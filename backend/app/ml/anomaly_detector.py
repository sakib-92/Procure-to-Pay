"""
ML Module: P2P Anomaly & Fraud Detection Engine.
Combines unsupervised machine learning (Isolation Forest) with heuristic
procurement compliance rules to detect:
  1. PO Structuring / Split Orders (just under ₹5,00,000 approval thresholds)
  2. Duplicate Invoices
  3. Weekend / Off-hours approvals
  4. Extreme unit price spikes
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


def run_anomaly_detection(df: pd.DataFrame, contamination: float = 0.035) -> dict:
    """
    Fits an Isolation Forest on multi-dimensional P2P features
    and cross-references with compliance rule violations.
    """
    df_feat = df.copy()

    # Numerical feature matrix for unsupervised anomaly scoring
    feature_cols = [
        "actual_unit_price",
        "quantity_ordered",
        "po_total_amount",
        "cycle_time_creation_to_approval",
        "cycle_time_approval_to_delivery",
        "payment_lag_days",
    ]

    X = df_feat[feature_cols].fillna(0.0).values
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    iso = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42,
    )
    raw_predictions = iso.fit_predict(X_scaled)  # -1 = anomaly, 1 = normal
    raw_scores = iso.decision_function(X_scaled) # lower = more anomalous

    # Normalize score to 0 - 100 risk score (100 = highest risk)
    min_s, max_s = raw_scores.min(), raw_scores.max()
    risk_scores = np.clip(100.0 * (1.0 - (raw_scores - min_s) / (max_s - min_s + 1e-6)), 0, 100).round(1)

    df_feat["ml_anomaly_score"] = risk_scores
    df_feat["is_ml_outlier"] = raw_predictions == -1

    # Audit Rule Flags
    df_feat["rule_split_po"] = df_feat["is_split_po"]
    df_feat["rule_weekend"] = df_feat["is_weekend_approval"]
    df_feat["rule_duplicate"] = df_feat["is_duplicate_invoice"]
    df_feat["rule_price_spike"] = (
        (df_feat["actual_unit_price"] > df_feat["base_unit_price"] * 1.25)
    )

    # Flag reason synthesizer
    reasons = []
    for _, r in df_feat.iterrows():
        flags = []
        if r["rule_split_po"]:
            flags.append("Split PO Threshold Evasion (Under INR 5L)")
        if r["rule_duplicate"]:
            flags.append("Suspected Duplicate Invoice")
        if r["rule_weekend"]:
            flags.append("Off-Hours / Weekend Approval")
        if r["rule_price_spike"]:
            flags.append("Unit Price Deviation (>25% over benchmark)")
        if r["is_ml_outlier"] and not flags:
            flags.append("Multi-dimensional Lead Time & Amount Outlier")
        reasons.append("; ".join(flags) if flags else "Normal Transaction")

    df_feat["anomaly_tags"] = reasons
    df_feat["is_flagged_audit"] = df_feat["anomaly_tags"] != "Normal Transaction"

    flagged_records = df_feat[df_feat["is_flagged_audit"]].sort_values("ml_anomaly_score", ascending=False)

    top_anomalies = []
    for _, r in flagged_records.head(50).iterrows():
        top_anomalies.append({
            "po_number": str(r["po_number"]),
            "invoice_number": str(r["invoice_number"]),
            "vendor_name": str(r["vendor_name"]),
            "department": str(r["department"]),
            "item_name": str(r["item_name"]),
            "po_total_amount": round(float(r["po_total_amount"]), 2),
            "approval_date": str(r["approval_date"]),
            "risk_score": float(r["ml_anomaly_score"]),
            "flags": str(r["anomaly_tags"]),
            "is_spot_buy": bool(r["is_spot_buy"]),
        })

    # Summary Stats
    total_pos = len(df_feat)
    flagged_count = len(flagged_records)

    return {
        "kpis": {
            "total_screened_pos": total_pos,
            "total_flagged_anomalies": flagged_count,
            "anomaly_rate_pct": round(flagged_count / total_pos * 100, 1),
            "split_po_count": int(df_feat["rule_split_po"].sum()),
            "weekend_approval_count": int(df_feat["rule_weekend"].sum()),
            "duplicate_invoice_count": int(df_feat["rule_duplicate"].sum()),
            "price_spike_count": int(df_feat["rule_price_spike"].sum()),
            "total_exposure_at_risk": round(float(flagged_records["po_total_amount"].sum()), 2),
        },
        "anomalies": top_anomalies,
    }

"""
Analytics Module: Vendor Scorecard & Kraljic Matrix Portfolio Segmentation.
Evaluates suppliers across OTIF fulfillment, lead time reliability,
invoice discrepancy rates, and spend magnitude.
"""

import pandas as pd
import numpy as np


def analyze_vendors(df: pd.DataFrame) -> dict:
    """
    Computes comprehensive vendor scorecards and Kraljic Matrix segmentation.
    """
    vendor_grp = (
        df.groupby("vendor_name")
        .agg(
            total_spend=("po_total_amount", "sum"),
            po_count=("po_number", "count"),
            avg_cycle_days=("cycle_time_approval_to_delivery", "mean"),
            p90_cycle_days=("cycle_time_approval_to_delivery", lambda s: s.quantile(0.90)),
            on_time_count=("is_on_time", "sum"),
            in_full_count=("is_in_full", "sum"),
            otif_count=("is_otif", "sum"),
            spot_buy_count=("is_spot_buy", "sum"),
            discrepancy_count=("three_way_match_status", lambda s: (s != "Matched").sum()),
            vendor_city=("vendor_city", lambda s: s.mode()[0] if not s.empty else "Bengaluru"),
            primary_category=("item_category", lambda s: s.mode()[0] if not s.empty else "General"),
        )
        .reset_index()
    )

    vendor_grp["otif_rate"] = (vendor_grp["otif_count"] / vendor_grp["po_count"] * 100).round(1)
    vendor_grp["on_time_rate"] = (vendor_grp["on_time_count"] / vendor_grp["po_count"] * 100).round(1)
    vendor_grp["in_full_rate"] = (vendor_grp["in_full_count"] / vendor_grp["po_count"] * 100).round(1)
    vendor_grp["discrepancy_rate"] = (vendor_grp["discrepancy_count"] / vendor_grp["po_count"] * 100).round(1)
    vendor_grp["spot_buy_rate"] = (vendor_grp["spot_buy_count"] / vendor_grp["po_count"] * 100).round(1)
    vendor_grp["avg_cycle_days"] = vendor_grp["avg_cycle_days"].round(1)
    vendor_grp["total_spend"] = vendor_grp["total_spend"].round(2)

    # Kraljic Matrix Classification:
    # Profit Impact = Total Spend
    # Supply Risk Score = (100 - OTIF Rate) * 0.5 + Discrepancy Rate * 0.3 + (avg_cycle_days / 30 * 20)
    spend_median = vendor_grp["total_spend"].median()
    vendor_grp["supply_risk_score"] = (
        (100.0 - vendor_grp["otif_rate"]) * 0.5
        + vendor_grp["discrepancy_rate"] * 0.3
        + (vendor_grp["avg_cycle_days"] / 30.0 * 20.0)
    ).clip(0, 100).round(1)
    risk_median = vendor_grp["supply_risk_score"].median()

    def classify_kraljic(row):
        high_spend = row["total_spend"] >= spend_median
        high_risk = row["supply_risk_score"] >= risk_median
        if high_spend and high_risk:
            return "Strategic"  # High spend, high supply risk
        elif high_spend and not high_risk:
            return "Leverage"   # High spend, low supply risk (buyer power)
        elif not high_spend and high_risk:
            return "Bottleneck" # Low spend, high supply risk (monopoly / long lead)
        else:
            return "Routine"    # Low spend, low supply risk (tactical catalog)

    vendor_grp["kraljic_quadrant"] = vendor_grp.apply(classify_kraljic, axis=1)

    # Composite Performance Score (0 - 100)
    # Higher is better: High OTIF, Low Discrepancies, Fast fulfillment
    vendor_grp["performance_score"] = (
        vendor_grp["otif_rate"] * 0.6
        + (100.0 - vendor_grp["discrepancy_rate"]) * 0.25
        + np.maximum(0.0, 100.0 - (vendor_grp["avg_cycle_days"] * 3.0)) * 0.15
    ).clip(0, 100).round(1)

    # Risk Tier
    def assign_tier(score):
        if score >= 85:
            return "Tier 1: Preferred Partner"
        elif score >= 65:
            return "Tier 2: Standard Supplier"
        else:
            return "Tier 3: High Risk / Watchlist"

    vendor_grp["risk_tier"] = vendor_grp["performance_score"].apply(assign_tier)

    # Sort by total spend
    vendor_grp = vendor_grp.sort_values("total_spend", ascending=False)

    # Kraljic Distribution
    kraljic_counts = vendor_grp["kraljic_quadrant"].value_counts().to_dict()
    kraljic_summary = []
    for quad, count in kraljic_counts.items():
        sub_spend = float(vendor_grp[vendor_grp["kraljic_quadrant"] == quad]["total_spend"].sum())
        kraljic_summary.append({
            "quadrant": quad,
            "vendor_count": int(count),
            "total_spend": round(sub_spend, 2),
            "description": (
                "Critical vendors requiring executive partnerships & joint business reviews" if quad == "Strategic"
                else "High spend commodities where competitive auctions drive maximum savings" if quad == "Leverage"
                else "Scarce suppliers requiring buffer stock and dual-sourcing insurance" if quad == "Bottleneck"
                else "Standardized supplies suited for automated e-catalogs and p-cards"
            ),
        })

    return {
        "kpis": {
            "total_suppliers": len(vendor_grp),
            "preferred_suppliers": int((vendor_grp["performance_score"] >= 85).sum()),
            "watchlist_suppliers": int((vendor_grp["performance_score"] < 65).sum()),
            "avg_fleet_otif": round(float(vendor_grp["otif_rate"].mean()), 1),
            "avg_fulfillment_days": round(float(vendor_grp["avg_cycle_days"].mean()), 1),
        },
        "kraljic_summary": kraljic_summary,
        "scorecard_table": vendor_grp.head(50).to_dict(orient="records"),
    }

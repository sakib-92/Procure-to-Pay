"""
Analytics Module: Working Capital & Accounts Payable Optimization.
Analyzes Days Payable Outstanding (DPO), payment terms compliance,
early settlement discount capture, and cash conversion runway.
"""

import pandas as pd
import numpy as np


def analyze_working_capital(df: pd.DataFrame) -> dict:
    """
    Computes Days Payable Outstanding (DPO), early discount capture/leakage,
    and payment aging schedules.
    """
    df_calc = df.copy()

    # DPO: invoice_to_payment latency
    dpo_series = df_calc["cycle_time_invoice_to_payment"].dropna()
    avg_dpo = round(float(dpo_series.mean()), 1)
    median_dpo = round(float(dpo_series.median()), 1)

    # Weighted DPO by spend amount
    total_spend = float(df_calc["po_total_amount"].sum())
    weighted_dpo = round(
        float((df_calc["cycle_time_invoice_to_payment"] * df_calc["po_total_amount"]).sum() / total_spend), 1
    )

    # Payment Terms Distribution
    terms_grp = (
        df_calc.groupby("payment_terms")
        .agg(
            po_count=("po_number", "count"),
            total_spend=("po_total_amount", "sum"),
            avg_actual_dpo=("cycle_time_invoice_to_payment", "mean"),
        )
        .reset_index()
    )
    terms_grp["spend_pct"] = (terms_grp["total_spend"] / total_spend * 100).round(1)
    terms_grp["avg_actual_dpo"] = terms_grp["avg_actual_dpo"].round(1)

    # Early Settlement Discount (2/10 Net 30) Analysis
    discount_eligible_pos = df_calc[df_calc["payment_terms"] == "2/10 Net 30"].copy()
    eligible_spend = float(discount_eligible_pos["po_total_amount"].sum())

    captured_mask = discount_eligible_pos["discount_captured"]
    captured_spend = float(discount_eligible_pos.loc[captured_mask, "po_total_amount"].sum())
    captured_savings = round(captured_spend * 0.02, 2)  # 2% cash rebate

    lost_spend = eligible_spend - captured_spend
    lost_savings = round(lost_spend * 0.02, 2)

    # Payment Aging Buckets (Overdue Analysis against Terms Days)
    df_calc["days_past_terms"] = df_calc["payment_lag_days"] - df_calc["terms_days"]
    overdue_mask = df_calc["days_past_terms"] > 0
    overdue_pos = int(overdue_mask.sum())
    overdue_spend = float(df_calc.loc[overdue_mask, "po_total_amount"].sum())

    aging_buckets = [
        {"bucket": "Paid Within Terms", "count": int((df_calc["days_past_terms"] <= 0).sum())},
        {"bucket": "1 - 15 Days Late", "count": int(((df_calc["days_past_terms"] > 0) & (df_calc["days_past_terms"] <= 15)).sum())},
        {"bucket": "16 - 30 Days Late", "count": int(((df_calc["days_past_terms"] > 15) & (df_calc["days_past_terms"] <= 30)).sum())},
        {"bucket": "31+ Days Late", "count": int((df_calc["days_past_terms"] > 30).sum())},
    ]

    return {
        "kpis": {
            "average_dpo_days": avg_dpo,
            "weighted_dpo_days": weighted_dpo,
            "median_dpo_days": median_dpo,
            "eligible_discount_spend": round(eligible_spend, 2),
            "captured_discount_savings": round(captured_savings, 2),
            "lost_discount_savings": round(lost_savings, 2),
            "discount_capture_rate_pct": round(captured_spend / eligible_spend * 100, 1) if eligible_spend > 0 else 0.0,
            "overdue_po_count": overdue_pos,
            "overdue_spend": round(overdue_spend, 2),
        },
        "payment_terms": terms_grp.to_dict(orient="records"),
        "aging_buckets": aging_buckets,
    }


def simulate_dpo_extension(
    df: pd.DataFrame,
    target_dpo_extension_days: int = 15,
    annual_cost_of_capital_pct: float = 8.5,
) -> dict:
    """
    Simulates operating cash flow freed up by extending Accounts Payable terms.
    Cash Freed Up = (Annual Spend / 365) * Delta DPO
    Annual Interest Benefit = Cash Freed Up * Cost of Capital %
    """
    total_annual_spend = float(df["po_total_amount"].sum())
    daily_spend = total_annual_spend / 365.0

    cash_freed_up = daily_spend * target_dpo_extension_days
    annual_interest_benefit = cash_freed_up * (annual_cost_of_capital_pct / 100.0)

    return {
        "current_total_spend": round(total_annual_spend, 2),
        "target_dpo_extension_days": target_dpo_extension_days,
        "daily_cash_burn": round(daily_spend, 2),
        "working_capital_freed_up": round(cash_freed_up, 2),
        "annual_interest_benefit": round(annual_interest_benefit, 2),
    }

"""
Analytics Module: P2P Process Mining & Cycle Times.
Calculates milestone lead times, SLA compliance, bottleneck analysis,
and the end-to-end P2P milestone conversion funnel.
"""

import pandas as pd
import numpy as np


def analyze_cycle_times(df: pd.DataFrame) -> dict:
    """
    Computes comprehensive cycle time metrics and bottleneck statistics.
    """
    df_calc = df.copy()

    # Lead time columns
    lead_time_cols = [
        "cycle_time_creation_to_approval",
        "cycle_time_approval_to_delivery",
        "cycle_time_delivery_to_invoice",
        "cycle_time_invoice_to_payment",
        "total_p2p_cycle_time",
    ]

    summary_stats = {}
    for col in lead_time_cols:
        series = df_calc[col].dropna()
        summary_stats[col] = {
            "mean_days": round(float(series.mean()), 1),
            "median_days": round(float(series.median()), 1),
            "p75_days": round(float(series.quantile(0.75)), 1),
            "p90_days": round(float(series.quantile(0.90)), 1),
            "p95_days": round(float(series.quantile(0.95)), 1),
            "min_days": int(series.min()),
            "max_days": int(series.max()),
        }

    # Departmental Approval Bottlenecks
    dept_approval = (
        df_calc.groupby("department")
        .agg(
            po_count=("po_number", "count"),
            avg_approval_days=("cycle_time_creation_to_approval", "mean"),
            p90_approval_days=("cycle_time_creation_to_approval", lambda s: s.quantile(0.90)),
            approval_bottlenecks=("cycle_time_creation_to_approval", lambda s: (s > 10).sum()),
            total_spend=("po_total_amount", "sum"),
        )
        .reset_index()
    )
    dept_approval["avg_approval_days"] = dept_approval["avg_approval_days"].round(1)
    dept_approval["p90_approval_days"] = dept_approval["p90_approval_days"].round(1)
    dept_approval = dept_approval.sort_values("avg_approval_days", ascending=False)

    # Category Fulfillment Lag (Approval to Delivery)
    cat_fulfillment = (
        df_calc.groupby("item_category")
        .agg(
            po_count=("po_number", "count"),
            avg_delivery_days=("cycle_time_approval_to_delivery", "mean"),
            otif_rate=("is_otif", "mean"),
            total_spend=("po_total_amount", "sum"),
        )
        .reset_index()
    )
    cat_fulfillment["avg_delivery_days"] = cat_fulfillment["avg_delivery_days"].round(1)
    cat_fulfillment["otif_rate"] = (cat_fulfillment["otif_rate"] * 100).round(1)
    cat_fulfillment = cat_fulfillment.sort_values("avg_delivery_days", ascending=False)

    # P2P Milestone Funnel
    total_pos = len(df_calc)
    total_spend = float(df_calc["po_total_amount"].sum())

    funnel = [
        {
            "stage": "1. Requisition & PO Created",
            "count": total_pos,
            "drop_rate_pct": 0.0,
            "avg_step_days": 0.0,
            "description": "Purchase orders drafted & submitted into ERP",
        },
        {
            "stage": "2. Managerial Approval",
            "count": total_pos,  # All historical POs reached approval
            "drop_rate_pct": 0.0,
            "avg_step_days": summary_stats["cycle_time_creation_to_approval"]["mean_days"],
            "description": "Multi-tier managerial sign-off & budget authorization",
        },
        {
            "stage": "3. Goods Receipt (GRN)",
            "count": int((df_calc["quantity_received"] > 0).sum()),
            "drop_rate_pct": round(float((df_calc["quantity_received"] == 0).mean() * 100), 1),
            "avg_step_days": summary_stats["cycle_time_approval_to_delivery"]["mean_days"],
            "description": "Physical intake, inspection, and warehouse logging",
        },
        {
            "stage": "4. Invoice Processed",
            "count": int((df_calc["invoice_amount"] > 0).sum()),
            "drop_rate_pct": 0.0,
            "avg_step_days": summary_stats["cycle_time_delivery_to_invoice"]["mean_days"],
            "description": "Vendor bill ingested and 3-way match validation",
        },
        {
            "stage": "5. Payment Disbursed",
            "count": int((df_calc["paid_amount"] > 0).sum()),
            "drop_rate_pct": round(float((df_calc["paid_amount"] == 0).mean() * 100), 1),
            "avg_step_days": summary_stats["cycle_time_invoice_to_payment"]["mean_days"],
            "description": "Accounts payable disbursement via NEFT/RTGS/NetBanking",
        },
    ]

    # Bottleneck Root Causes
    stalled_approvals = df_calc[df_calc["cycle_time_creation_to_approval"] > 10]
    stalled_deliveries = df_calc[df_calc["cycle_time_approval_to_delivery"] > 25]

    return {
        "summary": summary_stats,
        "department_approval_bottlenecks": dept_approval.to_dict(orient="records"),
        "category_fulfillment": cat_fulfillment.to_dict(orient="records"),
        "funnel": funnel,
        "bottlenecks": {
            "approval_stall_count": len(stalled_approvals),
            "approval_stall_pct": round(len(stalled_approvals) / total_pos * 100, 1),
            "delivery_stall_count": len(stalled_deliveries),
            "delivery_stall_pct": round(len(stalled_deliveries) / total_pos * 100, 1),
        },
    }

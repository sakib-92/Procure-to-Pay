"""
Analytics Module: 3-Way Matching & Discrepancy Reconciliation.
Audits Purchase Orders (PO) against Goods Receipt Notes (GRN) and Vendor Invoices.
Identifies price variances, quantity shortfalls, missing intake logs, and overbillings.
"""

import pandas as pd
import numpy as np


def analyze_three_way_match(df: pd.DataFrame) -> dict:
    """
    Computes 3-way matching pass/fail rates, disputed variance amounts,
    and returns a filtered exception audit queue.
    """
    total_pos = len(df)
    status_counts = df["three_way_match_status"].value_counts().to_dict()

    matched_count = status_counts.get("Matched", 0)
    matched_pct = round(matched_count / total_pos * 100, 1)

    # Discrepancy Financials
    # Price Discrepancy Amount: Invoice total - PO total
    df_calc = df.copy()
    df_calc["price_variance_amount"] = np.maximum(
        0.0, df_calc["invoice_amount"] - df_calc["po_total_amount"]
    )
    # Quantity Discrepancy Amount: (PO Qty - Recv Qty) * Unit Price
    df_calc["qty_variance_amount"] = np.maximum(
        0.0,
        (df_calc["quantity_ordered"] - df_calc["quantity_received"]) * df_calc["actual_unit_price"]
    )

    total_price_discrepancy_amt = float(df_calc[df_calc["three_way_match_status"] == "Price Discrepancy"]["price_variance_amount"].sum())
    total_qty_discrepancy_amt = float(df_calc[df_calc["three_way_match_status"] == "Quantity Discrepancy"]["qty_variance_amount"].sum())
    missing_grn_amt = float(df_calc[df_calc["three_way_match_status"] == "Missing Goods Receipt (GRN)"]["invoice_amount"].sum())
    duplicate_inv_amt = float(df_calc[df_calc["three_way_match_status"] == "Suspected Duplicate Invoice"]["invoice_amount"].sum())

    total_disputed_exposure = total_price_discrepancy_amt + total_qty_discrepancy_amt + missing_grn_amt + duplicate_inv_amt

    # Discrepancy Breakdown by Category
    cat_match = (
        df_calc.groupby("item_category")
        .agg(
            total_pos=("po_number", "count"),
            matched_pos=("three_way_match_status", lambda s: (s == "Matched").sum()),
            discrepancy_pos=("three_way_match_status", lambda s: (s != "Matched").sum()),
            price_discrepancies=("three_way_match_status", lambda s: (s == "Price Discrepancy").sum()),
            qty_discrepancies=("three_way_match_status", lambda s: (s == "Quantity Discrepancy").sum()),
            total_spend=("po_total_amount", "sum"),
        )
        .reset_index()
    )
    cat_match["match_rate_pct"] = (cat_match["matched_pos"] / cat_match["total_pos"] * 100).round(1)
    cat_match = cat_match.sort_values("discrepancy_pos", ascending=False)

    # Discrepancy Breakdown by Department
    dept_match = (
        df_calc.groupby("department")
        .agg(
            total_pos=("po_number", "count"),
            discrepancies=("three_way_match_status", lambda s: (s != "Matched").sum()),
        )
        .reset_index()
    )
    dept_match["discrepancy_rate_pct"] = (dept_match["discrepancies"] / dept_match["total_pos"] * 100).round(1)

    # Exception Audit Queue (Top 35 unresolved discrepancies)
    exceptions_df = df_calc[df_calc["three_way_match_status"] != "Matched"].copy()
    exceptions_df["disputed_value"] = np.where(
        exceptions_df["three_way_match_status"] == "Price Discrepancy",
        exceptions_df["price_variance_amount"],
        np.where(
            exceptions_df["three_way_match_status"] == "Quantity Discrepancy",
            exceptions_df["qty_variance_amount"],
            exceptions_df["invoice_amount"]
        )
    )
    exceptions_df = exceptions_df.sort_values("disputed_value", ascending=False).head(40)

    queue = []
    for _, r in exceptions_df.iterrows():
        queue.append({
            "po_number": str(r["po_number"]),
            "invoice_number": str(r["invoice_number"]),
            "grn_number": str(r["grn_number"]),
            "vendor_name": str(r["vendor_name"]),
            "item_name": str(r["item_name"]),
            "po_qty": int(r["quantity_ordered"]),
            "grn_qty": int(r["quantity_received"]),
            "po_unit_price": round(float(r["actual_unit_price"]), 2),
            "invoice_unit_price": round(float(r["invoice_unit_price"]), 2),
            "po_total": round(float(r["po_total_amount"]), 2),
            "invoice_total": round(float(r["invoice_amount"]), 2),
            "disputed_value": round(float(r["disputed_value"]), 2),
            "status": str(r["three_way_match_status"]),
            "recommended_action": (
                "Issue Debit Note & Pay Contract PO Amount" if r["three_way_match_status"] == "Price Discrepancy"
                else "Short-Payment Adjustment (Credit Memo)" if r["three_way_match_status"] == "Quantity Discrepancy"
                else "Hold Payment Pending Warehouse Intake" if "Missing" in r["three_way_match_status"]
                else "Immediate Payment Freeze & Audit Flag"
            ),
        })

    return {
        "kpis": {
            "total_audited_pos": total_pos,
            "matched_pos": matched_count,
            "matched_rate_pct": matched_pct,
            "total_discrepancy_count": total_pos - matched_count,
            "discrepancy_rate_pct": round(100.0 - matched_pct, 1),
            "price_discrepancy_count": status_counts.get("Price Discrepancy", 0),
            "qty_discrepancy_count": status_counts.get("Quantity Discrepancy", 0),
            "missing_grn_count": status_counts.get("Missing Goods Receipt (GRN)", 0),
            "duplicate_invoice_count": status_counts.get("Suspected Duplicate Invoice", 0),
            "total_disputed_exposure": round(total_disputed_exposure, 2),
            "price_discrepancy_exposure": round(total_price_discrepancy_amt, 2),
            "qty_discrepancy_exposure": round(total_qty_discrepancy_amt, 2),
            "missing_grn_exposure": round(missing_grn_amt, 2),
            "duplicate_invoice_exposure": round(duplicate_inv_amt, 2),
        },
        "category_breakdown": cat_match.to_dict(orient="records"),
        "department_breakdown": dept_match.to_dict(orient="records"),
        "exception_queue": queue,
    }

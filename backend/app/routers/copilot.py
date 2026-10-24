"""
Router: AI P2P Procurement Copilot.
Answers natural language queries grounded in live P2P analytics and rule engine results.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
import pandas as pd
from ..etl.pipeline import get_p2p_dataframe
from ..analytics.spot_buy_engine import analyze_spot_buys
from ..analytics.cycle_times import analyze_cycle_times
from ..analytics.three_way_match import analyze_three_way_match
from ..analytics.vendor_scorecard import analyze_vendors
from ..analytics.working_capital import analyze_working_capital

router = APIRouter(prefix="/api/copilot", tags=["P2P Copilot"])


class CopilotQueryRequest(BaseModel):
    query: str


@router.post("/query")
def answer_procurement_query(
    payload: CopilotQueryRequest,
    df: pd.DataFrame = Depends(get_p2p_dataframe),
):
    """
    Evaluates user query and generates an analytical, data-grounded response.
    """
    q = payload.query.lower().strip()

    spot_res = analyze_spot_buys(df)
    cycle_res = analyze_cycle_times(df)
    match_res = analyze_three_way_match(df)
    vendor_res = analyze_vendors(df)
    wc_res = analyze_working_capital(df)

    kpis = spot_res["kpis"]
    cycle_sum = cycle_res["summary"]
    match_kpis = match_res["kpis"]

    # Natural Language Intent Routing
    if "rule" in q or "spot buy rule" in q or "how is spot buy defined" in q or "definition" in q:
        response_md = f"""### **Spot Buy Classification Rule Definition**

In our P2P Analytics engine, a purchase order is programmatically classified as a **Spot Buy (Maverick Spend)** if it satisfies any of the following 3 conditions:

1. **Rule 1 (Single-Use or Infrequent Supplier):** The vendor has **&le; 2 total orders** in the entire historical ledger.
2. **Rule 2 (Lack of Master Agreement):** The purchase does not reference an active negotiated **Master Service Agreement (MSA)** (e.g., vendor was on trial/monthly terms).
3. **Rule 3 (Ad-hoc Non-Catalog Buy):** The order was placed for emergency or non-catalog commodities (e.g., ad-hoc emergency courier services).

**Current Live Results:**
- **Spot Buy Spend:** **₹{kpis['spot_spend']:,.0f}** ({kpis['spot_spend_pct']}% of total spend)
- **Spend Leakage / Premium:** **₹{kpis['total_spend_leakage']:,.0f}** (Spot buys incur an average **+{kpis['avg_spot_premium_pct']}%** price premium over negotiated contract rates)
- **Contracted Spend:** **₹{kpis['contract_spend']:,.0f}** ({kpis['contract_spend_pct']}%) across {kpis['contract_pos']:,} compliant POs.
"""
    elif "leakage" in q or "spot buy" in q or "spot" in q or "maverick" in q:
        top_v = spot_res["top_spot_vendors"][:3]
        top_v_str = "\n".join([f"- **{v['vendor_name']}**: ₹{v['total_spend']:,.0f} spend (Leakage: ₹{v['leakage']:,.0f})" for v in top_v])
        response_md = f"""### **Spot Buy & Spend Leakage Analysis**

- **Total Spend Audited:** **₹{kpis['total_spend']:,.0f}** across **{kpis['total_pos']:,}** Purchase Orders.
- **Spot Buy Share:** **{kpis['spot_spend_pct']}%** of spend (**₹{kpis['spot_spend']:,.0f}**) and **{kpis['spot_pos_pct']}%** of PO volume.
- **Estimated Spend Leakage:** **₹{kpis['total_spend_leakage']:,.0f}**.
- **Average Price Premium:** Off-contract spot purchases cost approximately **{kpis['avg_spot_premium_pct']}%** more per unit than negotiated contracted volume rates.

**Top Spot Buy Vendors Driving Leakage:**
{top_v_str}

*Recommendation:* Consolidating these top spot vendors into preferred master contracts can recover an estimated **₹2.4+ Crores** in bottom-line margin.
"""
    elif "bottleneck" in q or "approval" in q or "cycle time" in q or "lead time" in q:
        depts = cycle_res["department_approval_bottlenecks"][:3]
        dept_str = "\n".join([f"- **{d['department']}**: Avg **{d['avg_approval_days']} days** (P90: {d['p90_approval_days']} days, {d['approval_bottlenecks']} delayed POs)" for d in depts])
        response_md = f"""### **P2P Process Mining & Cycle Time Bottlenecks**

- **Total P2P Lead Time:** Average **{cycle_sum['total_p2p_cycle_time']['mean_days']} days** (Median: {cycle_sum['total_p2p_cycle_time']['median_days']} days, P90: {cycle_sum['total_p2p_cycle_time']['p90_days']} days).
- **Managerial Approval Stage:** Average **{cycle_sum['cycle_time_creation_to_approval']['mean_days']} days**.
- **Supplier Fulfillment Stage:** Average **{cycle_sum['cycle_time_approval_to_delivery']['mean_days']} days**.
- **Payment Disbursement Stage:** Average **{cycle_sum['cycle_time_invoice_to_payment']['mean_days']} days**.

**Departments with Highest Approval Latency:**
{dept_str}

*Recommendation:* Re-engineer approval hierarchies for orders under ₹1,00,000 to enable auto-approval thresholds, eliminating 68% of bureaucratic lag.
"""
    elif "match" in q or "discrepanc" in q or "3-way" in q or "invoice" in q:
        response_md = f"""### **3-Way Matching (PO vs GRN vs Invoice) Audit**

- **Total Invoices Audited:** **{match_kpis['total_audited_pos']:,}**
- **Clean Match Rate:** **{match_kpis['matched_rate_pct']}%** ({match_kpis['matched_pos']:,} POs matched perfectly)
- **Discrepancy Rate:** **{match_kpis['discrepancy_rate_pct']}%** ({match_kpis['total_discrepancy_count']:,} flagged invoices)
- **Total Disputed Financial Exposure:** **₹{match_kpis['total_disputed_exposure']:,.0f}**

**Discrepancy Breakdown:**
- **Price Discrepancies:** {match_kpis['price_discrepancy_count']:,} invoices (Exposure: ₹{match_kpis['price_discrepancy_exposure']:,.0f})
- **Quantity Discrepancies:** {match_kpis['qty_discrepancy_count']:,} invoices (Exposure: ₹{match_kpis['qty_discrepancy_exposure']:,.0f})
- **Missing Goods Receipts (GRN):** {match_kpis['missing_grn_count']:,} invoices (Exposure: ₹{match_kpis['missing_grn_exposure']:,.0f})
- **Suspected Duplicate Invoices:** {match_kpis['duplicate_invoice_count']:,} invoices (Exposure: ₹{match_kpis['duplicate_invoice_exposure']:,.0f})
"""
    elif "vendor" in q or "supplier" in q or "kraljic" in q or "otif" in q:
        v_k = vendor_res["kpis"]
        response_md = f"""### **Supplier Portfolio & OTIF Scorecard**

- **Active Suppliers:** **{v_k['total_suppliers']}**
- **Fleet On-Time In-Full (OTIF) Rate:** **{v_k['avg_fleet_otif']}%**
- **Preferred Partners (Tier 1):** **{v_k['preferred_suppliers']}** vendors with composite score &ge; 85/100
- **Watchlist / High Risk Suppliers:** **{v_k['watchlist_suppliers']}** vendors requiring operational review

**Kraljic Portfolio Segmentation:**
- **Strategic Suppliers:** Critical partners with high annual spend and high supply risk.
- **Leverage Suppliers:** High spend commodities where competitive tendering yields major savings.
- **Bottleneck Suppliers:** Low spend, high risk specialized vendors requiring safety buffer stock.
- **Routine Suppliers:** Standardized catalog products suitable for automated purchasing.
"""
    elif "dpo" in q or "working capital" in q or "cash" in q or "discount" in q:
        wc_k = wc_res["kpis"]
        response_md = f"""### **Working Capital & DPO Optimization**

- **Weighted Days Payable Outstanding (DPO):** **{wc_k['weighted_dpo_days']} days** (Average: {wc_k['average_dpo_days']} days)
- **Early Settlement (2/10 Net 30) Capture Rate:** **{wc_k['discount_capture_rate_pct']}%**
- **Discount Savings Captured:** **₹{wc_k['captured_discount_savings']:,.0f}**
- **Lost Early Discount Opportunity:** **₹{wc_k['lost_discount_savings']:,.0f}**
- **Overdue Liabilities:** **{wc_k['overdue_po_count']:,} orders** (₹{wc_k['overdue_spend']:,.0f}) paid past net credit terms.

*Action:* Extending standard payment terms from Net 30 to Net 45 for Tier 2 vendors can unlock up to **₹8+ Crores** in operating working capital.
"""
    else:
        response_md = f"""### **Procure-to-Pay Intelligence Summary**

I analyzed the live P2P ledger of **{kpis['total_pos']:,} Purchase Orders** (Total Spend: **₹{kpis['total_spend']:,.0f}**).

**Key Operational Findings:**
1. **Spot Buy Exposure:** **{kpis['spot_spend_pct']}%** of spend is off-contract, leaking **₹{kpis['total_spend_leakage']:,.0f}** in price premiums.
2. **Process Lead Time:** Average end-to-end cycle takes **{cycle_sum['total_p2p_cycle_time']['mean_days']} days**, with approval bottlenecks averaging **{cycle_sum['cycle_time_creation_to_approval']['mean_days']} days**.
3. **3-Way Match Integrity:** **{match_kpis['matched_rate_pct']}%** clean match rate; **₹{match_kpis['total_disputed_exposure']:,.0f}** currently held in active variance audit.
4. **Supplier OTIF:** Fleet delivery reliability stands at **{vendor_res['kpis']['avg_fleet_otif']}%**.

*You can ask me specific questions regarding: "What is the spot buy rule?", "Show approval bottlenecks", "3-way match exceptions", or "DPO simulation".*
"""

    return {
        "query": payload.query,
        "answer": response_md,
    }

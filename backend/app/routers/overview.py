"""
Router: Executive Overview & KPI Dashboard.
"""

from fastapi import APIRouter, Depends
import pandas as pd
from ..etl.pipeline import get_p2p_dataframe
from ..analytics.spot_buy_engine import analyze_spot_buys
from ..analytics.cycle_times import analyze_cycle_times
from ..analytics.three_way_match import analyze_three_way_match
from ..analytics.vendor_scorecard import analyze_vendors

router = APIRouter(prefix="/api/overview", tags=["Executive Overview"])


@router.get("")
def get_executive_overview(df: pd.DataFrame = Depends(get_p2p_dataframe)):
    """
    Returns aggregated executive procurement KPIs, trends, and milestone funnel.
    """
    spot_res = analyze_spot_buys(df)
    cycle_res = analyze_cycle_times(df)
    match_res = analyze_three_way_match(df)
    vendor_res = analyze_vendors(df)

    kpis = spot_res["kpis"]
    cycle_sum = cycle_res["summary"]
    match_kpis = match_res["kpis"]
    v_kpis = vendor_res["kpis"]

    # Monthly Trend (Time Series)
    df_ts = df.copy()
    df_ts["month_year"] = pd.to_datetime(df_ts["po_creation_date"]).dt.to_period("M").astype(str)
    monthly_trend = (
        df_ts.groupby("month_year")
        .agg(
            total_spend=("po_total_amount", "sum"),
            contract_spend=("po_total_amount", lambda s: s[df_ts.loc[s.index, "is_contract_buy"]].sum()),
            spot_spend=("po_total_amount", lambda s: s[df_ts.loc[s.index, "is_spot_buy"]].sum()),
            po_count=("po_number", "count"),
            avg_cycle_days=("total_p2p_cycle_time", "mean"),
        )
        .reset_index()
        .sort_values("month_year")
    )
    monthly_trend["total_spend"] = monthly_trend["total_spend"].round(2)
    monthly_trend["contract_spend"] = monthly_trend["contract_spend"].round(2)
    monthly_trend["spot_spend"] = monthly_trend["spot_spend"].round(2)
    monthly_trend["avg_cycle_days"] = monthly_trend["avg_cycle_days"].round(1)

    # Department Spend Distribution
    dept_spend = (
        df.groupby("department")
        .agg(
            total_spend=("po_total_amount", "sum"),
            po_count=("po_number", "count"),
            spot_spend=("po_total_amount", lambda s: s[df.loc[s.index, "is_spot_buy"]].sum()),
        )
        .reset_index()
        .sort_values("total_spend", ascending=False)
    )
    dept_spend["total_spend"] = dept_spend["total_spend"].round(2)
    dept_spend["spot_rate_pct"] = (dept_spend["spot_spend"] / dept_spend["total_spend"] * 100).round(1)

    return {
        "kpis": {
            "total_spend": kpis["total_spend"],
            "total_pos": kpis["total_pos"],
            "contract_spend": kpis["contract_spend"],
            "contract_spend_pct": kpis["contract_spend_pct"],
            "spot_spend": kpis["spot_spend"],
            "spot_spend_pct": kpis["spot_spend_pct"],
            "spend_leakage": kpis["total_spend_leakage"],
            "match_clean_rate_pct": match_kpis["matched_rate_pct"],
            "disputed_exposure": match_kpis["total_disputed_exposure"],
            "avg_p2p_cycle_days": cycle_sum["total_p2p_cycle_time"]["mean_days"],
            "avg_approval_days": cycle_sum["cycle_time_creation_to_approval"]["mean_days"],
            "avg_delivery_days": cycle_sum["cycle_time_approval_to_delivery"]["mean_days"],
            "fleet_otif_rate_pct": v_kpis["avg_fleet_otif"],
            "active_suppliers": v_kpis["total_suppliers"],
        },
        "monthly_trend": monthly_trend.tail(12).to_dict(orient="records"),
        "department_spend": dept_spend.to_dict(orient="records"),
        "milestone_funnel": cycle_res["funnel"],
        "category_exposure": spot_res["category_exposure"],
    }

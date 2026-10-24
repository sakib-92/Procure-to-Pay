"""
Router: Process Mining & Cycle Times.
"""

from fastapi import APIRouter, Depends
import pandas as pd
from ..etl.pipeline import get_p2p_dataframe
from ..analytics.cycle_times import analyze_cycle_times
from ..ml.lead_time_forecaster import train_lead_time_model

router = APIRouter(prefix="/api/process-mining", tags=["Process Mining"])


@router.get("")
def get_process_mining_metrics(df: pd.DataFrame = Depends(get_p2p_dataframe)):
    """
    Returns cycle times, bottleneck distributions, and predictive lead time metrics.
    """
    cycle_res = analyze_cycle_times(df)
    ml_res = train_lead_time_model(df)

    # Lead time distribution histogram buckets (Creation to Approval)
    approval_days = df["cycle_time_creation_to_approval"].dropna()
    approval_buckets = [
        {"bucket": "1-2 Days (Express)", "count": int(((approval_days >= 1) & (approval_days <= 2)).sum())},
        {"bucket": "3-5 Days (Normal SLA)", "count": int(((approval_days >= 3) & (approval_days <= 5)).sum())},
        {"bucket": "6-10 Days (Delayed)", "count": int(((approval_days >= 6) & (approval_days <= 10)).sum())},
        {"bucket": "11+ Days (Bottleneck Stall)", "count": int((approval_days > 10).sum())},
    ]

    # Fulfillment Lead Time histogram buckets (Approval to Delivery)
    delivery_days = df["cycle_time_approval_to_delivery"].dropna()
    delivery_buckets = [
        {"bucket": "1-7 Days", "count": int(((delivery_days >= 1) & (delivery_days <= 7)).sum())},
        {"bucket": "8-14 Days", "count": int(((delivery_days >= 8) & (delivery_days <= 14)).sum())},
        {"bucket": "15-21 Days", "count": int(((delivery_days >= 15) & (delivery_days <= 21)).sum())},
        {"bucket": "22+ Days (High Risk Delay)", "count": int((delivery_days > 21).sum())},
    ]

    return {
        "summary": cycle_res["summary"],
        "funnel": cycle_res["funnel"],
        "department_approval_bottlenecks": cycle_res["department_approval_bottlenecks"],
        "category_fulfillment": cycle_res["category_fulfillment"],
        "bottlenecks": cycle_res["bottlenecks"],
        "approval_distribution": approval_buckets,
        "delivery_distribution": delivery_buckets,
        "ml_forecaster": ml_res,
    }

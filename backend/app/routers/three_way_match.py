"""
Router: 3-Way Matching Engine & Discrepancy Reconciliation.
"""

from fastapi import APIRouter, Depends, Query
import pandas as pd
from ..etl.pipeline import get_p2p_dataframe
from ..analytics.three_way_match import analyze_three_way_match

router = APIRouter(prefix="/api/three-way-match", tags=["3-Way Matching"])


@router.get("")
def get_three_way_match_metrics(
    status_filter: str | None = Query(None, description="Optional status filter"),
    df: pd.DataFrame = Depends(get_p2p_dataframe),
):
    """
    Returns 3-way matching KPIs, discrepancy breakdowns, and exception audit queue.
    """
    res = analyze_three_way_match(df)
    if status_filter:
        res["exception_queue"] = [
            item for item in res["exception_queue"] if status_filter.lower() in item["status"].lower()
        ]
    return res

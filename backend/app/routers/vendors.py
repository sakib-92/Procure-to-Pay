"""
Router: Vendor Scorecard & Kraljic Matrix Segmentation.
"""

from fastapi import APIRouter, Depends, Query
import pandas as pd
from ..etl.pipeline import get_p2p_dataframe
from ..analytics.vendor_scorecard import analyze_vendors

router = APIRouter(prefix="/api/vendors", tags=["Vendor Performance"])


@router.get("")
def get_vendor_scorecards(
    quadrant: str | None = Query(None, description="Optional Kraljic quadrant filter"),
    df: pd.DataFrame = Depends(get_p2p_dataframe),
):
    """
    Returns supplier scorecards, OTIF rates, and Kraljic matrix segmentation.
    """
    res = analyze_vendors(df)
    if quadrant:
        res["scorecard_table"] = [
            v for v in res["scorecard_table"] if v["kraljic_quadrant"].lower() == quadrant.lower()
        ]
    return res

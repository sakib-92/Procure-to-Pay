"""
Router: Spot Buy vs Contract Analytics & What-If Simulator.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
import pandas as pd
from ..etl.pipeline import get_p2p_dataframe
from ..analytics.spot_buy_engine import analyze_spot_buys, simulate_spot_buy_reduction

router = APIRouter(prefix="/api/spot-buys", tags=["Spot Buy Analytics"])


class SpotBuySimulateRequest(BaseModel):
    target_reduction_pct: float = 25.0
    negotiated_discount_pct: float = 12.0


@router.get("")
def get_spot_buy_analytics(df: pd.DataFrame = Depends(get_p2p_dataframe)):
    """
    Returns spot buy vs contract metrics, rule triggers, and spend leakage.
    """
    return analyze_spot_buys(df)


@router.post("/simulate")
def simulate_savings(
    payload: SpotBuySimulateRequest,
    df: pd.DataFrame = Depends(get_p2p_dataframe),
):
    """
    Simulates projected savings and working capital unlocked by reducing spot buys.
    """
    return simulate_spot_buy_reduction(
        df=df,
        target_reduction_pct=payload.target_reduction_pct,
        negotiated_discount_pct=payload.negotiated_discount_pct,
    )

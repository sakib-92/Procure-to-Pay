"""
Router: Working Capital, DPO & Cash Optimization.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
import pandas as pd
from ..etl.pipeline import get_p2p_dataframe
from ..analytics.working_capital import analyze_working_capital, simulate_dpo_extension

router = APIRouter(prefix="/api/working-capital", tags=["Working Capital"])


class DPOSimulateRequest(BaseModel):
    target_dpo_extension_days: int = 15
    annual_cost_of_capital_pct: float = 8.5


@router.get("")
def get_working_capital_metrics(df: pd.DataFrame = Depends(get_p2p_dataframe)):
    """
    Returns DPO statistics, payment term adherence, and discount capture.
    """
    return analyze_working_capital(df)


@router.post("/simulate")
def simulate_dpo(
    payload: DPOSimulateRequest,
    df: pd.DataFrame = Depends(get_p2p_dataframe),
):
    """
    Simulates operating cash flow unlocked by extending Accounts Payable terms.
    """
    return simulate_dpo_extension(
        df=df,
        target_dpo_extension_days=payload.target_dpo_extension_days,
        annual_cost_of_capital_pct=payload.annual_cost_of_capital_pct,
    )

"""
Router: Anomaly & Procurement Audit Risk.
"""

from fastapi import APIRouter, Depends
import pandas as pd
from ..etl.pipeline import get_p2p_dataframe
from ..ml.anomaly_detector import run_anomaly_detection

router = APIRouter(prefix="/api/anomalies", tags=["Audit & Anomalies"])


@router.get("")
def get_audit_anomalies(df: pd.DataFrame = Depends(get_p2p_dataframe)):
    """
    Returns detected split POs, duplicate invoices, weekend approvals, and ML outliers.
    """
    return run_anomaly_detection(df)

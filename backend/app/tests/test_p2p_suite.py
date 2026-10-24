"""
Automated Pytest Test Suite for Procure-to-Pay Platform.
Tests data cleaning, spot buy rule logic, 3-way matching, and API endpoints.
"""

import pytest
import pandas as pd
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.etl.pipeline import get_p2p_dataframe
from backend.app.analytics.spot_buy_engine import analyze_spot_buys, simulate_spot_buy_reduction
from backend.app.analytics.three_way_match import analyze_three_way_match
from backend.app.analytics.cycle_times import analyze_cycle_times
from backend.app.analytics.vendor_scorecard import analyze_vendors
from backend.app.analytics.working_capital import analyze_working_capital

client = TestClient(app)


def test_p2p_dataset_integrity():
    """Verify master P2P dataset dimensions and required fields."""
    df = get_p2p_dataframe()
    assert len(df) > 5000
    required_cols = [
        "po_number", "requisition_id", "vendor_name", "department",
        "po_creation_date", "approval_date", "delivery_date", "invoice_date", "payment_date",
        "is_spot_buy", "is_contract_buy", "purchase_type", "spot_buy_rule_triggered",
        "po_total_amount", "three_way_match_status", "cycle_time_creation_to_approval",
    ]
    for col in required_cols:
        assert col in df.columns, f"Missing required column: {col}"


def test_spot_buy_rule_consistency():
    """Verify that spot buy and contract flags are strictly mutually exclusive."""
    df = get_p2p_dataframe()
    assert (df["is_spot_buy"] == ~df["is_contract_buy"]).all()
    assert set(df["purchase_type"].unique()) == {"Contract", "Spot Buy"}

    # Rule 1 verification: If vendor has <= 2 total historical orders, must be Spot Buy
    infrequent = df[df["vendor_total_historical_orders"] <= 2]
    assert (infrequent["is_spot_buy"] == True).all()

    # Verify spot buy analytics
    res = analyze_spot_buys(df)
    assert res["kpis"]["total_pos"] == len(df)
    assert res["kpis"]["spot_spend_pct"] > 0
    assert res["kpis"]["contract_spend_pct"] > 0
    assert len(res["rule_breakdown"]) >= 3


def test_three_way_match_accuracy():
    """Verify 3-way matching engine flags discrepancies and balances correctly."""
    df = get_p2p_dataframe()
    res = analyze_three_way_match(df)
    kpis = res["kpis"]
    assert kpis["total_audited_pos"] == len(df)
    assert kpis["matched_rate_pct"] > 70.0
    assert kpis["total_discrepancy_count"] > 0
    assert len(res["exception_queue"]) > 0


def test_cycle_times_and_funnel():
    """Verify cycle times and process mining funnel stages."""
    df = get_p2p_dataframe()
    res = analyze_cycle_times(df)
    assert "total_p2p_cycle_time" in res["summary"]
    assert res["summary"]["total_p2p_cycle_time"]["mean_days"] > 0
    assert len(res["funnel"]) == 5


def test_api_health_and_endpoints():
    """Test REST API responses."""
    r_health = client.get("/api/health")
    assert r_health.status_code == 200
    assert r_health.json()["status"] == "healthy"

    r_overview = client.get("/api/overview")
    assert r_overview.status_code == 200
    assert "kpis" in r_overview.json()

    r_spot = client.get("/api/spot-buys")
    assert r_spot.status_code == 200
    assert "kpis" in r_spot.json()

    r_match = client.get("/api/three-way-match")
    assert r_match.status_code == 200
    assert "exception_queue" in r_match.json()

    r_vendors = client.get("/api/vendors")
    assert r_vendors.status_code == 200
    assert "scorecard_table" in r_vendors.json()


def test_what_if_simulator():
    """Test spot buy reduction what-if simulator."""
    r_sim = client.post("/api/spot-buys/simulate", json={
        "target_reduction_pct": 20.0,
        "negotiated_discount_pct": 10.0
    })
    assert r_sim.status_code == 200
    data = r_sim.json()
    assert data["direct_cost_savings"] > 0
    assert data["total_projected_savings"] > 0

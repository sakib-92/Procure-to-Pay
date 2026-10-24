"""
ML Module: Fulfillment Lead Time & Delivery Risk Forecaster.
Trains a Gradient Boosting model to forecast delivery lead times
and identify at-risk orders before fulfillment delays occur.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline


def train_lead_time_model(df: pd.DataFrame) -> dict:
    """
    Trains a Gradient Boosting model to predict approval-to-delivery lead time.
    Returns model metrics and feature importance.
    """
    df_clean = df.dropna(subset=["cycle_time_approval_to_delivery"]).copy()

    features = ["item_category", "department", "is_spot_buy", "po_total_amount", "vendor_city"]
    target = "cycle_time_approval_to_delivery"

    X = df_clean[features]
    y = df_clean[target]

    categorical_features = ["item_category", "department", "vendor_city"]
    numerical_features = ["po_total_amount", "is_spot_buy"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(drop="first", sparse_output=False, handle_unknown="ignore"), categorical_features),
            ("num", "passthrough", numerical_features),
        ]
    )

    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", GradientBoostingRegressor(n_estimators=80, max_depth=4, random_state=42)),
        ]
    )

    model.fit(X, y)
    y_pred = model.predict(X)
    mae = round(float(np.mean(np.abs(y - y_pred))), 2)

    # Risk predictions for recent POs
    df_clean["predicted_delivery_days"] = y_pred.round(1)
    df_clean["delivery_risk_index"] = np.where(df_clean["predicted_delivery_days"] > 18, "High Risk", "Normal")

    return {
        "mae_days": mae,
        "training_samples": len(df_clean),
        "mean_actual_days": round(float(y.mean()), 1),
        "mean_predicted_days": round(float(y_pred.mean()), 1),
    }

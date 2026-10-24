"""
ETL Step 1: Clean Project 1 Dataset
Reuses the Project 1 raw datasets (sales_raw.csv, customers_raw.csv) and executes
standard data cleaning routines (deduplication, Indian city normalization,
null imputation) so data is cleaned strictly ONCE.
"""

import os
from pathlib import Path
import pandas as pd
import numpy as np

# Indian city label normalization map (from Project 1 ETL)
CITY_MAP = {
    "bombay": "Mumbai",
    "mumbai": "Mumbai",
    "bombay, mh": "Mumbai",
    "mumbai, mh": "Mumbai",
    "bangalore": "Bengaluru",
    "bengaluru": "Bengaluru",
    "blr": "Bengaluru",
    "delhi": "Delhi NCR",
    "new delhi": "Delhi NCR",
    "delhi ncr": "Delhi NCR",
    "hyderabad": "Hyderabad",
    "hyd": "Hyderabad",
    "pune": "Pune",
    "pune, mh": "Pune",
    "chennai": "Chennai",
    "madras": "Chennai",
}


def normalize_city(val: str | None) -> str | None:
    if pd.isna(val) or val is None:
        return "Bengaluru"
    s = str(val).strip().lower()
    return CITY_MAP.get(s, str(val).strip().title())


def clean_project1_data(
    raw_dir: str | Path | None = None,
    processed_dir: str | Path | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Cleans raw Project 1 datasets:
      1. customers_raw.csv -> clean_customers
      2. sales_raw.csv -> clean_sales
    Saves clean artifacts into processed_dir so cleaning is executed only once.
    """
    base_dir = Path(__file__).resolve().parent.parent.parent
    if raw_dir is None:
        raw_dir = base_dir / "data" / "raw"
    else:
        raw_dir = Path(raw_dir)

    if processed_dir is None:
        processed_dir = base_dir / "data" / "processed"
    else:
        processed_dir = Path(processed_dir)

    processed_dir.mkdir(parents=True, exist_ok=True)

    cust_file = raw_dir / "customers_raw.csv"
    sales_file = raw_dir / "sales_raw.csv"

    # Fallback to sibling bi-dashboard if needed
    if not cust_file.exists():
        sibling_raw = base_dir.parent.parent / "Dashboard" / "bi-dashboard" / "data" / "raw"
        if (sibling_raw / "customers_raw.csv").exists():
            cust_file = sibling_raw / "customers_raw.csv"
            sales_file = sibling_raw / "sales_raw.csv"

    print(f"[ETL Step 1] Reading Project 1 data from {raw_dir}...")
    df_customers = pd.read_csv(cust_file)
    df_sales = pd.read_csv(sales_file)

    # 1. Clean Customers
    n_cust_raw = len(df_customers)
    df_customers = df_customers.drop_duplicates(subset=["customer_id"]).copy()
    df_customers["country"] = df_customers["country"].apply(normalize_city)
    df_customers["contract_type"] = df_customers["contract_type"].fillna("trial")
    df_customers["payment_method"] = df_customers["payment_method"].fillna("net_banking")
    df_customers["payment_delay_days"] = df_customers["payment_delay_days"].fillna(0.0).clip(lower=0)
    df_customers["total_spend"] = pd.to_numeric(df_customers["total_spend"], errors="coerce")
    df_customers["total_spend"] = df_customers["total_spend"].fillna(df_customers["mrr"] * 12)
    print(f"  [Clean Customers] Deduplicated {n_cust_raw} -> {len(df_customers)} rows, normalized cities.")

    # 2. Clean Sales
    n_sales_raw = len(df_sales)
    df_sales = df_sales.drop_duplicates().copy()
    df_sales["country"] = df_sales["country"].apply(normalize_city)
    df_sales["sale_date"] = pd.to_datetime(df_sales["sale_date"], errors="coerce")
    df_sales = df_sales.dropna(subset=["sale_date"]).sort_values(["product", "sale_date"])

    # Time-series ffill/bfill for missing revenue
    df_sales["revenue"] = df_sales.groupby("product")["revenue"].transform(
        lambda s: s.ffill().bfill()
    )
    # Median impute units_sold
    df_sales["units_sold"] = df_sales.groupby("product")["units_sold"].transform(
        lambda s: s.fillna(s.median())
    ).round().astype("int64")

    df_sales["channel"] = df_sales["channel"].fillna("direct_procurement")
    df_sales["discount_pct"] = df_sales["discount_pct"].fillna(0.0)
    print(f"  [Clean Sales] Deduplicated {n_sales_raw} -> {len(df_sales)} rows, imputed missing values.")

    # Save cleaned intermediate datasets
    clean_cust_path = processed_dir / "clean_customers.parquet"
    clean_sales_path = processed_dir / "clean_sales.parquet"
    df_customers.to_parquet(clean_cust_path, index=False)
    df_sales.to_parquet(clean_sales_path, index=False)
    print(f"  [Cleaned Artifacts] Stored to {clean_cust_path} and {clean_sales_path}")

    return df_customers, df_sales


if __name__ == "__main__":
    clean_project1_data()

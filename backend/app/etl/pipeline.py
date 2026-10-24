"""
Unified ETL Pipeline Orchestrator.
Guarantees that Project 1 data is cleaned strictly once,
and manages memory caching of the enriched P2P master dataset.
"""

from pathlib import Path
import pandas as pd
from .clean_project1 import clean_project1_data
from .p2p_enrichment import enrich_p2p_dataset

_CACHED_DF: pd.DataFrame | None = None


def run_full_pipeline(force: bool = False) -> pd.DataFrame:
    """
    Runs the end-to-end pipeline:
    1. Clean Project 1 data (only once)
    2. Enrich into P2P master table with spot buy rule engine & 3-way matching
    """
    global _CACHED_DF
    base_dir = Path(__file__).resolve().parent.parent.parent
    processed_dir = base_dir / "data" / "processed"
    master_path = processed_dir / "p2p_master.parquet"

    if force or not master_path.exists():
        print("[Pipeline] Running Step 1: Cleaning Project 1 data...")
        clean_project1_data(processed_dir=processed_dir)

        print("[Pipeline] Running Step 2: Enriching P2P lifecycle & Spot Buy rules...")
        df = enrich_p2p_dataset(processed_dir=processed_dir)
        _CACHED_DF = df
        return df

    print(f"[Pipeline] Loading cached clean P2P master from {master_path}")
    _CACHED_DF = pd.read_parquet(master_path)
    return _CACHED_DF


def get_p2p_dataframe(force_reload: bool = False) -> pd.DataFrame:
    """
    Returns the loaded P2P DataFrame from memory cache,
    or loads it from disk if not already in memory.
    """
    global _CACHED_DF
    if _CACHED_DF is None or force_reload:
        _CACHED_DF = run_full_pipeline(force=force_reload)
    return _CACHED_DF


if __name__ == "__main__":
    df = run_full_pipeline(force=True)
    print(f"[Pipeline] Ready with {len(df)} records.")

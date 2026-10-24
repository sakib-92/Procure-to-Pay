"""
ETL Step 2: Procure-to-Pay (P2P) Lifecycle & Rule-based Spot Buy Enrichment.

Consumes the cleaned Project 1 base tables (clean_customers.parquet, clean_sales.parquet)
and constructs an enterprise-grade Procure-to-Pay dataset featuring:
  - PO Creation Date, Approval Date, Delivery Date (GRN), Invoice Date, and Payment Date.
  - Multi-condition Spot Buy Rule Engine (Contract vs Spot Buy / One-off classification).
  - 3-Way Matching Engine fields (PO vs GRN vs Invoice amounts and quantities).
  - Cycle times & SLA metrics across every stage of the P2P funnel.
  - Anomaly indicators (Split POs, Duplicate Invoices, Weekend Approvals).
"""

from datetime import datetime, timedelta
from pathlib import Path
import numpy as np
import pandas as pd


# Corporate Procurement Item Taxonomy mapping Project 1 products + enterprise commodities
COMMODITY_CATEGORIES = {
    "Enterprise ERP India": ("IT Software & SaaS", 48000.0, "Core ERP Cloud License Subscription"),
    "GST Cloud Sync": ("IT Software & SaaS", 18500.0, "Automated Tax Filing & E-way Bill SaaS"),
    "PayMetrics Pro": ("IT Software & SaaS", 32000.0, "Enterprise Payroll & Compliance Suite"),
    "InsightCore IN": ("IT Software & SaaS", 24000.0, "Executive Business Intelligence Platform"),
    "FlowTrack AI": ("IT Software & SaaS", 29500.0, "Supply Chain Workflow Automation AI"),
    "MetricsHub Enterprise": ("IT Software & SaaS", 35000.0, "Unified Telemetry & Server Monitoring"),
    "SegmentAI South Asia": ("IT Software & SaaS", 21000.0, "Customer Segmentation & ML Insights"),
    "DataVault IN": ("Cloud Infrastructure", 45000.0, "Secure Cloud Object Storage & Backup"),
    "ReportEngine GST": ("IT Software & SaaS", 16000.0, "Statutory Audit Reporting Add-on"),
    "QueryMaster IN": ("IT Software & SaaS", 22000.0, "SQL Acceleration Engine & Data Lake"),
    "AlertWatch Enterprise": ("IT Software & SaaS", 19000.0, "Real-time Infrastructure Alerting"),
    "CohortLens India": ("IT Software & SaaS", 27000.0, "Customer Cohort Retention Analytics"),
}

ADDITIONAL_P2P_COMMODITIES = [
    ("Dell PowerEdge R750 Rack Server", "Hardware & Networking", 320000.0, "Data Center Compute Node"),
    ("Cisco Catalyst 9300 48-Port Switch", "Hardware & Networking", 185000.0, "Core Campus Network Switch"),
    ("MacBook Pro 16 M3 Max Deployments", "Hardware & Networking", 249000.0, "Engineering Workstation Fleet"),
    ("KPMG Transfer Pricing Advisory", "Professional Services", 450000.0, "Quarterly Statutory Compliance Retainer"),
    ("PwC Forensic Security Audit", "Professional Services", 380000.0, "ISO 27001 Annual Recertification"),
    ("AWS Direct Connect & EC2 Reserve", "Cloud Infrastructure", 520000.0, "Reserved Cloud Compute Capacity"),
    ("Industrial Cleanroom HVAC Filters", "MRO & Facilities", 38000.0, "Bi-monthly Facility Air Filtration"),
    ("Heavy Duty Hydraulic Valve Kits", "MRO & Facilities", 64000.0, "Plant Maintenance Spares"),
    ("Ergonomic Herman Miller Seating", "Corporate Facilities", 42000.0, "Office Ergonomic Workplace Refit"),
    ("Polycom Studio Video Conference Kits", "Corporate Facilities", 89000.0, "Executive Boardroom AV Upgrade"),
    ("Ad-hoc Emergency Logistics Courier", "Logistics & Freight", 14500.0, "Same-day Critical Component Air Freight"),
    ("Temporary Translation Services", "Ad-hoc Services", 9500.0, "One-off Regional Translation Assistance"),
]

DEPARTMENTS = [
    "Information Technology",
    "Engineering & R&D",
    "Corporate Operations",
    "Finance & Accounts",
    "Marketing & Growth",
    "Legal & Compliance",
    "Human Resources",
]

BUYER_NAMES = [
    "Rajesh Sharma (CPO)",
    "Priya Nair (Senior Buyer)",
    "Vikramaditya Rao (IT Procurement)",
    "Ananya Deshmukh (MRO Specialist)",
    "Siddharth Menon (Services Category Lead)",
    "Sunita Iyer (Tactical Sourcing)",
]

PAYMENT_TERMS_CHOICES = ["Net 30", "Net 45", "Net 60", "2/10 Net 30"]
PAYMENT_TERMS_WEIGHTS = [0.45, 0.30, 0.15, 0.10]


def enrich_p2p_dataset(
    processed_dir: str | Path | None = None,
    seed: int = 42,
) -> pd.DataFrame:
    """
    Enriches the cleaned Project 1 dataset into a production-grade P2P table.
    Ensures that data cleaning was done only once in Step 1.
    """
    base_dir = Path(__file__).resolve().parent.parent.parent
    if processed_dir is None:
        processed_dir = base_dir / "data" / "processed"
    else:
        processed_dir = Path(processed_dir)

    clean_cust_path = processed_dir / "clean_customers.parquet"
    clean_sales_path = processed_dir / "clean_sales.parquet"

    if not clean_cust_path.exists() or not clean_sales_path.exists():
        from .clean_project1 import clean_project1_data
        clean_project1_data()

    print(f"[ETL Step 2] Loading clean Project 1 data from {processed_dir}...")
    df_customers = pd.read_parquet(clean_cust_path)
    df_sales = pd.read_parquet(clean_sales_path)

    rng = np.random.default_rng(seed)

    # Prepare pool of suppliers from customers table (reusing companies)
    unique_companies = df_customers["company"].dropna().unique()
    company_country_map = df_customers.set_index("company")["country"].to_dict()
    company_contract_map = df_customers.set_index("company")["contract_type"].to_dict()

    # Sample a manageable, high-fidelity P2P dataset (~8,000 to 10,000 PO transactions)
    # Reusing sales transaction timestamps and products
    df_base = df_sales.copy()
    if len(df_base) > 8500:
        df_base = df_base.sample(n=8500, random_state=seed).reset_index(drop=True)

    records = []
    supplier_order_counts: dict[str, int] = {}

    # Pre-assign suppliers with realistic power-law distribution (some frequent contracted, some one-off)
    # 70% of spend goes to 15% top suppliers; 30% goes to long tail (one-offs / spot buys)
    num_suppliers = min(450, len(unique_companies))
    top_contracted_suppliers = unique_companies[:50]
    mid_suppliers = unique_companies[50:180]
    tail_one_off_suppliers = unique_companies[180:num_suppliers]

    supplier_pool = []
    # Weighted selection to create repeat vs single-use vendors
    for comp in top_contracted_suppliers:
        supplier_pool.extend([comp] * 70)
    for comp in mid_suppliers:
        supplier_pool.extend([comp] * 18)
    for comp in tail_one_off_suppliers:
        supplier_pool.extend([comp] * 1)  # Single or rare occurrence -> perfect for Spot Buy rule!

    supplier_pool_len = len(supplier_pool)

    for i, row in df_base.iterrows():
        po_idx = i + 1
        po_number = f"PO-2023-{po_idx:05d}"
        requisition_id = f"PR-2023-{po_idx:05d}"

        # Assign vendor
        assigned_vendor = supplier_pool[rng.integers(0, supplier_pool_len)]
        vendor_city = company_country_map.get(assigned_vendor, "Bengaluru")
        orig_contract_type = company_contract_map.get(assigned_vendor, "trial")

        # Track vendor order count
        supplier_order_counts[assigned_vendor] = supplier_order_counts.get(assigned_vendor, 0) + 1

        # Determine item and category
        product_name = str(row["product"])
        if product_name in COMMODITY_CATEGORIES and rng.random() > 0.35:
            cat, base_price, desc = COMMODITY_CATEGORIES[product_name]
            item_name = product_name
        else:
            add_item = ADDITIONAL_P2P_COMMODITIES[rng.integers(0, len(ADDITIONAL_P2P_COMMODITIES))]
            item_name = add_item[0]
            cat = add_item[1]
            base_price = add_item[2]
            desc = add_item[3]

        quantity_ordered = int(max(1, row.get("units_sold", rng.integers(1, 20))))
        if cat in ["Professional Services", "Corporate Facilities"]:
            quantity_ordered = int(rng.integers(1, 5))

        # Dates: PO Creation -> Approval -> Delivery (GRN) -> Invoice -> Payment
        # Base timestamp from sale_date
        raw_date = row["sale_date"]
        po_creation_date = pd.to_datetime(raw_date).date()

        # Approval Lead Time: 1 to 5 days normally; 4% chance of managerial stall (12 to 24 days)
        if rng.random() < 0.04:
            approval_lag = int(rng.integers(12, 25))
        else:
            approval_lag = int(rng.integers(1, 6))
        approval_date = po_creation_date + timedelta(days=approval_lag)

        # Delivery Lead Time: 3 to 18 days; 8% chance of supplier delay / disruption (22 to 45 days)
        is_delayed = rng.random() < 0.08
        if is_delayed:
            delivery_lag = int(rng.integers(22, 46))
        else:
            delivery_lag = int(rng.integers(3, 19))
        delivery_date = approval_date + timedelta(days=delivery_lag)
        promised_delivery_date = approval_date + timedelta(days=int(delivery_lag * (0.8 if is_delayed else 1.15)))

        # Invoice Date: usually 0 to 4 days after delivery
        invoice_lag = int(rng.integers(0, 5))
        invoice_date = delivery_date + timedelta(days=invoice_lag)

        # Payment terms & payment date
        terms = rng.choice(PAYMENT_TERMS_CHOICES, p=PAYMENT_TERMS_WEIGHTS)
        terms_days = 30
        if terms == "Net 45":
            terms_days = 45
        elif terms == "Net 60":
            terms_days = 60
        elif terms == "2/10 Net 30":
            terms_days = 30

        # Accounts payable payment latency (DPO variance)
        # Some paid early (capturing 2% discount), some on time, 12% overdue
        is_early_discount_captured = False
        if terms == "2/10 Net 30" and rng.random() < 0.65:
            payment_lag = int(rng.integers(5, 10))
            is_early_discount_captured = True
        elif rng.random() < 0.12:  # Overdue payment
            payment_lag = terms_days + int(rng.integers(10, 35))
        else:
            payment_lag = int(rng.integers(max(10, terms_days - 5), terms_days + 4))

        payment_date = invoice_date + timedelta(days=payment_lag)

        # Department & Buyer
        dept = rng.choice(DEPARTMENTS)
        buyer = rng.choice(BUYER_NAMES)

        records.append({
            "po_number": po_number,
            "requisition_id": requisition_id,
            "vendor_name": assigned_vendor,
            "vendor_city": vendor_city,
            "orig_contract_type": orig_contract_type,
            "item_name": item_name,
            "item_category": cat,
            "item_description": desc,
            "department": dept,
            "buyer_name": buyer,
            "quantity_ordered": quantity_ordered,
            "base_unit_price": round(float(base_price), 2),
            "po_creation_date": po_creation_date,
            "approval_date": approval_date,
            "delivery_date": delivery_date,
            "promised_delivery_date": promised_delivery_date,
            "invoice_date": invoice_date,
            "payment_date": payment_date,
            "payment_terms": terms,
            "payment_lag_days": payment_lag,
            "terms_days": terms_days,
            "discount_captured": is_early_discount_captured,
        })

    df_p2p = pd.DataFrame(records)

    # Compute total supplier order counts across full dataset for Spot Buy Rule 1
    vendor_total_orders = df_p2p["vendor_name"].value_counts().to_dict()
    df_p2p["vendor_total_historical_orders"] = df_p2p["vendor_name"].map(vendor_total_orders)

    # -------------------------------------------------------------------------
    # SPOT BUY RULE ENGINE (Mandatory Requirement from Prompt)
    # Rule 1: Supplier used <= 2 times across historical records (One-off / Infrequent supplier)
    # Rule 2: No active Master Service Agreement (orig_contract_type in ('trial', 'none', 'one-off') or None)
    # Rule 3: Ad-hoc commodity category (e.g., "Ad-hoc Services", "Logistics & Freight" emergency couriers)
    # -------------------------------------------------------------------------
    rule1_cond = df_p2p["vendor_total_historical_orders"] <= 2
    rule2_cond = df_p2p["orig_contract_type"].isin(["trial", "none", "one-off", "monthly"]) & (df_p2p["vendor_total_historical_orders"] < 6)
    rule3_cond = df_p2p["item_category"].isin(["Ad-hoc Services", "Logistics & Freight"])

    is_spot = rule1_cond | rule2_cond | rule3_cond

    def determine_spot_rule(row) -> str:
        if row["rule1"]:
            return "Rule 1: Infrequent / Single-Use Supplier (<= 2 total POs)"
        elif row["rule3"]:
            return "Rule 3: Ad-hoc Non-Catalog / Emergency Requisition"
        elif row["rule2"]:
            return "Rule 2: No Active Master Services Agreement (MSA)"
        return "Contract Purchase: Active Long-Term Master Agreement"

    df_p2p["rule1"] = rule1_cond
    df_p2p["rule2"] = rule2_cond
    df_p2p["rule3"] = rule3_cond
    df_p2p["is_spot_buy"] = is_spot
    df_p2p["is_contract_buy"] = ~is_spot
    df_p2p["purchase_type"] = np.where(is_spot, "Spot Buy", "Contract")
    df_p2p["spot_buy_rule_triggered"] = df_p2p.apply(determine_spot_rule, axis=1)

    # Contract ID: Assigned for Contract buys, Null for Spot buys
    contract_ids = [
        f"MSA-IND-2022-{(hash(v) % 9000 + 1000):04d}" if not s else None
        for v, s in zip(df_p2p["vendor_name"], df_p2p["is_spot_buy"])
    ]
    df_p2p["contract_id"] = contract_ids

    # Pricing & Spend Leakage: Spot buys suffer an unnegotiated premium (+12% to +20%)
    # Contract buys enjoy volume discounts (-5% to -12%)
    spot_premium_multiplier = np.where(
        df_p2p["is_spot_buy"],
        rng.uniform(1.10, 1.22, size=len(df_p2p)),
        rng.uniform(0.92, 0.98, size=len(df_p2p))
    )
    df_p2p["actual_unit_price"] = (df_p2p["base_unit_price"] * spot_premium_multiplier).round(2)
    df_p2p["po_total_amount"] = (df_p2p["quantity_ordered"] * df_p2p["actual_unit_price"]).round(2)

    # Calculate Spend Leakage (Premium paid over contract benchmark)
    df_p2p["benchmark_contract_price"] = (df_p2p["base_unit_price"] * 0.94).round(2)
    df_p2p["spend_leakage_amount"] = np.maximum(
        0.0,
        (df_p2p["actual_unit_price"] - df_p2p["benchmark_contract_price"]) * df_p2p["quantity_ordered"]
    ).round(2)

    # -------------------------------------------------------------------------
    # 3-WAY MATCHING SIMULATION (PO vs GRN vs Vendor Invoice)
    # -------------------------------------------------------------------------
    grn_numbers = []
    quantities_received = []
    invoice_numbers = []
    invoice_unit_prices = []
    invoice_amounts = []
    match_statuses = []

    for idx, row in df_p2p.iterrows():
        po_qty = row["quantity_ordered"]
        po_price = row["actual_unit_price"]
        po_total = row["po_total_amount"]
        i_num = f"INV-2023-{(idx + 1):06d}"
        g_num = f"GRN-2023-{(idx + 1):06d}"

        draw = rng.random()
        if draw < 0.88:
            # Clean 3-way match
            match_status = "Matched"
            qty_recv = po_qty
            inv_price = po_price
            inv_total = po_total
        elif draw < 0.93:
            # Price Discrepancy (Supplier overbilled unit price by 5-15%)
            match_status = "Price Discrepancy"
            qty_recv = po_qty
            inv_price = round(po_price * rng.uniform(1.06, 1.15), 2)
            inv_total = round(qty_recv * inv_price, 2)
        elif draw < 0.97:
            # Quantity Discrepancy (Delivered less than ordered, but invoiced full or vice versa)
            match_status = "Quantity Discrepancy"
            qty_recv = max(1, po_qty - int(rng.integers(1, max(2, po_qty // 2 + 1))))
            inv_price = po_price
            inv_total = round(po_qty * inv_price, 2)  # Invoiced for ordered rather than received!
        else:
            # Missing GRN / Intake Discrepancy (Invoice arrived before Goods Receipt intake)
            match_status = "Missing Goods Receipt (GRN)"
            qty_recv = 0
            g_num = "PENDING_GRN"
            inv_price = po_price
            inv_total = po_total

        grn_numbers.append(g_num)
        quantities_received.append(qty_recv)
        invoice_numbers.append(i_num)
        invoice_unit_prices.append(inv_price)
        invoice_amounts.append(inv_total)
        match_statuses.append(match_status)

    df_p2p["grn_number"] = grn_numbers
    df_p2p["quantity_received"] = quantities_received
    df_p2p["invoice_number"] = invoice_numbers
    df_p2p["invoice_unit_price"] = invoice_unit_prices
    df_p2p["invoice_amount"] = invoice_amounts
    df_p2p["three_way_match_status"] = match_statuses

    # Paid amount: Accounts payable settles invoiced amount or holds disputed amount
    paid_amounts = []
    for m_stat, inv_amt, po_amt in zip(match_statuses, invoice_amounts, df_p2p["po_total_amount"]):
        if m_stat == "Matched":
            paid_amounts.append(inv_amt)
        elif m_stat == "Price Discrepancy":
            # AP pays contracted PO amount, holding back unauthorized variance
            paid_amounts.append(po_amt)
        elif m_stat == "Quantity Discrepancy":
            paid_amounts.append(round(po_amt * 0.75, 2))
        else:
            paid_amounts.append(0.0)  # On hold pending GRN verification
    df_p2p["paid_amount"] = paid_amounts

    # -------------------------------------------------------------------------
    # CYCLE TIMES & SLA CALCULATIONS
    # -------------------------------------------------------------------------
    df_p2p["cycle_time_creation_to_approval"] = (
        pd.to_datetime(df_p2p["approval_date"]) - pd.to_datetime(df_p2p["po_creation_date"])
    ).dt.days

    df_p2p["cycle_time_approval_to_delivery"] = (
        pd.to_datetime(df_p2p["delivery_date"]) - pd.to_datetime(df_p2p["approval_date"])
    ).dt.days

    df_p2p["cycle_time_delivery_to_invoice"] = (
        pd.to_datetime(df_p2p["invoice_date"]) - pd.to_datetime(df_p2p["delivery_date"])
    ).dt.days

    df_p2p["cycle_time_invoice_to_payment"] = (
        pd.to_datetime(df_p2p["payment_date"]) - pd.to_datetime(df_p2p["invoice_date"])
    ).dt.days

    df_p2p["total_p2p_cycle_time"] = (
        pd.to_datetime(df_p2p["payment_date"]) - pd.to_datetime(df_p2p["po_creation_date"])
    ).dt.days

    # OTIF (On-Time In-Full)
    df_p2p["is_on_time"] = df_p2p["delivery_date"] <= df_p2p["promised_delivery_date"]
    df_p2p["is_in_full"] = df_p2p["quantity_received"] >= df_p2p["quantity_ordered"]
    df_p2p["is_otif"] = df_p2p["is_on_time"] & df_p2p["is_in_full"]

    # -------------------------------------------------------------------------
    # FRAUD & AUDIT ANOMALY SIGNALS
    # -------------------------------------------------------------------------
    # 1. Split PO Detection: PO value between ₹4,75,000 and ₹4,99,999 (avoiding ₹5,00,000 board sign-off threshold)
    df_p2p["is_split_po"] = (
        (df_p2p["po_total_amount"] >= 475000.0) & (df_p2p["po_total_amount"] < 500000.0)
    )

    # 2. Weekend Approval: Approved on Saturday (5) or Sunday (6)
    approval_weekdays = pd.to_datetime(df_p2p["approval_date"]).dt.weekday
    df_p2p["is_weekend_approval"] = approval_weekdays.isin([5, 6])

    # 3. Duplicate Invoice Anomaly: Injected duplicates (~1.5% frequency)
    df_p2p["is_duplicate_invoice"] = False
    dup_indices = rng.choice(df_p2p.index, size=int(len(df_p2p) * 0.015), replace=False)
    for d_idx in dup_indices:
        df_p2p.loc[d_idx, "is_duplicate_invoice"] = True
        df_p2p.loc[d_idx, "three_way_match_status"] = "Suspected Duplicate Invoice"

    # Drop intermediate temporary rule flags from final view
    df_p2p = df_p2p.drop(columns=["rule1", "rule2", "rule3"])

    # Save enriched P2P master dataset
    master_parquet_path = processed_dir / "p2p_master.parquet"
    master_csv_path = processed_dir / "p2p_master.csv"
    df_p2p.to_parquet(master_parquet_path, index=False)
    df_p2p.to_csv(master_csv_path, index=False)

    print(f"[ETL Step 2] Successfully generated {len(df_p2p)} P2P records.")
    print(f"  Spot Buys: {df_p2p['is_spot_buy'].sum()} ({df_p2p['is_spot_buy'].mean()*100:.1f}%)")
    print(f"  Contract Buys: {df_p2p['is_contract_buy'].sum()} ({df_p2p['is_contract_buy'].mean()*100:.1f}%)")
    print(f"  Spend Leakage: INR {df_p2p['spend_leakage_amount'].sum():,.2f}")
    print(f"  Saved master dataset to {master_parquet_path} and {master_csv_path}")

    return df_p2p


if __name__ == "__main__":
    enrich_p2p_dataset()

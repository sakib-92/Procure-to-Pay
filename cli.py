"""
Command-Line Interface (CLI) for Procure-to-Pay Analytics & Automated Reporting.
Supports automated cron execution, data cleaning, anomaly audits, and report generation.
"""

import argparse
import sys
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from backend.app.etl.clean_project1 import clean_project1_data
from backend.app.etl.p2p_enrichment import enrich_p2p_dataset
from backend.app.etl.pipeline import get_p2p_dataframe
from backend.app.analytics.spot_buy_engine import analyze_spot_buys
from backend.app.analytics.three_way_match import analyze_three_way_match
from backend.app.analytics.cycle_times import analyze_cycle_times
from backend.app.reporting.pdf_generator import generate_p2p_pdf_report
from backend.app.reporting.excel_generator import generate_p2p_excel_report
from backend.app.reporting.html_generator import generate_p2p_html_report
from backend.app.ml.anomaly_detector import run_anomaly_detection

console = Console()


def print_spot_buy_rules():
    rule_text = (
        "[bold cyan]Spot Buy (Maverick Spend) Classification Rule Engine[/bold cyan]\n\n"
        "[bold yellow]Rule 1: Infrequent / Single-Use Supplier[/bold yellow]\n"
        "  Any supplier with <= 2 total purchase orders in historical ledger is classified as a spot buy.\n\n"
        "[bold yellow]Rule 2: Lack of Master Services Agreement (MSA)[/bold yellow]\n"
        "  Any purchase order not referencing an active negotiated master agreement (e.g. trial/monthly terms).\n\n"
        "[bold yellow]Rule 3: Ad-hoc Non-Catalog / Emergency Requisitions[/bold yellow]\n"
        "  Ad-hoc expedited services or freight bypassing negotiated catalog pricing.\n\n"
        "[bold green]Contract Buys:[/bold green] All orders satisfying active negotiated enterprise contracts."
    )
    console.print(Panel(rule_text, title="Procure-to-Pay Governance", border_style="cyan"))


def main():
    parser = argparse.ArgumentParser(
        description="P2P Process Analytics & Automated Reporting CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--clean", action="store_true", help="Execute Project 1 data cleaning (once)")
    parser.add_argument("--enrich", action="store_true", help="Enrich cleaned data into P2P master dataset")
    parser.add_argument("--audit", action="store_true", help="Run 3-way match reconciliation and anomaly scan")
    parser.add_argument("--report", choices=["pdf", "excel", "html", "all"], help="Generate executive reports")
    parser.add_argument("--spot-rules", action="store_true", help="Display formal spot buy rule definitions")
    parser.add_argument("--kpis", action="store_true", help="Print executive KPI summary table")

    args = parser.parse_args()

    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(0)

    if args.spot_rules:
        print_spot_buy_rules()

    if args.clean:
        console.print("[bold green]Running Step 1: Cleaning Project 1 data (once)...[/bold green]")
        clean_project1_data()
        console.print("[bold green]Clean datasets saved to backend/data/processed/[/bold green]")

    if args.enrich:
        console.print("[bold blue]Running Step 2: Enriching P2P lifecycle & Spot Buy rules...[/bold blue]")
        enrich_p2p_dataset()
        console.print("[bold blue]P2P master dataset updated.[/bold blue]")

    if args.kpis or args.audit or args.report:
        df = get_p2p_dataframe()
        spot_res = analyze_spot_buys(df)
        kpis = spot_res["kpis"]

        if args.kpis:
            table = Table(title="Procure-to-Pay (P2P) Executive Performance KPIs")
            table.add_column("Metric", style="bold cyan")
            table.add_column("Value", style="bold white", justify="right")
            table.add_column("Notes", style="dim")

            table.add_row("Total Spend", f"INR {kpis['total_spend']:,.0f}", f"{kpis['total_pos']:,} Purchase Orders")
            table.add_row("Contract Spend Rate", f"{kpis['contract_spend_pct']}%", f"INR {kpis['contract_spend']:,.0f}")
            table.add_row("Spot Buy Spend Rate", f"{kpis['spot_spend_pct']}%", f"INR {kpis['spot_spend']:,.0f}")
            table.add_row("Spend Leakage", f"INR {kpis['total_spend_leakage']:,.0f}", f"+{kpis['avg_spot_premium_pct']}% Avg Spot Premium")

            cycle_res = analyze_cycle_times(df)
            table.add_row("Avg Approval Lead Time", f"{cycle_res['summary']['cycle_time_creation_to_approval']['mean_days']} days", "Creation to Approval")
            table.add_row("Avg Total P2P Cycle", f"{cycle_res['summary']['total_p2p_cycle_time']['mean_days']} days", "Requisition to AP Disbursement")

            match_res = analyze_three_way_match(df)
            table.add_row("3-Way Match Clean Rate", f"{match_res['kpis']['matched_rate_pct']}%", f"{match_res['kpis']['matched_pos']:,} matched")
            table.add_row("Disputed Exposure", f"INR {match_res['kpis']['total_disputed_exposure']:,.0f}", f"{match_res['kpis']['total_discrepancy_count']:,} discrepancies")

            console.print(table)

        if args.audit:
            console.print("[bold magenta]Running ML Isolation Forest & Procurement Audit Scan...[/bold magenta]")
            anom_res = run_anomaly_detection(df)
            a_kpis = anom_res["kpis"]

            table = Table(title="Audit & Fraud Anomaly Findings")
            table.add_column("Audit Check", style="bold yellow")
            table.add_column("Count", justify="right")
            table.add_column("Status", style="bold")

            table.add_row("Split PO Structuring (< INR 5L threshold)", str(a_kpis["split_po_count"]), "[red]High Risk[/red]")
            table.add_row("Weekend / Off-hours Approvals", str(a_kpis["weekend_approval_count"]), "[yellow]Compliance Flag[/yellow]")
            table.add_row("Suspected Duplicate Invoices", str(a_kpis["duplicate_invoice_count"]), "[red]Payment Hold[/red]")
            table.add_row("Unit Price Spikes (>25% benchmark)", str(a_kpis["price_spike_count"]), "[yellow]Price Audit[/yellow]")
            console.print(table)

        if args.report:
            console.print(f"[bold green]Generating Automated Executive Report: {args.report.upper()}...[/bold green]")
            if args.report in ["pdf", "all"]:
                pdf_path = generate_p2p_pdf_report(df)
                console.print(f"  [green]PDF Report generated: {pdf_path}[/green]")
            if args.report in ["excel", "all"]:
                excel_path = generate_p2p_excel_report(df)
                console.print(f"  [green]Excel Workbook generated: {excel_path}[/green]")
            if args.report in ["html", "all"]:
                html_path = generate_p2p_html_report(df)
                console.print(f"  [green]HTML Digest generated: {html_path}[/green]")


if __name__ == "__main__":
    main()

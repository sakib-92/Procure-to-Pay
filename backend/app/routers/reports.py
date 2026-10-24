"""
Router: Automated Reporting Engine.
Provides endpoints to generate and download PDF, Excel, and HTML audit packages.
"""

from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
import pandas as pd
from ..etl.pipeline import get_p2p_dataframe
from ..reporting.pdf_generator import generate_p2p_pdf_report
from ..reporting.excel_generator import generate_p2p_excel_report
from ..reporting.html_generator import generate_p2p_html_report

router = APIRouter(prefix="/api/reports", tags=["Automated Reporting"])

REPORTS_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/generate-pdf")
def create_pdf_report(df: pd.DataFrame = Depends(get_p2p_dataframe)):
    """
    Triggers automated generation of the executive CPO/CFO PDF audit report.
    """
    file_path_str = generate_p2p_pdf_report(df)
    filename = Path(file_path_str).name
    return {
        "status": "success",
        "filename": filename,
        "download_url": f"/api/reports/download/{filename}",
        "message": "Executive PDF Audit Report generated successfully.",
    }


@router.post("/generate-excel")
def create_excel_report(df: pd.DataFrame = Depends(get_p2p_dataframe)):
    """
    Triggers automated generation of the multi-tab Excel financial model workbook.
    """
    file_path_str = generate_p2p_excel_report(df)
    filename = Path(file_path_str).name
    return {
        "status": "success",
        "filename": filename,
        "download_url": f"/api/reports/download/{filename}",
        "message": "Financial Audit Excel Workbook generated successfully.",
    }


@router.get("/html", response_class=HTMLResponse)
def get_html_report_view(df: pd.DataFrame = Depends(get_p2p_dataframe)):
    """
    Renders and streams the executive HTML audit memorandum.
    """
    html_path = generate_p2p_html_report(df)
    return Path(html_path).read_text(encoding="utf-8")


@router.get("/list")
def list_generated_reports():
    """
    Returns a list of all pre-generated PDF and Excel reports available on disk.
    """
    files = []
    for p in sorted(REPORTS_DIR.glob("*.*"), key=lambda x: x.stat().st_mtime, reverse=True):
        if p.suffix in [".pdf", ".xlsx", ".html"]:
            files.append({
                "filename": p.name,
                "file_type": p.suffix.replace(".", "").upper(),
                "size_kb": round(p.stat().st_size / 1024, 1),
                "download_url": f"/api/reports/download/{p.name}",
            })
    return {"reports": files}


@router.get("/download/{filename}")
def download_report(filename: str):
    """
    Streams the requested report file to the client.
    """
    target = REPORTS_DIR / filename
    if not target.exists():
        raise HTTPException(status_code=404, detail="Requested report file not found on server.")
    media_type = (
        "application/pdf" if target.suffix == ".pdf"
        else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if target.suffix == ".xlsx"
        else "text/html"
    )
    return FileResponse(path=target, filename=filename, media_type=media_type)

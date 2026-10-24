"""
Procure-to-Pay (P2P) Process Analytics & Automated Reporting API.
Main FastAPI Application Entrypoint.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .etl.pipeline import run_full_pipeline

from .routers import (
    overview,
    process_mining,
    spot_buys,
    three_way_match,
    vendors,
    anomalies,
    working_capital,
    reports,
    copilot,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure cleaned data is cached and ready upon server boot
    print("[Server Boot] Verifying P2P dataset readiness...")
    run_full_pipeline(force=False)
    print("[Server Boot] P2P Analytics Engine ready.")
    yield


app = FastAPI(
    title="Procure-to-Pay (P2P) Analytics & Automated Reporting API",
    description="Enterprise P2P process mining, contract compliance, spot buy rule engine, 3-way matching, and automated reporting.",
    version="2.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend Vite development server & production builds
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(overview.router)
app.include_router(process_mining.router)
app.include_router(spot_buys.router)
app.include_router(three_way_match.router)
app.include_router(vendors.router)
app.include_router(anomalies.router)
app.include_router(working_capital.router)
app.include_router(reports.router)
app.include_router(copilot.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Procure-to-Pay Analytics API",
        "version": "2.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

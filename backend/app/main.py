from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np

from app.services.engine import MonteCarloEngine

app = FastAPI(title="SMA Risk Engine API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Holding(BaseModel):
    ticker: str
    weight: float = Field(..., ge=0.0, le=1.0)

def default_holdings() -> list[Holding]:
    return [
        Holding(ticker="SPY", weight=0.45),
        Holding(ticker="VEA", weight=0.20),
        Holding(ticker="AGG", weight=0.25),
        Holding(ticker="BIL", weight=0.10),
    ]


class SimulationRequest(BaseModel):
    portfolio_id: str = "demo-sma"
    holdings: list[Holding] = Field(default_factory=default_holdings)
    simulations: int = Field(default=10000, ge=1000, le=50000)
    time_horizon_years: int = Field(default=5, ge=1, le=30)
    distribution_model: str = Field(default="student_t")
    macro_shock_bps: float = Field(default=0.0) # e.g., +200 bps rate shock

@app.post("/api/v1/simulate")
async def run_simulation(payload: SimulationRequest):
    total_weight = sum(h.weight for h in payload.holdings)
    if not np.isclose(total_weight, 1.0, atol=1e-2):
        raise HTTPException(status_code=400, detail="Portfolio weights must sum to 1.0")

    try:
        result = MonteCarloEngine.run_simulation(
            holdings=[holding.model_dump() for holding in payload.holdings],
            simulations=payload.simulations,
            time_horizon_years=payload.time_horizon_years,
            distribution_model=payload.distribution_model,
            macro_shock_bps=payload.macro_shock_bps,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "status": "success",
        "portfolio_id": payload.portfolio_id,
        **result,
    }
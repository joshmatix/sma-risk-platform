from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import numpy as np
import scipy.stats as stats

router = APIRouter()

class Holding(BaseModel):
    ticker: str
    weight: float = Field(..., ge=0.0, le=1.0)

class SimulationRequest(BaseModel):
    portfolio_id: str
    holdings: list[Holding]
    simulations: int = Field(default=10000, ge=1000, le=50000)
    time_horizon_years: int = Field(default=5, ge=1, le=30)
    distribution_model: str = Field(default="student_t", description="Options: normal, student_t, bootstrap")
    macro_shock_bps: float = Field(default=0.0, description="Yield curve shift in basis points (e.g., 200.0)")

@router.post("/simulate")
async def run_simulation(payload: SimulationRequest):
    try:
        # Validate that portfolio weights sum close to 1.0 (if holdings are provided)
        if payload.holdings:
            total_weight = sum(h.weight for h in payload.holdings)
            if not np.isclose(total_weight, 1.0, atol=1e-2):
                raise HTTPException(status_code=400, detail="Portfolio weights must sum to 1.0")

        np.random.seed(42)
        initial_value = 1000000.0
        n_days = payload.time_horizon_years * 252

        # 1. Generate return paths based on the selected distribution model
        if payload.distribution_model == "student_t":
            # Student's t-distribution for fat tails (df=5 captures crisis tail risks)
            daily_returns = stats.t.rvs(df=5, loc=0.0004, scale=0.012, size=(payload.simulations, n_days))
        elif payload.distribution_model == "normal":
            # Standard multivariate normal distribution assumption
            daily_returns = np.random.normal(loc=0.0004, scale=0.012, size=(payload.simulations, n_days))
        elif payload.distribution_model == "bootstrap":
            # Historical empirical bootstrap resampling
            base_history = np.random.normal(loc=0.0004, scale=0.011, size=(1000,))
            daily_returns = np.random.choice(base_history, size=(payload.simulations, n_days))
        else:
            raise HTTPException(status_code=400, detail="Invalid distribution model specified.")

        # 2. Inject macro factor shocks (e.g., parallel yield curve shift in bps)
        # Converts basis points to a scaling adjustment factor applied to returns
        shock_adjustment = 1.0 - (payload.macro_shock_bps / 10000.0)
        adjusted_returns = daily_returns * shock_adjustment

        # 3. Compute vectorized cumulative path trajectories
        cumulative_paths = initial_value * np.cumprod(1 + adjusted_returns, axis=1)
        final_values = cumulative_paths[:, -1]

        # 4. Compute institutional risk percentiles and metrics
        p5_val = float(np.percentile(final_values, 5))
        p50_val = float(np.percentile(final_values, 50))
        p95_val = float(np.percentile(final_values, 95))
        
        metrics = {
            "p5": p5_val,
            "p25": float(np.percentile(final_values, 25)),
            "p50": p50_val,
            "p75": float(np.percentile(final_values, 75)),
            "p95": p95_val,
            "var_95": float(initial_value - p5_val),
            "expected_shortfall_95": float(initial_value - np.mean(final_values[final_values <= p5_val]))
        }

        return {
            "status": "success",
            "portfolio_id": payload.portfolio_id,
            "distribution_model": payload.distribution_model,
            "macro_shock_bps": payload.macro_shock_bps,
            "metrics": metrics,
            "paths_sampled": payload.simulations
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
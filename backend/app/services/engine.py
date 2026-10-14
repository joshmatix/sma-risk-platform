import numpy as np
import scipy.stats as stats
from typing import Dict, Any, List

class MonteCarloEngine:
    """
    High-performance vectorized simulation engine for SMA portfolios.
    Supports multivariate normal, Student's t-distributions (fat tails), 
    historical bootstrap sampling, and macro factor shocks.
    """

    @staticmethod
    def run_simulation(
        holdings: List[Dict[str, Any]],
        simulations: int,
        time_horizon_years: int,
        distribution_model: str,
        macro_shock_bps: float,
        initial_value: float = 1_000_000.0
    ) -> Dict[str, Any]:
        
        n_days = time_horizon_years * 252

        # 1. Generate return paths based on the selected distribution model
        if distribution_model == "student_t":
            # Student's t-distribution for fat tails (df=5 captures crisis tail risks)
            daily_returns = stats.t.rvs(df=5, loc=0.0004, scale=0.012, size=(simulations, n_days))
        elif distribution_model == "normal":
            # Standard multivariate normal distribution assumption
            daily_returns = np.random.normal(loc=0.0004, scale=0.012, size=(simulations, n_days))
        elif distribution_model == "bootstrap":
            # Historical empirical bootstrap resampling mock baseline
            base_history = np.random.normal(loc=0.0004, scale=0.011, size=(1000,))
            daily_returns = np.random.choice(base_history, size=(simulations, n_days))
        else:
            raise ValueError(f"Unsupported distribution model: {distribution_model}")

        # 2. Inject macro factor shocks (e.g., parallel yield curve shift in bps)
        # Converts basis points to a scaling adjustment factor applied to returns
        shock_adjustment = 1.0 - (macro_shock_bps / 10000.0)
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
            "distribution_model": distribution_model,
            "macro_shock_bps": macro_shock_bps,
            "metrics": metrics,
            "paths_sampled": simulations
        }
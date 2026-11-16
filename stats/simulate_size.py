# AI-use notice: written with the assistance of Claude (Anthropic) and reviewed by the team.
"""False-positive rate (test size) of the trend test for 25-year series.

Run from the repository root (about one minute):
    python -m stats.simulate_size

Series are AR(1) noise with NO trend, length 25 (the 2000-2024 study window), 3000 per
setting, fixed seeds. For each setting it reports how often each rule rejects at 0.05:
  rule          the rule used by the app (stats.trends.trend_report)
  MK only       original Mann-Kendall for every series
  HR always     Hamed-Rao for every series
It also reports how often the lag-1 rule picks Hamed-Rao (P[r1 > 0.2]) and the mean and
spread of the lag-1 estimate, which is what makes that choice noisy at n = 25.
Finally it reports power: white noise plus a steady trend that adds up to about one
standard deviation over the 25 years.
"""

import warnings

import numpy as np
import pandas as pd
import pymannkendall as mk

from stats.trends import trend_report

N_YEARS = 25
N_SIM = 3000
ALPHA = 0.05
PHIS = (-0.5, 0.0, 0.2, 0.5)
YEARS = np.arange(2000, 2000 + N_YEARS)


def ar1_series(rng: np.random.Generator, phi: float, n: int = N_YEARS, burn_in: int = 100):
    noise = rng.normal(size=n + burn_in)
    values = np.zeros(n + burn_in)
    for i in range(1, n + burn_in):
        values[i] = phi * values[i - 1] + noise[i]
    return values[burn_in:]


def simulate(phi: float, n_sim: int = N_SIM) -> dict:
    rows = []
    for index in range(n_sim):
        rng = np.random.default_rng([2026, int(round(phi * 100)) + 1000, index])
        values = ar1_series(rng, phi)
        rule = trend_report(YEARS, values, alpha=ALPHA)
        with np.errstate(all="ignore"):
            hr = mk.hamed_rao_modification_test(values, alpha=ALPHA)
        rows.append({
            "r1": rule.lag1_autocorr,
            "uses_hr": rule.method == "Hamed-Rao",
            "reject_rule": bool(rule.significant),
            "reject_mk": mk.original_test(values, alpha=ALPHA).p < ALPHA,
            "reject_hr": bool(hr.p < ALPHA) if np.isfinite(hr.p) and hr.var_s > 0 else False,
        })
    frame = pd.DataFrame(rows)
    return {
        "true_phi": phi,
        "mean_r1": frame.r1.mean(),
        "sd_r1": frame.r1.std(),
        "share_using_HR": frame.uses_hr.mean(),
        "false_pos_rule": frame.reject_rule.mean(),
        "false_pos_MK_only": frame.reject_mk.mean(),
        "false_pos_HR_always": frame.reject_hr.mean(),
    }


def power_for_one_sd_change(n_sim: int = N_SIM) -> float:
    """Share of white-noise series with a 1-SD total change that the rule flags."""
    slope = 1.0 / (N_YEARS - 1)  # standard deviations per year
    hits = 0
    for index in range(n_sim):
        rng = np.random.default_rng([2026, 5000, index])
        values = rng.normal(size=N_YEARS) + slope * (YEARS - YEARS[0])
        hits += bool(trend_report(YEARS, values, alpha=ALPHA).significant)
    return hits / n_sim


def main() -> None:
    warnings.filterwarnings("ignore")
    table = pd.DataFrame([simulate(phi) for phi in PHIS])
    print(f"No-trend AR(1) series, n = {N_YEARS}, {N_SIM} per row, alpha = {ALPHA}")
    print((table * [1, 1, 1, 100, 100, 100, 100]).round(2).to_string(index=False))
    print("(share_using_HR and false_pos_* are percentages)")
    print(f"Power with white noise and a change of 1 SD over the period: "
          f"{100 * power_for_one_sd_change():.0f}%")


if __name__ == "__main__":
    main()

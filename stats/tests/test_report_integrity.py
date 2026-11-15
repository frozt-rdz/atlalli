"""Integrity checks on the committed results: an independent oracle, staleness and a snapshot."""

import numpy as np
import pandas as pd
from scipy import stats as scipy_stats

from stats.analyze_giovanni import INPUT_CSV, OUTPUT_CSV, adjust_p_values, build_report


def test_bh_matches_scipy_reference():
    """Independent oracle: scipy's Benjamini-Hochberg on the full family of 18."""
    p = np.random.default_rng(7).uniform(size=18) ** 2
    np.testing.assert_allclose(
        adjust_p_values(p), scipy_stats.false_discovery_control(p, method="bh"), rtol=1e-12
    )


def test_committed_report_matches_the_code():
    """data/processed/giovanni_significance.csv must be regenerated whenever the method changes."""
    fresh = build_report(pd.read_csv(INPUT_CSV))
    committed = pd.read_csv(OUTPUT_CSV)
    for column in ["sen_slope_decade", "ci_low_decade", "ci_high_decade", "p_value", "q_value"]:
        np.testing.assert_allclose(fresh[column], committed[column], rtol=1e-6, atol=1e-9)
    assert fresh.method.tolist() == committed.method.tolist()
    assert fresh.classification.tolist() == committed.classification.tolist()


def test_headline_counts_regression():
    """Regression snapshot of the numbers quoted in the README (not an independent check)."""
    report = build_report(pd.read_csv(INPUT_CSV))
    assert int(report.significant_fdr.sum()) == 8 and int(report.significant.sum()) == 12
    assert set(report.query("significant_fdr").set_index(["variable", "region"]).index) == {
        ("precipitation_rate", "sahel"), ("precipitation_rate", "south_amazon"),
        ("air_temperature_2m", "chiapas"), ("air_temperature_2m", "morelos"),
        ("air_temperature_2m", "zacatecas"), ("air_temperature_2m", "south_amazon"),
        ("soil_moisture_0_10cm", "chiapas"), ("soil_moisture_0_10cm", "south_amazon"),
    }

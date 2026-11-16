"""The web atlas must not say more than the statistics: wording follows the evidence tier."""

import json
import re
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
ATLAS = ROOT / "app" / "web" / "explorar" / "region-data.js"
REPORT = ROOT / "data" / "processed" / "giovanni_significance.csv"

FORBIDDEN = ("% sure", "proving", "not a fluke", "Real, sustained", "nearly confirmed", "Near Proof",
             "Confirmed Long-Term", "Confirmed Warming", "Certainty")


def _atlas():
    text = ATLAS.read_text(encoding="utf-8")
    return json.loads(text[text.index("{"): text.rindex("}") + 1])


def test_atlas_has_no_overclaiming_phrases():
    raw = ATLAS.read_text(encoding="utf-8")
    assert [p for p in FORBIDDEN if p in raw] == []


def test_atlas_numbers_and_tiers_match_the_report():
    report = pd.read_csv(REPORT).set_index(["variable", "region"])
    atlas = _atlas()
    for region, data in atlas["regions"].items():
        for variable, series in data["variables"].items():
            row = report.loc[(variable, region)]
            assert abs(series["senSlopeDecade"] - row.sen_slope_decade) < 1e-2
            assert abs(series["pValue"] - row.p_value) < 1e-4
            label = series["story"]["signalLabel"]
            if not row.significant_fdr:
                assert label in ("Suggestive, not confirmed", "No trend can be claimed")
            else:
                assert label in ("Trend detected", "Detected, but fragile")


def test_fragile_and_contradicted_series_are_flagged():
    atlas = _atlas()["regions"]
    assert atlas["sahel"]["variables"]["precipitation_rate"]["story"]["signalLabel"] == "Detected, but fragile"
    sahel_t = atlas["sahel"]["variables"]["air_temperature_2m"]["story"]
    assert "ERA5" in sahel_t["story"] and not re.search(r"warming becoming", sahel_t["story"])


def test_gauge_and_labels_follow_the_evidence_tier():
    js = (ROOT / "app" / "web" / "explorar" / "explorar.js").read_text(encoding="utf-8")
    assert "Proven" not in js and "Certainty Level" not in js and "REAL 25-YEAR" not in js
    assert 'evidenceTier === "robust"' in js
    expected = {"robust": "Trend detected", "fragile": "Detected, but fragile",
                "suggestive": "Suggestive, not confirmed", "none": "No trend can be claimed"}
    for data in _atlas()["regions"].values():
        for series in data["variables"].values():
            assert series["story"]["signalLabel"] == expected[series["evidenceTier"]] or (
                series["evidenceTier"] == "suggestive" and series["story"]["signalLabel"] == expected["suggestive"])


def test_series_without_a_trend_do_not_describe_a_change_or_a_cause():
    for data in _atlas()["regions"].values():
        for series in data["variables"].values():
            story = series["story"]
            if series["evidenceTier"] == "none":
                assert story["headline"].startswith("No trend can be claimed")
                assert not re.search(r"\b(lost|rose|fell|slipped|moved)\b", story["story"])
            assert "evaporates" not in story["story"] and "Seeds and shallow roots" not in story["story"]

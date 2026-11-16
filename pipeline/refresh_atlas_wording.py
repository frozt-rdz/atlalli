"""Rewrite the verdict wording of the web atlas from the statistics, so the text cannot overclaim.

The atlas data file (app/web/explorar/region-data.js) carries its own plain-language story for each of
the 18 series. This script keeps every number and replaces only the verdict fields, choosing the wording
from four evidence tiers that match the Streamlit app:

  robust       significant after FDR and still significant when the series starts in 2005
  fragile      significant after FDR but not significant from 2005
  suggestive   p < 0.05 but not significant after FDR
  none         p >= 0.05

Run from the repository root:
    python -m pipeline.refresh_atlas_wording
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_JS = ROOT / "app" / "web" / "explorar" / "region-data.js"
REPORT_CSV = ROOT / "data" / "processed" / "giovanni_significance.csv"
ALPHA = 0.05

UNITS = {"precipitation_rate": "mm", "air_temperature_2m": "°C", "soil_moisture_0_10cm": "kg/m²"}
NOUN = {"precipitation_rate": "rainfall", "air_temperature_2m": "air temperature",
        "soil_moisture_0_10cm": "topsoil moisture"}
PILL = {  # (variable, sign) -> short status label for a detected or suggestive change
    ("precipitation_rate", 1): "More rain", ("precipitation_rate", -1): "Less rain",
    ("air_temperature_2m", 1): "Warming", ("air_temperature_2m", -1): "Cooling",
    ("soil_moisture_0_10cm", 1): "Wetter topsoil", ("soil_moisture_0_10cm", -1): "Drier topsoil",
}
TONE = {"precipitation_rate": {1: "wetting", -1: "drying"},
        "air_temperature_2m": {1: "warming", -1: "borderline"},
        "soil_moisture_0_10cm": {1: "wetting", -1: "drying"}}

# Series whose reading needs an explicit independent-product caveat (README, Limitations).
SAHEL_T = ("sahel", "air_temperature_2m")


def load_atlas(path: Path = DATA_JS):
    text = path.read_text(encoding="utf-8")
    start, end = text.index("{"), text.rindex("}") + 1
    return text[:start], json.loads(text[start:end]), text[end:]


def tier_of(series: dict) -> str:
    robustness = series["robustness2005"]
    if series["classification"] == "significant":
        holds = bool(robustness["significant"]) and bool(robustness["sameSign"])
        return "robust" if holds else "fragile"
    return "suggestive" if series["pValue"] < ALPHA else "none"


def _eq(formatted: str) -> str:
    """'= 0.016' or '< 0.001' (the atlas stores '< 0.001' for tiny values)."""
    return formatted if formatted.startswith("<") else f"= {formatted}"


def _recent(series: dict, tier: str, unit: str) -> dict:
    rb = series["robustness2005"]
    base = (f"From 2005 the change is {rb['senSlopeDecade']:+.3g} {unit} per decade "
            f"(p {_eq(rb['pFormatted'])}, {rb['nYears']} years)")
    if not rb["sameSign"]:
        return {"recentTitle": "The direction changes from 2005",
                "recentBody": base + ", the opposite sign: the result is fragile.",
                "recentConclusion": "Direction not stable"}
    if tier == "none":
        if rb["significant"]:
            return {"recentTitle": "Looks different when starting in 2005",
                    "recentBody": base + ": significant on its own, but this is an extra check and is not corrected for multiple testing.",
                    "recentConclusion": "Exploratory only"}
        return {"recentTitle": "Also no clear trend from 2005",
                "recentBody": base + ": still no trend that can be told apart from normal variability.",
                "recentConclusion": "No trend either way"}
    if rb["significant"]:
        return {"recentTitle": "Still significant when starting in 2005",
                "recentBody": base + ": same direction and still significant before any multiple-testing correction.",
                "recentConclusion": "Holds from 2005"}
    return {"recentTitle": "Not significant when starting in 2005",
            "recentBody": base + ": same direction, but no longer significant, so the evidence depends on the start year.",
            "recentConclusion": "Depends on the start year"}


def reword(region_key: str, variable: str, series: dict) -> None:
    story = series["story"]
    tier = tier_of(series)
    sign = 1 if series["senSlopeDecade"] > 0 else -1
    unit = UNITS[variable]
    p, q = series["pFormatted"], series["qFormatted"]
    noun = NOUN[variable]

    if tier == "robust":
        story.update(
            statusPill=PILL[(variable, sign)] + " detected", verdictTone=TONE[variable][sign],
            signalLabel="Trend detected", signalTag=f"Significant (q {_eq(q)})",
            verdictHuman="A trend is detected",
            confidenceHuman=f"q {_eq(q)}: unlikely to be chance alone",
            whyConfident=("The yearly values move in one direction over 2000–2024 and the change is "
                          "significant after correcting for 18 comparisons. It shows that the change is "
                          "present in this dataset, not what causes it."),
        )
    elif tier == "fragile":
        story.update(
            statusPill=PILL[(variable, sign)] + " (fragile)", verdictTone="borderline",
            signalLabel="Detected, but fragile", signalTag=f"Significant (q {_eq(q)}), not robust",
            verdictHuman="Significant, but sensitive to the start year",
            confidenceHuman=f"q {_eq(q)}; from 2005 p {_eq(series['robustness2005']['pFormatted'])}",
            whyConfident=("The change is significant over 2000–2024 but stops being significant when the "
                          "first five years are dropped, so it depends on the start year. Treat it as a "
                          "lead, not a firm finding."),
        )
    elif tier == "suggestive":
        story.update(
            statusPill="Suggestive " + PILL[(variable, sign)].lower(), verdictTone="borderline",
            signalLabel="Suggestive, not confirmed", signalTag=f"p {_eq(p)}, q {_eq(q)}",
            verdictHuman="Suggestive, not confirmed",
            confidenceHuman="p < 0.05, but not after correcting for 18 comparisons",
            whyConfident=("On its own this change looks unusual (p < 0.05), but not after correcting for "
                          "running 18 tests at once, so it could be a lucky result. Treat it as a lead."),
        )
    else:
        story.update(
            statusPill="No clear trend", verdictTone="neutral",
            signalLabel="No trend can be claimed", signalTag=f"p {_eq(p)}, q {_eq(q)}",
            verdictHuman="No trend can be claimed",
            confidenceHuman=f"Not significant (q {_eq(q)})",
            whyConfident=("The yearly values rise and fall without a direction that the test can tell apart "
                          "from normal variability. This does not prove that nothing is changing; 25 years "
                          "is short."),
        )
    story.update(_recent(series, tier, unit))
    story["signalPct"] = None  # the old value was 1 - q read as "% sure", which is not a probability

    if (region_key, variable) == SAHEL_T:
        story.update(
            statusPill="Products disagree", verdictTone="borderline",
            headline="MERRA-2 and ERA5 disagree on the sign",
            story=(f"MERRA-2 (the product analysed here) shows a decrease of {abs(series['senSlopeDecade']):.2f} "
                   "°C per decade in the Sahel, while an independent ERA5 check shows an increase of "
                   "+0.24 °C per decade. Read it as product-dependent, not as cooling."),
            whyConfident=("Not a finding: the sign differs between two reanalyses, and the MERRA-2 result "
                          "depends on the start year and on single years."),
        )
    elif variable == "air_temperature_2m" and sign < 0:
        story["story"] = story["story"].replace("with warming becoming much clearer during the last 20 years", "")


def main() -> None:
    import pandas as pd

    prefix, atlas, suffix = load_atlas()
    report = pd.read_csv(REPORT_CSV).set_index(["variable", "region"])
    for region_key, region in atlas["regions"].items():
        for variable, series in region["variables"].items():
            row = report.loc[(variable, region_key)]
            if abs(series["pValue"] - row.p_value) > 1e-4 or abs(series["senSlopeDecade"] - row.sen_slope_decade) > 1e-2:
                raise SystemExit(f"Atlas numbers differ from the report for {region_key}/{variable}")
            reword(region_key, variable, series)
    DATA_JS.write_text(prefix + json.dumps(atlas, indent=2, ensure_ascii=False) + suffix, encoding="utf-8")
    print(f"Reworded 18 series in {DATA_JS}")


if __name__ == "__main__":
    main()

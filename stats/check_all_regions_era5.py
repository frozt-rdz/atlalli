"""Compare the app's 2 m temperature (MERRA-2 via Giovanni) with ERA5 for ALL 6 regions.

ERA5 comes from the free Open-Meteo archive API (no key; non-commercial use). RUN IT ON YOUR OWN
COMPUTER (needs internet). Answers are cached in ./_era5_cache, so an interrupted run can be repeated.

Usage (run it from C:\\dev\\patches so the cache folder does not land inside the repository):
    python check_all_regions_era5.py C:\\dev\\trend-detective\\data\\processed\\giovanni_observations.csv

Takes about 10-15 minutes (66 requests, 1 s apart; it waits and retries if the API says "too many").
Needs: numpy pandas scipy pymannkendall.  Status: the statistics were tested with synthetic data;
the download itself has NOT been tested by the author (the review environment cannot reach the API).
"""
import json, sys, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path
import numpy as np, pandas as pd, pymannkendall as mk
from scipy import stats

REGIONS = {  # (west, south, east, north), same boxes as pipeline/ingest_giovanni.py
    "chiapas": (-93.5, 16.0, -91.0, 17.5), "morelos": (-100.0, 18.0, -98.2, 19.6),
    "south_amazon": (-62.0, -14.0, -52.0, -6.0), "sonora": (-111.5, 29.0, -108.8, 31.5),
    "zacatecas": (-103.5, 22.3, -101.5, 24.5), "sahel": (-10.0, 12.0, 10.0, 16.0)}
START, END = "2000-01-01", "2024-12-31"
CACHE = Path("_era5_cache")
API = "https://archive-api.open-meteo.com/v1/archive"


def fetch_point(lat, lon):
    CACHE.mkdir(exist_ok=True)
    cache_file = CACHE / f"era5_t2m_{lat:.2f}_{lon:.2f}.json"
    if cache_file.exists():
        payload = json.loads(cache_file.read_text())
    else:
        query = {"latitude": f"{lat:.4f}", "longitude": f"{lon:.4f}", "start_date": START, "end_date": END,
                 "daily": "temperature_2m_mean", "models": "era5", "timezone": "UTC"}
        url = API + "?" + urllib.parse.urlencode(query)
        for attempt in range(6):
            try:
                with urllib.request.urlopen(url, timeout=120) as response:
                    payload = json.loads(response.read().decode("utf-8"))
                break
            except urllib.error.HTTPError as exc:
                body = exc.read().decode("utf-8", "replace")[:300]
                if exc.code == 429 and attempt < 5:
                    wait = 30 * (attempt + 1); print(f"  rate limit (HTTP 429), waiting {wait} s ..."); time.sleep(wait); continue
                raise SystemExit(f"HTTP {exc.code} from Open-Meteo for lat={lat}, lon={lon}: {body}")
            except urllib.error.URLError as exc:
                raise SystemExit(f"Could not reach Open-Meteo ({exc.reason}). Check your internet connection.")
        cache_file.write_text(json.dumps(payload)); time.sleep(1.0)
    daily = payload["daily"]
    return pd.Series(daily["temperature_2m_mean"], index=pd.to_datetime(daily["time"]), dtype=float)


def annual_complete(series, per_year):
    g = series.groupby(series.index.year); mean, count = g.mean(), g.count()
    return mean[count >= per_year]


def sen_mk(annual, start=2000):
    sub = annual[annual.index >= start]; y = sub.index.values.astype(float)
    return stats.theilslopes(sub.values, y)[0] * 10, mk.original_test(sub.values).p


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    csv_path = Path(argv[0]) if argv else Path("data/processed/giovanni_observations.csv")
    df = pd.read_csv(csv_path, parse_dates=["date"])
    rows = []
    for region, (w, s, e, n) in REGIONS.items():
        sub = df[(df.region == region) & (df.variable == "air_temperature_2m")]
        if sub.empty:
            raise SystemExit(f"No air_temperature_2m rows for {region} in {csv_path}")
        merra = annual_complete(sub.set_index("date").value, 12)
        lons = np.linspace(w, e, 5 if (e - w) >= 10 else 3); lats = np.linspace(s, n, 3)
        print(f"{region}: downloading ERA5 for {len(lons) * len(lats)} points ...", flush=True)
        pts = pd.DataFrame({(la, lo): annual_complete(fetch_point(la, lo), 365) for la in lats for lo in lons})
        era5 = pts.mean(axis=1).loc[merra.index.intersection(pts.index)]; merra = merra.loc[era5.index]
        sm, pm = sen_mk(merra); se, pe = sen_mk(era5)
        diff = era5 - merra; sd, pd_ = sen_mk(diff)
        r = np.corrcoef(np.diff(era5.values), np.diff(merra.values))[0, 1]
        n_pos = sum(stats.theilslopes(pts[c].dropna().values, pts[c].dropna().index.values.astype(float))[0] > 0 for c in pts)
        rows.append(dict(region=region, merra_slope=sm, merra_p=pm, era5_slope=se, era5_p=pe,
                         r_changes=r, diff_slope=sd, diff_p=pd_, era5_points_warming=f"{n_pos}/{pts.shape[1]}",
                         offset=diff.mean()))
    T = pd.DataFrame(rows)
    T["same_sign"] = np.sign(T.merra_slope) == np.sign(T.era5_slope)
    T["flag"] = np.where(~T.same_sign, "SIGN DISAGREES", np.where(T.diff_p < 0.05, "products drift apart", "ok"))
    pd.set_option("display.width", 250); pd.set_option("display.max_columns", 30)
    print("\nSlopes in C/decade, 2000-2024 (Sen; p = original Mann-Kendall). diff = ERA5 - MERRA-2.")
    print(T.round(3).to_string(index=False))
    print("\nHow to read it: 'ok' = same sign and no significant drift between the products. "
          "'products drift apart' = same sign but the ERA5-MERRA-2 difference itself has a significant trend "
          "(the size of the slope is product-dependent). 'SIGN DISAGREES' = treat the result as product-dependent.")


if __name__ == "__main__":
    main()

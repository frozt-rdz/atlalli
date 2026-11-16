"""Does the 0.2 autocorrelation threshold matter?  Sweep it on the real data and on simulated noise.

Does NOT import anything from the project: reads data/giovanni/*.csv itself.
Usage:  python threshold_sweep.py path/to/trend-detective        (about 1-2 minutes)
Needs:  numpy pandas scipy pymannkendall

Rule under test: use Hamed-Rao when lag-1 autocorrelation of the Sen residuals is > threshold,
otherwise original Mann-Kendall; then Benjamini-Hochberg over the 18 series (q <= 0.05).
'always HR' = threshold -1 (every series).  'never HR' = Mann-Kendall for every series.
"""
import glob, io, os, sys, warnings
import numpy as np, pandas as pd
from scipy import stats
import pymannkendall as mk
warnings.filterwarnings("ignore")
ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
THRESHOLDS = [-1.0, 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 9.0]
LABEL = {-1.0: "always HR", 9.0: "never HR (MK)"}
name_of = lambda t: LABEL.get(t, f"r1 > {t}")
N_SIM = 3000

def load(path):
    lines = open(path, encoding="utf-8-sig").read().splitlines()
    i = [k for k, l in enumerate(lines) if l.startswith("time")][0]
    df = pd.read_csv(io.StringIO("\n".join(lines[i:])), skipinitialspace=True)
    df.columns = ["time", "v"]; df["time"] = pd.to_datetime(df["time"]); df["year"] = df.time.dt.year
    return df

def bh(p):
    p = np.asarray(p, float); m = len(p); o = np.argsort(p); r = p[o] * m / np.arange(1, m + 1)
    q = np.minimum.accumulate(r[::-1])[::-1]; out = np.empty(m); out[o] = np.clip(q, 0, 1); return out

def three(v, years):
    sl, ic, _, _ = stats.theilslopes(v, years); res = v - (sl * years + ic)
    r1 = np.corrcoef(res[:-1], res[1:])[0, 1]
    h = mk.hamed_rao_modification_test(v)
    p_hr = h.p if (np.isfinite(h.p) and h.var_s > 0) else 1.0     # invalid variance -> not significant
    return r1, mk.original_test(v).p, p_hr

# ---- real data
rows = []
for f in sorted(glob.glob(os.path.join(ROOT, "data", "giovanni", "*.csv"))):
    name = os.path.basename(f)[:-4]; df = load(f)
    ann = (df.assign(c=df.v * df.time.dt.days_in_month).groupby("year").c.sum() if name.startswith("precip")
           else df.groupby("year").v.mean())
    ann = ann[df.groupby("year").v.count() == 12]
    rows.append((name,) + three(ann.values.astype(float), ann.index.values.astype(float)))
D = pd.DataFrame(rows, columns=["series", "r1", "p_mk", "p_hr"])
assert len(D) == 18, f"expected 18 series, found {len(D)}"
mk_set = set(D.series[bh(D.p_mk) <= .05])
print("REAL DATA (18 series)\n  threshold      series sent to HR   significant (BH, q<=0.05)   same set as MK only")
for t in THRESHOLDS:
    use = D.r1 > t; sig = set(D.series[bh(np.where(use, D.p_hr, D.p_mk)) <= .05])
    print(f"  {name_of(t):13s}  {int(use.sum()):>10d}          {len(sig):>10d}                 {sig == mk_set}")
use = D.r1.abs() > 0.2; sig = set(D.series[bh(np.where(use, D.p_hr, D.p_mk)) <= .05])
print(f"  |r1| > 0.2     {int(use.sum()):>10d}          {len(sig):>10d}                 {sig == mk_set}   <- first version of the code (before the positive-only change)")
print("     in first version but not MK only:", sorted(sig - mk_set) or "none", "| in MK only but not first version:", sorted(mk_set - sig) or "none")
print("  r1 of the 18 series: min %.2f, max %.2f; series with r1 > 0.2: %s"
      % (D.r1.min(), D.r1.max(), ", ".join(D.series[D.r1 > 0.2]) or "none"))

# ---- simulation: trend-free AR(1), 25 years
years = np.arange(2000, 2025).astype(float); out = []
for phi in (-0.5, 0.0, 0.2, 0.5):
    for i in range(N_SIM):
        rng = np.random.default_rng([7, int(phi * 100) + 500, i]); e = rng.normal(size=125); x = np.zeros(125)
        for k in range(1, 125): x[k] = phi * x[k - 1] + e[k]
        out.append((phi,) + three(x[100:], years))
S = pd.DataFrame(out, columns=["phi", "r1", "p_mk", "p_hr"])
print(f"\nSIMULATION: false positives % at alpha=0.05 ({N_SIM} trend-free series of 25 years per column)")
tab = {}
for t in THRESHOLDS:
    tab[name_of(t)] = {f"phi={phi:+.1f}": round(100 * (np.where(g.r1 > t, g.p_hr, g.p_mk) < .05).mean(), 1)
                       for phi, g in S.groupby("phi")}
print(pd.DataFrame(tab).T.to_string())
print("(Rows share the same series, so compare rows with each other. Other seeds move the whole table by about 1 point.)")

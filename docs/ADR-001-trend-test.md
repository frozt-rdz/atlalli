# ADR-001: Primary significance test and autocorrelation handling

**Status:** Accepted
**Date:** 2026-11-14
**Deciders:** Science lead (Briana), team

## Context

Each of the 18 series has 25 annual values (2000–2024). The app reports a Sen slope and decides
significance with a trend test, then corrects the 18 p-values together (Benjamini-Hochberg).

Hamed-Rao (HR) applied to every series misbehaves when years are negatively correlated: for Sahel
precipitation, whose lag-1 autocorrelation is about −0.57, HR returns a negative variance, and for Chiapas
precipitation (−0.44) it returns p = 0.0002 against p = 0.042 for Mann-Kendall (MK). The current rule
therefore uses HR only when the lag-1 autocorrelation of the Sen residuals is above 0.2, and MK otherwise.
The 0.2 value was already in the first version of the code (commit 3726b5b, 11 Nov), fixed in advance from
background reading on the topic; it was not tuned on these series.

The restriction to *positive* autocorrelation was not part of that first version, which used
|lag-1| > 0.2. It was added later (commit 74b75cf, 14 Nov), after HR gave an invalid variance for Sahel
precipitation. That choice was therefore made with the data in view, and it changed the result: the first
version sent Chiapas precipitation to HR (significant, p = 0.0002) and left Sahel precipitation unresolved;
the current rule uses MK for both (Sahel precipitation significant, Chiapas precipitation p = 0.042 but
q = 0.069, so not significant).

Three facts constrain the choice:

- At n = 25 the lag-1 estimate is noisy and biased low: standard deviation about 0.2; mean −0.08 when the
  truth is 0 and +0.33 when the truth is +0.5 (`python -m stats.simulate_size`).
- HR only corrects the variance for lags whose autocorrelation (of the ranks of the detrended series)
  exceeds ±1.96/√n, which is about ±0.39 at n = 25 (pyMannKendall source). Below that, HR is numerically
  the same test as MK, so a threshold between 0 and 0.39 changes little.
- On the real data the largest lag-1 value is 0.27. Only three series (Morelos precipitation, Southern
  Amazon precipitation, Zacatecas soil moisture) lie above 0.2.

## Decision

Keep the rule as it is (Option A: threshold 0.2, positive autocorrelation only) and disclose in the README
that the sign restriction was added after HR failed on Sahel precipitation. Do not change the threshold
now: on the 18 series every threshold from 0 to 0.5 gives the same 8 significant series, so a change
cannot improve the result, and choosing a new value after seeing the results would add one more decision
made with the data in view. Report MK alone (the same 8 series) as the sensitivity check. If the team
prefers to have no data-dependent choice at all, Option B does that without changing a single result.

## Options Considered

### Option A: Conditional HR, threshold 0.2, positive autocorrelation only (current, recommended)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium: a data-dependent switch to explain and test |
| Cost | None, already implemented; the 0.2 was fixed before the results, the sign restriction after |
| Scalability | n/a |
| Team familiarity | Medium |

**Pros:** the 0.2 is pre-specified; avoids the invalid HR variance for negative autocorrelation; same 8 series as MK.
**Cons:** the switch depends on a noisy estimate and brings no measurable protection at n = 25; the sign restriction was added after seeing the Sahel failure.

### Option B: MK primary, HR/TFPW as sensitivity

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low: one test, nothing to select from the data |
| Cost | Small code change if the switch is removed; none if only the documentation changes |
| Scalability | n/a |
| Team familiarity | High |

**Pros:** no data-dependent choice; simple to explain to judges; same results as A.
**Cons:** MK assumes independent years, so positive autocorrelation inflates false positives; it is a code
and documentation change on the last day (it changes no result).

### Option C: HR for every series

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low |
| Cost | None |
| Scalability | n/a |
| Team familiarity | Medium |

**Pros:** one test for everything.
**Cons:** invalid variance for Sahel precipitation; false-positive rate 7.2 % (white noise) and 10.7 %
(autocorrelation −0.5) at n = 25.

### Option D: Trend-free pre-whitening (TFPW)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium |
| Cost | Small |
| Scalability | n/a |
| Team familiarity | Low |

**Pros:** designed for autocorrelated series.
**Cons:** on the real data it changes 6 of the 18 classifications (it is both more and less
conservative), which would make the headline depend on an arbitrary method choice.

### Option E: Another threshold (0.1, 0.3, or 1.645/√n ≈ 0.33, the one-sided 5 % cutoff at n = 25)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low: one constant |
| Cost | One line in `stats/trends.py`, plus tests and a new README sentence |
| Scalability | n/a |
| Team familiarity | Medium |

**Pros:** a significance-based cutoff is easier to justify in theory than a fixed 0.2.
**Cons:** no measurable gain (table below); adds a choice made after seeing the results.

## Trade-off Analysis

Measured on the 18 real series (BH over the planned family of 18, q ≤ 0.05):

| Test | Significant | Differs from current rule |
|------|-------------|---------------------------|
| Current rule (conditional HR, 0.2, positive only) | 8 | n/a |
| First version of the rule (conditional HR, \|lag-1\| > 0.2) | 8 | Chiapas precip in (HR, inflated); Sahel precip unresolved |
| MK for every series | 8 | none |
| HR for every series | 10 | Chiapas precip (inflated), Sahel precip (invalid), Morelos soil, Sahel temp |
| TFPW for every series | 12 | 6 series |

Threshold sweep on the same 18 series (`threshold_sweep.py`, a standalone script from the independent
review; it is not included in this repository):

| Threshold for using HR | Series sent to HR | Significant | Same set as MK only |
|------------------------|-------------------|-------------|---------------------|
| always | 18 | 10 | no |
| lag-1 > 0.0 | 10 | 8 | yes |
| lag-1 > 0.1 | 8 | 8 | yes |
| lag-1 > 0.2 (current) | 3 | 8 | yes |
| lag-1 > 0.3 or higher | 0 | 8 | yes |

Measured by simulation (25 trend-free years, 3 000 series per row): the conditional rule and MK alone
have the same false-positive rate (4.5 % vs 4.3 % for white noise; 21.0 % vs 21.6 % with
autocorrelation +0.5). HR is applied to about 8 % of white-noise series and 76 % of series with true
autocorrelation +0.5, and it does not reduce the false-positive rate there. In two separate sweeps of the
review (other seeds), lowering the threshold to 0 raised the white-noise false-positive rate by about one
point against 0.3 or higher (5.7 % vs 4.7 %, and 6.4 % vs 5.5 %). Between 0.2 and 0.5 the rows differ by
less than 0.6 point. The absolute level moves by about one point between seeds (4.3–5.4 % for MK alone),
so a threshold between 0.2 and 0.5 cannot be told apart from another.

So the switch changes no conclusion and does not buy protection. Its only effect is a method label that
depends on a noisy estimate. The honest limitation is the one the app already states: with 25 years and
possible positive autocorrelation, a single significant series is a lead, not proof.

## Consequences

- Easier: nothing changes in the code or the results; the README now says which part of the rule was fixed
  in advance and which part was added after seeing the data.
- Harder: the app cannot claim that autocorrelation has been corrected.
- To revisit: if more years become available (n ≥ 40), a block bootstrap becomes feasible and should
  replace this discussion.

## Action Items

1. [x] State in the README that the 0.2 threshold was fixed in advance, that the positive-only restriction
   was added later, and that MK alone and every threshold from 0 to 0.5 give the same 8 series.
2. [x] Commit `stats/simulate_size.py` and cite its output instead of unreproducible numbers.
3. [ ] The 0.2 value is a practical heuristic with no literature citation; the README says so.
4. [x] Label series with q > 0.05 but p < 0.05 as "suggestive" in the app (separate patch: app verdicts).
5. [ ] Optional: if the team prefers a single test for simplicity, move to Option B; it changes no result.

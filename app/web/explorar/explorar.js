/* AI-use notice: this file includes AI-generated content and code, reviewed by the team. */
/* ==========================================================================
   Atlalli · Independent 6-Region Selector Page & Dedicated Region Climate
   Data Page (Unified Reactive Glider Switchers, Auto-Hiding Centered Header,
   Adjustable Play Speed, Bounded SVG Story Diagrams, and NASA Data Passport).
   ========================================================================== */

(function () {
  "use strict";

  const DATA = window.ATLALLI_REGION_DATA;
  if (!DATA) {
    console.error("Atlalli region data not loaded.");
    return;
  }

  const REGION_ORDER = ["morelos", "chiapas", "south_amazon", "sahel", "sonora", "zacatecas"];
  const VAR_ORDER = ["precipitation_rate", "soil_moisture_0_10cm", "air_temperature_2m"];
  const MODE_ORDER = ["annual", "seasonal", "anomaly"];
  const SPEED_OPTIONS = [
    { label: "0.5×", value: 1.25 },
    { label: "1×", value: 2.5 },
    { label: "2×", value: 5.0 },
    { label: "4×", value: 9.0 },
  ];

  const state = {
    activePage: "data", // "selector" | "data"
    regionId: "morelos",
    activeVar: "precipitation_rate",
    chartMode: "annual", // "annual" | "seasonal" | "anomaly"
    targetYear: 2024,
    currentYearFloat: 2024.0,
    playing: false,
    speedIdx: 1, // default 1x (2.5 yrs/sec)
    playSpeed: 2.5,
    show2005Line: false,
    phaseTime: 0,
    lastFrameTs: performance.now(),
    wheelInitialized: false,
    selectorVarsInitialized: false,
    studioShellInitialized: false,
  };

  function resolveInitialState() {
    const params = new URLSearchParams(window.location.search);
    const qReg = (params.get("region") || "").toLowerCase().trim();
    const qVar = (params.get("var") || "").toLowerCase().trim();
    const qPage = (params.get("page") || "").toLowerCase().trim();
    const defaultPageAttr = document.body.getAttribute("data-default-page");

    if (DATA.regions[qReg]) state.regionId = qReg;
    if (DATA.variableMeta[qVar]) state.activeVar = qVar;

    if (qPage === "selector" || qPage === "data") {
      state.activePage = qPage;
    } else if (defaultPageAttr === "selector") {
      state.activePage = "selector";
    } else if (!qReg) {
      state.activePage = "selector";
    } else {
      state.activePage = "data";
    }
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function sampleSeriesAtYear(arr, yearFloat) {
    const f = clamp(yearFloat - 2000, 0, arr.length - 1);
    const i0 = Math.floor(f);
    const i1 = Math.min(arr.length - 1, i0 + 1);
    return lerp(arr[i0], arr[i1], f - i0);
  }

  function sampleMonthlyAtYear(monthlyByYear, yearFloat) {
    const f = clamp(yearFloat, 2000, 2024);
    const y0 = Math.floor(f);
    const y1 = Math.min(2024, y0 + 1);
    const t = f - y0;
    const m0 = monthlyByYear[String(y0)] || monthlyByYear["2024"];
    const m1 = monthlyByYear[String(y1)] || m0;
    return m0.map((v, idx) => lerp(v, m1[idx], t));
  }

  function formatSigned(val, decimals, unit) {
    const s = val >= 0 ? "+" : "";
    return `${s}${val.toFixed(decimals)}${unit ? " " + unit : ""}`;
  }

  function buildSmoothSvgPath(points) {
    if (!points.length) return "";
    if (points.length === 1) return `M ${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
    let d = `M ${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
      const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
      const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
      const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  }

  /* ==========================================================================
     AI-use notice: Custom Vector SVG Icons (Zero Emojis Anywhere)
     ========================================================================== */
  function getVariableIconSvg(varKey) {
    if (varKey === "precipitation_rate") {
      return `
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path d="M11,22 C7.5,22 5,19.5 5,16.2 C5,13.2 7.2,10.8 10.2,10.5 C11.5,7.2 14.8,5 18.6,5 C23.6,5 27.6,8.8 27.8,13.6 C30.8,14 33,16.5 33,19.5 C33,22 31,22 28.5,22 Z" fill="#2A5F8F"/>
          <g stroke="#2A5F8F" stroke-width="2.4" stroke-linecap="round">
            <line x1="13" y1="26" x2="10" y2="33"/>
            <line x1="20" y1="26" x2="17" y2="35"/>
            <line x1="27" y1="26" x2="24" y2="33"/>
          </g>
        </svg>`;
    }
    if (varKey === "soil_moisture_0_10cm") {
      return `
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <rect x="4" y="23" width="32" height="13" rx="4" fill="#8C4A2F"/>
          <path d="M20,23 L20,10" stroke="#619F4D" stroke-width="2.8" stroke-linecap="round"/>
          <path d="M20,17 C13,17 11,11 16,9 C19,8 20,13 20,17 Z" fill="#619F4D"/>
          <path d="M20,14 C27,14 29,8 24,6 C21,5 20,10 20,14 Z" fill="#619F4D"/>
          <circle cx="12" cy="29" r="2.2" fill="#2A5F8F"/>
          <circle cx="20" cy="31" r="2.4" fill="#2A5F8F"/>
          <circle cx="28" cy="28.5" r="2.2" fill="#2A5F8F"/>
        </svg>`;
    }
    return `
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="15" cy="16" r="7" fill="#D59625"/>
        <g stroke="#D59625" stroke-width="2" stroke-linecap="round">
          <line x1="15" y1="5" x2="15" y2="7.5"/>
          <line x1="15" y1="24.5" x2="15" y2="27"/>
          <line x1="4" y1="16" x2="6.5" y2="16"/>
          <line x1="23.5" y1="16" x2="26" y2="16"/>
        </g>
        <rect x="27" y="7" width="6" height="22" rx="3" fill="#FFFBEF" stroke="#C2410C" stroke-width="2"/>
        <circle cx="30" cy="30" r="5" fill="#C2410C"/>
        <rect x="28.8" y="14" width="2.4" height="15" rx="1.2" fill="#C2410C"/>
      </svg>`;
  }

  function getPlayPauseSvg(isPlaying) {
    if (isPlaying) {
      return `
        <svg viewBox="0 0 18 18" aria-hidden="true">
          <rect x="4" y="3.5" width="3.6" height="11" rx="1.2" fill="currentColor"/>
          <rect x="10.4" y="3.5" width="3.6" height="11" rx="1.2" fill="currentColor"/>
        </svg>`;
    }
    return `
      <svg viewBox="0 0 18 18" aria-hidden="true">
        <path d="M5 3.5L14.5 9L5 14.5V3.5Z" fill="currentColor"/>
      </svg>`;
  }

  function getSatelliteBiblioSvg(primaryColor) {
    return `
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <g transform="rotate(-24 22 22)">
          <rect x="3" y="16" width="11" height="12" rx="2" fill="#2A5F8F" stroke="#1F3A36" stroke-width="1.6"/>
          <line x1="8.5" y1="16" x2="8.5" y2="28" stroke="#FFFBEF" stroke-width="1.2"/>
          <rect x="30" y="16" width="11" height="12" rx="2" fill="#2A5F8F" stroke="#1F3A36" stroke-width="1.6"/>
          <line x1="35.5" y1="16" x2="35.5" y2="28" stroke="#FFFBEF" stroke-width="1.2"/>
          <line x1="14" y1="22" x2="30" y2="22" stroke="#1F3A36" stroke-width="2.2"/>
          <rect x="17" y="14" width="10" height="16" rx="3" fill="${primaryColor}" stroke="#1F3A36" stroke-width="1.8"/>
          <circle cx="22" cy="22" r="2.6" fill="#FFFBEF"/>
          <path d="M19,30 Q22,35 25,30" fill="none" stroke="#1F3A36" stroke-width="1.8"/>
        </g>
        <path d="M16,35 Q22,39 28,35" fill="none" stroke="${primaryColor}" stroke-width="2" stroke-linecap="round"/>
        <path d="M12,39 Q22,44 32,39" fill="none" stroke="${primaryColor}" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>
      </svg>`;
  }

  /* ==========================================================================
     AI-use notice: Miniature & Large Central Animated SVG Landscapes (6 Regions)
     ========================================================================== */
  function getRegionMiniNodeSvg(regionId) {
    const r = DATA.regions[regionId];
    const c = r.colors;
    switch (regionId) {
      case "morelos":
        return `<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="${c.softBg}"/><circle cx="44" cy="18" r="8" fill="${c.accent}"/><path d="M0,42 L18,24 L36,38 L52,22 L60,32 L60,60 L0,60 Z" fill="${c.primary}" opacity="0.75"/><path d="M0,46 Q30,34 60,44 L60,60 L0,60 Z" fill="#619F4D"/><circle cx="20" cy="50" r="3" fill="${c.primary}"/><circle cx="38" cy="48" r="3" fill="${c.primary}"/></svg>`;
      case "chiapas":
        return `<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="${c.softBg}"/><circle cx="44" cy="16" r="8" fill="${c.accent}"/><polygon points="14,44 22,26 38,26 46,44" fill="#4B5F5A"/><rect x="25" y="19" width="10" height="7" fill="#4B5F5A"/><path d="M0,44 Q30,36 60,44 L60,60 L0,60 Z" fill="${c.primary}"/></svg>`;
      case "south_amazon":
        return `<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="${c.softBg}"/><circle cx="44" cy="16" r="8" fill="#D59625"/><path d="M0,38 Q30,26 60,38 L60,60 L0,60 Z" fill="${c.primary}"/><path d="M24,38 Q18,48 10,60 L34,60 Q36,48 24,38 Z" fill="#1B8E96"/></svg>`;
      case "sahel":
        return `<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="${c.softBg}"/><circle cx="18" cy="18" r="9" fill="${c.accent}"/><path d="M0,42 Q30,34 60,42 L60,60 L0,60 Z" fill="${c.primary}"/><ellipse cx="38" cy="26" rx="14" ry="4" fill="#619F4D"/><line x1="38" y1="26" x2="38" y2="42" stroke="#4B5F5A" stroke-width="2.5"/></svg>`;
      case "sonora":
        return `<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="${c.softBg}"/><circle cx="18" cy="18" r="8" fill="#CD8F2C"/><polygon points="6,45 24,22 42,45" fill="${c.primary}"/><path d="M0,44 Q30,38 60,44 L60,60 L0,60 Z" fill="${c.accent}"/><rect x="43" y="24" width="4" height="20" rx="2" fill="#1B8E96"/></svg>`;
      case "zacatecas":
      default:
        return `<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="${c.softBg}"/><circle cx="44" cy="18" r="8" fill="#A97508"/><polygon points="8,44 26,20 44,44" fill="${c.accent}"/><path d="M0,44 Q30,36 60,44 L60,60 L0,60 Z" fill="${c.primary}"/></svg>`;
    }
  }

  function renderAnimatedHubRegionSvg(regionId, phase) {
    const r = DATA.regions[regionId];
    const c = r.colors;
    const breeze = Math.sin(phase * 2.2) * 7;
    const floatY = Math.cos(phase * 1.8) * 4.5;
    const sunPulse = Math.sin(phase * 2.8) * 3;

    switch (regionId) {
      case "morelos":
        return `
          <svg viewBox="0 0 260 260" aria-label="Animated Morelos valley scene">
            <rect width="260" height="260" fill="${c.softBg}"/>
            <circle cx="188" cy="${(64 + floatY).toFixed(1)}" r="${(30 + sunPulse).toFixed(1)}" fill="${c.accent}" opacity="0.38"/>
            <circle cx="188" cy="${(64 + floatY).toFixed(1)}" r="20" fill="#D59625"/>
            <g transform="translate(${(34 + breeze * 1.4).toFixed(1)}, 42)" fill="#FFFBEF" opacity="0.85">
              <rect x="0" y="10" width="54" height="14" rx="7"/>
              <circle cx="16" cy="10" r="10"/><circle cx="34" cy="8" r="12"/>
            </g>
            <path d="M0,162 L56,102 L112,136 L174,86 L260,142 L260,260 L0,260 Z" fill="#7B50A2" opacity="0.68"/>
            <path d="M0,178 Q78,138 158,168 T260,156 L260,260 L0,260 Z" fill="#619F4D"/>
            <path d="M0,204 Q130,180 260,202 L260,260 L0,260 Z" fill="#3B7A57"/>
            <g transform="translate(42, 146)">
              <rect x="12" y="22" width="4" height="18" fill="#8C4A2F"/>
              <circle cx="14" cy="16" r="14" fill="#1F3A36" opacity="0.75"/>
            </g>
            <g transform="translate(${breeze.toFixed(1)}, 0)" fill="${c.primary}">
              <circle cx="58" cy="196" r="7"/><circle cx="68" cy="191" r="5.5"/>
              <circle cx="128" cy="188" r="7.5"/><circle cx="140" cy="193" r="6"/>
              <circle cx="196" cy="194" r="7"/><circle cx="206" cy="188" r="5.5"/>
              <circle cx="${(96 + breeze * 1.6).toFixed(1)}" cy="${(128 + floatY).toFixed(1)}" r="4.5" fill="${c.accent}"/>
              <circle cx="${(154 - breeze * 1.4).toFixed(1)}" cy="${(116 - floatY).toFixed(1)}" r="4" fill="${c.primary}"/>
            </g>
          </svg>`;

      case "chiapas":
        return `
          <svg viewBox="0 0 260 260" aria-label="Animated Chiapas highland pyramid scene">
            <rect width="260" height="260" fill="${c.softBg}"/>
            <circle cx="190" cy="62" r="${(24 + sunPulse).toFixed(1)}" fill="${c.accent}" opacity="0.35"/>
            <circle cx="190" cy="62" r="18" fill="${c.accent}"/>
            <path d="M0,166 Q78,112 158,148 T260,130 L260,260 L0,260 Z" fill="#7fa89e"/>
            <g transform="translate(74, 88)" fill="#2d5f59">
              <rect x="0" y="68" width="112" height="12" rx="2"/>
              <rect x="10" y="56" width="92" height="12" rx="2"/>
              <rect x="20" y="44" width="72" height="12" rx="2"/>
              <rect x="30" y="32" width="52" height="12" rx="2"/>
              <rect x="38" y="14" width="36" height="18" rx="2"/>
              <polygon points="48,80 52,32 60,32 64,80" fill="${c.softBg}"/>
            </g>
            <path d="M${(24 + breeze * 1.8).toFixed(1)},158 Q98,148 184,158" stroke="#FFFBEF" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.8"/>
            <path d="M${(48 - breeze * 1.4).toFixed(1)},172 Q128,164 212,172" stroke="#FFFBEF" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0.65"/>
            <path d="M0,186 Q112,162 260,184 L260,260 L0,260 Z" fill="${c.primary}"/>
            <g transform="translate(${(96 + breeze * 1.1).toFixed(1)}, 180)" fill="${c.accent}">
              <rect x="0" y="6" width="28" height="12" rx="6"/>
              <circle cx="31" cy="7" r="6.5"/>
              <rect x="3" y="16" width="4" height="9" rx="2"/>
              <rect x="21" y="16" width="4" height="9" rx="2"/>
              <path d="M0,9 Q-10,4 -12,12" stroke="${c.accent}" stroke-width="3" fill="none" stroke-linecap="round"/>
            </g>
          </svg>`;

      case "south_amazon":
        return `
          <svg viewBox="0 0 260 260" aria-label="Animated Southern Amazon canopy and river">
            <rect width="260" height="260" fill="${c.softBg}"/>
            <circle cx="186" cy="62" r="${(23 + sunPulse).toFixed(1)}" fill="#D59625"/>
            <path d="M0,154 Q70,118 142,144 T260,136 L260,260 L0,260 Z" fill="${c.primary}"/>
            <path d="M0,182 Q96,156 188,178 T260,170 L260,260 L0,260 Z" fill="#3B7A57"/>
            <path d="M138,168 Q108,196 72,260 L172,260 Q178,204 138,168 Z" fill="#1B8E96"/>
            <line x1="${(112 + breeze * 1.3).toFixed(1)}" y1="196" x2="${(138 + breeze * 1.3).toFixed(1)}" y2="196" stroke="#FFFBEF" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
            <line x1="${(102 - breeze * 1.2).toFixed(1)}" y1="216" x2="${(142 - breeze * 1.2).toFixed(1)}" y2="216" stroke="#FFFBEF" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
            <g transform="translate(${(breeze * 0.7).toFixed(1)}, 0)" fill="#1F3A36">
              <circle cx="48" cy="158" r="22"/><circle cx="72" cy="166" r="17"/>
              <circle cx="210" cy="156" r="23"/>
            </g>
          </svg>`;

      case "sahel":
        return `
          <svg viewBox="0 0 260 260" aria-label="Animated Sahel savanna and acacia">
            <rect width="260" height="260" fill="${c.softBg}"/>
            <circle cx="78" cy="68" r="${(25 + sunPulse).toFixed(1)}" fill="${c.accent}"/>
            <g transform="translate(${(136 + breeze * 1.6).toFixed(1)}, 48)" fill="#78A2CC">
              <rect x="0" y="14" width="68" height="18" rx="9"/>
              <circle cx="22" cy="14" r="13"/><circle cx="46" cy="10" r="15"/>
            </g>
            <path d="M0,170 Q112,144 260,168 L260,260 L0,260 Z" fill="#DCBA89"/>
            <path d="M0,196 Q130,178 260,194 L260,260 L0,260 Z" fill="${c.primary}"/>
            <g transform="translate(154, 114)">
              <path d="M28,68 L28,28 L12,14 M28,32 L44,16" stroke="#4B5F5A" stroke-width="3.8" fill="none" stroke-linecap="round"/>
              <ellipse cx="28" cy="13" rx="34" ry="8" fill="#619F4D"/>
              <ellipse cx="12" cy="19" rx="17" ry="5.5" fill="#3B7A57"/>
            </g>
          </svg>`;

      case "sonora":
        return `
          <svg viewBox="0 0 260 260" aria-label="Animated Sonora desert canyon and saguaro">
            <rect width="260" height="260" fill="${c.softBg}"/>
            <circle cx="74" cy="64" r="${(25 + sunPulse).toFixed(1)}" fill="#CD8F2C"/>
            <polygon points="18,178 80,96 142,178" fill="${c.primary}"/>
            <polygon points="96,182 168,84 238,182" fill="#B2673D"/>
            <path d="M0,178 Q130,154 260,176 L260,260 L0,260 Z" fill="${c.accent}"/>
            <path d="M0,204 Q130,188 260,202 L260,260 L0,260 Z" fill="${c.primary}"/>
            <g transform="translate(174, 108)" fill="#1B8E96">
              <rect x="12" y="0" width="8" height="72" rx="4"/>
              <path d="M16,38 L30,38 L30,16 L23,16 L23,30 L16,30 Z"/>
              <path d="M16,46 L2,46 L2,26 L9,26 L9,38 L16,38 Z"/>
            </g>
          </svg>`;

      case "zacatecas":
      default:
        return `
          <svg viewBox="0 0 260 260" aria-label="Animated Zacatecas plateau and La Bufa">
            <rect width="260" height="260" fill="${c.softBg}"/>
            <circle cx="186" cy="64" r="${(23 + sunPulse).toFixed(1)}" fill="#A97508"/>
            <polygon points="28,178 104,78 178,178" fill="${c.accent}"/>
            <rect x="92" y="70" width="24" height="12" rx="2" fill="#8C4A2F"/>
            <path d="M0,178 Q130,152 260,174 L260,260 L0,260 Z" fill="#B9A4D7"/>
            <path d="M0,202 Q130,184 260,200 L260,260 L0,260 Z" fill="${c.primary}"/>
            <path d="M${(42 + breeze * 2.2).toFixed(1)},106 Q104,94 164,106" stroke="#FFFBEF" stroke-width="3.6" fill="none" stroke-linecap="round"/>
            <path d="M${(64 - breeze * 1.8).toFixed(1)},124 Q124,114 184,124" stroke="#FFFBEF" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.85"/>
          </svg>`;
    }
  }

  /* ==========================================================================
     AI-use notice: Build & Update Single-Rectangle Unified Variable Switcher
     (Persists DOM so the glider physically slides smoothly on variable click!)
     ========================================================================== */
  function ensureUnifiedVarSwitcherDom(containerEl) {
    if (!containerEl) return;
    if (containerEl.querySelector(".var-switcher-glider")) return;

    const varIdx = Math.max(0, VAR_ORDER.indexOf(state.activeVar));
    containerEl.style.setProperty("--var-idx", String(varIdx));

    containerEl.innerHTML = `
      <span class="var-switcher-glider" aria-hidden="true"></span>
      ${VAR_ORDER.map((vKey) => {
        const vm = DATA.variableMeta[vKey];
        return `
          <button type="button" class="unified-var-btn" data-select-var="${vKey}" role="tab">
            <span class="uvar-left">
              <span class="uvar-icon">${getVariableIconSvg(vKey)}</span>
              <span class="uvar-copy">
                <span class="uvar-name">${vm.shortLabel}</span>
                <span class="uvar-status" data-var-status="${vKey}">
                  <span class="uvar-status-dot" aria-hidden="true"></span>
                  <span class="uvar-status-text"></span>
                </span>
              </span>
            </span>
            <span class="uvar-state-pill" data-var-pill="${vKey}">Select</span>
          </button>`;
      }).join("")}
    `;
  }

  function syncUnifiedVarSwitcherDom(containerEl, currReg) {
    if (!containerEl) return;
    ensureUnifiedVarSwitcherDom(containerEl);

    const varIdx = Math.max(0, VAR_ORDER.indexOf(state.activeVar));
    containerEl.style.setProperty("--var-idx", String(varIdx));

    VAR_ORDER.forEach((vKey) => {
      const vd = currReg.variables[vKey];
      const isAct = vKey === state.activeVar;
      const btn = containerEl.querySelector(`[data-select-var="${vKey}"]`);
      if (btn) {
        btn.classList.toggle("active", isAct);
        btn.setAttribute("aria-selected", isAct ? "true" : "false");
      }
      const statusEl = containerEl.querySelector(`[data-var-status="${vKey}"]`);
      if (statusEl) {
        statusEl.className = `uvar-status status-${vd.story.verdictTone}`;
        const txt = statusEl.querySelector(".uvar-status-text");
        if (txt) txt.textContent = vd.story.statusPill;
      }
      const pillEl = containerEl.querySelector(`[data-var-pill="${vKey}"]`);
      if (pillEl) {
        pillEl.textContent = isAct ? "Active" : "Select";
      }
    });
  }

  /* ==========================================================================
     AI-use notice: Independent Region Selector Page (460x460 Persistent Wheel)
     ========================================================================== */
  function initCircularWheelOnce() {
    const wheelStage = document.getElementById("circular-wheel-stage");
    if (!wheelStage || state.wheelInitialized) return;

    const cx = 230;
    const cy = 230;
    const radius = 176;
    let backgroundSpokes = "";
    let nodesHtml = "";

    REGION_ORDER.forEach((id, idx) => {
      const angleDeg = -90 + idx * 60;
      const rad = (angleDeg * Math.PI) / 180;
      const nx = cx + Math.cos(rad) * radius;
      const ny = cy + Math.sin(rad) * radius;
      const pctX = (nx / 460) * 100;
      const pctY = (ny / 460) * 100;
      const rObj = DATA.regions[id];

      backgroundSpokes += `<line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#E2D5B0" stroke-width="2" stroke-dasharray="6,6"/>`;

      nodesHtml += `
        <button
          type="button"
          class="wheel-node"
          id="wheel-node-${id}"
          style="left:${pctX.toFixed(2)}%; top:${pctY.toFixed(2)}%; --node-color:${rObj.colors.primary}; --node-soft:${rObj.colors.softBg}"
          data-select-region="${id}"
          aria-label="Select ${rObj.name} region"
        >
          <span class="node-mini-svg">${getRegionMiniNodeSvg(id)}</span>
          <span class="node-label">${rObj.name}</span>
        </button>`;
    });

    wheelStage.innerHTML = `
      <svg class="wheel-orbit-svg" viewBox="0 0 460 460" aria-hidden="true">
        <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#E2D5B0" stroke-width="2.5" stroke-dasharray="8,8"/>
        <circle id="wheel-inner-ring" cx="${cx}" cy="${cy}" r="124" fill="none" stroke="#D51761" stroke-width="2.2" stroke-opacity="0.38"/>
        ${backgroundSpokes}
        <g id="wheel-pointer-group">
          <line id="wheel-pointer-line" x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - radius}" stroke="#D51761" stroke-width="4.5" stroke-linecap="round"/>
        </g>
      </svg>
      <div class="wheel-center-hub" id="wheel-center-hub" data-goto-page="data" title="Click to open ${DATA.regions[state.regionId].name} climate data">
        <div class="hub-svg-wrap" id="hub-svg-wrap"></div>
        <span class="hub-caption-pill" id="hub-caption-pill">Morelos · Mexico</span>
      </div>
      ${nodesHtml}
    `;

    state.wheelInitialized = true;
  }

  function updateCircularWheelSelection(animatePop) {
    initCircularWheelOnce();

    const currReg = DATA.regions[state.regionId];
    const activeIdx = REGION_ORDER.indexOf(state.regionId);
    const angleDeg = activeIdx * 60;

    REGION_ORDER.forEach((id) => {
      const btn = document.getElementById(`wheel-node-${id}`);
      if (btn) {
        btn.classList.toggle("active", id === state.regionId);
      }
    });

    const pointerGroup = document.getElementById("wheel-pointer-group");
    const pointerLine = document.getElementById("wheel-pointer-line");
    const innerRing = document.getElementById("wheel-inner-ring");
    if (pointerGroup) pointerGroup.style.transform = `rotate(${angleDeg}deg)`;
    if (pointerLine) pointerLine.setAttribute("stroke", currReg.colors.primary);
    if (innerRing) innerRing.setAttribute("stroke", currReg.colors.primary);

    const mainTitle = document.getElementById("selector-main-title");
    const subLandmark = document.getElementById("selector-sub-landmark");
    const summaryText = document.getElementById("selector-regional-summary-text");
    const hubCaption = document.getElementById("hub-caption-pill");
    const varRegionLabel = document.getElementById("selector-var-region-label");
    const openBtnTxt = document.getElementById("open-region-btn-text");
    const activeVMeta = DATA.variableMeta[state.activeVar];

    if (mainTitle) mainTitle.textContent = currReg.fullName;
    if (subLandmark) subLandmark.textContent = `${currReg.landmarkLabel} · ${currReg.climateTag}`;
    if (summaryText) summaryText.textContent = currReg.simpleOverview || currReg.regionalSummary || "";
    if (hubCaption) hubCaption.textContent = `${currReg.name} · ${currReg.country}`;
    if (varRegionLabel) varRegionLabel.textContent = currReg.name;
    if (openBtnTxt) {
      openBtnTxt.textContent = `Open ${currReg.name} · ${activeVMeta.shortLabel} Graphs & Analysis`;
    }

    const hubWrap = document.getElementById("hub-svg-wrap");
    if (hubWrap) {
      hubWrap.innerHTML = renderAnimatedHubRegionSvg(state.regionId, state.phaseTime);
    }

    // Update unified single-rectangle variable switcher on the Selector Page
    const previewList = document.getElementById("selector-var-preview-list");
    syncUnifiedVarSwitcherDom(previewList, currReg);

    if (animatePop) {
      const hub = document.getElementById("wheel-center-hub");
      if (hub) {
        hub.classList.add("hub-transitioning");
        setTimeout(() => {
          hub.classList.remove("hub-transitioning");
        }, 220);
      }
    }
  }

  /* ==========================================================================
     AI-use notice: Full-Width Animated SVG Scene Blended INSIDE the Graph
     ========================================================================== */
  function renderInGraphBackgroundScene(varKey, vData, regionColors, yearFloat, phase, W, H, padL, padR, padT, padB) {
    const val = sampleSeriesAtYear(vData.annualValues, yearFloat);
    const span = Math.max(0.15, vData.maxValue - vData.minValue);
    const norm = clamp((val - vData.minValue) / span, 0, 1);
    const plotW = W - padL - padR;
    const plotBottom = H - padB;

    if (varKey === "precipitation_rate") {
      const waterY = lerp(plotBottom - 26, plotBottom - 135, norm);
      const waveAmp = lerp(3, 9, norm);
      const driftX = Math.sin(phase * 0.9) * 18;
      const dropCount = Math.round(lerp(8, 36, norm));
      const speedMult = lerp(0.7, 1.55, norm);

      let wavePath = `M ${padL},${waterY.toFixed(1)}`;
      for (let x = padL; x <= W - padR; x += 36) {
        const y = waterY + Math.sin(x * 0.02 + phase * 3.0) * waveAmp;
        wavePath += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
      }
      wavePath += ` L ${W - padR},${plotBottom} L ${padL},${plotBottom} Z`;

      let dropsSvg = "";
      for (let i = 0; i < dropCount; i++) {
        const seed = (i * 43) % 100;
        const baseX = padL + 35 + (i * (plotW - 70)) / Math.max(1, dropCount);
        const progress = (phase * speedMult * 1.15 + seed * 0.03) % 1;
        const yStart = padT + 28 + progress * (waterY - padT - 32);
        const len = lerp(14, 26, norm);
        const xStart = baseX - progress * 16;
        dropsSvg += `<line x1="${xStart.toFixed(1)}" y1="${yStart.toFixed(1)}" x2="${(xStart - 5).toFixed(1)}" y2="${(yStart + len).toFixed(1)}" stroke="#2A5F8F" stroke-width="2" stroke-linecap="round" opacity="${lerp(0.14, 0.30, norm).toFixed(2)}"/>`;
      }

      return `
        <g opacity="0.88" pointer-events="none">
          <circle cx="${W - padR - 95}" cy="${padT + 58}" r="${lerp(38, 22, norm).toFixed(1)}" fill="#D59625" opacity="${lerp(0.28, 0.10, norm).toFixed(2)}"/>
          <path d="M ${padL},${plotBottom} L ${padL + 160},${plotBottom - 95} L ${padL + 340},${plotBottom - 45} L ${padL + 560},${plotBottom - 115} L ${padL + 790},${plotBottom - 52} L ${W - padR},${plotBottom - 90} L ${W - padR},${plotBottom} Z" fill="${regionColors.accent}" opacity="0.14"/>
          <g transform="translate(${(padL + 90 + driftX).toFixed(1)}, ${padT + 12})" fill="#2A5F8F" opacity="${lerp(0.14, 0.28, norm).toFixed(2)}">
            <rect x="0" y="18" width="130" height="26" rx="13"/>
            <circle cx="38" cy="18" r="20"/><circle cx="76" cy="12" r="25"/><circle cx="108" cy="20" r="16"/>
          </g>
          <g transform="translate(${(padL + 440 - driftX * 0.8).toFixed(1)}, ${padT + 18})" fill="#2A5F8F" opacity="${lerp(0.12, 0.25, norm).toFixed(2)}">
            <rect x="0" y="16" width="145" height="26" rx="13"/>
            <circle cx="44" cy="16" r="21"/><circle cx="88" cy="11" r="26"/><circle cx="122" cy="18" r="17"/>
          </g>
          <g transform="translate(${(padL + 760 + driftX * 0.6).toFixed(1)}, ${padT + 14})" fill="#2A5F8F" opacity="${lerp(0.12, 0.25, norm).toFixed(2)}">
            <rect x="0" y="16" width="120" height="24" rx="12"/>
            <circle cx="36" cy="16" r="18"/><circle cx="74" cy="12" r="22"/>
          </g>
          ${dropsSvg}
          <path d="${wavePath}" fill="#2A5F8F" opacity="0.16"/>
          <path d="${wavePath}" transform="translate(0, 12)" fill="#1B8E96" opacity="0.12"/>
        </g>`;
    }

    if (varKey === "soil_moisture_0_10cm") {
      const dryness = 1 - norm;
      const moistureY = lerp(plotBottom - 24, plotBottom - 140, norm);
      const stemTilt = lerp(16, -2, norm);
      const leafScale = lerp(0.76, 1.15, norm);
      const plantColor = norm > 0.45 ? "#619F4D" : norm > 0.22 ? "#D59625" : "#C2410C";
      const crackW = lerp(0, 11, Math.pow(dryness, 1.15));

      let moistureWave = `M ${padL},${moistureY.toFixed(1)}`;
      for (let x = padL; x <= W - padR; x += 40) {
        const wy = moistureY + Math.sin(x * 0.022 + phase * 2.2) * 5;
        moistureWave += ` L ${x.toFixed(1)},${wy.toFixed(1)}`;
      }
      moistureWave += ` L ${W - padR},${plotBottom} L ${padL},${plotBottom} Z`;

      const plantXList = [padL + 165, padL + 410, padL + 665, padL + 905];
      const plantsSvg = plantXList
        .map((px, idx) => {
          const sway = Math.sin(phase * 2.0 + idx) * 2.2;
          return `
            <g transform="translate(${px}, ${plotBottom - 88})">
              <path d="M0,0 Q-6,36 -18,74 M0,0 Q8,40 20,78 M-4,28 Q-24,42 -34,62" stroke="#8C4A2F" stroke-width="2.5" fill="none" opacity="0.22" stroke-linecap="round"/>
              <g transform="rotate(${(stemTilt + sway).toFixed(1)}) scale(${leafScale.toFixed(2)})" opacity="0.34">
                <path d="M0,0 Q-2,-34 0,-64" stroke="${plantColor}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
                <path d="M0,-28 Q-30,-42 -34,-20 Q-16,-10 0,-22 Z" fill="${plantColor}"/>
                <path d="M0,-40 Q30,-54 34,-32 Q16,-22 0,-34 Z" fill="${plantColor}"/>
                <path d="M0,-58 Q-16,-78 0,-86 Q16,-78 0,-58 Z" fill="${plantColor}"/>
              </g>
            </g>`;
        })
        .join("");

      const cracksSvg =
        crackW > 0.5
          ? [padL + 280, padL + 540, padL + 785]
              .map(
                (cx) =>
                  `<polygon points="${(cx - crackW).toFixed(1)},${plotBottom - 88} ${(cx + crackW).toFixed(1)},${plotBottom - 88} ${cx + 4},${plotBottom - 26} ${cx - 3},${plotBottom - 48}" fill="#8C4A2F" opacity="${clamp(dryness * 0.28, 0, 0.28).toFixed(2)}"/>`
              )
              .join("")
          : "";

      const dropletCount = Math.round(lerp(4, 24, norm));
      let dropletsSvg = "";
      for (let i = 0; i < dropletCount; i++) {
        const dx = padL + 45 + ((i * 67) % (plotW - 90));
        const dy = plotBottom - 82 + ((phase * 22 + i * 17) % 74);
        dropletsSvg += `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="3.2" fill="#2A5F8F" opacity="${lerp(0.15, 0.34, norm).toFixed(2)}"/>`;
      }

      return `
        <g pointer-events="none">
          <rect x="${padL}" y="${plotBottom - 88}" width="${plotW}" height="88" fill="#B2673D" opacity="0.11"/>
          <path d="${moistureWave}" fill="#2A5F8F" opacity="0.16"/>
          ${cracksSvg}
          ${plantsSvg}
          ${dropletsSvg}
        </g>`;
    }

    // Air Temperature Background Scene with 8 Symmetrical Radial Rays
    const sunR = lerp(34, 58, norm);
    const haloR = sunR + 18 + Math.sin(phase * 3.2) * 5;
    const mercColor = norm > 0.55 ? "#C2410C" : norm > 0.28 ? "#D59625" : "#2A5F8F";
    const rayAngle = (phase * 16 * (0.6 + norm)) % 360;
    const waveAmp = lerp(3, 12, norm);

    let raysSvg = "";
    for (let r = 0; r < 8; r++) {
      const ang = (r * Math.PI) / 4;
      const rIn = sunR + 9;
      const rOut = sunR + 23;
      const x1 = Math.cos(ang) * rIn;
      const y1 = Math.sin(ang) * rIn;
      const x2 = Math.cos(ang) * rOut;
      const y2 = Math.sin(ang) * rOut;
      raysSvg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    }

    let shimmerSvg = "";
    for (let w = 0; w < 6; w++) {
      const bx = padL + 120 + w * 165;
      let d = `M ${bx},${plotBottom - 20}`;
      for (let y = plotBottom - 20; y >= padT + 70; y -= 16) {
        const xOff = Math.sin((plotBottom - y) * 0.065 - phase * (2.2 + norm * 2.2) + w) * waveAmp;
        d += ` L ${(bx + xOff).toFixed(1)},${y}`;
      }
      shimmerSvg += `<path d="${d}" fill="none" stroke="${mercColor}" stroke-width="2.6" stroke-linecap="round" opacity="${lerp(0.10, 0.25, norm).toFixed(2)}"/>`;
    }

    return `
      <g pointer-events="none">
        <rect x="${padL}" y="${plotBottom - 110}" width="${plotW}" height="110" fill="${mercColor}" opacity="${lerp(0.05, 0.16, norm).toFixed(2)}"/>
        <g transform="translate(${W - padR - 145}, ${padT + 92})" opacity="${lerp(0.22, 0.38, norm).toFixed(2)}">
          <circle cx="0" cy="0" r="${haloR.toFixed(1)}" fill="${mercColor}" opacity="0.30"/>
          <circle cx="0" cy="0" r="${sunR.toFixed(1)}" fill="#D59625"/>
          <g transform="rotate(${rayAngle.toFixed(1)})" stroke="${mercColor}" stroke-width="3.5" stroke-linecap="round">
            ${raysSvg}
          </g>
        </g>
        ${shimmerSvg}
        <path d="M ${padL},${plotBottom} Q ${padL + 280},${plotBottom - 44} ${padL + 560},${plotBottom - 20} T ${W - padR},${plotBottom - 34} L ${W - padR},${plotBottom} Z" fill="${regionColors.primary}" opacity="0.14"/>
      </g>`;
  }

  /* ==========================================================================
     AI-use notice: Full-Width Integrated SVG Graph (1140 x 450)
     ========================================================================== */
  function renderIntegratedGraphSvg(varKey, vData, regionColors, yearFloat, mode, phase) {
    const W = 1140;
    const H = 450;
    const padL = 68;
    const padR = 36;
    const padT = 34;
    const padB = 44;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const lineColor = varKey === "precipitation_rate" ? "#2A5F8F" : regionColors.primary;
    const senColor = "#C2410C";

    const bgSceneSvg = renderInGraphBackgroundScene(varKey, vData, regionColors, yearFloat, phase, W, H, padL, padR, padT, padB);

    if (mode === "seasonal") {
      const months = DATA.months;
      const activeMonthly = sampleMonthlyAtYear(vData.monthlyByYear, yearFloat);
      const baseMonthly = vData.monthlyBaseline2000_2004;

      const allVals = [...activeMonthly, ...baseMonthly];
      for (let y = 2000; y <= 2024; y++) {
        allVals.push(...vData.monthlyByYear[String(y)]);
      }
      const minV = Math.min(...allVals);
      const maxV = Math.max(...allVals);
      const margin = Math.max(0.5, (maxV - minV) * 0.12);
      const yMin = varKey === "precipitation_rate" ? 0 : minV - margin;
      const yMax = maxV + margin;

      const xAt = (mIdx) => padL + (mIdx / 11) * plotW;
      const yAt = (val) => padT + plotH - ((val - yMin) / Math.max(0.001, yMax - yMin)) * plotH;

      const activePts = activeMonthly.map((v, i) => [xAt(i), yAt(v)]);
      const basePts = baseMonthly.map((v, i) => [xAt(i), yAt(v)]);
      const activePath = buildSmoothSvgPath(activePts);
      const basePath = buildSmoothSvgPath(basePts);

      let gridSvg = "";
      for (let g = 0; g <= 4; g++) {
        const gv = yMin + (g / 4) * (yMax - yMin);
        const gy = yAt(gv);
        gridSvg += `
          <line x1="${padL}" y1="${gy.toFixed(1)}" x2="${W - padR}" y2="${gy.toFixed(1)}" stroke="#E2D5B0" stroke-width="1.3" stroke-dasharray="5,5"/>
          <text x="${padL - 12}" y="${(gy + 4).toFixed(1)}" text-anchor="end" fill="#4B5F5A" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700">${gv.toFixed(varKey === "precipitation_rate" ? 0 : 1)}</text>`;
      }

      const xLabels = months
        .map(
          (m, i) =>
            `<text x="${xAt(i).toFixed(1)}" y="${H - 12}" text-anchor="middle" fill="#1F3A36" font-family="Plus Jakarta Sans, sans-serif" font-size="12.5" font-weight="800">${m}</text>`
        )
        .join("");

      const dotsSvg = activePts
        .map(
          (pt, i) => `
          <circle cx="${pt[0].toFixed(1)}" cy="${pt[1].toFixed(1)}" r="6" fill="${lineColor}" stroke="#FFFBEF" stroke-width="2.5"/>
          <rect x="${(pt[0] - 24).toFixed(1)}" y="${(pt[1] - 28).toFixed(1)}" width="48" height="18" rx="5" fill="#FFFBEF" opacity="0.9"/>
          <text x="${pt[0].toFixed(1)}" y="${(pt[1] - 15).toFixed(1)}" text-anchor="middle" fill="#1F3A36" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700">${activeMonthly[i].toFixed(varKey === "precipitation_rate" ? 0 : 1)}</text>`
        )
        .join("");

      return `
        <svg viewBox="0 0 ${W} ${H}" aria-label="Full-width monthly seasonal cycle chart">
          <rect width="${W}" height="${H}" fill="#FFFBEF"/>
          <rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" rx="10" fill="${regionColors.softBg}" opacity="0.42"/>
          ${bgSceneSvg}
          ${gridSvg}
          <path d="${basePath}" fill="none" stroke="#4B5F5A" stroke-width="2.6" stroke-dasharray="7,5"/>
          <path d="${activePath}" fill="none" stroke="#FFFBEF" stroke-width="9" stroke-linecap="round"/>
          <path d="${activePath}" fill="none" stroke="${lineColor}" stroke-width="4.5" stroke-linecap="round"/>
          ${dotsSvg}
          ${xLabels}
        </svg>`;
    }

    if (mode === "anomaly") {
      const anoms = vData.anomalies;
      const maxAbs = Math.max(...anoms.map((a) => Math.abs(a)), 0.1) * 1.18;
      const yZero = padT + plotH / 2;
      const xAt = (idx) => padL + (idx / 24) * plotW;
      const yAt = (a) => yZero - (a / maxAbs) * (plotH / 2);

      const posColor = varKey === "air_temperature_2m" ? "#C2410C" : "#2A5F8F";
      const negColor = varKey === "air_temperature_2m" ? "#2A5F8F" : "#C2410C";

      const barW = (plotW / 25) * 0.68;
      const activeIdx = Math.round(clamp(yearFloat - 2000, 0, 24));
      let barsSvg = "";
      anoms.forEach((a, i) => {
        const cx = xAt(i);
        const by = a >= 0 ? yAt(a) : yZero;
        const bh = Math.max(3, Math.abs(yAt(a) - yZero));
        const fill = a >= 0 ? posColor : negColor;
        const isCurrent = i === activeIdx;
        barsSvg += `<rect x="${(cx - barW / 2).toFixed(1)}" y="${by.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="4" fill="${fill}" opacity="${isCurrent ? "0.96" : "0.72"}" stroke="${isCurrent ? "#1F3A36" : "#FFFBEF"}" stroke-width="${isCurrent ? "2.5" : "1"}"/>`;
      });

      const playX = xAt(clamp(yearFloat - 2000, 0, 24));
      let xTicks = "";
      for (let y = 2000; y <= 2024; y += 2) {
        xTicks += `<text x="${xAt(y - 2000).toFixed(1)}" y="${H - 12}" text-anchor="middle" fill="#1F3A36" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700">${y}</text>`;
      }

      return `
        <svg viewBox="0 0 ${W} ${H}" aria-label="Full-width anomaly bar chart">
          <rect width="${W}" height="${H}" fill="#FFFBEF"/>
          <rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" rx="10" fill="${regionColors.softBg}" opacity="0.42"/>
          ${bgSceneSvg}
          <line x1="${padL}" y1="${yZero.toFixed(1)}" x2="${W - padR}" y2="${yZero.toFixed(1)}" stroke="#1F3A36" stroke-width="2"/>
          <text x="${padL - 12}" y="${(yZero + 4).toFixed(1)}" text-anchor="end" fill="#1F3A36" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700">Avg</text>
          ${barsSvg}
          <line x1="${playX.toFixed(1)}" y1="${padT}" x2="${playX.toFixed(1)}" y2="${padT + plotH}" stroke="#1F3A36" stroke-width="2" stroke-dasharray="4,4"/>
          ${xTicks}
        </svg>`;
    }

    // Default Mode: "annual"
    const vals = vData.annualValues;
    const sen = vData.senLine;
    const ciLow = vData.ciLowLine;
    const ciHigh = vData.ciHighLine;
    const allY = [...vals, ...sen, ...ciLow, ...ciHigh];
    const minV = Math.min(...allY);
    const maxV = Math.max(...allY);
    const padV = Math.max(0.2, (maxV - minV) * 0.14);
    const yMin = minV - padV;
    const yMax = maxV + padV;

    const xAt = (idxFloat) => padL + (idxFloat / 24) * plotW;
    const yAt = (v) => padT + plotH - ((v - yMin) / Math.max(0.001, yMax - yMin)) * plotH;

    let gridSvg = "";
    for (let g = 0; g <= 4; g++) {
      const gv = yMin + (g / 4) * (yMax - yMin);
      const gy = yAt(gv);
      gridSvg += `
        <line x1="${padL}" y1="${gy.toFixed(1)}" x2="${W - padR}" y2="${gy.toFixed(1)}" stroke="#E2D5B0" stroke-width="1.3" stroke-dasharray="5,5"/>
        <text x="${padL - 12}" y="${(gy + 4).toFixed(1)}" text-anchor="end" fill="#4B5F5A" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700">${gv.toFixed(varKey === "precipitation_rate" ? 0 : 1)}</text>`;
    }

    const ciTopPts = ciHigh.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(" L ");
    const ciBotPts = [...ciLow]
      .reverse()
      .map((v, i) => `${xAt(24 - i).toFixed(1)},${yAt(v).toFixed(1)}`)
      .join(" L ");
    const ciPolygon = `M ${ciTopPts} L ${ciBotPts} Z`;

    const senX1 = xAt(0);
    const senY1 = yAt(sen[0]);
    const senX2 = xAt(24);
    const senY2 = yAt(sen[24]);

    let line2005Svg = "";
    if (state.show2005Line && vData.robustness2005) {
      const s2005 = vData.robustness2005.senLine2005;
      line2005Svg = `
        <line x1="${xAt(5).toFixed(1)}" y1="${yAt(s2005[0]).toFixed(1)}" x2="${xAt(24).toFixed(1)}" y2="${yAt(s2005[s2005.length - 1]).toFixed(1)}" stroke="#FFFBEF" stroke-width="6.5"/>
        <line x1="${xAt(5).toFixed(1)}" y1="${yAt(s2005[0]).toFixed(1)}" x2="${xAt(24).toFixed(1)}" y2="${yAt(s2005[s2005.length - 1]).toFixed(1)}" stroke="#1F3A36" stroke-width="3.2" stroke-dasharray="6,4"/>`;
    }

    const pts = vals.map((v, i) => [xAt(i), yAt(v)]);
    const fullCurve = buildSmoothSvgPath(pts);

    const fIdx = clamp(yearFloat - 2000, 0, 24);
    const playX = xAt(fIdx);
    const playVal = sampleSeriesAtYear(vals, yearFloat);
    const playY = yAt(playVal);
    const playSenVal = sampleSeriesAtYear(sen, yearFloat);
    const playSenY = yAt(playSenVal);

    const dotsSvg = pts
      .map((pt, i) => {
        const reached = i <= Math.ceil(fIdx);
        return `<circle cx="${pt[0].toFixed(1)}" cy="${pt[1].toFixed(1)}" r="${reached ? "5.2" : "4"}" fill="${reached ? lineColor : "#E2D5B0"}" stroke="#FFFBEF" stroke-width="2"/>`;
      })
      .join("");

    let xTicks = "";
    for (let y = 2000; y <= 2024; y += 2) {
      xTicks += `<text x="${xAt(y - 2000).toFixed(1)}" y="${H - 12}" text-anchor="middle" fill="#1F3A36" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700">${y}</text>`;
    }

    const badgeX = clamp(playX - 88, padL, W - padR - 176);

    return `
      <svg viewBox="0 0 ${W} ${H}" aria-label="Full-width annual trend graph with integrated animated SVG scene">
        <defs>
          <clipPath id="full-warm-clip">
            <rect x="0" y="0" width="${playX.toFixed(1)}" height="${H}"/>
          </clipPath>
        </defs>
        <rect width="${W}" height="${H}" fill="#FFFBEF"/>
        <rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" rx="12" fill="${regionColors.softBg}" opacity="0.45"/>
        ${bgSceneSvg}
        ${gridSvg}
        <path d="${ciPolygon}" fill="${regionColors.primary}" opacity="0.13"/>
        <path d="${fullCurve}" fill="none" stroke="#FFFBEF" stroke-width="7" opacity="0.7"/>
        <path d="${fullCurve}" fill="none" stroke="#4B5F5A" stroke-width="2.4" stroke-opacity="0.38"/>
        <g clip-path="url(#full-warm-clip)">
          <path d="${fullCurve}" fill="none" stroke="#FFFBEF" stroke-width="9.5" stroke-linecap="round"/>
          <path d="${fullCurve}" fill="none" stroke="${lineColor}" stroke-width="4.6" stroke-linecap="round"/>
        </g>
        <line x1="${senX1.toFixed(1)}" y1="${senY1.toFixed(1)}" x2="${senX2.toFixed(1)}" y2="${senY2.toFixed(1)}" stroke="#FFFBEF" stroke-width="6.5"/>
        <line x1="${senX1.toFixed(1)}" y1="${senY1.toFixed(1)}" x2="${senX2.toFixed(1)}" y2="${senY2.toFixed(1)}" stroke="${senColor}" stroke-width="3.4" stroke-dasharray="9,5"/>
        ${line2005Svg}
        ${dotsSvg}
        <line x1="${playX.toFixed(1)}" y1="${padT}" x2="${playX.toFixed(1)}" y2="${padT + plotH}" stroke="#1F3A36" stroke-width="2" stroke-dasharray="4,4"/>
        <circle cx="${playX.toFixed(1)}" cy="${playSenY.toFixed(1)}" r="5.5" fill="${senColor}" stroke="#FFFBEF" stroke-width="2"/>
        <circle cx="${playX.toFixed(1)}" cy="${playY.toFixed(1)}" r="12" fill="${lineColor}" opacity="0.24"/>
        <circle cx="${playX.toFixed(1)}" cy="${playY.toFixed(1)}" r="7.5" fill="${lineColor}" stroke="#FFFBEF" stroke-width="2.5"/>
        <rect x="${badgeX.toFixed(1)}" y="6" width="176" height="26" rx="13" fill="#1F3A36"/>
        <text x="${(badgeX + 88).toFixed(1)}" y="23" text-anchor="middle" fill="#FFFBEF" font-family="Plus Jakarta Sans, sans-serif" font-size="12.5" font-weight="800">
          Year ${Math.round(yearFloat)}: ${playVal.toFixed(varKey === "precipitation_rate" ? 0 : 2)} ${vData.units}
        </text>
        ${xTicks}
      </svg>`;
  }

  /* ==========================================================================
     AI-use notice: Honest, Proportional "Then vs. Now (2000 vs 2024)" Artwork
     ========================================================================== */
  function renderWideBeforeAfterArt(varKey, vData, regionColors) {
    const s = vData.story;
    const v2000 = s.startEst2000;
    const v2024 = s.endEst2024;
    const dec = varKey === "precipitation_rate" ? 0 : 1;
    const pctChange = ((v2024 - v2000) / Math.max(0.1, Math.abs(v2000))) * 100;

    let scaleMax = 40;
    let scaleLabel = "0–40 °C scale";
    if (varKey === "precipitation_rate") {
      scaleMax = Math.ceil((Math.max(v2000, v2024, 500) * 1.25) / 100) * 100;
      scaleLabel = `0–${scaleMax} mm scale`;
    } else if (varKey === "soil_moisture_0_10cm") {
      scaleMax = Math.ceil(Math.max(45, Math.max(v2000, v2024) * 1.25));
      scaleLabel = `0–${scaleMax} kg/m² scale`;
    }

    const tankTop = 54;
    const tankH = 110;
    const tankBot = tankTop + tankH;

    const h2000 = clamp(Math.round((v2000 / scaleMax) * tankH), 8, tankH - 4);
    const h2024 = clamp(Math.round((v2024 / scaleMax) * tankH), 8, tankH - 4);
    const y2000 = tankBot - h2000;
    const y2024 = tankBot - h2024;

    const fill2024 =
      vData.senSlopeDecade >= 0
        ? varKey === "air_temperature_2m"
          ? "#C2410C"
          : "#2A5F8F"
        : "#C2410C";

    const baseFill2000 = varKey === "air_temperature_2m" ? "#D59625" : "#4B5F5A";
    const deltaTop = Math.min(y2000, y2024);
    const deltaH = Math.max(2.5, Math.abs(h2024 - h2000));

    return `
      <svg viewBox="0 0 560 256" aria-hidden="true">
        <rect width="560" height="256" fill="${regionColors.softBg}" opacity="0.5"/>

        <!-- Left Card: Year 2000 -->
        <g transform="translate(30, 18)">
          <rect x="0" y="0" width="162" height="220" rx="16" fill="#FFFBEF" stroke="#E2D5B0" stroke-width="2"/>
          <text x="81" y="25" text-anchor="middle" fill="#4B5F5A" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="800">YEAR 2000</text>
          <text x="81" y="42" text-anchor="middle" fill="#4B5F5A" font-family="JetBrains Mono, monospace" font-size="10" font-weight="600">${scaleLabel}</text>

          <rect x="29" y="${tankTop}" width="104" height="${tankH}" rx="10" fill="#F9EFD4" stroke="#E2D5B0" stroke-width="1.5"/>
          <line x1="29" y1="${tankTop + tankH * 0.25}" x2="36" y2="${tankTop + tankH * 0.25}" stroke="#4B5F5A" stroke-width="1.2" opacity="0.5"/>
          <line x1="29" y1="${tankTop + tankH * 0.5}" x2="38" y2="${tankTop + tankH * 0.5}" stroke="#4B5F5A" stroke-width="1.2" opacity="0.5"/>
          <line x1="29" y1="${tankTop + tankH * 0.75}" x2="36" y2="${tankTop + tankH * 0.75}" stroke="#4B5F5A" stroke-width="1.2" opacity="0.5"/>

          <rect x="33" y="${y2000}" width="96" height="${h2000}" rx="7" fill="${baseFill2000}" opacity="0.72"/>

          <rect x="20" y="178" width="122" height="26" rx="13" fill="#1F3A36"/>
          <text x="81" y="195" text-anchor="middle" fill="#FFFBEF" font-family="Plus Jakarta Sans, sans-serif" font-size="12.5" font-weight="800">${v2000.toFixed(dec)} ${vData.units}</text>
        </g>

        <!-- Center Change Connector Badge -->
        <g transform="translate(204, 72)">
          <rect x="0" y="0" width="152" height="106" rx="16" fill="#FFFBEF" stroke="${regionColors.primary}" stroke-width="2.5"/>
          <text x="76" y="24" text-anchor="middle" fill="#4B5F5A" font-family="DM Sans, sans-serif" font-size="11" font-weight="700">NET 25-YR SHIFT</text>
          <text x="76" y="50" text-anchor="middle" fill="${regionColors.primary}" font-family="Plus Jakarta Sans, sans-serif" font-size="17" font-weight="800">
            ${formatSigned(vData.totalChange25yr, dec, vData.units)}
          </text>
          <text x="76" y="70" text-anchor="middle" fill="#4B5F5A" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700">
            (${formatSigned(pctChange, 1, "%")} vs 2000)
          </text>
          <path d="M 38,86 L 108,86" stroke="${regionColors.primary}" stroke-width="3" stroke-linecap="round"/>
          <polygon points="104,81 114,86 104,91" fill="${regionColors.primary}"/>
        </g>

        <!-- Right Card: Year 2024 (With Dashed 2000 Reference Level) -->
        <g transform="translate(368, 18)">
          <rect x="0" y="0" width="162" height="220" rx="16" fill="#FFFBEF" stroke="${fill2024}" stroke-width="2.5"/>
          <text x="81" y="25" text-anchor="middle" fill="${fill2024}" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="800">YEAR 2024</text>
          <text x="81" y="42" text-anchor="middle" fill="#4B5F5A" font-family="JetBrains Mono, monospace" font-size="10" font-weight="600">${scaleLabel}</text>

          <rect x="29" y="${tankTop}" width="104" height="${tankH}" rx="10" fill="#F9EFD4" stroke="#E2D5B0" stroke-width="1.5"/>
          <line x1="29" y1="${tankTop + tankH * 0.25}" x2="36" y2="${tankTop + tankH * 0.25}" stroke="#4B5F5A" stroke-width="1.2" opacity="0.5"/>
          <line x1="29" y1="${tankTop + tankH * 0.5}" x2="38" y2="${tankTop + tankH * 0.5}" stroke="#4B5F5A" stroke-width="1.2" opacity="0.5"/>
          <line x1="29" y1="${tankTop + tankH * 0.75}" x2="36" y2="${tankTop + tankH * 0.75}" stroke="#4B5F5A" stroke-width="1.2" opacity="0.5"/>

          <rect x="33" y="${y2024}" width="96" height="${h2024}" rx="7" fill="${fill2024}" opacity="0.78"/>
          <rect x="33" y="${deltaTop}" width="96" height="${deltaH}" fill="${fill2024}"/>
          <line x1="25" y1="${y2000}" x2="137" y2="${y2000}" stroke="#1F3A36" stroke-width="2" stroke-dasharray="4,3"/>

          <rect x="20" y="178" width="122" height="26" rx="13" fill="${fill2024}"/>
          <text x="81" y="195" text-anchor="middle" fill="#FFFBEF" font-family="Plus Jakarta Sans, sans-serif" font-size="12.5" font-weight="800">${v2024.toFixed(dec)} ${vData.units}</text>
        </g>
      </svg>`;
  }

  /* ==========================================================================
     AI-use notice: Section 02 Visual Artwork — Mathematically Bounded Wave
     (Fixes Screenshot 5 where the wave overflowed and bottom text clipped!)
     ========================================================================== */
  function renderWideSignalDialArt(vData, regionColors) {
    const isSig = vData.significantFdr;
    const isBorderline = !isSig && vData.qValue <= 0.1;
    const activeZone = isSig ? 3 : isBorderline ? 2 : 1;
    const slopeUp = vData.senSlopeDecade >= 0;

    // 1. Bounded wave for Box A ("Normal Weather Swings"): strictly stays within y = 41..67
    const waveAPts = [];
    for (let i = 0; i <= 12; i++) {
      const x = 22 + (i / 12) * 188;
      const y = 54 + Math.sin(i * 1.15) * 12;
      waveAPts.push([x, y]);
    }
    const waveAPath = buildSmoothSvgPath(waveAPts);

    // 2. Bounded trend + gentle wave for Box B ("Real 25-Year Climate Shift"): strictly within y = 34..74
    const waveBPts = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = 22 + t * 188;
      const baseLineY = slopeUp ? lerp(70, 36, t) : lerp(36, 70, t);
      const y = baseLineY + Math.sin(i * 1.25) * 5.5;
      waveBPts.push([x, y]);
    }
    const waveBPath = buildSmoothSvgPath(waveBPts);
    const trendLineB = slopeUp
      ? `<line x1="22" y1="70" x2="210" y2="36" stroke="${regionColors.primary}" stroke-width="2.6" stroke-dasharray="5,4"/>`
      : `<line x1="22" y1="36" x2="210" y2="70" stroke="${regionColors.primary}" stroke-width="2.6" stroke-dasharray="5,4"/>`;

    return `
      <svg viewBox="0 0 560 256" aria-hidden="true">
        <rect width="560" height="256" fill="${regionColors.softBg}" opacity="0.5"/>
        <rect x="18" y="14" width="524" height="228" rx="18" fill="#FFFBEF" stroke="#E2D5B0" stroke-width="2"/>

        <!-- Top Visual Comparison: How We Tell Weather Apart From Climate -->
        <g transform="translate(36, 26)">
          <!-- Left Mini Diagram: Normal Weather Ups & Downs -->
          <rect x="0" y="0" width="232" height="106" rx="12" fill="${!isSig ? "#F3E8CF" : "#F9EFD4"}" stroke="${!isSig ? "#1F3A36" : "#E2D5B0"}" stroke-width="${!isSig ? "2.5" : "1.5"}"/>
          <text x="116" y="21" text-anchor="middle" fill="#4B5F5A" font-family="Plus Jakarta Sans, sans-serif" font-size="11" font-weight="800">
            A. NORMAL WEATHER SWINGS
          </text>
          <line x1="22" y1="54" x2="210" y2="54" stroke="#4B5F5A" stroke-width="1.8" stroke-dasharray="4,4"/>
          <path d="${waveAPath}" fill="none" stroke="#4B5F5A" stroke-width="3" stroke-linecap="round"/>
          <text x="116" y="93" text-anchor="middle" fill="#4B5F5A" font-family="DM Sans, sans-serif" font-size="11" font-weight="700">
            Bounces up &amp; down, stays flat overall
          </text>

          <!-- Right Mini Diagram: Real 25-Year Climate Trend -->
          <g transform="translate(256, 0)">
            <rect x="0" y="0" width="232" height="106" rx="12" fill="${isSig ? regionColors.softBg : "#F9EFD4"}" stroke="${isSig ? regionColors.primary : "#E2D5B0"}" stroke-width="${isSig ? "2.5" : "1.5"}"/>
            <text x="116" y="21" text-anchor="middle" fill="${regionColors.primary}" font-family="Plus Jakarta Sans, sans-serif" font-size="11" font-weight="800">
              B. REAL 25-YEAR CLIMATE SHIFT
            </text>
            ${trendLineB}
            <path d="${waveBPath}" fill="none" stroke="${regionColors.primary}" stroke-width="3.2" stroke-linecap="round"/>
            <text x="116" y="93" text-anchor="middle" fill="#1F3A36" font-family="DM Sans, sans-serif" font-size="11" font-weight="700">
              Steady 25-year climb or drop over time
            </text>
          </g>
        </g>

        <!-- Middle 3-Step Plain-Language Verdict Meter -->
        <g transform="translate(36, 144)">
          <rect x="0" y="0" width="154" height="40" rx="10" fill="${activeZone === 1 ? "#1F3A36" : "#F9EFD4"}" stroke="#E2D5B0" stroke-width="1.5"/>
          <text x="77" y="25" text-anchor="middle" fill="${activeZone === 1 ? "#FFFBEF" : "#4B5F5A"}" font-family="Plus Jakarta Sans, sans-serif" font-size="11.5" font-weight="800">
            Just Normal Swings
          </text>

          <rect x="167" y="0" width="154" height="40" rx="10" fill="${activeZone === 2 ? "#D59625" : "#F9EFD4"}" stroke="#E2D5B0" stroke-width="1.5"/>
          <text x="244" y="25" text-anchor="middle" fill="${activeZone === 2 ? "#FFFBEF" : "#4B5F5A"}" font-family="Plus Jakarta Sans, sans-serif" font-size="11.5" font-weight="800">
            Early Shifting Clue
          </text>

          <rect x="334" y="0" width="154" height="40" rx="10" fill="${activeZone === 3 ? regionColors.primary : "#F9EFD4"}" stroke="#E2D5B0" stroke-width="1.5"/>
          <text x="411" y="25" text-anchor="middle" fill="${activeZone === 3 ? "#FFFBEF" : "#4B5F5A"}" font-family="Plus Jakarta Sans, sans-serif" font-size="11.5" font-weight="800">
            Proven 25-Yr Trend
          </text>
        </g>

        <!-- Bottom Well-Fitted Verdict Pill (Zero Overflow) -->
        <rect x="36" y="196" width="488" height="32" rx="9" fill="${isSig ? regionColors.softBg : "#F9EFD4"}" stroke="${isSig ? regionColors.primary : "#E2D5B0"}" stroke-width="1.5"/>
        <text x="280" y="216" text-anchor="middle" fill="#1F3A36" font-family="Plus Jakarta Sans, sans-serif" font-size="11.5" font-weight="800">
          Verdict: ${vData.story.verdictHuman} · ${vData.story.signalTag}
        </text>
      </svg>`;
  }

  /* ==========================================================================
     AI-use notice: Section 03 Visual Artwork — Intuitive 2-Timeline Comparison
     (Fixes Screenshot 6 text overflow and replaces unicode arrows with SVG!)
     ========================================================================== */
  function renderWideRecentCompassArt(varKey, vData, regionColors) {
    const sFull = vData.senSlopeDecade;
    const s2005 = vData.robustness2005.senSlopeDecade;
    const dec = varKey === "precipitation_rate" ? 1 : 2;
    const sameSign = vData.robustness2005.sameSign;

    const conclusionBannerText = sameSign
      ? "Both periods move in the same direction — the trend continues in recent years"
      : "Direction shifts after 2005 — early 2000–2004 years drove most of the change";

    return `
      <svg viewBox="0 0 560 256" aria-hidden="true">
        <rect width="560" height="256" fill="${regionColors.softBg}" opacity="0.5"/>
        <rect x="18" y="14" width="524" height="228" rx="18" fill="#FFFBEF" stroke="#E2D5B0" stroke-width="2"/>

        <text x="280" y="38" text-anchor="middle" fill="#4B5F5A" font-family="Plus Jakarta Sans, sans-serif" font-size="11" font-weight="800" letter-spacing="0.05em">
          COMPARING TWO TIMELINES: DID THE CHANGE CONTINUE AFTER 2005?
        </text>

        <!-- Timeline 1: Full 25 Years (2000 to 2024) -->
        <g transform="translate(36, 52)">
          <text x="0" y="15" fill="#1F3A36" font-family="Plus Jakarta Sans, sans-serif" font-size="12" font-weight="800">
            1. Full 25-Year Record (2000 – 2024)
          </text>
          <rect x="0" y="24" width="312" height="36" rx="10" fill="#2A5F8F"/>
          <text x="16" y="47" fill="#FFFBEF" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700">2000</text>
          <line x1="60" y1="42" x2="246" y2="42" stroke="#FFFBEF" stroke-width="2" stroke-dasharray="4,4" opacity="0.8"/>
          <text x="260" y="47" fill="#FFFBEF" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700">2024</text>

          <rect x="324" y="24" width="164" height="36" rx="10" fill="#F9EFD4" stroke="#2A5F8F" stroke-width="2"/>
          <text x="406" y="47" text-anchor="middle" fill="#1F3A36" font-family="JetBrains Mono, monospace" font-size="11.5" font-weight="700">
            ${formatSigned(sFull, dec, vData.units + "/dec")}
          </text>
        </g>

        <!-- Timeline 2: Skipping 2000-2004 (2005 to 2024) -->
        <g transform="translate(36, 120)">
          <text x="0" y="15" fill="#1F3A36" font-family="Plus Jakarta Sans, sans-serif" font-size="12" font-weight="800">
            2. Recent 20 Years Only (Skipping 2000–2004)
          </text>
          <rect x="0" y="24" width="66" height="36" rx="8" fill="#F9EFD4" stroke="#E2D5B0" stroke-width="1.5" stroke-dasharray="4,3"/>
          <text x="33" y="40" text-anchor="middle" fill="#4B5F5A" font-family="DM Sans, sans-serif" font-size="9.5" font-weight="700">2000–04</text>
          <text x="33" y="52" text-anchor="middle" fill="#4B5F5A" font-family="DM Sans, sans-serif" font-size="9.5" font-weight="700">Skipped</text>

          <rect x="72" y="24" width="240" height="36" rx="10" fill="${regionColors.primary}"/>
          <text x="88" y="47" fill="#FFFBEF" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700">2005</text>
          <line x1="134" y1="42" x2="246" y2="42" stroke="#FFFBEF" stroke-width="2" stroke-dasharray="4,4" opacity="0.8"/>
          <text x="260" y="47" fill="#FFFBEF" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700">2024</text>

          <rect x="324" y="24" width="164" height="36" rx="10" fill="#F9EFD4" stroke="${regionColors.primary}" stroke-width="2"/>
          <text x="406" y="47" text-anchor="middle" fill="#1F3A36" font-family="JetBrains Mono, monospace" font-size="11.5" font-weight="700">
            ${formatSigned(s2005, dec, vData.units + "/dec")}
          </text>
        </g>

        <!-- Bottom Verdict Banner (Well-proportioned, zero overflow) -->
        <rect x="32" y="194" width="496" height="34" rx="10" fill="${sameSign ? regionColors.softBg : "#F3E8CF"}" stroke="${sameSign ? regionColors.primary : "#D59625"}" stroke-width="1.5"/>
        <text x="280" y="215" text-anchor="middle" fill="#1F3A36" font-family="Plus Jakarta Sans, sans-serif" font-size="11.2" font-weight="800">
          ${conclusionBannerText}
        </text>
      </svg>`;
  }

  /* ==========================================================================
     AI-use notice: Persistent Studio Shell on Page 2 (So Variable, Chart Mode,
     and Speed Gliders Slide Smoothly Without Destroying Their DOM!)
     ========================================================================== */
  function initStudioShellOnce() {
    const studioEl = document.getElementById("single-variable-studio");
    if (!studioEl || state.studioShellInitialized) return;

    studioEl.innerHTML = `
      <!-- Top Region Identity & Single-Rectangle Reactive Variable Switcher -->
      <div class="region-data-top-banner">
        <div class="region-banner-row">
          <div class="region-identity-left">
            <div class="region-mini-emblem" id="data-region-emblem"></div>
            <div class="region-identity-titles">
              <span class="region-identity-kicker">Active Study Region · 2000–2024</span>
              <h1 class="region-identity-h1" id="data-region-h1"></h1>
              <p class="region-identity-sub" id="data-region-sub"></p>
            </div>
          </div>
          <button type="button" class="change-region-Action-btn" data-goto-page="selector">
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
              <ellipse cx="10" cy="10" rx="3.6" ry="7.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <line x1="2.8" y1="10" x2="17.2" y2="10" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <span>Change Region (6 Regions)</span>
          </button>
        </div>

        <!-- Single Unified Rectangle Variable Switcher with Sliding Glider -->
        <nav class="unified-var-switcher" id="data-var-switcher" style="--var-idx: 0;" role="tablist" aria-label="Switch climate variable">
        </nav>
      </div>

      <!-- Full-Width Integrated SVG Graph Card -->
      <div class="fullwidth-graph-card" id="graph-studio-anchor">
        <header class="studio-header">
          <div class="studio-title-group">
            <div class="studio-badge-svg" id="studio-var-badge-svg"></div>
            <div>
              <h2 class="studio-question" id="studio-question-title"></h2>
              <p class="studio-subtitle" id="studio-question-subtitle"></p>
            </div>
          </div>
          <div class="studio-controls-right">
            <!-- Single Unified Rectangle for Chart Mode with Sliding Glider -->
            <div class="mode-pill-group" id="chart-mode-switcher" style="--mode-idx: 0;" role="tablist" aria-label="Chart display mode">
              <span class="mode-glider" aria-hidden="true"></span>
              <button type="button" class="mode-pill-btn active" data-chart-mode="annual">
                <svg viewBox="0 0 18 18" aria-hidden="true">
                  <path d="M2 13L7 8l4 3 5-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Yearly Trend (2000–2024)</span>
              </button>
              <button type="button" class="mode-pill-btn" data-chart-mode="seasonal">
                <svg viewBox="0 0 18 18" aria-hidden="true">
                  <path d="M2 10Q5.5 3 9 10T16 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>Monthly Seasons (Jan–Dec)</span>
              </button>
              <button type="button" class="mode-pill-btn" data-chart-mode="anomaly">
                <svg viewBox="0 0 18 18" aria-hidden="true">
                  <line x1="2" y1="9" x2="16" y2="9" stroke="currentColor" stroke-width="1.6"/>
                  <rect x="4" y="4" width="2.5" height="5" fill="currentColor"/>
                  <rect x="8" y="9" width="2.5" height="5" fill="currentColor"/>
                  <rect x="12" y="5" width="2.5" height="4" fill="currentColor"/>
                </svg>
                <span>Above / Below Avg Bars</span>
              </button>
            </div>
          </div>
        </header>

        <div class="soft-regional-stage">
          <div class="fullwidth-graph-frame">
            <div class="graph-top-hud">
              <div class="graph-legend-items" id="graph-legend-items"></div>
              <div class="live-hud-metrics">
                <span class="hud-pill primary" id="hud-obs-pill">2024: --</span>
                <span class="hud-pill" id="hud-anom-pill">vs 25-Yr Avg: --</span>
              </div>
            </div>

            <!-- Full-Width Integrated SVG Graph + Animated Background Scene -->
            <div class="graph-canvas-wrap" id="graph-canvas-wrap" data-scrub-graph></div>

            <!-- Year Evolution Bar + Play Speed Selector Positioned Directly Below the Graph -->
            <div class="graph-year-evolution-bar">
              <button type="button" class="play-evolution-btn" data-toggle-play>
                <span id="play-btn-icon">${getPlayPauseSvg(false)}</span>
                <span id="play-btn-text">Play Years (2000–2024)</span>
              </button>

              <div class="evolution-slider-col">
                <input
                  type="range"
                  class="evolution-range-input"
                  id="year-evolution-slider"
                  min="2000"
                  max="2024"
                  step="0.05"
                  value="${state.targetYear}"
                  aria-label="Year evolution slider from 2000 to 2024"
                />
                <div class="evolution-year-ticks">
                  <span>2000</span>
                  <span>2004</span>
                  <span>2008</span>
                  <span>2012</span>
                  <span>2016</span>
                  <span>2020</span>
                  <span>2024</span>
                </div>
              </div>

              <!-- Unified Single-Rectangle Speed Selector -->
              <div class="evolution-speed-wrap" aria-label="Playback speed">
                <span class="speed-label">Speed</span>
                <div class="speed-pill-group" id="play-speed-switcher" style="--speed-idx: ${state.speedIdx};">
                  <span class="speed-glider" aria-hidden="true"></span>
                  ${SPEED_OPTIONS.map(
                    (sp, idx) => `
                    <button type="button" class="speed-pill-btn ${idx === state.speedIdx ? "active" : ""}" data-speed-idx="${idx}">
                      ${sp.label}
                    </button>`
                  ).join("")}
                </div>
              </div>

              <div class="evolution-active-badge" id="evolution-active-badge">
                Year 2024
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dynamic 3 Wide Story Cards + Redesigned NASA Satellite Data & Reference Passport -->
      <div class="wide-stories-stack" id="dynamic-stories-and-passport"></div>
    `;

    state.studioShellInitialized = true;
  }

  function renderStudioContent() {
    initStudioShellOnce();

    const region = DATA.regions[state.regionId];
    const vMeta = DATA.variableMeta[state.activeVar];
    const vData = region.variables[state.activeVar];
    const story = vData.story;
    const dec = state.activeVar === "precipitation_rate" ? 1 : 2;
    const lineColor = state.activeVar === "precipitation_rate" ? "#2A5F8F" : region.colors.primary;

    // 1. Update Top Region Banner & Reactive Single-Rectangle Variable Switcher in-place
    const emblemEl = document.getElementById("data-region-emblem");
    const h1El = document.getElementById("data-region-h1");
    const subEl = document.getElementById("data-region-sub");
    if (emblemEl) emblemEl.innerHTML = getRegionMiniNodeSvg(state.regionId);
    if (h1El) h1El.textContent = region.fullName;
    if (subEl) subEl.textContent = `${region.landmarkLabel} · ${region.climateTag}`;

    const dataVarSwitcher = document.getElementById("data-var-switcher");
    syncUnifiedVarSwitcherDom(dataVarSwitcher, region);

    // 2. Update Studio Graph Header & Reactive Single-Rectangle Chart Mode Switcher in-place
    const badgeSvgEl = document.getElementById("studio-var-badge-svg");
    const qTitleEl = document.getElementById("studio-question-title");
    const qSubEl = document.getElementById("studio-question-subtitle");
    if (badgeSvgEl) badgeSvgEl.innerHTML = getVariableIconSvg(state.activeVar);
    if (qTitleEl) qTitleEl.textContent = `${vMeta.questionTitle} (${region.name})`;
    if (qSubEl) qSubEl.textContent = vMeta.simpleWhatItIs;

    const modeSwitcher = document.getElementById("chart-mode-switcher");
    if (modeSwitcher) {
      const mIdx = Math.max(0, MODE_ORDER.indexOf(state.chartMode));
      modeSwitcher.style.setProperty("--mode-idx", String(mIdx));
      modeSwitcher.querySelectorAll("[data-chart-mode]").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-chart-mode") === state.chartMode);
      });
    }

    const legendEl = document.getElementById("graph-legend-items");
    if (legendEl) {
      legendEl.innerHTML = `
        <span class="g-legend-item">
          <span class="g-swatch-line" style="background:${lineColor}"></span>
          <span>Observed (${vData.units})</span>
        </span>
        <span class="g-legend-item">
          <span class="g-swatch-line" style="background:#C2410C"></span>
          <span>25-Yr Trend (${formatSigned(vData.senSlopeDecade, dec, vMeta.slopeUnitDisplay)})</span>
        </span>
        <span class="g-legend-item">
          <span class="g-swatch-band" style="background:${region.colors.primary}; opacity:0.25"></span>
          <span>95% Confidence Range</span>
        </span>
      `;
    }

    // 3. Render the 3 Wide Story Cards + Redesigned NASA Satellite Data & Reference Passport
    const storiesContainer = document.getElementById("dynamic-stories-and-passport");
    if (!storiesContainer) return;

    const fullCitationString = `${vData.provenance.citationAuthor || vMeta.citationAuthor}. ${vData.provenance.citationTitle || vMeta.citationTitle}. https://doi.org/${vData.provenance.doi}`;

    storiesContainer.innerHTML = `
      <!-- SECTION 01: Then vs. Now (Honest 0-Based Scale) -->
      <section class="wide-story-section">
        <div class="wide-story-copy">
          <div class="wide-story-kicker">
            <span class="story-step-pill">01 · Then vs. Now (2000 vs. 2024)</span>
            <span class="story-tag-pill">${story.statusPill}</span>
          </div>
          <h3 class="wide-story-headline">${story.headline}</h3>
          <p class="wide-story-body">${story.story}</p>
          <div class="story-key-takeaway-pills">
            <div class="takeaway-chip">
              <span class="takeaway-chip-label">Typical in 2000</span>
              <span class="takeaway-chip-val">${story.startEst2000.toFixed(dec)} ${vData.units}</span>
            </div>
            <div class="takeaway-chip">
              <span class="takeaway-chip-label">Typical in 2024</span>
              <span class="takeaway-chip-val">${story.endEst2024.toFixed(dec)} ${vData.units}</span>
            </div>
            <div class="takeaway-chip">
              <span class="takeaway-chip-label">25-Year Average</span>
              <span class="takeaway-chip-val">${vData.meanAnnual.toFixed(dec)} ${vData.units}</span>
            </div>
          </div>
        </div>
        <div class="wide-story-art">
          ${renderWideBeforeAfterArt(state.activeVar, vData, region.colors)}
        </div>
      </section>

      <!-- SECTION 02: Real Trend vs. Normal Weather (Bounded Wave & Zero Statistical Jargon) -->
      <section class="wide-story-section">
        <div class="wide-story-copy">
          <div class="wide-story-kicker">
            <span class="story-step-pill">02 · Real Shift or Normal Weather?</span>
            <span class="story-tag-pill">${story.signalTag}</span>
          </div>
          <h3 class="wide-story-headline">${story.signalLabel}</h3>
          <p class="wide-story-body">${story.whyConfident}</p>
          <div class="story-key-takeaway-pills">
            <div class="takeaway-chip">
              <span class="takeaway-chip-label">What We Found</span>
              <span class="takeaway-chip-val">${story.verdictHuman}</span>
            </div>
            <div class="takeaway-chip">
              <span class="takeaway-chip-label">Certainty Level</span>
              <span class="takeaway-chip-val">${story.confidenceHuman}</span>
            </div>
            <div class="takeaway-chip">
              <span class="takeaway-chip-label">Observations Checked</span>
              <span class="takeaway-chip-val">300 Monthly Records</span>
            </div>
          </div>
        </div>
        <div class="wide-story-art">
          ${renderWideSignalDialArt(vData, region.colors)}
        </div>
      </section>

      <!-- SECTION 03: Full 25 Years vs. Last 20 Years (Crystal-Clear Explanation) -->
      <section class="wide-story-section">
        <div class="wide-story-copy">
          <div class="wide-story-kicker">
            <span class="story-step-pill">03 · Still Happening in Recent Years?</span>
            <span class="story-tag-pill">2000–2024 vs. 2005–2024</span>
          </div>
          <h3 class="wide-story-headline">${story.recentTitle}</h3>
          <p class="wide-story-body">${story.recentBody}</p>
          <div class="story-key-takeaway-pills">
            <div class="takeaway-chip">
              <span class="takeaway-chip-label">Full 25-Yr Pace (2000–2024)</span>
              <span class="takeaway-chip-val">${formatSigned(vData.senSlopeDecade, dec, vMeta.slopeUnitDisplay)}</span>
            </div>
            <div class="takeaway-chip">
              <span class="takeaway-chip-label">Recent 20-Yr Pace (2005–2024)</span>
              <span class="takeaway-chip-val">${formatSigned(vData.robustness2005.senSlopeDecade, dec, vMeta.slopeUnitDisplay)}</span>
            </div>
            <div class="takeaway-chip">
              <span class="takeaway-chip-label">Takeaway</span>
              <span class="takeaway-chip-val">${story.recentConclusion}</span>
            </div>
          </div>
          <button type="button" class="inline-toggle-2005 ${state.show2005Line ? "active" : ""}" id="btn-toggle-2005">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M2 12L6 7l3 2 5-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>${state.show2005Line ? "Showing 2005–2024 line on graph (Click to hide)" : "Overlay 2005–2024 line on graph"}</span>
          </button>
        </div>
        <div class="wide-story-art">
          ${renderWideRecentCompassArt(state.activeVar, vData, region.colors)}
        </div>
      </section>

      <!-- REDESIGNED NASA SATELLITE DATA & REFERENCE PASSPORT -->
      <section class="nasa-passport-card" aria-label="NASA satellite data and reference passport">
        <div class="passport-banner">
          <div class="passport-brand-left">
            <div class="passport-emblem-svg">${getSatelliteBiblioSvg(region.colors.primary)}</div>
            <div>
              <span class="passport-kicker">Verified NASA Earth Observation Passport</span>
              <h3 class="passport-title">NASA Satellite Data &amp; Reference</h3>
            </div>
          </div>
          <div class="passport-actions">
            <button type="button" class="passport-copy-btn" data-copy-citation="${fullCitationString.replace(/"/g, "&quot;")}">
              <svg viewBox="0 0 18 18" width="15" height="15" aria-hidden="true">
                <rect x="6" y="6" width="9" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/>
                <path d="M12 6V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2" fill="none" stroke="currentColor" stroke-width="1.7"/>
              </svg>
              <span id="copy-citation-label">Copy Citation</span>
            </button>
            <a class="passport-doi-btn" href="https://doi.org/${vData.provenance.doi}" target="_blank" rel="noopener noreferrer">
              <span>Official NASA DOI</span>
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path d="M5 11L11 5M6 5h5v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </div>
        </div>

        <div class="passport-body">
          <div class="passport-pillars-grid">
            <div class="passport-pillar">
              <div class="pillar-icon-box" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </div>
              <div class="pillar-copy">
                <span class="pillar-label">Mission &amp; Sensor</span>
                <span class="pillar-value">${vMeta.sensorTag}</span>
                <span class="pillar-sub">${vData.provenance.source} · 300 monthly records (2000–2024)</span>
              </div>
            </div>

            <div class="passport-pillar">
              <div class="pillar-icon-box" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="3" y1="15" x2="21" y2="15"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                  <line x1="15" y1="3" x2="15" y2="21"/>
                </svg>
              </div>
              <div class="pillar-copy">
                <span class="pillar-label">Observation Grid</span>
                <span class="pillar-value">${region.fullName} (${region.bbox.coordLabel})</span>
                <span class="pillar-sub">${vData.provenance.gridCells} satellite grid cells · ${vData.provenance.cellKm} spatial resolution</span>
              </div>
            </div>

            <div class="passport-pillar">
              <div class="pillar-icon-box" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                  <polyline points="16 7 22 7 22 13"/>
                </svg>
              </div>
              <div class="pillar-copy">
                <span class="pillar-label">Verification Protocol</span>
                <span class="pillar-value">Sen’s Slope &amp; Mann–Kendall</span>
                <span class="pillar-sub">Benjamini–Hochberg (1995) false-discovery filter across all 18 series</span>
              </div>
            </div>
          </div>

          <div class="passport-citation-strip">
            <div class="citation-strip-left">
              <span class="citation-strip-tag">Dataset Citation</span>
              <span>
                <strong>${vData.provenance.citationAuthor || vMeta.citationAuthor}.</strong>
                ${vData.provenance.citationTitle || vMeta.citationTitle}.
              </span>
            </div>
            <a class="citation-doi-pill" href="https://doi.org/${vData.provenance.doi}" target="_blank" rel="noopener noreferrer">
              doi.org/${vData.provenance.doi}
            </a>
          </div>
        </div>
      </section>
    `;
  }

  function syncTopNavTabs() {
    const navTabs = document.getElementById("header-page-tabs");
    const tabSelector = document.getElementById("nav-tab-selector");
    const tabData = document.getElementById("nav-tab-data");
    const pageIdx = state.activePage === "selector" ? 0 : 1;

    if (navTabs) navTabs.style.setProperty("--page-idx", String(pageIdx));
    if (tabSelector) tabSelector.classList.toggle("active", state.activePage === "selector");
    if (tabData) tabData.classList.toggle("active", state.activePage === "data");
  }

  function setPageView(nextPage, scrollTop) {
    state.activePage = nextPage === "selector" ? "selector" : "data";
    document.body.setAttribute("data-page", state.activePage);

    const header = document.getElementById("explorer-header");
    if (header) header.classList.remove("nav-hidden");

    syncTopNavTabs();

    const url = new URL(window.location.href);
    url.searchParams.set("region", state.regionId);
    url.searchParams.set("var", state.activeVar);
    url.searchParams.set("page", state.activePage);
    window.history.replaceState({}, "", url);

    if (scrollTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function updatePage(animateTransition) {
    const region = DATA.regions[state.regionId];
    const vMeta = DATA.variableMeta[state.activeVar];

    document.body.setAttribute("data-region", state.regionId);
    document.body.setAttribute("data-page", state.activePage);
    document.title =
      state.activePage === "selector"
        ? `Select a Study Region (${region.name}) · Atlalli`
        : `${region.name} · ${vMeta.shortLabel} · Atlalli`;

    syncTopNavTabs();

    const url = new URL(window.location.href);
    url.searchParams.set("region", state.regionId);
    url.searchParams.set("var", state.activeVar);
    url.searchParams.set("page", state.activePage);
    window.history.replaceState({}, "", url);

    const headerBadge = document.getElementById("header-region-name");
    if (headerBadge) {
      headerBadge.textContent = `2. View Graphs: ${region.name} · ${vMeta.shortLabel}`;
    }

    updateCircularWheelSelection(animateTransition);
    renderStudioContent();
    updateDynamicVisuals();
  }

  /* ==========================================================================
     60fps Frame Updater
     ========================================================================== */
  function updateDynamicVisuals() {
    const region = DATA.regions[state.regionId];
    if (!region) return;
    const vData = region.variables[state.activeVar];
    const yFloat = state.currentYearFloat;
    const yInt = Math.round(yFloat);
    const dec = state.activeVar === "precipitation_rate" ? 0 : 2;

    if (state.activePage === "selector") {
      const hubWrap = document.getElementById("hub-svg-wrap");
      if (hubWrap) {
        hubWrap.innerHTML = renderAnimatedHubRegionSvg(state.regionId, state.phaseTime);
      }
      return;
    }

    const obsVal = sampleSeriesAtYear(vData.annualValues, yFloat);
    const anomVal = obsVal - vData.meanAnnual;

    const hudObs = document.getElementById("hud-obs-pill");
    if (hudObs) hudObs.textContent = `Year ${yInt}: ${obsVal.toFixed(dec)} ${vData.units}`;

    const hudAnom = document.getElementById("hud-anom-pill");
    if (hudAnom) hudAnom.textContent = `vs 25-Yr Avg: ${formatSigned(anomVal, dec, vData.units)}`;

    const evoBadge = document.getElementById("evolution-active-badge");
    if (evoBadge) evoBadge.textContent = `${yInt} · ${obsVal.toFixed(dec)} ${vData.units}`;

    const playIcon = document.getElementById("play-btn-icon");
    const playTxt = document.getElementById("play-btn-text");
    if (playIcon) playIcon.innerHTML = getPlayPauseSvg(state.playing);
    if (playTxt) playTxt.textContent = state.playing ? "Pause Evolution" : "Play Years (2000–2024)";

    const slider = document.getElementById("year-evolution-slider");
    if (slider && document.activeElement !== slider) {
      slider.value = yFloat.toFixed(2);
    }

    const graphWrap = document.getElementById("graph-canvas-wrap");
    if (graphWrap) {
      graphWrap.innerHTML = renderIntegratedGraphSvg(
        state.activeVar,
        vData,
        region.colors,
        yFloat,
        state.chartMode,
        state.phaseTime
      );
    }
  }

  function tick(now) {
    const dt = Math.min(0.08, (now - state.lastFrameTs) / 1000);
    state.lastFrameTs = now;
    state.phaseTime += dt;

    if (state.playing && state.activePage === "data") {
      state.targetYear += dt * state.playSpeed;
      if (state.targetYear > 2024) {
        state.targetYear = 2000;
        state.currentYearFloat = 2000;
      }
    }

    const diff = state.targetYear - state.currentYearFloat;
    if (Math.abs(diff) > 0.002) {
      state.currentYearFloat += diff * 0.18;
    } else {
      state.currentYearFloat = state.targetYear;
    }

    updateDynamicVisuals();
    requestAnimationFrame(tick);
  }

  /* ==========================================================================
     Event Listeners
     ========================================================================== */
  function bindEvents() {
    document.addEventListener("click", (e) => {
      // 1. Switch between Independent Pages ("selector" vs "data")
      const pageBtn = e.target.closest("[data-goto-page]");
      if (pageBtn) {
        const targetPage = pageBtn.getAttribute("data-goto-page");
        setPageView(targetPage, true);
        updatePage(false);
        return;
      }

      // 2. Select a Region on the Circular Wheel
      const regBtn = e.target.closest("[data-select-region]");
      if (regBtn) {
        const nextReg = regBtn.getAttribute("data-select-region");
        if (nextReg && DATA.regions[nextReg]) {
          if (nextReg !== state.regionId) {
            state.regionId = nextReg;
            updatePage(true);
          } else {
            setPageView("data", true);
            updatePage(false);
          }
        }
        return;
      }

      // 3. Switch Variable inside the Unified Single-Rectangle Switcher
      const varBtn = e.target.closest("[data-select-var]");
      if (varBtn) {
        const nextVar = varBtn.getAttribute("data-select-var");
        if (nextVar && DATA.variableMeta[nextVar]) {
          if (nextVar !== state.activeVar) {
            state.activeVar = nextVar;
            updatePage(false);
          } else if (state.activePage === "selector") {
            setPageView("data", true);
            updatePage(false);
          }
        }
        return;
      }

      // 4. Switch Chart Mode inside the Unified Single-Rectangle Switcher
      const modeBtn = e.target.closest("[data-chart-mode]");
      if (modeBtn) {
        state.chartMode = modeBtn.getAttribute("data-chart-mode");
        updatePage(false);
        return;
      }

      // 5. Switch Playback Speed inside the Unified Speed Control
      const speedBtn = e.target.closest("[data-speed-idx]");
      if (speedBtn) {
        const sIdx = parseInt(speedBtn.getAttribute("data-speed-idx"), 10);
        if (SPEED_OPTIONS[sIdx]) {
          state.speedIdx = sIdx;
          state.playSpeed = SPEED_OPTIONS[sIdx].value;
          const speedGroup = document.getElementById("play-speed-switcher");
          if (speedGroup) {
            speedGroup.style.setProperty("--speed-idx", String(sIdx));
            speedGroup.querySelectorAll("[data-speed-idx]").forEach((b, i) => {
              b.classList.toggle("active", i === sIdx);
            });
          }
        }
        return;
      }

      // 6. Play / Pause Year Evolution
      const playBtn = e.target.closest("[data-toggle-play]");
      if (playBtn) {
        if (!state.playing && state.targetYear >= 2023.9) {
          state.targetYear = 2000;
          state.currentYearFloat = 2000;
        }
        state.playing = !state.playing;
        return;
      }

      // 7. Copy Citation Button in NASA Data Passport
      const copyBtn = e.target.closest("[data-copy-citation]");
      if (copyBtn) {
        const citation = copyBtn.getAttribute("data-copy-citation");
        const labelEl = document.getElementById("copy-citation-label");
        if (navigator.clipboard && citation) {
          navigator.clipboard.writeText(citation).catch(() => {});
        }
        if (labelEl) {
          labelEl.textContent = "Citation Copied";
          setTimeout(() => {
            labelEl.textContent = "Copy Citation";
          }, 2000);
        }
        return;
      }

      // 8. Toggle 2005-2024 Trend Line Overlay
      const btn2005 = e.target.closest("#btn-toggle-2005");
      if (btn2005) {
        state.show2005Line = !state.show2005Line;
        updatePage(false);
        const anchor = document.getElementById("graph-studio-anchor");
        if (anchor) anchor.scrollIntoView({ behavior: "smooth" });
      }
    });

    document.addEventListener("input", (e) => {
      if (e.target.id === "year-evolution-slider") {
        state.playing = false;
        state.targetYear = parseFloat(e.target.value);
      }
    });

    let draggingGraph = null;
    function scrubGraphAtPointer(e, el) {
      const rect = el.getBoundingClientRect();
      const padLRatio = 68 / 1140;
      const padRRatio = 36 / 1140;
      const left = rect.left + rect.width * padLRatio;
      const width = rect.width * (1 - padLRatio - padRRatio);
      const rel = clamp((e.clientX - left) / Math.max(1, width), 0, 1);
      state.playing = false;
      state.targetYear = 2000 + rel * 24;
    }

    document.addEventListener("pointerdown", (e) => {
      const g = e.target.closest("[data-scrub-graph]");
      if (g) {
        draggingGraph = g;
        scrubGraphAtPointer(e, g);
      }
    });

    window.addEventListener("pointermove", (e) => {
      if (draggingGraph) {
        scrubGraphAtPointer(e, draggingGraph);
      }
    });

    window.addEventListener("pointerup", () => {
      draggingGraph = null;
    });

    // Auto-hide centered top switcher / header on scroll down on BOTH pages
    let lastY = window.scrollY;
    const header = document.getElementById("explorer-header");
    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY;
        if (header) {
          if (y > 64 && y > lastY + 5) {
            header.classList.add("nav-hidden");
          } else if (y < lastY - 5 || y <= 40) {
            header.classList.remove("nav-hidden");
          }
        }
        lastY = y;
      },
      { passive: true }
    );
  }

  resolveInitialState();
  bindEvents();
  updatePage(false);
  requestAnimationFrame(tick);
})();

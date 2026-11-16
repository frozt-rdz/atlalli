// AI-use notice: this file includes AI-generated content and code, reviewed by the team.
// Auto-hide sticky header when scrolling down, reveal when scrolling up
const header = document.querySelector("header");
if (header) {
  let lastScrollY = window.scrollY;
  let ticking = false;

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > lastScrollY + 8 && currentScrollY > 84) {
            header.classList.add("nav-hidden");
          } else if (currentScrollY < lastScrollY - 6 || currentScrollY <= 60) {
            header.classList.remove("nav-hidden");
          }
          lastScrollY = Math.max(0, currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
}

// Set data-pitch-src on .screen when the team supplies its explanatory pitch video.
// It will mount directly inside the right-hand video frame (#pitch-video-slot).
const screen = document.querySelector(".screen");
const videoSlot = document.getElementById("pitch-video-slot");

// Click "Pitch & Explanatory Video" to load and play the video in place.
function mountPitchVideo() {
  const player = document.createElement("video");
  player.controls = true;
  player.playsInline = true;
  player.preload = "auto";
  player.src = screen.dataset.pitchSrc;
  player.setAttribute("aria-label", "The Atlalli project explanatory pitch video");
  if (screen.dataset.captionsSrc) {
    const captions = document.createElement("track");
    captions.kind = "captions";
    captions.srclang = "en";
    captions.label = "English";
    captions.src = screen.dataset.captionsSrc;
    player.append(captions);
  }
  player.className = "pitch-player";
  videoSlot.innerHTML = "";
  videoSlot.append(player);
  screen.classList.add("has-video");
  player.play().catch(() => {});
  player.focus();
}

if (screen && screen.dataset.pitchSrc && videoSlot) {
  const placeholder = videoSlot.querySelector(".video-placeholder");
  if (placeholder) {
    placeholder.style.cursor = "pointer";
    placeholder.addEventListener("click", mountPitchVideo, { once: true });
  }
}

// Always show the Pause/Play motion toggle button across all devices
if (screen) {
  const toggle = screen.querySelector(".weather-toggle");
  let paused = false;
  function updateWeather() {
    screen.toggleAttribute("data-paused", paused);
    document.body.toggleAttribute("data-paused", paused);
    if (toggle) {
      toggle.hidden = false;
      toggle.textContent = paused ? "Play motion" : "Pause motion";
    }
  }
  if (toggle) {
    toggle.addEventListener("click", () => {
      paused = !paused;
      updateWeather();
    });
  }
  updateWeather();
}

// Enable regional card and variable animations across all devices
const cards = document.querySelectorAll(".card");
for (const card of cards) {
  card.dataset.moving = "";
}

if ("IntersectionObserver" in window) {
  const sceneObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.dataset.moving = "";
        } else {
          delete entry.target.dataset.moving;
        }
      }
    },
    { threshold: 0.08 }
  );

  for (const card of cards) {
    sceneObserver.observe(card);
  }

  // Gentle scroll-reveal choreography for sections and cards
  const revealTargets = document.querySelectorAll(
    ".telemetry-strip, .var-panel, .card, .method-card, .repo-card"
  );
  revealTargets.forEach((el, idx) => {
    el.classList.add("reveal");
    if (
      el.classList.contains("var-panel") ||
      el.classList.contains("card") ||
      el.classList.contains("method-card")
    ) {
      el.style.transitionDelay = `${(idx % 3) * 65}ms`;
    }
  });

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
  );

  for (const el of revealTargets) {
    revealObserver.observe(el);
  }
}


// ---- Opening animation (plays once per session, skippable) ----
(function () {
  const intro = document.getElementById("intro");
  if (!intro || intro.hidden) return;
  const video = document.getElementById("intro-video");
  const skip = document.getElementById("intro-skip");
  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    try { sessionStorage.setItem("atlalli-intro", "1"); } catch (e) {}
    intro.classList.add("done");
    document.documentElement.classList.remove("intro-on");
    setTimeout(() => { intro.hidden = true; video.pause(); }, 650);
  }
  video.addEventListener("ended", close);
  video.addEventListener("error", close);
  skip.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" || e.key === "Enter") close();
  });
  const p = video.play();
  if (p && p.catch) p.catch(close);
  setTimeout(close, 9000);
  skip.focus({ preventScroll: true });
})();

// ---- About us: reuse each region's animated scene for its team member ----
document.querySelectorAll(".member[data-region]").forEach((m) => {
  const src = document.querySelector("#" + m.dataset.region + " .card-scene svg");
  const slot = m.querySelector(".member-scene");
  if (src && slot) slot.appendChild(src.cloneNode(true));
});

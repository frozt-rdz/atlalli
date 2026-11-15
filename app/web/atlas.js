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

if (screen && screen.dataset.pitchSrc && videoSlot) {
  const player = document.createElement("video");
  player.controls = true;
  player.playsInline = true;
  player.preload = "metadata";
  player.poster = "pitch-poster.svg#still";
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
  videoSlot.innerHTML = "";
  videoSlot.append(player);
  player.className = "pitch-player";
  screen.classList.add("has-video");
}

if (screen) {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const toggle = screen.querySelector(".weather-toggle");
  let paused = false;
  function updateWeather() {
    screen.toggleAttribute("data-paused", paused);
    if (toggle) {
      toggle.hidden = motion.matches;
      toggle.textContent = paused ? "Play motion" : "Pause motion";
    }
  }
  if (toggle) {
    toggle.addEventListener("click", () => {
      paused = !paused;
      updateWeather();
    });
  }
  motion.addEventListener("change", updateWeather);
  updateWeather();
}

// Respect reduced motion preference across interactive scenes and scroll reveals
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const cards = document.querySelectorAll(".card");

// Keep card vignettes smoothly animated while visible in viewport
if ("IntersectionObserver" in window) {
  const sceneObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (reducedMotion.matches) {
          delete entry.target.dataset.moving;
          continue;
        }
        if (entry.isIntersecting) {
          entry.target.dataset.moving = "";
        } else {
          delete entry.target.dataset.moving;
        }
      }
    },
    { threshold: 0.15 }
  );

  for (const card of cards) {
    sceneObserver.observe(card);
  }

  // Gentle scroll-reveal choreography for sections and cards
  const revealTargets = document.querySelectorAll(
    ".telemetry-strip, .var-panel, .card, .method-card, .repo-card"
  );
  revealTargets.forEach((el, idx) => {
    if (!reducedMotion.matches) {
      el.classList.add("reveal");
      if (
        el.classList.contains("var-panel") ||
        el.classList.contains("card") ||
        el.classList.contains("method-card")
      ) {
        el.style.transitionDelay = `${(idx % 3) * 65}ms`;
      }
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
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  for (const el of revealTargets) {
    revealObserver.observe(el);
  }
} else {
  for (const card of cards) {
    if (!reducedMotion.matches) card.dataset.moving = "";
  }
}

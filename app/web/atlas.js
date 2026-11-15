// Set data-pitch-src on the screen when the team supplies its film.
const screen = document.querySelector(".screen");
if (screen.dataset.pitchSrc) {
  const player = document.createElement("video");
  player.controls = true;
  player.playsInline = true;
  player.preload = "metadata";
  player.poster = "pitch-poster.svg#still";
  player.src = screen.dataset.pitchSrc;
  player.setAttribute("aria-label", "The Atlalli project pitch");
  if (screen.dataset.captionsSrc) {
    const captions = document.createElement("track");
    captions.kind = "captions";
    captions.srclang = "en";
    captions.label = "English";
    captions.src = screen.dataset.captionsSrc;
    player.append(captions);
  }
  screen.append(player);
  player.className = "pitch-player";
  screen.classList.add("has-video");
} else {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const toggle = screen.querySelector(".weather-toggle");
  let paused = false;
  function updateWeather() {
    screen.toggleAttribute("data-paused", paused);
    toggle.hidden = motion.matches;
    toggle.textContent = paused ? "Play motion" : "Pause motion";
  }
  toggle.addEventListener("click", () => {
    paused = !paused;
    updateWeather();
  });
  motion.addEventListener("change", updateWeather);
  updateWeather();
}

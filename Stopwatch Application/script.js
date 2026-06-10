let hr = 0, min = 0, sec = 0, ms = 0;
let startTimer;
let running = false;

let laps = [];

const startBtn = document.querySelector(".start");
const stopBtn = document.querySelector(".stop");
const resetBtn = document.querySelector(".reset");
const lapBtn = document.querySelector(".lap");

const elHour = document.querySelector(".hour");
const elMinute = document.querySelector(".minute");
const elSecond = document.querySelector(".second");
const elMs = document.querySelector(".millisecond");
const lapsList = document.getElementById("lapsList");
const bestTimeEl = document.getElementById("bestTime");

// Debug guard (prevents silent failures if HTML changed)
if (!lapBtn) console.error("Lap button not found: .lap");
if (!lapsList) console.error("Laps list not found: #lapsList");


const themeToggle = document.getElementById("themeToggle");
const LS_THEME = "stopwatch_theme";
const LS_BEST_MS = "stopwatch_best_ms";

const pad2 = (n) => String(n).padStart(2, "0");
const pad2Ms = (n) => String(n).padStart(2, "0");

function toDisplay() {
  elHour.textContent = pad2(hr);
  elMinute.textContent = pad2(min);
  elSecond.textContent = pad2(sec);
  elMs.textContent = pad2Ms(ms);
}

function resetState() {
  clearInterval(startTimer);
  startTimer = undefined;
  running = false;

  hr = 0;
  min = 0;
  sec = 0;
  ms = 0;

  laps = [];
  renderLaps();
  setButtonStates(false);
  toDisplay();
}


function setButtonStates(isRunning) {
  if (isRunning) {
    // Disable start, enable stop + lap
    startBtn.classList.add("active");
    stopBtn.classList.remove("stopActive");
    // Lap should remain clickable while running
    lapBtn.classList.remove("active");
  } else {
    // Enable start, disable stop + lap
    startBtn.classList.remove("active");
    stopBtn.classList.add("stopActive");
    lapBtn.classList.add("active");
  }
}


function start() {
  if (running) return;
  running = true;
  setButtonStates(true);

  startTimer = setInterval(() => {
    ms += 1;

    if (ms === 100) {
      ms = 0;
      sec += 1;

      if (sec === 60) {
        sec = 0;
        min += 1;

        if (min === 60) {
          min = 0;
          hr += 1;
        }
      }
    }

    toDisplay();
  }, 10);
}

function stop() {
  if (!running) return;

  running = false;
  setButtonStates(false);
  clearInterval(startTimer);

  updateBestTime();
}

function updateBestTime() {
  const total = getTotalElapsedMs();
  const prevBest = Number(localStorage.getItem(LS_BEST_MS) || "0");

  // Always update when we have a new smaller total time.
  // Also support cases where prevBest is NaN.
  if (!Number.isFinite(prevBest) || prevBest <= 0) {
    if (total > 0) {
      localStorage.setItem(LS_BEST_MS, String(total));
      bestTimeEl.textContent = formatBest(total);
    }
    return;
  }

  if (total > 0 && total < prevBest) {
    localStorage.setItem(LS_BEST_MS, String(total));
    bestTimeEl.textContent = formatBest(total);
  }
}

function getTotalElapsedMs() {
  // total time in milliseconds: 1 tick = 10ms, ms variable stores 0-99 for centiseconds
  // hr/min/sec are normal units; ms here are centiseconds.
  return ((hr * 3600 + min * 60 + sec) * 1000) + (ms * 10);
}

function currentTimestampString() {
  const h = pad2(hr);
  const m = pad2(min);
  const s = pad2(sec);
  const c = pad2Ms(ms);
  return `${h}:${m}:${s}.${c}`;
}

function formatBest(totalMs) {
  const totalCentiseconds = Math.floor(totalMs / 10);
  const c = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const s = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = totalMinutes % 60;
  const h = Math.floor(totalMinutes / 60);

  return `${pad2(h)}:${pad2(m)}:${pad2(s)}.${pad2Ms(c)}`;
}

function lap() {
  if (!running) return;
  const label = `Lap ${laps.length + 1}`;
  const t = currentTimestampString();

  laps.push({ label, t });
  renderLaps();
}

// Make sure buttons always work even if a browser cached old listeners
// (some environments can behave oddly when reloading files).
lapBtn.addEventListener('click', lap);


function renderLaps() {
  if (!laps.length) {
    lapsList.innerHTML = `No laps yet. Click <b>Lap</b> while running.`;
    return;
  }

  lapsList.innerHTML = laps
    .map((lap) => `
      <div class="lap-item" role="listitem">
        <span class="lap-label">${lap.label}</span>
        <span class="lap-time">${lap.t}</span>
      </div>
    `)
    .join("");
}

function reset() {
  resetState();
}

startBtn.addEventListener("click", start);
stopBtn.addEventListener("click", stop);
resetBtn.addEventListener("click", reset);
lapBtn.addEventListener("click", lap);

// Keyboard shortcuts
// Space -> start/stop
// R -> reset
// L -> lap
window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (e.code === "Space") {
    e.preventDefault();
    if (running) stop(); else start();
    return;
  }
  if (key === "r") {
    reset();
    return;
  }
  if (key === "l") {
    lap();
    return;
  }
});

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  if (theme === "dark") {
    themeToggle.textContent = "🌙 Dark";
  } else {
    themeToggle.textContent = "☀️ Light";
  }
}

function initTheme() {
  const stored = localStorage.getItem(LS_THEME);
  if (stored === "light" || stored === "dark") {
    applyTheme(stored);
    return;
  }
  // default: dark
  applyTheme("dark");
}

function initBestTime() {
  const best = Number(localStorage.getItem(LS_BEST_MS) || "0");
  if (!best) {
    bestTimeEl.textContent = "00:00:00.00";
    return;
  }
  bestTimeEl.textContent = formatBest(best);
}

themeToggle.addEventListener("click", () => {
  const current = document.body.getAttribute("data-theme") === "light" ? "dark" : "light";
  localStorage.setItem(LS_THEME, current);
  applyTheme(current);
});

// Init
stopBtn.classList.add("stopActive");
setButtonStates(false);
initTheme();
initBestTime();
toDisplay();


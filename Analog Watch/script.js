const clockEl = document.getElementById('clock');
const ticksEl = clockEl?.querySelector('.ticks');

const hr = document.getElementById('hour');
const min = document.getElementById('min');
const sec = document.getElementById('sec');

const themeToggle = document.getElementById('themeToggle');

function pad2(n) {
  return String(n).padStart(2, '0');
}

function monthName(idx) {
  return [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September','October','November','December',
  ][idx];
}
function dayName(idx) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][idx];
}

function buildTicks() {
  if (!ticksEl) return;
  ticksEl.innerHTML = '';

  // 60 tick marks: every 5th thicker
  for (let i = 0; i < 60; i++) {
    const tick = document.createElement('span');
    tick.className = 'tick' + (i % 5 === 0 ? ' strong' : '');
    // Use index so the 12 o'clock tick is at the top (0deg)
    // We rotate each tick around the center.
    // 6 degrees per tick: 360/60
    tick.style.transform = `translate(-50%, -50%) rotate(${i * 6}deg) translateY(calc(-1 * var(--tick-radius, 116px)))`;
    // fallback translate positioning handled by CSS positioning on parent
    tick.style.left = '50%';
    tick.style.top = '50%';

    // store angle for potential future improvements
    tick.dataset.angle = String(i * 6);

    ticksEl.appendChild(tick);
  }
}

function setTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;

  if (themeToggle) {
    themeToggle.dataset.theme = next;
    const icon = themeToggle.querySelector('.theme-icon');
    const text = themeToggle.querySelector('.theme-text');

    // Toggle label should show what clicking will do next
    const showLight = next === 'dark';
    if (icon) icon.textContent = showLight ? '☀️' : '🌙';
    if (text) text.textContent = showLight ? 'Light Mode' : 'Dark Mode';
  }
}


function initTheme() {
  const saved = localStorage.getItem('analogClockTheme');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;

  if (saved === 'light' || saved === 'dark') {
    setTheme(saved);
  } else {
    setTheme(prefersLight ? 'light' : 'dark');
  }

  themeToggle?.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem('analogClockTheme', next);
    setTheme(next);
  });
}

function updateDigital(now) {
  const dayEl = document.getElementById('digitalDay');
  const dateEl = document.getElementById('digitalDate');
  const timeEl = document.getElementById('digitalTime');

  const day = dayName(now.getDay());
  const date = `${pad2(now.getDate())} ${monthName(now.getMonth())} ${now.getFullYear()}`;

  let hours = now.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const time = `${hours.toString().padStart(2, '0')}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())} ${ampm}`;

  if (dayEl) dayEl.textContent = day;
  if (dateEl) dateEl.textContent = date;
  if (timeEl) timeEl.textContent = time;
}

function animate() {
  const now = new Date();

  const hh = now.getHours();
  const mm = now.getMinutes();
  const ss = now.getSeconds();
  const ms = now.getMilliseconds();

  const secondsWithMs = ss + ms / 1000;

  // Smooth motion
  const hRotation = (30 * (hh % 12)) + (mm * 0.5) + (secondsWithMs * 0.5 / 60);
  const mRotation = (6 * mm) + (secondsWithMs * 6 / 60);
  const sRotation = 6 * secondsWithMs;

  hr.style.transform = `rotate(${hRotation}deg)`;
  min.style.transform = `rotate(${mRotation}deg)`;
  sec.style.transform = `rotate(${sRotation}deg)`;

  updateDigital(now);
  requestAnimationFrame(animate);
}

function init() {
  buildTicks();

  // Improve tick radius based on current clock size
  const clockSize = clockEl?.getBoundingClientRect().width || 300;
  const radius = (clockSize / 2) - 28; // place ticks near inner ring
  document.documentElement.style.setProperty('--tick-radius', `${radius}px`);

  initTheme();
  animate();
}

window.addEventListener('resize', () => {
  const clockSize = clockEl?.getBoundingClientRect().width || 300;
  const radius = (clockSize / 2) - 28;
  document.documentElement.style.setProperty('--tick-radius', `${radius}px`);
});

init();


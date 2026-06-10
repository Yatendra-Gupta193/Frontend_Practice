const daysTag = document.querySelector('.days');
const currentDate = document.querySelector('#current-date');
const prevNextIcon = document.querySelectorAll('#prev, #next');

const clockEl = document.querySelector('#clock');
const yearSelect = document.querySelector('#year');
const todayBtn = document.querySelector('#todayBtn');

const modalOverlay = document.querySelector('#modalOverlay');
const eventModal = document.querySelector('#eventModal');
const modalClose = document.querySelector('#modalClose');
const eventForm = document.querySelector('#eventForm');
const deleteBtn = document.querySelector('#deleteBtn');

const modalDateKeyEl = document.querySelector('#modalDateKey');
const modalTitleEl = document.querySelector('#modalTitle');
const modalSubtitleEl = document.querySelector('#modalSubtitle');
const eventTextEl = document.querySelector('#eventText');
const eventTypeEl = document.querySelector('#eventType');
const eventNoteEl = document.querySelector('#eventNote');

const agendaList = document.querySelector('#agendaList');

// Calendar state
let date = new Date();
let currYear = date.getFullYear();
let currMonth = date.getMonth();

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const pad2 = (n) => String(n).padStart(2, '0');
const dateKey = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`; // m is 0-based

const EVENTS_KEY = 'dynamicCalendarEvents_v1';
const THEME_KEY = 'dynamicCalendarTheme_v1';

/** @type {Record<string, Array<{id:string, type:string, text:string, note:string}>>} */
let events = loadEvents();
let selectedDateKey = null;

function loadEvents() {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveEvents() {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

function setTheme(theme) {
  const root = document.documentElement;

  const themes = {
    purple: {
      accent: '#7C3AED',
      a2: '#4F46E5',
      a3: '#9333EA',
      bg: 'linear-gradient(135deg, #0F172A, #4F46E5, #9333EA)',
    },
    blue: {
      accent: '#3B82F6',
      a2: '#2563EB',
      a3: '#60A5FA',
      bg: 'linear-gradient(135deg, #0B1220, #2563EB, #60A5FA)',
    },
    green: {
      accent: '#10B981',
      a2: '#059669',
      a3: '#34D399',
      bg: 'linear-gradient(135deg, #061B17, #059669, #34D399)',
    },
    dark: {
      accent: '#A78BFA',
      a2: '#111827',
      a3: '#334155',
      bg: 'linear-gradient(135deg, #0B1220, #0F172A, #334155)',
    },
  };

  const t = themes[theme] || themes.purple;
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--accent-2', t.a2);
  root.style.setProperty('--accent-3', t.a3);
  document.body.style.background = t.bg;

  localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  setTheme(saved || 'purple');
}

function initYearDropdown() {
  const years = [2024, 2025, 2026, 2027];
  yearSelect.innerHTML = years
    .map((y) => `<option value="${y}" ${y === currYear ? 'selected' : ''}>${y}</option>`)
    .join('');

  yearSelect.addEventListener('change', (e) => {
    currYear = Number(e.target.value);
    date = new Date(currYear, currMonth, new Date().getDate());
    refreshAfterRender();
  });
}

function updateClock() {
  const now = new Date();
  let hrs = now.getHours();
  const mins = pad2(now.getMinutes());
  const ampm = hrs >= 12 ? 'PM' : 'AM';
  hrs = hrs % 12;
  if (hrs === 0) hrs = 12;
  clockEl.textContent = `🕒 ${pad2(hrs)}:${mins} ${ampm}`;
}

setInterval(updateClock, 1000);
updateClock();

function getDateLabelForKey(key) {
  const [y, mm, dd] = key.split('-').map(Number);
  const d = new Date(y, mm - 1, dd);
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
  const month = months[d.getMonth()];
  return `${weekday} ${d.getDate()} ${month} ${d.getFullYear()}`;
}

function openModal(forDateKey) {
  selectedDateKey = forDateKey;

  modalSubtitleEl.textContent = getDateLabelForKey(forDateKey);
  modalTitleEl.textContent = 'Add Event';

  modalDateKeyEl.value = forDateKey;
  eventTextEl.value = '';
  eventTypeEl.value = 'event';
  eventNoteEl.value = '';

  modalOverlay.hidden = false;
  eventModal.hidden = false;
}

function closeModal() {
  selectedDateKey = null;
  modalOverlay.hidden = true;
  eventModal.hidden = true;
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

function addEventToState(key, payload) {
  events[key] = events[key] || [];
  events[key].push(payload);
}

function deleteOneEventFromState(key, id) {
  if (!events[key]) return;
  events[key] = events[key].filter((e) => e.id !== id);
  if (events[key].length === 0) delete events[key];
}

function getEventsForKey(key) {
  return events[key] || [];
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"')
    .replaceAll("'", '&#039;');
}

function renderEventDotsForDate(key) {
  const list = getEventsForKey(key);
  const count = Math.min(list.length, 3);
  if (!count) return '';

  return `
    <div class="event-dots" aria-hidden="true">
      ${Array.from({ length: count })
        .map(() => '<span class="dot"></span>')
        .join('')}
    </div>
  `;
}

function renderAgenda() {
  const all = Object.entries(events).flatMap(([key, list]) =>
    list.map((e) => ({ key, ...e }))
  );

  all.sort((a, b) => (a.key < b.key ? -1 : 1));

  const now = new Date();
  const todayK = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
  const upcoming = all.filter((e) => e.key >= todayK).slice(0, 6);

  if (upcoming.length === 0) {
    agendaList.textContent = 'No events yet.';
    return;
  }

  agendaList.innerHTML = upcoming
    .map((e) => {
      return `
        <div class="agenda-item">
          <div class="agenda-item-title">${escapeHtml(e.text)}</div>
          <div class="agenda-item-sub">${escapeHtml(e.key)}</div>
        </div>
      `;
    })
    .join('');
}

function renderCalendar() {
  const firstDayofMonth = new Date(currYear, currMonth, 1).getDay();
  const lastDateofMonth = new Date(currYear, currMonth + 1, 0).getDate();
  const lastDayofMonth = new Date(currYear, currMonth, lastDateofMonth).getDay();
  const lastDateofLastMonth = new Date(currYear, currMonth, 0).getDate();

  let liTag = '';

  for (let i = firstDayofMonth; i > 0; i--) {
    const d = lastDateofLastMonth - i + 1;
    const weekday = new Date(currYear, currMonth - 1, d).getDay();
    const weekendClass = weekday === 6 ? 'weekend-sat' : weekday === 0 ? 'weekend-sun' : '';
    const key = dateKey(currYear, currMonth - 1, d);

    liTag += `<li class="inactive ${weekendClass}" data-date-key="${key}">${d}${renderEventDotsForDate(key)}</li>`;
  }

  const today = new Date();
  for (let i = 1; i <= lastDateofMonth; i++) {
    const weekday = new Date(currYear, currMonth, i).getDay();
    const weekendClass = weekday === 6 ? 'weekend-sat' : weekday === 0 ? 'weekend-sun' : '';

    const key = dateKey(currYear, currMonth, i);
    const isToday = i === today.getDate() && currMonth === today.getMonth() && currYear === today.getFullYear();
    const cls = isToday ? 'active' : '';

    liTag += `<li class="${cls} ${weekendClass}" data-date-key="${key}">${i}${renderEventDotsForDate(key)}</li>`;
  }

  for (let i = lastDayofMonth; i < 6; i++) {
    const d = i - lastDayofMonth + 1;
    const weekday = new Date(currYear, currMonth + 1, d).getDay();
    const weekendClass = weekday === 6 ? 'weekend-sat' : weekday === 0 ? 'weekend-sun' : '';
    const key = dateKey(currYear, currMonth + 1, d);

    liTag += `<li class="inactive ${weekendClass}" data-date-key="${key}">${d}${renderEventDotsForDate(key)}</li>`;
  }

  const first = new Date(currYear, currMonth, 1);
  const weekday = first.toLocaleDateString(undefined, { weekday: 'long' });
  currentDate.textContent = `${weekday} ${first.getDate()} ${months[currMonth]} ${currYear}`;

  daysTag.innerHTML = liTag;
}

function attachDayClickHandlers() {
  daysTag.querySelectorAll('li').forEach((li) => {
    li.addEventListener('click', () => {
      const key = li.getAttribute('data-date-key');
      if (!key) return;

      daysTag.querySelectorAll('li.selected').forEach((x) => x.classList.remove('selected'));
      li.classList.add('selected');

      openModal(key);

      const list = getEventsForKey(key);
      if (list.length > 0) {
        deleteBtn.dataset.deleteId = list[list.length - 1].id;
        deleteBtn.disabled = false;
      } else {
        deleteBtn.dataset.deleteId = '';
        deleteBtn.disabled = true;
      }
    });
  });
}

function refreshAfterRender() {
  renderCalendar();
  attachDayClickHandlers();
  renderAgenda();
  yearSelect.value = String(currYear);
}

function shiftMonth(delta) {
  const next = new Date(currYear, currMonth + delta, 1);
  currYear = next.getFullYear();
  currMonth = next.getMonth();
  date = new Date(currYear, currMonth, new Date().getDate());
  refreshAfterRender();
}

prevNextIcon.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.id === 'prev') shiftMonth(-1);
    else shiftMonth(1);
  });
});

todayBtn.addEventListener('click', () => {
  const now = new Date();
  currYear = now.getFullYear();
  currMonth = now.getMonth();
  date = new Date(currYear, currMonth, now.getDate());
  refreshAfterRender();
});

document.querySelectorAll('.theme-dot').forEach((dot) => {
  dot.addEventListener('click', () => setTheme(dot.dataset.theme));
});

eventForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!selectedDateKey) return;

  const key = modalDateKeyEl.value;
  const payload = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    type: eventTypeEl.value,
    text: eventTextEl.value.trim(),
    note: eventNoteEl.value.trim(),
  };

  addEventToState(key, payload);
  saveEvents();
  closeModal();
  refreshAfterRender();
});

deleteBtn.addEventListener('click', () => {
  if (!selectedDateKey) return;
  const id = deleteBtn.dataset.deleteId;
  if (!id) return;

  deleteOneEventFromState(selectedDateKey, id);
  saveEvents();
  closeModal();
  refreshAfterRender();
});

initTheme();
initYearDropdown();
refreshAfterRender();


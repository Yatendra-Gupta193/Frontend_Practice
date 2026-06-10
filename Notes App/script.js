// Notes Pro (Intermediate) - Enhanced Notes App

// DOM Element Selectors
const noteForm = document.getElementById('note-form');
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const colorSelect = document.getElementById('color-select');
const notesGrid = document.getElementById('notes-grid');
const emptyStateEl = document.getElementById('empty-state');
const toastContainer = document.getElementById('toast-container');

// Toolbar
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const savedNotesBtn = document.getElementById('saved-notes-btn');
const backToHomeBtn = document.getElementById('back-to-home-btn');
const savedNotesGrid = document.getElementById('saved-notes-grid');
const savedSection = document.getElementById('saved-section');
const themeToggle = document.getElementById('theme-toggle');
const totalNotesEl = document.getElementById('total-notes');


// Counters
const titleCounter = document.getElementById('title-counter');
const contentCounter = document.getElementById('content-counter');

// Edit modal
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editIdEl = document.getElementById('edit-id');
const editTitleEl = document.getElementById('edit-title');
const editContentEl = document.getElementById('edit-content');
const editColorSelectEl = document.getElementById('edit-color-select');
const editTitleCounterEl = document.getElementById('edit-title-counter');
const editContentCounterEl = document.getElementById('edit-content-counter');

// State
const STORAGE_KEY = 'notes';
const THEME_KEY = 'theme';

let notes = loadNotes();
let searchQuery = '';

function loadNotes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? JSON.parse(raw) : [];

  // Migrate older notes (no pinned/createdAt/updatedAt/color)
  return (Array.isArray(parsed) ? parsed : []).map(n => ({
    id: n.id,
    title: n.title ?? '',
    content: n.content ?? '',
    pinned: Boolean(n.pinned),
    color: n.color ?? 'yellow',
    createdAt: n.createdAt ?? Date.now(),
    updatedAt: n.updatedAt ?? Date.now()
  }));
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#39;'
  })[ch]);
}

function showToast(message, type = 'success') {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  }, 2200);
}

function formatDate(ts) {
  const d = new Date(ts);
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getFilteredNotes() {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return notes;

  return notes.filter(n => {
    const title = (n.title || '').toLowerCase();
    const content = (n.content || '').toLowerCase();
    return title.includes(q) || content.includes(q);
  });
}

function getSortedNotes(list) {
  const mode = sortSelect ? sortSelect.value : 'newest';

  // pinned first
  const pinnedFirst = [...list].sort((a, b) => {
    if (a.pinned === b.pinned) return 0;
    return a.pinned ? -1 : 1;
  });

  return pinnedFirst.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

    if (mode === 'newest') return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
    if (mode === 'oldest') return (a.updatedAt || a.createdAt) - (b.updatedAt || b.createdAt);
    if (mode === 'az') return (a.title || '').localeCompare(b.title || '');
    if (mode === 'za') return (b.title || '').localeCompare(a.title || '');
    return 0;
  });
}

function renderNotes() {
  if (!notesGrid) return;

  // Always render home view cards

  const filtered = getFilteredNotes();
  const sorted = getSortedNotes(filtered);

  notesGrid.innerHTML = '';
  if (totalNotesEl) totalNotesEl.textContent = `📒 Total Notes: ${notes.length}`;

  if (emptyStateEl) {
    const shouldShow = notes.length === 0 || sorted.length === 0;
    emptyStateEl.style.display = shouldShow ? 'block' : 'none';

    if (notes.length === 0) {
      const h2 = emptyStateEl.querySelector('h2');
      const p = emptyStateEl.querySelector('p');
      if (h2) h2.textContent = 'No Notes Yet';
      if (p) p.textContent = 'Create your first note.';
    } else if (sorted.length === 0) {
      const h2 = emptyStateEl.querySelector('h2');
      const p = emptyStateEl.querySelector('p');
      if (h2) h2.textContent = 'No Matches';
      if (p) p.textContent = 'Try a different search.';
    }
  }

  sorted.forEach(note => {
    const card = document.createElement('article');
    card.className = `note-card color-${note.color}`;
    card.dataset.id = note.id;

    const title = escapeHTML(note.title);
    const content = escapeHTML(note.content);
    const created = formatDate(note.createdAt);
    const updated = formatDate(note.updatedAt);
    const pinnedText = note.pinned ? '📌 Pinned' : '📍 Pin';

    card.innerHTML = `
      <div class="note-main">
        <div class="note-title-row">
          <h3>${title}</h3>
        </div>
        <p class="note-content">${content}</p>
        <div class="note-meta">
          <div>Created: <span>${created}</span></div>
          <div>Updated: <span>${updated}</span></div>
        </div>
      </div>

      <div class="note-actions">
        <button type="button" class="btn-pin" data-action="pin">${pinnedText}</button>
        <button type="button" class="btn-copy" data-action="copy">📋 Copy</button>
        <button type="button" class="btn-edit" data-action="edit">✏ Edit</button>
        <button type="button" class="btn-delete" data-action="delete">🗑 Delete</button>
      </div>
    `;

    card.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = Number(card.dataset.id);

      if (action === 'delete') deleteNote(id);
      if (action === 'edit') openEditModal(id);
      if (action === 'pin') togglePin(id);
      if (action === 'copy') copyNote(id);
    });

    notesGrid.appendChild(card);
  });
}

function updateCounters() {
  if (titleCounter && noteTitle) titleCounter.textContent = `${noteTitle.value.length} / 50`;
  if (contentCounter && noteContent) contentCounter.textContent = `${noteContent.value.length} / 500`;

  if (editTitleCounterEl && editTitleEl) editTitleCounterEl.textContent = `${editTitleEl.value.length} / 50`;
  if (editContentCounterEl && editContentEl) editContentCounterEl.textContent = `${editContentEl.value.length} / 500`;
}

function addNote() {
  const title = noteTitle ? noteTitle.value.trim() : '';
  const content = noteContent ? noteContent.value.trim() : '';
  if (!title || !content) return;

  const now = Date.now();
  const newNote = {
    id: now,
    title,
    content,
    color: colorSelect ? colorSelect.value : 'yellow',
    pinned: false,
    createdAt: now,
    updatedAt: now
  };

  notes.unshift(newNote);
  saveNotes();
  renderNotes();

  if (noteForm) noteForm.reset();
  updateCounters();
  // Sidebar popup requirement: this UI has no sidebar, so use toast
  showToast('✅ Notes added; please view them in Saved Notes.', 'success');
}


function deleteNote(id) {
  const ok = confirm('🗑 Are you sure you want to delete this note?');
  if (!ok) return;

  const before = notes.length;
  notes = notes.filter(n => n.id !== id);
  if (notes.length === before) return;

  saveNotes();
  renderNotes();
  showToast('🗑 Note Deleted', 'danger');
}


function togglePin(id) {
  const n = notes.find(x => x.id === id);
  if (!n) return;

  n.pinned = !n.pinned;
  n.updatedAt = Date.now();

  saveNotes();
  renderNotes();
  showToast(n.pinned ? '📌 Note Pinned' : '📍 Note Unpinned', 'success');
}

async function copyNote(id) {
  const n = notes.find(x => x.id === id);
  if (!n) return;

  const text = `${n.title}\n\n${n.content}`;

  try {
    await navigator.clipboard.writeText(text);
    showToast('📋 Note Copied', 'success');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast('📋 Note Copied', 'success');
  }
}

function openEditModal(id) {
  const n = notes.find(x => x.id === id);
  if (!n) return;

  if (!editModal) return;

  editIdEl.value = String(n.id);
  editTitleEl.value = n.title;
  editContentEl.value = n.content;
  editColorSelectEl.value = n.color || 'yellow';

  if (editTitleCounterEl) editTitleCounterEl.textContent = `${editTitleEl.value.length} / 50`;
  if (editContentCounterEl) editContentCounterEl.textContent = `${editContentEl.value.length} / 500`;

  showModal(true);
}

function showModal(open) {
  if (!editModal) return;
  editModal.style.display = open ? 'block' : 'none';
  if (open) setTimeout(() => editTitleEl?.focus(), 0);
}

if (editModal) {
  editModal.addEventListener('click', (e) => {
    const close = e.target.closest('[data-close-modal]');
    if (close) showModal(false);
  });
}

if (noteForm) {
  noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addNote();
  });
}

if (editForm) {
  editForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = Number(editIdEl.value);
    const n = notes.find(x => x.id === id);
    if (!n) return;

    n.title = editTitleEl.value.trim();
    n.content = editContentEl.value.trim();
    n.color = editColorSelectEl.value;
    n.updatedAt = Date.now();

    saveNotes();
    renderNotes();
    showModal(false);
    showToast('✅ Note Updated', 'success');
  });
}

if (noteTitle) noteTitle.addEventListener('input', updateCounters);
if (noteContent) noteContent.addEventListener('input', updateCounters);

if (editTitleEl && editTitleCounterEl) {
  editTitleEl.addEventListener('input', () => {
    editTitleCounterEl.textContent = `${editTitleEl.value.length} / 50`;
  });
}

if (editContentEl && editContentCounterEl) {
  editContentEl.addEventListener('input', () => {
    editContentCounterEl.textContent = `${editContentEl.value.length} / 500`;
  });
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderNotes();
  });
}

if (sortSelect) {
  sortSelect.addEventListener('change', renderNotes);
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  if (!themeToggle) return;
  themeToggle.textContent = theme === 'dark' ? '☀ Light' : '🌙 Dark';
}

applyTheme(localStorage.getItem(THEME_KEY) || 'light');

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = document.body.dataset.theme || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

// Saved Notes view handling
if (savedNotesBtn && savedSection) {
  savedNotesBtn.addEventListener('click', () => {
    // toggle to saved section
    if (noteForm) noteForm.style.display = 'none';
    if (emptyStateEl) emptyStateEl.style.display = 'none';
    if (notesGrid) notesGrid.style.display = 'none';

    savedSection.style.display = 'block';

    // ensure buttons and grid are updated
    renderSavedNotes();
  });
}

if (backToHomeBtn && savedSection) {
  backToHomeBtn.addEventListener('click', () => {
    savedSection.style.display = 'none';
    if (noteForm) noteForm.style.display = 'block';
    if (notesGrid) notesGrid.style.display = 'grid';
    renderNotes();
  });
}

function renderSavedNotes() {
  if (!savedNotesGrid) return;

  // Use same sorting logic, but ignore search while in saved view
  const sorted = getSortedNotes([...notes]);
  savedNotesGrid.innerHTML = '';

  if (!sorted.length) {
    savedNotesGrid.innerHTML = `<div style="width:100%; text-align:center; padding:1.2rem; color: var(--text-muted); font-weight:900;">📒 No saved notes yet.</div>`;
    return;
  }

  sorted.forEach(note => {
    const card = document.createElement('article');
    card.className = `note-card color-${note.color}`;
    card.dataset.id = note.id;

    const title = escapeHTML(note.title);
    const content = escapeHTML(note.content);
    const created = formatDate(note.createdAt);
    const updated = formatDate(note.updatedAt);
    const pinnedText = note.pinned ? '📌 Pinned' : '📍 Pin';

    card.innerHTML = `
      <div class="note-main">
        <div class="note-title-row">
          <h3>${title}</h3>
        </div>
        <p class="note-content">${content}</p>
        <div class="note-meta">
          <div>Created: <span>${created}</span></div>
          <div>Updated: <span>${updated}</span></div>
        </div>
      </div>

      <div class="note-actions">
        <button type="button" class="btn-pin" data-action="pin">${pinnedText}</button>
        <button type="button" class="btn-copy" data-action="copy">📋 Copy</button>
        <button type="button" class="btn-edit" data-action="edit">✏ Edit</button>
        <button type="button" class="btn-delete" data-action="delete">🗑 Delete</button>
      </div>
    `;

    card.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = Number(card.dataset.id);

      if (action === 'delete') deleteNote(id);
      if (action === 'edit') openEditModal(id);
      if (action === 'pin') togglePin(id);
      if (action === 'copy') copyNote(id);

      // keep saved grid in sync after any action
      renderSavedNotes();
    });

    savedNotesGrid.appendChild(card);
  });
}

// Initial render
updateCounters();
renderNotes();



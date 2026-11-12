/* ============================================
   NOTES PILLAR — Phase 5.7 Shell
   ============================================ */

let notesCurrentTab = 'journal'; // 'journal' | 'learning' | 'literature' | 'z-index'
let notesCalendarDate = new Date(); // For the calendar widget
let notesCalendarOpen = false;
let liveSessionInterval = null;
let liveSessionSeconds = 0;
let liveSessionMethod = 'App';
let liveSessionLanguage = 'korean';

function renderNotesPage() {
  const container = document.getElementById('notes-page');
  if (!container) return;
  
  const admin = isEditable();

  container.innerHTML = `
    <div class="book-spread">
      <div class="book-page" style="padding: 2rem; max-width: 100%; display: flex; flex-direction: column;">
        
        <div class="notes-layout" style="margin: 0;">
          <div class="notes-header">
            <div class="notes-title">The Z-System & Journal</div>
          </div>

          <div class="notes-tabs">
            <button class="notes-tab ${notesCurrentTab === 'journal' ? 'active' : ''}" 
                    onclick="setNotesTab('journal')">Journal & Calendar</button>
            <button class="notes-tab ${notesCurrentTab === 'learning' ? 'active' : ''}" 
                    onclick="setNotesTab('learning')">Learning Logs</button>
            <button class="notes-tab ${notesCurrentTab === 'literature' ? 'active' : ''}" 
                    onclick="setNotesTab('literature')">Literature Notes</button>
            <button class="notes-tab ${notesCurrentTab === 'z-index' ? 'active' : ''}" 
                    onclick="setNotesTab('z-index')">Z-Library (Index)</button>
          </div>

          <div class="notes-content" id="notes-content">
            ${renderNotesTabContent()}
          </div>
        </div>

      </div>
    </div>
    
    ${admin ? `
      <button class="notes-fab" onclick="openNewNoteEditor('${notesCurrentTab}')" title="New Note">
        +
      </button>
    ` : ''}
  `;
}

function setNotesTab(tab) {
  notesCurrentTab = tab;
  renderNotesPage();
}

function renderNotesTabContent() {
  if (notesCurrentTab === 'journal') {
    return renderNotesJournal();
  } else if (notesCurrentTab === 'learning') {
    return renderNotesGrid('learning');
  } else if (notesCurrentTab === 'literature') {
    return renderNotesGrid('literature');
  } else if (notesCurrentTab === 'z-index') {
    return renderNotesGrid('z-index');
  }
  return '';
}

// ═══ JOURNAL & CALENDAR ═══
function renderNotesJournal() {
  const events = [];

  (DATA.dailyLogs || []).forEach(log => {
    events.push({ type: 'daily', date: log.date, data: log });
  });

  (DATA.learningLogs || []).forEach(note => {
    events.push({ type: 'learning', date: note.date, data: note });
  });

  // Sort newest first
  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  let timelineHtml = '';
  if (!events.length) {
    timelineHtml = `<div class="notes-empty">No events logged yet.</div>`;
  } else {
    timelineHtml = events.map(ev => {
      if (ev.type === 'daily') {
        const log = ev.data;
        const sessions = log.sessions || [];
        const palaceSessions = sessions.filter(s => s.activity === 'Memory Palace');
        const regularSessions = sessions.filter(s => s.activity !== 'Memory Palace');
        const media = log.mediaConsumed || [];
        
        let contentHtml = '';

        // 1. Lab Note
        if (log.labNote) {
          contentHtml += `<div class="journal-note">"${escapeHtml(log.labNote)}"</div>`;
        }

        // 2. Sessions (Clickable)
        if (sessions.length) {
          contentHtml += `<div class="journal-section-title">Sessions</div>`;
          contentHtml += regularSessions.map((s, i) => `
            <div class="journal-session-row" onclick="viewSessionDetails('${log.date}', ${sessions.indexOf(s)})">
              <span>📖 ${escapeHtml(s.activity)}</span>
              <span>${s.durationMinutes} mins · ${escapeHtml(s.notes || 'No notes')}</span>
            </div>
          `).join('');
        }

        // 3. Palace Sessions
        if (palaceSessions.length) {
          contentHtml += `<div class="journal-section-title">Palace</div>`;
          contentHtml += palaceSessions.map(s => `
            <div class="journal-session-row" style="border-left-color: var(--warning);">
              <span>🏛 ${escapeHtml(s.notes)}</span>
              <span>${s.durationMinutes} mins</span>
            </div>
          `).join('');
        }

        // 4. Media
        if (media.length) {
          contentHtml += `<div class="journal-section-title">Media</div>`;
          contentHtml += media.map(m => `
            <div class="journal-session-row" style="border-left-color: var(--accent-blue);">
              <span>🎬 ${escapeHtml(m.title)}</span>
              <span>${escapeHtml(m.whatILearned || 'No notes')}</span>
            </div>
          `).join('');
        }

        // 5. Vitals
        const sleep = log.physiological?.sleepHours;
        const headache = log.physiological?.headacheAfterKorean;
        let vitalsHtml = '';
        if (sleep || headache) {
          vitalsHtml = `<div class="journal-stats">
            ${sleep ? `<span>💤 ${sleep}h sleep</span>` : ''}
            ${headache ? `<span>🤕 Headache: ${headache}/10</span>` : ''}
          </div>`;
        }

        return `
          <div class="journal-entry" data-date="${log.date}">
            <div class="journal-date">${formatDate(log.date)}</div>
            ${contentHtml}
            ${vitalsHtml}
          </div>
        `;
      } else {
        // Learning Log
        const note = ev.data;
        return `
          <div class="journal-entry learning-entry" data-date="${note.date}">
            <div class="journal-date">${formatDate(note.date)} · Learning Log</div>
            <div class="journal-title">${escapeHtml(note.title)}</div>
            <div class="journal-snippet">${escapeHtml(note.body.slice(0, 150))}...</div>
          </div>
        `;
      }
    }).join('');
  }

  return `
    ${renderCalendarWidget()}
    <div class="journal-timeline">
      ${timelineHtml}
    </div>
  `;
}

function viewSessionDetails(dateStr, sessionIndex) {
  const log = DATA.dailyLogs.find(l => l.date === dateStr);
  if (!log || !log.sessions || !log.sessions[sessionIndex]) return;
  
  const s = log.sessions[sessionIndex];
  alert(`Session Details (${dateStr})\n\nActivity: ${s.activity}\nDuration: ${s.durationMinutes} mins\nNotes: ${s.notes || 'None'}`);
}

function renderCalendarWidget() {
  const d = notesCalendarDate;
  const year = d.getFullYear();
  const month = d.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  let cells = '';
  for (let i = 0; i < startingDayOfWeek; i++) {
    cells += `<div class="calendar-day empty"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasLog = (DATA.dailyLogs || []).some(l => l.date === dateStr);
    const hasLearningLog = (DATA.learningLogs || []).some(l => l.date === dateStr);
    const hasData = hasLog || hasLearningLog;
    const isToday = dateStr === localDateStr();

    cells += `
      <div class="calendar-day ${hasData ? 'has-data' : ''} ${isToday ? 'today' : ''}"
           onclick="onCalendarDayClick('${dateStr}')">
        ${day}
        ${hasData ? '<div class="calendar-day-dot"></div>' : ''}
      </div>
    `;
  }

  // The toggle header
  const header = `
    <div class="calendar-header">
      <div class="calendar-month" style="display:flex; align-items:center; gap:0.5rem;">
        <button class="calendar-toggle-btn" onclick="toggleCalendar()">
          ${notesCalendarOpen ? '▼' : '▶'}
        </button>
        Calendar
      </div>
      ${notesCalendarOpen ? `
        <div class="calendar-nav">
          <span style="font-size:0.7rem; margin-right: 0.5rem;">${monthNames[month]} ${year}</span>
          <button onclick="shiftCalendarMonth(-1)">◀</button>
          <button onclick="shiftCalendarMonth(1)">▶</button>
        </div>
      ` : ''}
    </div>
  `;

  return `
    <div class="notes-calendar-wrap">
      ${header}
      ${notesCalendarOpen ? `
        <div class="calendar-grid">
          ${dayNames.map(dn => `<div class="calendar-day-label">${dn}</div>`).join('')}
          ${cells}
        </div>
      ` : ''}
    </div>
  `;
}

function toggleCalendar() {
  notesCalendarOpen = !notesCalendarOpen;
  renderNotesPage();
}

function shiftCalendarMonth(dir) {
  notesCalendarDate.setMonth(notesCalendarDate.getMonth() + dir);
  renderNotesPage();
}

function onCalendarDayClick(dateStr) {
  // Scroll to the journal entry for that date
  const entries = document.querySelectorAll('.journal-entry');
  let found = false;
  
  entries.forEach(entry => {
    const entryDate = entry.getAttribute('data-date');
    if (entryDate === dateStr) {
      entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
      entry.style.border = '2px solid var(--accent-violet)';
      setTimeout(() => entry.style.border = '', 2000);
      found = true;
    }
  });

  if (!found) {
    // If no entry exists, we could open the New Learning Log modal prefilled with this date
    if (confirm(`No entry found for ${dateStr}. Create a Learning Log for this day?`)) {
      openNewNoteEditor('learning');
      // Prefill date
      document.getElementById('note-edit-date').value = dateStr;
    }
  }
}

// ═══ GRID VIEWS ═══
function renderNotesGrid(type) {
  let notes = [];
  let emptyMsg = '';
  let label = '';

  if (type === 'learning') {
    notes = DATA.learningLogs || [];
    emptyMsg = 'No learning logs yet. Start a session to write one.';
    label = 'Learning Log';
  } else if (type === 'literature') {
    notes = DATA.literatureNotes || [];
    emptyMsg = 'No literature notes yet. Add a book, paper, or video to read.';
    label = 'Literature';
  } else if (type === 'z-index') {
    // Z-Index shows BOTH manual index notes and literature notes (but we'll focus on index for now)
    notes = DATA.zIndexNotes || [];
    emptyMsg = 'No Z-Library notes yet. Capture a single idea.';
    label = 'Z-Note';
  }

  if (!notes.length) {
    return `<div class="notes-empty">${emptyMsg}</div>`;
  }

  // Sort by date (newest first)
  notes.sort((a, b) => new Date(b.date) - new Date(a.date));

  return `
    <div class="notes-grid">
      ${notes.map(n => `
        <div class="note-card" onclick="openNoteView('${n.id}', '${type}')">
          <div class="note-card-type">${label} · ${n.date}</div>
          <div class="note-card-title">${escapeHtml(n.title || 'Untitled')}</div>
          <div class="note-card-snippet">${escapeHtml((n.body || '').slice(0, 100))}...</div>
          <div class="note-card-footer">
            <span>${n.source ? n.source.type : 'No source'}</span>
            <span>${n.linkedNoteIds ? n.linkedNoteIds.length : 0} links</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ═══════════════════════════════════════════════
// EDITOR & VIEWING LOGIC
// ═══════════════════════════════════════════════

let currentNoteDraft = null;
let currentNoteType = null;   // 'learning' | 'literature' | 'z-index'
let currentNoteMode = 'edit'; // 'edit' | 'view'

function openNewNoteEditor(type) {
  if (!isEditable()) return;

  if (type === 'learning') {
    startLiveSession();
    return;
  }

  currentNoteType = type;
  currentNoteMode = 'edit';
  currentNoteDraft = {
    id: 'note-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: '',
    body: '',
    date: localDateStr(),
    source: { type: 'custom', title: '', url: '' },
    tags: [],
    linkedNoteIds: [],
    sessionStats: null,
    readStatus: 'to-read'
  };
  renderNoteEditorModal();
}

function renderNoteEditMode(draft, sourceOptions) {
  const isLearning = currentNoteType === 'learning';
  const isLit = currentNoteType === 'literature';

  // Different placeholder text based on context
  const titlePlaceholder = isLearning ? "What are you studying today? (e.g. Particles & Greetings)" : 
                           isLit ? "Title of the book, video, or paper" :
                           "Title of this idea...";

  const bodyPlaceholder = isLearning ? "Write down what you're learning..." :
                          isLit ? "Notes on the source material..." :
                          "Explain this single idea...";

  return `
    <div class="note-edit-form">
      
      <div class="note-field-row">
        <label class="note-field" style="flex: 2;">
          <span>${isLearning ? 'Session Title' : 'Title'}</span>
          <input type="text" id="note-edit-title" value="${escapeHtml(draft.title)}" placeholder="${titlePlaceholder}">
        </label>
        <label class="note-field" style="flex: 1;">
          <span>Date</span>
          <input type="date" id="note-edit-date" value="${draft.date}">
        </label>
      </div>

      ${isLit ? `
        <div class="note-field-row">
          <label class="note-field">
            <span>Read Status</span>
            <select id="note-edit-readstatus">
              <option value="to-read" ${draft.readStatus === 'to-read' ? 'selected' : ''}>To Read</option>
              <option value="read" ${draft.readStatus === 'read' ? 'selected' : ''}>Read</option>
            </select>
          </label>
        </div>
      ` : ''}

      ${isLearning ? '' : `
        <div class="note-field-row" style="background: rgba(0,0,0,0.03); padding: 0.5rem; border: 1px solid var(--border-soft);">
          <label class="note-field">
            <span>Source Type</span>
            <select id="note-edit-sourcetype">${sourceOptions}</select>
          </label>
          <label class="note-field">
            <span>Source Title</span>
            <input type="text" id="note-edit-sourcetitle" value="${escapeHtml(draft.source?.title || '')}" placeholder="Name...">
          </label>
          <label class="note-field">
            <span>Source URL (optional)</span>
            <input type="url" id="note-edit-sourceurl" value="${escapeHtml(draft.source?.url || '')}" placeholder="https://...">
          </label>
        </div>
      `}

      <div class="note-field" style="flex: 1; display: flex; flex-direction: column; min-height: 300px; position: relative;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
          <span style="font-size: 0.7rem; color: var(--paper-ink-soft);">Body (Markdown supported)</span>
          <button class="add-btn small" onclick="manualLinkSearch()">+ Link Note</button>
        </div>
        <textarea id="note-edit-body" placeholder="${bodyPlaceholder}" style="flex: 1; resize: vertical; min-height: 250px;">${escapeHtml(draft.body)}</textarea>
      </div>

      <div class="note-field">
        <span>Tags (comma separated)</span>
        <input type="text" id="note-edit-tags" value="${(draft.tags || []).join(', ')}" placeholder="neuroscience, korean, particles">
      </div>

      <div id="note-editor-markdown-preview" class="note-markdown-preview">
        <!-- Live preview will render here -->
      </div>

    </div>
  `;
}

let linkSearchActive = false;

function showLinkSearch(query, textarea, containerSelector) {
  const allNotes = [...(DATA.zIndexNotes||[]), ...(DATA.literatureNotes||[])];
  if (!allNotes.length) return;

  const results = query ? allNotes.filter(n => n.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : allNotes.slice(0, 5);
  if (!results.length) {
    hideLinkSearch();
    return;
  }

  let dropdown = document.getElementById('note-link-dropdown');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.id = 'note-link-dropdown';
    dropdown.className = 'note-link-dropdown';
    const container = document.querySelector(containerSelector);
    if (container) container.appendChild(dropdown);
  }

  dropdown.innerHTML = results.map(n => `
    <div class="note-link-option" onclick="insertNoteLink('${n.id}', '${escapeHtml(n.title).replace(/'/g, "\\'")}')">
      <span>${escapeHtml(n.title)}</span>
      <small>${n.type || 'note'}</small>
    </div>
  `).join('');
}

function insertNoteLink(noteId, title) {
  // Find whichever textarea is active
  const textarea = document.getElementById('live-session-body') || document.getElementById('note-edit-body');
  if (!textarea) return;

  const val = textarea.value;
  
  // Replace the unclosed [[ query with the full highlighted reference
  const newVal = val.replace(/\[\[([^\]]+)$/, `[[${title}]] `);
  textarea.value = newVal;
  
  // Auto-add to linkedNoteIds
  if (currentNoteDraft) {
    if (!currentNoteDraft.linkedNoteIds) currentNoteDraft.linkedNoteIds = [];
    if (!currentNoteDraft.linkedNoteIds.includes(noteId)) {
      currentNoteDraft.linkedNoteIds.push(noteId);
    }
  }

  // Refresh preview
  if (typeof marked !== 'undefined') {
    const preview = document.getElementById('live-session-preview') || document.getElementById('note-editor-markdown-preview');
    if (preview) preview.innerHTML = marked.parse(newVal);
  }
  
  hideLinkSearch();
  textarea.focus();
}

function hideLinkSearch() {
  linkSearchActive = false;
  const dropdown = document.getElementById('note-link-dropdown');
  if (dropdown) dropdown.remove();
}

function openNoteView(id, type) {
  let note = null;
  if (type === 'learning') note = DATA.learningLogs.find(n => n.id === id);
  else if (type === 'literature') note = DATA.literatureNotes.find(n => n.id === id);
  else if (type === 'z-index') note = DATA.zIndexNotes.find(n => n.id === id);

  if (!note) return;

  currentNoteDraft = JSON.parse(JSON.stringify(note)); // Clone
  currentNoteType = type;
  currentNoteMode = 'view';

  renderNoteEditorModal();
}

function renderNoteEditorModal() {
  // Remove any existing modal
  const existing = document.getElementById('note-editor-modal');
  if (existing) existing.remove();

  const admin = isEditable();
  const isEdit = currentNoteMode === 'edit' && admin;
  const draft = currentNoteDraft;
  const isLearning = currentNoteType === 'learning';

  // Build source dropdown options
  const sourceTypes = ['book', 'movie', 'song', 'article', 'research', 'blog', 'web', 'youtube', 'custom'];
  const sourceOptions = sourceTypes.map(t => 
    `<option value="${t}" ${draft.source?.type === t ? 'selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`
  ).join('');

  const modalHtml = `
    <div class="modal-overlay" id="note-editor-modal">
      <div class="note-editor-panel">
          <div class="note-editor-tab">
            ${currentNoteType === 'learning' ? '📖 Learning Log' : currentNoteType === 'literature' ? '📚 Literature' : '🗂 Z-Note'}
          </div>
         <div class="note-editor-controls">
    ${isEdit ? `<button class="save-btn small" onclick="saveNoteDraft()">Save</button>` : ''}
    
    ${admin && !isEdit && !isLearning ? `
      <button class="add-btn small" onclick="currentNoteMode='edit'; renderNoteEditorModal()">Edit</button>
    ` : ''}
    
    <button class="cancel-btn small" onclick="closeNoteEditor()">Close</button>
    ${admin && !isEdit ? `<button class="cancel-btn small" style="color: var(--danger);" onclick="deleteCurrentNote()">Delete</button>` : ''}

  </div>
        <div class="note-editor-header">
        

        <div class="note-editor-body">
          ${isEdit ? renderNoteEditMode(draft, sourceOptions) : renderNoteViewMode(draft, currentNoteType)}
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}


function renderNoteViewMode(draft, type) {
  const renderedBody = marked.parse(draft.body || '');

  const allNotes = [...(DATA.zIndexNotes||[]), ...(DATA.literatureNotes||[])];
  const linksHtml = (draft.linkedNoteIds || []).map(id => {
    const linked = allNotes.find(n => n.id === id);
    if (!linked) return '';
    return `<span class="note-link-highlight" onclick="openNoteView('${linked.id}', '${type}')">${escapeHtml(linked.title)}</span>`;
  }).join(' ');
  

  const isLearning = type === 'learning';

  return `
    <div class="note-view-content">
      <div class="note-view-header">
        <h1>${escapeHtml(draft.title || 'Untitled')}</h1>
        <div class="note-view-meta">
          <span>${draft.date}</span>
          ${draft.source?.title ? `<span>· Source: ${escapeHtml(draft.source.title)}</span>` : ''}
          ${draft.readStatus ? `<span>· Status: ${draft.readStatus === 'read' ? '✅ Read' : '⏳ To Read'}</span>` : ''}
        </div>
      </div>

      <div class="note-view-body">
        ${renderedBody}
      </div>

      ${linksHtml ? `
        <div class="note-view-links">
          <div class="note-view-links-title">Linked Notes:</div>
          <div class="note-link-container">${linksHtml}</div>
        </div>
      ` : ''}

      ${(draft.tags || []).length ? `
        <div class="note-view-tags">
          ${draft.tags.map(t => `<span class="note-tag">#${escapeHtml(t)}</span>`).join('')}
        </div>
      ` : ''}

      ${isLearning && draft.sessionStats ? `
        <div class="session-end-block">
          <div class="session-end-title">--- End of Session ---</div>
          <div class="session-end-stats">
            ${draft.sessionStats.time ? `<span>⏱ ${draft.sessionStats.time} mins</span>` : ''}
            ${draft.sessionStats.headache ? `<span>🧠 Headache: ${draft.sessionStats.headache}/10</span>` : ''}
            ${draft.sessionStats.words ? `<span>🪴 ${draft.sessionStats.words} words reviewed</span>` : ''}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function closeNoteEditor() {
  const modal = document.getElementById('note-editor-modal');
  if (modal) modal.remove();
  currentNoteDraft = null;
  currentNoteMode = 'view';
}

function saveNoteDraft() {
  if (!isEditable() || !currentNoteDraft) return;

  // Gather inputs
  currentNoteDraft.title = document.getElementById('note-edit-title').value.trim() || 'Untitled';
  currentNoteDraft.date = document.getElementById('note-edit-date').value || localDateStr();
  currentNoteDraft.body = document.getElementById('note-edit-body').value;
  
  currentNoteDraft.source = {
    type: document.getElementById('note-edit-sourcetype').value,
    title: document.getElementById('note-edit-sourcetitle').value.trim(),
    url: document.getElementById('note-edit-sourceurl').value.trim()
  };

  const tagsRaw = document.getElementById('note-edit-tags').value;
  currentNoteDraft.tags = tagsRaw.split(',').map(t => t.trim()).filter(t => t);

  if (currentNoteType === 'literature') {
    currentNoteDraft.readStatus = document.getElementById('note-edit-readstatus').value;
  }

  // Save to the correct array
  let targetArray;
  if (currentNoteType === 'learning') targetArray = DATA.learningLogs;
  else if (currentNoteType === 'literature') targetArray = DATA.literatureNotes;
  else targetArray = DATA.zIndexNotes;

  // Check if it exists (update) or is new (push)
  const existingIdx = targetArray.findIndex(n => n.id === currentNoteDraft.id);
  if (existingIdx >= 0) {
    targetArray[existingIdx] = currentNoteDraft;
  } else {
    targetArray.push(currentNoteDraft);
  }

  saveData(DATA);
  closeNoteEditor();
  renderNotesPage();
}

// ═══ MARKDOWN PREVIEW ═══
document.addEventListener('input', (e) => {
  if (e.target.id === 'note-edit-body') {
    const preview = document.getElementById('note-editor-markdown-preview');
    if (preview && typeof marked !== 'undefined') {
      preview.innerHTML = marked.parse(e.target.value);
    }
  }
});
// ═══ MARKDOWN PREVIEW & [[ LINKING ═══
document.addEventListener('input', (e) => {
  // 1. Handle Live Session Editor
  if (e.target.id === 'live-session-body') {
    if (typeof marked !== 'undefined') {
      const preview = document.getElementById('live-session-preview');
      if (preview) preview.innerHTML = marked.parse(e.target.value);
    }
    handleLinkTyping(e.target, '.live-session-editor');
  } 
  // 2. Handle Standard Z-Library Editor
  else if (e.target.id === 'note-edit-body') {
    if (typeof marked !== 'undefined') {
      const preview = document.getElementById('note-editor-markdown-preview');
      if (preview) preview.innerHTML = marked.parse(e.target.value);
    }
    handleLinkTyping(e.target, '.note-edit-form');
  }
});

function handleLinkTyping(textarea, containerSelector) {
  const val = textarea.value;
  const match = val.match(/\[\[([^\]]+)$/); // Match unclosed [[
  
  if (match) {
    showLinkSearch(match[1], textarea, containerSelector);
  } else {
    hideLinkSearch();
  }
}

function manualLinkSearch() {
  const textarea = document.getElementById('note-edit-body');
  if (textarea) {
    // Insert [[ at cursor position
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value = textarea.value.substring(0, start) + '[[' + textarea.value.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + 2, start + 2);
    showLinkSearch('', textarea, '.note-edit-form');
  }
}

// start a live study session (learning log) with timer and auto-save
function startLiveSession() {
  liveSessionSeconds = 0;
  liveSessionMethod = 'App';
  
  // Create a draft specifically for the live session
  currentNoteDraft = {
    id: 'log-' + Date.now().toString(36),
    type: 'learning',
    title: '', 
    body: '',
    date: localDateStr(),
    tags: [],
    linkedNoteIds: [],
    sessionStats: { time: 0, method: '', language: '' }
  };

  // Take over the screen
  const container = document.getElementById('notes-page');
  container.innerHTML = `
    <div class="live-session-wrap">
      <div class="live-session-header">
        <div class="live-session-title-group">
          <input type="text" id="live-session-title" placeholder="What are you studying today?" class="live-title-input" value="">
        </div>
        <div class="live-session-timer" id="live-timer">00:00:00</div>
        <button class="cancel-btn" onclick="cancelLiveSession()">Exit</button>
      </div>

            <div class="live-session-toolbar">
        <label>Language:
          <select id="live-lang">
            ${Object.keys(LANGUAGES).map(l => `<option value="${l}">${LANGUAGES[l].flag} ${LANGUAGES[l].name}</option>`).join('')}
          </select>
        </label>
        <label>Method:
          <select id="live-method" onchange="toggleCustomMethodInput(this.value)">
            <option value="App">📱 App (Busuu/Hangul/Shadowing)</option>
            <option value="Writing">✍️ Writing</option>
            <option value="Shadowing">🗣 Shadowing</option>
            <option value="Reading">📖 Reading</option>
            <option value="Watching">🎬 Watching</option>
            <option value="Music">🎵 Music</option>
            <option value="Grammar">📐 Grammar</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <input type="text" id="live-custom-method" placeholder="Type custom method..." style="display: none; flex: 1; background: var(--bg-input); border: 2px solid var(--border-main); padding: 0.3rem; font-family: var(--font-pixel);">
      </div>

      <div class="live-session-editor">
        <textarea id="live-session-body" placeholder="Start typing your thoughts, what you're learning, or use [[ to link a note..."></textarea>
        <div id="live-session-preview" class="live-preview"></div>
      </div>

      <div class="live-session-footer">
        <button class="save-btn" onclick="endLiveSession()">End Session & Save</button>
      </div>
    </div>
  `;

  // Start the timer
  clearInterval(liveSessionInterval);
  liveSessionInterval = setInterval(() => {
    liveSessionSeconds++;
    document.getElementById('live-timer').textContent = formatTime(liveSessionSeconds);
  }, 1000);

  // Handle Markdown preview + Note Linking
  const textarea = document.getElementById('live-session-body');
  textarea.addEventListener('input', (e) => {
    const val = e.target.value;
    // Basic Markdown Preview
    if (typeof marked !== 'undefined') {
      document.getElementById('live-session-preview').innerHTML = marked.parse(val);
    }
    
    // Check for [[ linking
    const match = val.match(/\[\[([^\]]+)$/); // Match an unclosed [[
    if (match) {
      showLinkSearch(match[1], textarea);
    } else {
      hideLinkSearch();
    }
  });
}
function toggleCustomMethodInput(val) {
  const customInput = document.getElementById('live-custom-method');
  if (customInput) {
    if (val === 'Other') {
      customInput.style.display = 'block';
      customInput.focus();
    } else {
      customInput.style.display = 'none';
      customInput.value = ''; // Clear it if they switch away
    }
  }
}

function formatTime(sec) {
  const h = Math.floor(sec / 3600).toString().padStart(2, '0');
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function cancelLiveSession() {
  if (!confirm('Cancel session? Data will be lost.')) return;
  clearInterval(liveSessionInterval);
  renderNotesPage(); // Reset to normal view
}

function endLiveSession() {
  clearInterval(liveSessionInterval);
  
  const title = document.getElementById('live-session-title').value.trim();
  const body = document.getElementById('live-session-body').value;
  const lang = document.getElementById('live-lang').value;
  
  // Grab the method, checking for custom input
  let method = document.getElementById('live-method').value;
  if (method === 'Other') {
    const customText = document.getElementById('live-custom-method').value.trim();
    if (customText) {
      method = customText; // Override "Other" with the custom text
    }
  }
  
  if (!title) {
    alert('Please enter a title for this session.');
    return;
  }

  // Fill in the draft
  currentNoteDraft.title = title;
  currentNoteDraft.body = body;
  currentNoteDraft.date = localDateStr(); // Use today's date
  currentNoteDraft.tags = [lang, method.toLowerCase()];
  
  currentNoteDraft.sessionStats = {
    time: Math.round(liveSessionSeconds / 60), // Save in minutes
    method: method,
    language: lang
  };

  // Save to Learning Logs
  DATA.learningLogs.push(currentNoteDraft);

  // Push to Daily Log sessions
  const today = currentNoteDraft.date;
  let log = DATA.dailyLogs.find(l => l.date === today);
  if (!log) {
    log = {
      date: today, day: daysBetween(DATA.metadata.experimentStartDate, today) + 1,
      sessions: [], mediaConsumed: [], physiological: {}, koreanOutput: {}, otherLanguagesWords: [], labNote: ''
    };
    DATA.dailyLogs.push(log);
  }
  
  log.sessions = log.sessions || [];
  log.sessions.push({
    startTime: new Date(Date.now() - liveSessionSeconds * 1000).toTimeString().slice(0, 5),
    endTime: new Date().toTimeString().slice(0, 5),
    durationMinutes: Math.max(1, Math.round(liveSessionSeconds / 60)),
    language: LANGUAGES[lang].name,
    activity: method,
    notes: `Learning Log: ${title}`
  });

  saveData(DATA);
  recalculateAll();
  
  // Reset and show the Library
  currentNoteDraft = null;
  setNotesTab('learning');
}
function deleteCurrentNote() {
  if (!confirm('Delete this note permanently?')) return;
  
  let targetArray;
  if (currentNoteType === 'learning') targetArray = DATA.learningLogs;
  else if (currentNoteType === 'literature') targetArray = DATA.literatureNotes;
  else targetArray = DATA.zIndexNotes;

  DATA[targetArray === DATA.learningLogs ? 'learningLogs' : targetArray === DATA.literatureNotes ? 'literatureNotes' : 'zIndexNotes'] = 
    targetArray.filter(n => n.id !== currentNoteDraft.id);
    
  saveData(DATA);
  closeNoteEditor();
  renderNotesPage();
}
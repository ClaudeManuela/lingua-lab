// The memory palace - maybe my best work yet to practice and remember vocabulary
/* ============================================
   MEMORY PALACE — consolidated
   Room picker · slot editing · word assignment
   Learn · Test · Sprint study modes
   ============================================ */

// ─── MODULE STATE ────────────────────────────
let palaceCurrentRoom = null;
let palaceEditMode = false;
let palaceAddingSlot = false;
let palaceSelectedSlotId = null;
let palacePickerState = null;         // { slotId, lang, query, showAll }
let palaceAutoAssignState = null;     // { slotId, sourceWord, suggestions }
let palaceDragState = null;
let palaceStudySession = null;
let palaceTimerInterval = null;
let palaceTick = 0;
let palaceMobileFullscreen = false;
let palaceFullscreenPrompted = false;
let palaceConfirmAbandonPending = false;

// ─── ENTRY POINT ─────────────────────────────
function renderPalace(targetId = 'vocab-content') {
  const container = document.getElementById(targetId);
  if (!container) return;

  if (palaceCurrentRoom) {
    renderPalaceRoom(container, palaceCurrentRoom);
  } else {
    renderPalacePicker(container);
  }
}

function openPalaceRoom(roomId) {
  clearPalaceTimer();
  palaceStudySession = null;
  palaceTick = 0;
  palacePickerState = null;
  palaceAutoAssignState = null;
  palaceMobileFullscreen = false;
  palaceFullscreenPrompted = false;

  palaceCurrentRoom = roomId;
  palaceEditMode = isEditable();
  palaceSelectedSlotId = null;
  renderPalace();
}

function closePalaceRoom() {
  clearPalaceTimer();
  palaceStudySession = null;
  palaceTick = 0;
  palacePickerState = null;
  palaceAutoAssignState = null;
  palaceMobileFullscreen = false;
  palaceFullscreenPrompted = false;

  palaceCurrentRoom = null;
  palaceEditMode = false;
  palaceAddingSlot = false;
  palaceSelectedSlotId = null;
  document.querySelectorAll('.palace-overlay-root').forEach(el => el.remove());
  renderPalace();
}

// ─── ROOM PICKER ─────────────────────────────
function renderPalacePicker(container) {
  const cards = PALACE_ROOMS.map(room => {
    const data = DATA.palaceRooms[room.id] || { slots: [] };
    const totalSlots = data.slots.length;

    const perLang = PALACE_LANGS.map(lang => {
      const filled = data.slots.filter(s => s.words && s.words[lang]).length;
      return { lang, filled, total: totalSlots };
    });

    const totalPairs = PALACE_LANGS.length * totalSlots;
    const filledPairs = perLang.reduce((a, p) => a + p.filled, 0);
    const pct = totalPairs ? Math.round((filledPairs / totalPairs) * 100) : 0;

    return `
      <div class="palace-room-card" onclick="openPalaceRoom('${room.id}')">
        <div class="palace-room-thumb" style="background: ${room.placeholderColor};">
          <div class="palace-room-thumb-icon">${room.icon}</div>
          <div class="palace-room-thumb-count">${totalSlots} slot${totalSlots === 1 ? '' : 's'}</div>
        </div>
        <div class="palace-room-card-body">
          <div class="palace-room-name">${room.name}</div>
          <div class="palace-room-fill-bar">
            ${perLang.map(p => `
              <span class="palace-lang-seg" title="${p.lang}: ${p.filled}/${p.total}"
                    style="flex: ${p.filled || 0.001}; background: ${LANGUAGES[p.lang].accent};">
              </span>
              <span class="palace-lang-seg empty"
                    style="flex: ${(p.total - p.filled) || 0.001};">
              </span>
            `).join('')}
          </div>
          <div class="palace-room-pct">${pct}% filled</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="palace-picker">
      <div class="palace-picker-header">
        <h2>Memory Palace</h2>
        <p class="palace-picker-hint">Pick a room to walk through. Each room is a themed scene with objects you can name in any language.</p>
      </div>
      <div class="palace-room-grid">${cards}</div>
    </div>
  `;
}

// ─── ROOM VIEW ───────────────────────────────
function renderPalaceRoom(container, roomId) {
  const room = PALACE_ROOM_MAP[roomId];
  if (!room) { closePalaceRoom(); return; }
  const data = DATA.palaceRooms[roomId] || { slots: [] };
  const admin = isEditable();
  const showEditPanels = palaceEditMode && admin;

  const slotsWithWords = data.slots.filter(s =>
    s.words && Object.keys(s.words).length > 0
  );
  const canStudy = slotsWithWords.length >= 1;

  container.innerHTML = `
    <div class="palace-room-view">
      <div class="palace-room-toolbar">
        <button class="palace-back-btn" onclick="closePalaceRoom()">← Rooms</button>
        <div class="palace-room-title">${room.icon} ${room.name}</div>
        <div class="palace-room-actions">
          ${admin ? `
            <button class="palace-btn ${palaceEditMode ? 'active' : ''}"
                    onclick="togglePalaceEdit()">
              ${palaceEditMode ? '✓ Done editing' : '✏ Edit'}
            </button>
          ` : ''}
          <button class="palace-btn ${canStudy ? '' : 'disabled'}"
                  ${canStudy ? `onclick="switchToStudyLayout()"` : 'disabled'}
                  title="${canStudy ? 'Start a study session' : 'Assign words to slots first'}">
            ▶ Study
          </button>
        </div>
      </div>

      ${showEditPanels
        ? renderPalaceEditLayout(room, data)
        : renderPalaceStudyLayout(room, data)
      }
    </div>
  `;

  // Overlay mounting block
 document.querySelectorAll('.palace-overlay-root').forEach(el => el.remove());
const pickerHtml  = renderPalaceWordPicker();
const autoHtml    = renderPalaceAutoAssignPrompt();
const abandonHtml = renderPalaceAbandonModal();
const setupHtml   = renderPalaceSetupModal();
if (pickerHtml || autoHtml || abandonHtml || setupHtml) {
  const overlayRoot = document.createElement('div');
  overlayRoot.className = 'palace-overlay-root';
  overlayRoot.innerHTML = pickerHtml + autoHtml + abandonHtml + setupHtml;
  document.body.appendChild(overlayRoot);
}
}

function switchToStudyLayout() {
  palaceEditMode = false;
  palaceStudySession = null;
  palaceTick = 0;
  palaceMobileFullscreen = false;
  palaceFullscreenPrompted = false;
  renderPalace();
}

function togglePalaceEdit() {
  if (!isEditable()) return;
  if (palaceStudySession) {
    clearPalaceTimer();
    palaceStudySession = null;
    palaceTick = 0;
  }
  palaceEditMode = !palaceEditMode;
  if (!palaceEditMode) {
    palaceAddingSlot = false;
    palaceSelectedSlotId = null;
  }
  renderPalace();
}

// ─── EDIT LAYOUT (3 columns) ─────────────────
function renderPalaceEditLayout(room, data) {
  return `
    <div class="palace-edit-layout">
      ${renderPalaceWordsPanel(room, data)}
      ${renderPalaceScenePanel(room, data, true)}
      ${renderPalaceSlotsPanel(room, data)}
    </div>
    ${renderPalaceMobileDrawer(room, data, true)}
  `;
}

function renderPalaceStudyLayout(room, data) {
  const abandonModal = renderPalaceAbandonModal();

  if (isPalaceMobile() && palaceMobileFullscreen && palaceStudySession) {
    return `
      <div class="palace-study-layout fullscreen">
        ${renderPalaceScenePanel(room, data, false)}
        <div class="palace-fullscreen-task">
          ${renderPalaceSessionRunning()}
        </div>
      </div>
      ${abandonModal}
    `;
  }

  if (isPalaceMobile()) {
    return `
      <div class="palace-study-layout mobile">
        ${renderPalaceScenePanel(room, data, false)}
      </div>
      ${renderPalaceMobileStudyDrawer(room, data)}
      ${renderPalaceSetupModal()}
      ${renderPalaceFullscreenPrompt()}
      ${abandonModal}
    `;
  }

  return `
    <div class="palace-study-layout">
      ${renderPalaceScenePanel(room, data, false)}
      ${renderPalaceTaskPanel()}
    </div>
    ${renderPalaceMobileDrawer(room, data, false)}
    ${abandonModal}
  `;
}

// ─── LEFT PANEL — WORDS FOR SELECTED SLOT ────
function renderPalaceWordsPanel(room, data) {
  const slots = data.slots || [];
  const selected = slots.find(s => s.id === palaceSelectedSlotId);

  if (!selected) {
    return `
      <div class="palace-words-panel empty">
        <div class="palace-panel-title">Words</div>
        <div class="palace-panel-empty">Select a slot to see its words.</div>
      </div>
    `;
  }

  return `
    <div class="palace-words-panel">
      <div class="palace-panel-title">Words for <strong>${escapeHtml(selected.label)}</strong></div>
      <div class="palace-words-list">
        ${PALACE_LANGS.map(lang => renderPalaceWordRow(selected, lang)).join('')}
      </div>
    </div>
  `;
}

function renderPalaceWordRow(slot, lang) {
  const meta = LANGUAGES[lang];
  const wordId = slot.words && slot.words[lang];
  const word = wordId ? DATA.vocabulary.find(w => w.id === wordId) : null;

  if (word) {
    const display = formatClusterInline(word) || word.word;
    return `
      <div class="palace-word-row filled">
        <div class="palace-word-row-top">
          <span class="palace-word-lang">${meta.flag} ${meta.name}</span>
          <button class="palace-word-remove"
                  onclick="unassignPalaceWord('${slot.id}', '${lang}')"
                  title="Remove word">×</button>
        </div>
        <div class="palace-word-row-bottom">
          <button class="palace-word-value"
                  onclick="openWordCard('${word.id}')"
                  title="Open word card">
            ${escapeHtml(display)}
          </button>
          <span class="palace-word-meaning">${escapeHtml(word.meaning || '')}</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="palace-word-row empty">
      <div class="palace-word-row-top">
        <span class="palace-word-lang">${meta.flag} ${meta.name}</span>
      </div>
      <div class="palace-word-row-bottom">
        <span class="palace-word-gap">No word assigned</span>
        <button class="palace-word-assign"
                onclick="openPalaceWordPicker('${slot.id}', '${lang}')"
                title="Assign a word">+ Assign</button>
      </div>
    </div>
  `;
}

// ─── MIDDLE PANEL — SCENE ────────────────────
function renderPalaceScenePanel(room, data, editing) {
  const sessionSlotsHtml = palaceStudySession && !palaceStudySession.complete
    ? renderPalaceSlotsSession(data.slots, palaceStudySession)
    : renderPalaceSlots(data.slots, editing, palaceSelectedSlotId);

  return `
    <div class="palace-scene-panel">
      ${renderPalaceFullscreenPrompt()}
      <div class="palace-scene-wrap" id="palace-scene-wrap">
        <div class="palace-scene" id="palace-scene"
             style="background-image: url('${room.background}'); background-color: ${room.placeholderColor};"
             onclick="onPalaceSceneClick(event)">
          ${sessionSlotsHtml}
        </div>
        ${palaceAddingSlot ? `
          <div class="palace-add-slot-banner">
            Click on the scene to place the new slot — <button onclick="cancelAddSlot()">Cancel</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ─── SLOT RENDERING — EDIT MODE ──────────────
function renderPalaceSlots(slots, editing, selectedId) {
  return slots.map(slot => {
    const selected = slot.id === selectedId ? 'selected' : '';
    const pips = PALACE_LANGS.map(lang => {
      const filled = slot.words && slot.words[lang];
      return `<span class="palace-slot-pip ${filled ? 'filled' : 'empty'}"
                    style="${filled ? `background: ${LANGUAGES[lang].accent};` : ''}"
                    title="${LANGUAGES[lang].name}"></span>`;
    }).join('');

    return `
      <div class="palace-slot ${selected}"
           data-slot-id="${slot.id}"
           style="left: ${slot.x}%; top: ${slot.y}%; --slot-color: ${slot.color};"
           onclick="onSlotClick(event, '${slot.id}')">
        <div class="palace-slot-dot"></div>
        ${editing ? `
          <div class="palace-slot-pips">${pips}</div>
          <div class="palace-slot-label">${escapeHtml(slot.label)}</div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function onSlotClick(event, slotId) {
  if (palaceAddingSlot) return;
  if (!palaceEditMode) return;
  event.stopPropagation();
  selectPalaceSlot(slotId);
}

function selectPalaceSlot(slotId) {
  palaceSelectedSlotId = palaceSelectedSlotId === slotId ? null : slotId;
  renderPalace();
}

// ─── RIGHT PANEL — SLOTS + EDITOR + FILL ─────
function renderPalaceSlotsPanel(room, data) {
  const slots = data.slots || [];
  const selected = slots.find(s => s.id === palaceSelectedSlotId);

  return `
    <div class="palace-slots-panel">
      <div class="palace-panel-section">
        <div class="palace-panel-title">Slots (${slots.length})</div>
        <div class="palace-slot-list">
          ${slots.length ? slots.map(s => `
            <div class="palace-slot-row ${s.id === palaceSelectedSlotId ? 'selected' : ''}"
                 onclick="selectPalaceSlot('${s.id}')">
              <span class="palace-slot-swatch" style="background: ${s.color};"></span>
              <span class="palace-slot-row-label">${escapeHtml(s.label)}</span>
              <button class="palace-slot-delete"
                      onclick="event.stopPropagation(); deletePalaceSlot('${s.id}')"
                      title="Delete slot">×</button>
            </div>
          `).join('') : `<div class="palace-empty-msg">No slots yet.</div>`}
        </div>
        <button class="palace-add-slot-btn" onclick="startAddSlot()">+ Add slot</button>
      </div>

      ${selected ? `
        <div class="palace-panel-section">
          <div class="palace-panel-title">Edit slot</div>

          <label class="palace-field">
            <span>Label</span>
            <input type="text" value="${escapeHtml(selected.label)}"
                   onchange="updatePalaceSlotField('${selected.id}', 'label', this.value)">
          </label>

          <div class="palace-field">
            <span>Color</span>
            <div class="palace-color-picker">
              ${SLOT_COLORS.map(c => `
                <button class="palace-color-swatch ${c === selected.color ? 'active' : ''}"
                        style="background: ${c};"
                        onclick="updatePalaceSlotField('${selected.id}', 'color', '${c}')"
                        title="${c}"></button>
              `).join('')}
            </div>
          </div>

          <div class="palace-sidebar-row">
            <span>Position</span>
            <strong>${selected.x}% / ${selected.y}%</strong>
          </div>
        </div>
      ` : ''}

      <div class="palace-panel-section">
        <div class="palace-panel-title">Fill summary</div>
        ${PALACE_LANGS.map(lang => {
          const filled = slots.filter(s => s.words && s.words[lang]).length;
          const total = slots.length;
          const pct = total ? Math.round((filled / total) * 100) : 0;
          return `
            <div class="palace-fill-row">
              <span class="palace-fill-lang">${LANGUAGES[lang].flag} ${LANGUAGES[lang].name}</span>
              <span class="palace-fill-count">${filled}/${total}</span>
              <div class="palace-fill-bar-mini">
                <div class="palace-fill-bar-fill"
                     style="width: ${pct}%; background: ${LANGUAGES[lang].accent};"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ─── MOBILE FULLSCREEN ──────────────────────
function isPalaceMobile() {
  return window.matchMedia('(max-width: 700px)').matches;
}

function togglePalaceFullscreen() {
  palaceMobileFullscreen = !palaceMobileFullscreen;
  renderPalace();
}

function dismissFullscreenPrompt() {
  palaceFullscreenPrompted = true;
  renderPalace();
}

function acceptFullscreenPrompt() {
  palaceMobileFullscreen = true;
  palaceFullscreenPrompted = true;
  renderPalace();
}

function renderPalaceFullscreenPrompt() {
  if (!isPalaceMobile()) return '';
  if (palaceMobileFullscreen) return '';
  if (palaceFullscreenPrompted) return '';
  if (!palaceStudySession || palaceStudySession.complete) return '';
  return `
    <div class="palace-fullscreen-prompt">
      <span>Want a bigger scene for this session?</span>
      <div class="palace-fullscreen-prompt-actions">
        <button class="add-btn small" onclick="acceptFullscreenPrompt()">Fullscreen</button>
        <button class="cancel-btn small" onclick="dismissFullscreenPrompt()">Stay here</button>
      </div>
    </div>
  `;
}

// ─── MOBILE SETUP MODAL ─────────────────────
let palaceSetupModalOpen = false;

function openPalaceSetupModal() {
  palaceSetupModalOpen = true;
  renderPalace();
}

function closePalaceSetupModal() {
  palaceSetupModalOpen = false;
  renderPalace();
}

function renderPalaceSetupModal() {
  if (!palaceSetupModalOpen) return '';
  const room = PALACE_ROOM_MAP[palaceCurrentRoom];
  const data = DATA.palaceRooms[palaceCurrentRoom];
  if (!room || !data) return '';
  return `
    <div class="palace-picker-overlay" onclick="if (event.target === this) closePalaceSetupModal()">
      <div class="palace-picker-panel">
        <div class="palace-picker-header">
          <div class="palace-picker-title">Study: ${room.icon} ${room.name}</div>
          <button class="remove-btn" onclick="closePalaceSetupModal()">X</button>
        </div>
        <div class="palace-setup-modal-body">
          ${renderPalaceSetupPanel(room, data, true)}
        </div>
      </div>
    </div>
  `;
}

// ─── MOBILE DRAWER ───────────────────────────
function renderPalaceMobileDrawer(room, data, editing) {
  if (!editing) {
    // NOTE: mobile study layout is a placeholder until Phase 5.5c-4
    // (full-screen mobile sessions).
    return `
      <div class="palace-mobile-drawer" id="palace-mobile-drawer">
        <button class="palace-drawer-toggle" onclick="togglePalaceDrawer()">
          <span id="palace-drawer-label">Tasks</span>
          <span class="palace-drawer-caret" id="palace-drawer-caret">▾</span>
        </button>
        <div class="palace-drawer-body" id="palace-drawer-body" hidden>
          <div class="palace-drawer-content" id="palace-drawer-content">
            ${renderPalaceTaskPanel()}
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="palace-mobile-drawer" id="palace-mobile-drawer">
      <div class="palace-drawer-tabs">
        <button class="palace-drawer-tab active" data-tab="slots"
                onclick="setPalaceMobileTab('slots')">Slots</button>
        <button class="palace-drawer-tab" data-tab="words"
                onclick="setPalaceMobileTab('words')">Words</button>
      </div>
      <div class="palace-drawer-body">
        <div class="palace-drawer-content" id="palace-drawer-content">
          ${renderPalaceMobileSlotsContent(room, data)}
        </div>
      </div>
    </div>
  `;
}

// ═════════════════════════════════════════════
// MOBILE STUDY DRAWER
// ═════════════════════════════════════════════

function renderPalaceMobileStudyDrawer(room, data) {
  // Running session — drawer shows the current task panel
  if (palaceStudySession && !palaceStudySession.complete) {
    return `
      <div class="palace-mobile-drawer open" id="palace-mobile-drawer">
        <div class="palace-drawer-body">
          <div class="palace-drawer-content" id="palace-drawer-content">
            ${renderPalaceSessionRunning()}
          </div>
        </div>
      </div>
    `;
  }

  // Setup — show a button that opens the setup modal
  return `
    <div class="palace-mobile-drawer" id="palace-mobile-drawer">
      <button class="palace-drawer-toggle" onclick="openPalaceSetupModal()">
        ▶ Start a study session
      </button>
    </div>
  `;
}
function renderPalaceMobileSlotsContent(room, data) {
  return `<div class="palace-slots-panel compact">${renderPalaceSlotsPanel(room, data)}</div>`;
}

function renderPalaceMobileWordsContent(room, data) {
  return `<div class="palace-words-panel compact">${renderPalaceWordsPanel(room, data)}</div>`;
}

function setPalaceMobileTab(tab) {
  document.querySelectorAll('.palace-drawer-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  const content = document.getElementById('palace-drawer-content');
  if (!content) return;
  const data = DATA.palaceRooms[palaceCurrentRoom] || { slots: [] };
  const room = PALACE_ROOM_MAP[palaceCurrentRoom];
  content.innerHTML = tab === 'slots'
    ? renderPalaceMobileSlotsContent(room, data)
    : renderPalaceMobileWordsContent(room, data);
}

function togglePalaceDrawer() {
  const body = document.getElementById('palace-drawer-body');
  const caret = document.getElementById('palace-drawer-caret');
  if (!body) return;
  const hidden = body.hasAttribute('hidden');
  if (hidden) body.removeAttribute('hidden'); else body.setAttribute('hidden', '');
  if (caret) caret.textContent = hidden ? '▴' : '▾';
}

// ─── SLOT PLACEMENT ──────────────────────────
function startAddSlot() {
  if (!isEditable()) return;
  palaceAddingSlot = true;
  palaceSelectedSlotId = null;
  renderPalace();
}

function cancelAddSlot() {
  palaceAddingSlot = false;
  renderPalace();
}

function onPalaceSceneClick(event) {
  if (!palaceAddingSlot || !isEditable()) return;
  if (event.target.closest('.palace-slot')) return;

  const scene = document.getElementById('palace-scene');
  if (!scene) return;
  const rect = scene.getBoundingClientRect();
  const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
  const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);

  createPalaceSlot(palaceCurrentRoom, x, y);
  palaceAddingSlot = false;
}

function createPalaceSlot(roomId, x, y) {
  const data = DATA.palaceRooms[roomId];
  if (!data) return;

  const label = prompt('Slot label (English, e.g., "Counter"):', '');
  if (label === null) { renderPalace(); return; }

  const slot = {
    id: 'slot-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    label: label.trim() || 'Slot',
    x, y,
    color: SLOT_COLORS[data.slots.length % SLOT_COLORS.length],
    words: {}
  };
  data.slots.push(slot);
  palaceSelectedSlotId = slot.id;
  saveData(DATA);
  renderPalace();
}

function deletePalaceSlot(slotId) {
  if (!isEditable()) return;
  if (!confirm('Delete this slot?')) return;
  const data = DATA.palaceRooms[palaceCurrentRoom];
  if (!data) return;
  data.slots = data.slots.filter(s => s.id !== slotId);
  if (palaceSelectedSlotId === slotId) palaceSelectedSlotId = null;
  saveData(DATA);
  renderPalace();
}

function updatePalaceSlotField(slotId, key, value) {
  if (!isEditable()) return;
  const data = DATA.palaceRooms[palaceCurrentRoom];
  if (!data) return;
  const slot = data.slots.find(s => s.id === slotId);
  if (!slot) return;
  slot[key] = value;
  saveData(DATA);
  renderPalace();
}

// ─── SLOT DRAG ───────────────────────────────
document.addEventListener('mousedown', (e) => {
  if (!palaceEditMode || !isEditable()) return;
  const slotEl = e.target.closest('.palace-slot');
  if (!slotEl) return;
  const scene = document.getElementById('palace-scene');
  if (!scene) return;

  palaceDragState = {
    slotId: slotEl.dataset.slotId,
    scene,
    rect: scene.getBoundingClientRect(),
    el: slotEl
  };
  slotEl.classList.add('dragging');
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!palaceDragState) return;
  const { rect, el } = palaceDragState;
  const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
  const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
  el.style.left = x + '%';
  el.style.top = y + '%';
  palaceDragState.lastX = x;
  palaceDragState.lastY = y;
});

document.addEventListener('mouseup', () => {
  if (!palaceDragState) return;
  const { slotId, el, lastX, lastY } = palaceDragState;
  el.classList.remove('dragging');
  palaceDragState = null;

  if (typeof lastX === 'number' && typeof lastY === 'number') {
    const data = DATA.palaceRooms[palaceCurrentRoom];
    if (!data) return;
    const slot = data.slots.find(s => s.id === slotId);
    if (!slot) return;
    slot.x = Math.round(lastX);
    slot.y = Math.round(lastY);
    saveData(DATA);
    renderPalace();
  }
});

// ═════════════════════════════════════════════
// WORD PICKER
// ═════════════════════════════════════════════

function openPalaceWordPicker(slotId, lang) {
  if (!isEditable()) return;
  palacePickerState = { slotId, lang, query: '', showAll: false };
  renderPalace();
}

function closePalaceWordPicker() {
  palacePickerState = null;
  renderPalace();
}

function setPalacePickerQuery(q) {
  if (!palacePickerState) return;
  palacePickerState.query = q;
  const resultsEl = document.getElementById('palace-picker-results');
  if (resultsEl) resultsEl.innerHTML = renderPalacePickerResults();
  const input = document.getElementById('palace-picker-search');
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}

function togglePalacePickerScope() {
  if (!palacePickerState) return;
  palacePickerState.showAll = !palacePickerState.showAll;
  renderPalace();
}

function renderPalaceWordPicker() {
  if (!palacePickerState) return '';
  const meta = LANGUAGES[palacePickerState.lang];
  const room = PALACE_ROOM_MAP[palaceCurrentRoom];
  return `
    <div class="palace-picker-overlay" onclick="if (event.target === this) closePalaceWordPicker()">
      <div class="palace-picker-panel">
        <div class="palace-picker-header">
          <div class="palace-picker-title">${meta.flag} Assign ${meta.name} word</div>
          <button class="remove-btn" onclick="closePalaceWordPicker()">X</button>
        </div>

        <div class="palace-picker-search-row">
          <input type="text" id="palace-picker-search"
                 placeholder="Search word, reading, or meaning…"
                 value="${escapeHtml(palacePickerState.query)}"
                 oninput="setPalacePickerQuery(this.value)"
                 autocomplete="off">
        </div>

        <div class="palace-picker-scope-row">
          <button class="palace-scope-btn ${!palacePickerState.showAll ? 'active' : ''}"
                  onclick="if (palacePickerState.showAll) togglePalacePickerScope()">
            ${room.icon} ${room.name} only
          </button>
          <button class="palace-scope-btn ${palacePickerState.showAll ? 'active' : ''}"
                  onclick="if (!palacePickerState.showAll) togglePalacePickerScope()">
            🌍 All words
          </button>
        </div>

        <div class="palace-picker-results" id="palace-picker-results">
          ${renderPalacePickerResults()}
        </div>

        <div class="palace-picker-footer">
          <button class="add-btn small" onclick="openPalaceCreateWord()">+ Create new word</button>
        </div>
      </div>
    </div>
  `;
}

function renderPalacePickerResults() {
  if (!palacePickerState) return '';
  const { lang, query, showAll } = palacePickerState;
  const room = PALACE_ROOM_MAP[palaceCurrentRoom];

  let pool = (DATA.vocabulary || []).filter(w => w.language === lang);
  if (!showAll) pool = pool.filter(w => w.theme === room.theme);

  if (!pool.length) {
    return `
      <div class="palace-picker-empty">
        No ${LANGUAGES[lang].name} words
        ${showAll ? '' : `tagged <strong>${room.theme}</strong>`} yet.
        <br>
        <button class="add-btn small" style="margin-top:0.5rem;" onclick="openPalaceCreateWord()">
          + Create one
        </button>
      </div>
    `;
  }

  let results;
  if (query && query.trim() && typeof fuzzySearch === 'function') {
    results = fuzzySearch(query, pool);
  } else {
    results = pool.slice()
      .sort((a, b) => (a.word || '').localeCompare(b.word || ''))
      .slice(0, 60);
  }

  if (!results.length) {
    return `<div class="palace-picker-empty">No matches for "${escapeHtml(query)}".</div>`;
  }

  return results.map(w => {
    const display = formatClusterInline(w) || w.word;
    return `
      <div class="palace-picker-result" onclick="assignPalaceWord('${w.id}')">
        <div class="palace-picker-result-main">
          <div class="palace-picker-result-word">${escapeHtml(display)}</div>
          <div class="palace-picker-result-meaning">${escapeHtml(w.meaning || '—')}</div>
        </div>
        <div class="palace-picker-result-meta">
          ${w.theme ? `<span class="palace-picker-theme">${THEME_MAP[w.theme] ? THEME_MAP[w.theme].icon : ''}</span>` : ''}
          <span class="palace-picker-waters">${w.waters || 0}w</span>
        </div>
      </div>
    `;
  }).join('');
}

function assignPalaceWord(wordId) {
  if (!isEditable() || !palacePickerState) return;
  const { slotId, lang } = palacePickerState;
  const room = DATA.palaceRooms[palaceCurrentRoom];
  if (!room) return;
  const slot = room.slots.find(s => s.id === slotId);
  if (!slot) return;

  const pickedWord = DATA.vocabulary.find(w => w.id === wordId);
  if (!pickedWord) return;

  slot.words = slot.words || {};
  slot.words[lang] = wordId;
  saveData(DATA);

  const suggestions = findRelatedWords(pickedWord);
  if (suggestions.length) {
    showPalaceAutoAssignPrompt(slotId, pickedWord, suggestions);
  } else {
    palacePickerState = null;
    renderPalace();
  }
}

function unassignPalaceWord(slotId, lang) {
  if (!isEditable()) return;
  const room = DATA.palaceRooms[palaceCurrentRoom];
  if (!room) return;
  const slot = room.slots.find(s => s.id === slotId);
  if (!slot || !slot.words) return;
  if (!confirm(`Remove the ${LANGUAGES[lang].name} word from this slot?`)) return;
  delete slot.words[lang];
  saveData(DATA);
  renderPalace();
}

// ─── AUTO-SUGGEST ────────────────────────────
function findRelatedWords(sourceWord) {
  const srcMeaning = (sourceWord.meaning || '').trim().toLowerCase();
  const connections = new Set(sourceWord.connections || []);
  const suggestions = [];

  for (const w of DATA.vocabulary) {
    if (w.id === sourceWord.id) continue;
    if (w.language === sourceWord.language) continue;
    if (!w.meaning) continue;

    const sameMeaning = srcMeaning && w.meaning.trim().toLowerCase() === srcMeaning;
    const isConnected = connections.has(w.id);
    if (sameMeaning || isConnected) suggestions.push(w);
  }
  return suggestions;
}

function showPalaceAutoAssignPrompt(slotId, sourceWord, suggestions) {
  palaceAutoAssignState = { slotId, sourceWord, suggestions };
  renderPalace();
}

function renderPalaceAutoAssignPrompt() {
  if (!palaceAutoAssignState) return '';
  const { sourceWord, suggestions } = palaceAutoAssignState;
  return `
    <div class="palace-picker-overlay" onclick="if (event.target === this) closeAutoAssign()">
      <div class="palace-picker-panel narrow">
        <div class="palace-picker-header">
          <div class="palace-picker-title">Also assign these?</div>
          <button class="remove-btn" onclick="closeAutoAssign()">X</button>
        </div>
        <div class="palace-auto-body">
          <p class="palace-auto-hint">
            You assigned <strong>${escapeHtml(formatClusterInline(sourceWord) || sourceWord.word)}</strong>.
            These words share its meaning or are Garden-connected:
          </p>
          <div class="palace-auto-list">
            ${suggestions.map(w => `
              <div class="palace-auto-row">
                <input type="checkbox" class="palace-auto-check" data-word-id="${w.id}" checked>
                <span class="palace-auto-flag">${LANGUAGES[w.language].flag}</span>
                <span class="palace-auto-word">${escapeHtml(formatClusterInline(w) || w.word)}</span>
                <span class="palace-auto-meaning">— ${escapeHtml(w.meaning || '')}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="palace-picker-footer">
          <button class="save-btn" onclick="confirmAutoAssign()">Assign checked</button>
          <button class="cancel-btn" onclick="closeAutoAssign()">Skip</button>
        </div>
      </div>
    </div>
  `;
}

function confirmAutoAssign() {
  if (!palaceAutoAssignState) return;
  const { slotId } = palaceAutoAssignState;
  const room = DATA.palaceRooms[palaceCurrentRoom];
  if (!room) return;
  const slot = room.slots.find(s => s.id === slotId);
  if (!slot) return;

  slot.words = slot.words || {};
  document.querySelectorAll('.palace-auto-check:checked').forEach(cb => {
    const wordId = cb.dataset.wordId;
    const word = DATA.vocabulary.find(w => w.id === wordId);
    if (word) slot.words[word.language] = wordId;
  });

  saveData(DATA);
  palaceAutoAssignState = null;
  palacePickerState = null;
  renderPalace();
}

function closeAutoAssign() {
  palaceAutoAssignState = null;
  palacePickerState = null;
  renderPalace();
}

// ─── INLINE CREATE ───────────────────────────
function openPalaceCreateWord() {
  if (!palacePickerState || !isEditable()) return;
  const { lang } = palacePickerState;
  const room = PALACE_ROOM_MAP[palaceCurrentRoom];

  const wordText = prompt(`New ${LANGUAGES[lang].name} word:`);
  if (!wordText) return;
  const meaning = prompt(`Meaning (English):`, '') || '';
  const reading = prompt(`Reading (optional, e.g., romanization):`, '') || '';

  const pos = findAutoPosition(lang);
  const newWord = {
    id: generateUUID(),
    word: wordText.trim(),
    meaning: meaning.trim(),
    reading: reading.trim(),
    language: lang,
    dateAdded: new Date().toISOString().slice(0, 10),
    waters: 1,
    lastWatered: new Date().toISOString().slice(0, 10),
    stage: 'sprout',
    parentId: null,
    childIds: [],
    connections: [],
    favorite: false,
    notes: '',
    backlog: false,
    gardenX: pos.x,
    gardenY: pos.y,
    theme: room.theme,
    wordType: '',
    gender: '',
    number: '',
    article: '',
    forms: []
  };
  DATA.vocabulary.push(newWord);
  saveData(DATA);

  const roomData = DATA.palaceRooms[palaceCurrentRoom];
  const slot = roomData.slots.find(s => s.id === palacePickerState.slotId);
  if (slot) {
    slot.words = slot.words || {};
    slot.words[lang] = newWord.id;
    saveData(DATA);
  }

  palacePickerState = null;
  renderPalace();
}

// ═════════════════════════════════════════════
// STUDY SESSION — SETUP
// ═════════════════════════════════════════════

function renderPalaceSetupPanel(room, data, isModal = false) {
  const slotsWithWords = data.slots.filter(s =>
    s.words && Object.keys(s.words).length > 0
  );
  if (!slotsWithWords.length) {
    return `
      <div class="palace-task-panel-inner">
        <div class="palace-task-title">Study: ${room.icon} ${room.name}</div>
        <p class="palace-task-hint">
          No slots have words assigned yet.
          Switch to <strong>✏ Edit</strong> mode to assign words to slots first.
        </p>
      </div>
    `;
  }

  const langOptions = PALACE_LANGS.map(slug => {
    const meta = LANGUAGES[slug];
    const count = slotsWithWords.filter(s => s.words[slug]).length;
    return `<option value="${slug}" ${count === 0 ? 'disabled' : ''}>
      ${meta.flag} ${meta.name} (${count})
    </option>`;
  }).join('');

  const defaultLang = PALACE_LANGS.find(slug =>
    slotsWithWords.some(s => s.words[slug])
  );
  const maxItems = slotsWithWords.filter(s => s.words[defaultLang]).length;

  return `
    <div class="palace-task-panel-inner">
      <div class="palace-task-title">Study: ${room.icon} ${room.name}</div>

      <div class="palace-task-form">
        <label class="palace-task-field">
          <span>Mode</span>
          <div class="palace-task-radio-group">
            <label>
              <input type="radio" name="palace-mode" value="learn" checked
                     onchange="onPalaceModeChange()">
              Learn — walk through, grade each item
            </label>
            <label>
              <input type="radio" name="palace-mode" value="test"
                     onchange="onPalaceModeChange()">
              Test — find items from a list
            </label>
          </div>
        </label>

        <label class="palace-task-field">
          <span>Language</span>
          <select id="palace-setup-lang" onchange="onPalaceSetupLangChange()">
            ${langOptions}
          </select>
        </label>

        <label class="palace-task-field">
          <span>Items</span>
          <input type="number" id="palace-setup-items" min="1" max="${maxItems}"
                 value="${Math.min(10, maxItems)}">
        </label>

        <div id="palace-test-options" class="palace-task-test-options" hidden>
          <div class="palace-task-subtitle">Test options</div>

          <label class="palace-task-field">
            <span>Order</span>
            <select id="palace-setup-order">
              <option value="ordered">Ordered — find them in sequence</option>
              <option value="random" selected>Random — find them in any order</option>
            </select>
          </label>

          <label class="palace-task-field">
            <span>Timer</span>
            <select id="palace-setup-timer">
              <option value="untimed" selected>Untimed</option>
              <option value="sprint">60-second sprint</option>
            </select>
          </label>

          <label class="palace-task-field">
            <span>Difficulty</span>
            <select id="palace-setup-difficulty">
              <option value="normal" selected>Normal — dots visible</option>
              <option value="hard">Hard — dots hidden until found</option>
            </select>
          </label>
        </div>
      </div>

      <div class="palace-task-actions">
        <button class="save-btn"
                onclick="${isModal ? 'startPalaceSessionFromModal()' : 'startPalaceSessionFromSetup()'}">
          Start session
        </button>
      </div>
    </div>
  `;
}

function startPalaceSessionFromModal() {
  palaceSetupModalOpen = false;
  startPalaceSessionFromSetup();
}

function onPalaceModeChange() {
  const mode = document.querySelector('input[name="palace-mode"]:checked')?.value;
  const testOptions = document.getElementById('palace-test-options');
  if (testOptions) testOptions.hidden = mode !== 'test';
}

function onPalaceSetupLangChange() {
  const lang = document.getElementById('palace-setup-lang').value;
  const data = DATA.palaceRooms[palaceCurrentRoom];
  if (!data) return;
  const count = data.slots.filter(s => s.words && s.words[lang]).length;
  const itemsInput = document.getElementById('palace-setup-items');
  if (itemsInput) {
    itemsInput.max = count;
    if (parseInt(itemsInput.value) > count) itemsInput.value = count;
  }
}

function startPalaceSessionFromSetup() {
  const mode = document.querySelector('input[name="palace-mode"]:checked')?.value;
  const language = document.getElementById('palace-setup-lang').value;
  const itemCount = Math.max(1, parseInt(document.getElementById('palace-setup-items').value) || 10);

  const data = DATA.palaceRooms[palaceCurrentRoom];
  if (!data) return;

  const eligible = data.slots.filter(s => s.words && s.words[language]);
  if (!eligible.length) {
    alert(`No ${LANGUAGES[language].name} words assigned in this room.`);
    return;
  }

  const pool = eligible.map(s => ({ slotId: s.id, wordId: s.words[language] }));
  shuffle(pool);
  const items = pool.slice(0, Math.min(itemCount, pool.length));

  if (mode === 'learn') {
    startPalaceSession({ mode: 'learn', roomId: palaceCurrentRoom, language, items });
  } else {
    const order = document.getElementById('palace-setup-order').value;
    const timer = document.getElementById('palace-setup-timer').value;
    const difficulty = document.getElementById('palace-setup-difficulty').value;

    let testMode = 'test-random';
    if (order === 'ordered') testMode = 'test-ordered';
    if (timer === 'sprint') testMode = 'test-sprint';

    startPalaceSession({
      mode: testMode,
      roomId: palaceCurrentRoom,
      language,
      items,
      difficulty,
      sprint: timer === 'sprint'
    });
  }
}

// ═════════════════════════════════════════════
// STUDY SESSION — LIFECYCLE
// ═════════════════════════════════════════════

function startPalaceSession({ mode, roomId, language, items, difficulty = 'normal', sprint = false }) {
  palaceStudySession = {
    id: 'palace-' + Date.now(),
    mode,
    roomId,
    language,
    items,
    difficulty,
    sprint,
    date: new Date().toISOString().slice(0, 10),
    startTime: new Date().toTimeString().slice(0, 5),

    currentIndex: 0,
    results: [],
    wrongTries: 0,
    pendingMiss: false,
    revealed: false,

    itemStartTime: Date.now(),
    elapsedSeconds: 0,
    complete: false
  };

  palaceTick = sprint ? 60 : 0;
  palaceMobileFullscreen = false;
  palaceFullscreenPrompted = false;
  startPalaceTimer();
  renderPalace();
}

function startPalaceTimer() {
  clearPalaceTimer();
  palaceTimerInterval = setInterval(() => {
    if (!palaceStudySession || palaceStudySession.complete) {
      clearPalaceTimer();
      return;
    }

    if (palaceStudySession.sprint && palaceStudySession.mode === 'test-sprint') {
      palaceTick--;
      if (palaceTick <= 0) {
        palaceTick = 0;
        clearPalaceTimer();
        completePalaceSession();
        return;
      }
    } else {
      palaceTick++;
    }

    const el = document.getElementById('palace-session-timer');
    if (el) {
      el.textContent = formatPalaceTime(palaceTick);
      if (palaceStudySession.sprint && palaceTick <= 10) el.classList.add('urgent');
      else el.classList.remove('urgent');
    }
  }, 1000);
}

function clearPalaceTimer() {
  if (palaceTimerInterval) {
    clearInterval(palaceTimerInterval);
    palaceTimerInterval = null;
  }
}

function formatPalaceTime(sec) {
  const abs = Math.abs(sec);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function requestAbandonPalaceSession() {
  if (!palaceStudySession) return;
  palaceConfirmAbandonPending = true;
  renderPalace();
}

function closeAbandonConfirm() {
  palaceConfirmAbandonPending = false;
  renderPalace();
}

function confirmAbandonPalaceSession() {
  palaceConfirmAbandonPending = false;
  if (!palaceStudySession) return;
  clearPalaceTimer();
  palaceStudySession = null;
  palaceTick = 0;
  renderPalace();
}

function renderPalaceAbandonModal() {
  if (!palaceConfirmAbandonPending) return '';
  return `
    <div class="palace-picker-overlay" onclick="if (event.target === this) closeAbandonConfirm()">
      <div class="palace-picker-panel narrow">
        <div class="palace-picker-header">
          <div class="palace-picker-title">Abandon session?</div>
          <button class="remove-btn" onclick="closeAbandonConfirm()">X</button>
        </div>
        <div class="palace-auto-body">
          <p class="palace-auto-hint">
            Your progress on this session will not be saved to the log.
            Words you already studied keep their waters.
          </p>
        </div>
        <div class="palace-picker-footer">
          <button class="cancel-btn" onclick="closeAbandonConfirm()">Keep studying</button>
          <button class="delete-btn" onclick="confirmAbandonPalaceSession()">Abandon</button>
        </div>
      </div>
    </div>
  `;
}

function completePalaceSession() {
  const s = palaceStudySession;
  if (!s) return;

  clearPalaceTimer();
  s.complete = true;
  s.elapsedSeconds = palaceTick;
  s.durationMinutes = Math.max(1, Math.round(Math.abs(palaceTick) / 60));

  const summary = buildPalaceSessionSummary(s);
  if (!Array.isArray(DATA.studySessions)) DATA.studySessions = [];
  DATA.studySessions.push(summary);

  appendPalaceSessionToLog(s, summary);

  saveData(DATA);

  // Refresh page-level stats so the cover and TOC update
  if (typeof recalculateAll === 'function') DATA = recalculateAll();
  if (typeof updateCoverPage === 'function') updateCoverPage();
  if (typeof updateTOCPage === 'function') updateTOCPage();

  renderPalace();
}

function buildPalaceSessionSummary(s) {
  const knew = s.results.filter(r => r.grade === 3).length;
  const almost = s.results.filter(r => r.grade === 2).length;
  const didntKnow = s.results.filter(r => r.grade === 1).length;
  const found = s.results.filter(r => r.grade === 2).length;   // test correct
  const missed = s.results.filter(r => r.grade === 0).length;  // test missed

  const isLearn = s.mode === 'learn';
  const accuracy = isLearn
    ? (s.results.length ? Math.round(((knew + almost) / s.results.length) * 100) : 0)
    : (s.items.length ? Math.round((found / s.items.length) * 100) : 0);

  const watersAdded = s.results.reduce((a, r) => a + (r.newWaters - r.oldWaters), 0);

  return {
    id: s.id,
    mode: 'palace-' + s.mode,
    roomId: s.roomId,
    language: s.language,
    date: s.date,
    startTime: s.startTime,
    durationMinutes: s.durationMinutes,
    itemsReviewed: s.items.length,
    knew, almost, didntKnow,
    found, missed,
    accuracy,
    watersAdded,
    results: s.results.slice()
  };
}

function appendPalaceSessionToLog(s, summary) {
  const today = s.date;
  let log = DATA.dailyLogs.find(l => l.date === today);

  const langName = LANGUAGES[s.language].name;
  const roomName = PALACE_ROOM_MAP[s.roomId]?.name || s.roomId;
  const modeLabel = s.mode === 'learn' ? 'Learn' :
                    s.mode === 'test-ordered' ? 'Test (ordered)' :
                    s.mode === 'test-random' ? 'Test (random)' :
                    s.mode === 'test-sprint' ? 'Test (sprint)' : s.mode;

  const sessionEntry = {
    startTime: s.startTime,
    endTime: '',
    durationMinutes: s.durationMinutes,
    language: langName,
    activity: 'Memory Palace',
    customActivity: '',
    subtitleLanguage: '',
    splitTime: false,
    notes: `Palace ${modeLabel}: ${roomName}, ${summary.itemsReviewed} items, ${summary.accuracy}% accuracy`
  };

  if (log) {
    log.sessions = log.sessions || [];
    log.sessions.push(sessionEntry);
  } else {
    DATA.dailyLogs.push({
      date: today,
      day: daysBetween(DATA.metadata.experimentStartDate, today) + 1,
      createdAt: new Date().toISOString(),
      backlog: false,
      confidence: 'HIGH',
      sessions: [sessionEntry],
      mediaConsumed: [],
      physiological: {},
      koreanOutput: {},
      otherLanguagesWords: [],
      labNote: ''
    });
  }
}

// ═════════════════════════════════════════════
// TASK PANEL
// ═════════════════════════════════════════════

function renderPalaceTaskPanel() {
  const room = PALACE_ROOM_MAP[palaceCurrentRoom];
  const data = DATA.palaceRooms[palaceCurrentRoom];
  if (!room || !data) return '<div class="palace-task-panel"></div>';

  let content;
  if (!palaceStudySession) {
    content = renderPalaceSetupPanel(room, data);
  } else if (palaceStudySession.complete) {
    content = renderPalaceSessionComplete();
  } else {
    content = renderPalaceSessionRunning();
  }

  return `<div class="palace-task-panel" id="palace-task-panel">${content}</div>`;
}

function renderPalaceSessionRunning() {
  const s = palaceStudySession;
  if (!s) return '';
  return s.mode === 'learn'
    ? renderPalaceLearnRunning()
    : renderPalaceTestRunning();
}

// ─── LEARN MODE — task panel ─────────────────
function renderPalaceLearnRunning() {
  const s = palaceStudySession;
  const current = s.items[s.currentIndex];
  if (!current) return '<div class="palace-task-panel-inner">Complete.</div>';

  const total = s.items.length;
  const cardNum = s.currentIndex + 1;
  const word = DATA.vocabulary.find(w => w.id === current.wordId);
  const revealed = s.revealed === true;

  const pct = Math.round(((cardNum - 1) / total) * 100);

  const revealBlock = revealed && word
    ? `
      <div class="palace-learn-reveal">
        <div class="palace-learn-word">${escapeHtml(formatClusterInline(word) || word.word)}</div>
        ${word.reading ? `<div class="palace-learn-reading">(${escapeHtml(word.reading)})</div>` : ''}
        <div class="palace-learn-meaning">${escapeHtml(word.meaning || '—')}</div>
      </div>
      <div class="palace-learn-grades">
        <button class="study-grade didnt" onclick="gradePalaceLearn(1)">Didn't know</button>
        <button class="study-grade almost" onclick="gradePalaceLearn(2)">Almost</button>
        <button class="study-grade knew" onclick="gradePalaceLearn(3)">Knew it</button>
      </div>
    `
    : `
      <div class="palace-learn-prompt">
        <div class="palace-learn-prompt-text">What's this?</div>
        <div class="palace-learn-prompt-hint">Tap the pulsing slot</div>
      </div>
    `;

  return `
    <div class="palace-task-panel-inner">
      <div class="palace-task-title">Learn — ${LANGUAGES[s.language].flag} ${LANGUAGES[s.language].name}</div>

      <div class="palace-learn-progress">
        <div class="palace-learn-progress-label">${cardNum} / ${total}</div>
        <div class="palace-learn-progress-bar">
          <div class="palace-learn-progress-fill" style="width: ${pct}%"></div>
        </div>
      </div>

      ${revealBlock}

           <div class="palace-task-timer" id="palace-session-timer">${formatPalaceTime(palaceTick)}</div>

      <div class="palace-task-actions">
        ${isPalaceMobile() ? `
          <button class="palace-btn" onclick="togglePalaceFullscreen()">
            ${palaceMobileFullscreen ? '⛶ Exit fullscreen' : '⛶ Fullscreen'}
          </button>
        ` : ''}
        <button class="cancel-btn" onclick="requestAbandonPalaceSession()">Abandon</button>
      </div>
    </div>
  `;
}

// ─── TEST MODE — task panel ──────────────────
function renderPalaceTestRunning() {
  const s = palaceStudySession;
  if (!s) return '';

  const total = s.items.length;
  const foundCount = s.results.filter(r => r.grade === 2).length;

  const modeLabel = s.mode === 'test-ordered' ? 'Test (ordered)' :
                    s.mode === 'test-random'  ? 'Test (random)'  :
                    s.mode === 'test-sprint'  ? 'Test (sprint)'  : 'Test';

  const listHtml = s.items.map((item, i) => {
    const word = DATA.vocabulary.find(w => w.id === item.wordId);
    if (!word) return '';
    const display = formatClusterInline(word) || word.word;
    const wasFound = s.results.some(r => r.slotId === item.slotId && r.grade === 2);
    const wasMissed = s.results.some(r => r.slotId === item.slotId && r.grade === 0);
    const isCurrent = s.mode === 'test-ordered' && i === s.currentIndex;

    let cls = 'palace-test-item';
    if (wasFound) cls += ' found';
    else if (wasMissed) cls += ' missed';
    if (isCurrent) cls += ' current';

    const marker = wasFound ? '✓' : wasMissed ? '✗' : isCurrent ? '▶' : '▢';

    return `
      <div class="${cls}">
        <span class="palace-test-marker">${marker}</span>
        <span class="palace-test-word">${escapeHtml(display)}</span>
      </div>
    `;
  }).join('');

  const isSprint = s.mode === 'test-sprint';

  return `
    <div class="palace-task-panel-inner">
      <div class="palace-task-title">${modeLabel} — ${LANGUAGES[s.language].flag} ${LANGUAGES[s.language].name}</div>

      <div class="palace-learn-progress">
        <div class="palace-learn-progress-label">Found ${foundCount} / ${total}</div>
        <div class="palace-learn-progress-bar">
          <div class="palace-learn-progress-fill"
               style="width: ${Math.round((foundCount / total) * 100)}%"></div>
        </div>
      </div>

      <div class="palace-test-list">${listHtml}</div>

          <div class="palace-task-timer ${isSprint ? 'sprint' : ''}" id="palace-session-timer">
        ${formatPalaceTime(palaceTick)}
      </div>

      <div class="palace-task-actions">
        ${isPalaceMobile() ? `
          <button class="palace-btn" onclick="togglePalaceFullscreen()">
            ${palaceMobileFullscreen ? '⛶ Exit fullscreen' : '⛶ Fullscreen'}
          </button>
        ` : ''}
        <button class="cancel-btn" onclick="requestAbandonPalaceSession()">Abandon</button>
      </div>
    </div>
  `;
}

// ─── SESSION — SCENE RENDERING ───────────────
function renderPalaceSlotsSession(slots, session) {
  const isLearn = session.mode === 'learn';
  const isHard = session.difficulty === 'hard' && !isLearn;

  return slots.map(slot => {
    const isItem = session.items.some(it => it.slotId === slot.id);
    const result = session.results.find(r => r.slotId === slot.id);
    const wasFound = result && result.grade === 2;
    const wasMissed = result && result.grade === 0;

    if (isLearn) {
      const current = session.items[session.currentIndex];
      const isActive = current && slot.id === current.slotId;
      const revealed = isActive && session.revealed === true;
      const stateClass = isActive ? (revealed ? 'active revealed' : 'active pulsing') : 'pale';
      return `
        <div class="palace-slot session ${stateClass}"
             data-slot-id="${slot.id}"
             style="left: ${slot.x}%; top: ${slot.y}%; --slot-color: ${slot.color};"
             onclick="onPalaceSessionSlotClick(event, '${slot.id}')">
          <div class="palace-slot-dot"></div>
        </div>
      `;
    }

    // Test mode
    let cls = 'palace-slot session test';
    let marker = '';

    if (wasFound) { cls += ' found'; marker = '✓'; }
    else if (wasMissed) { cls += ' missed'; marker = '✗'; }
    else if (isHard && !isItem) { cls += ' hidden-hard'; }
    else if (isHard && isItem) { cls += ' faint'; }
    else { cls += ' visible'; }

    return `
      <div class="${cls}"
           data-slot-id="${slot.id}"
           style="left: ${slot.x}%; top: ${slot.y}%; --slot-color: ${slot.color};"
           onclick="onPalaceSessionSlotClick(event, '${slot.id}')">
        <div class="palace-slot-dot"></div>
        ${marker ? `<div class="palace-slot-marker">${marker}</div>` : ''}
      </div>
    `;
  }).join('');
}

function onPalaceSessionSlotClick(event, slotId) {
  if (!palaceStudySession || palaceStudySession.complete) return;
  event.stopPropagation();
  if (palaceStudySession.mode === 'learn') {
    handlePalaceLearnSlotTap(slotId);
  } else {
    handlePalaceTestSlotClick(slotId);
  }
}

function flashSlotWrong(slotId) {
  const el = document.querySelector(`.palace-slot[data-slot-id="${slotId}"]`);
  if (!el) return;
  el.classList.add('wrong-flash');
  setTimeout(() => el.classList.remove('wrong-flash'), 400);
}

function flashSlotAlreadyFound(slotId) {
  const el = document.querySelector(`.palace-slot[data-slot-id="${slotId}"]`);
  if (!el) return;
  el.classList.add('already-found-flash');
  setTimeout(() => el.classList.remove('already-found-flash'), 400);
}

// ─── LEARN MODE ACTIONS ──────────────────────
function handlePalaceLearnSlotTap(slotId) {
  const s = palaceStudySession;
  if (!s || s.mode !== 'learn' || s.complete) return;

  const current = s.items[s.currentIndex];
  if (!current) return;
  if (s.revealed) return;

  if (slotId === current.slotId) {
    s.revealed = true;
    renderPalace();
  } else {
    flashSlotWrong(slotId);
  }
}

function gradePalaceLearn(grade) {
  const s = palaceStudySession;
  if (!s || s.mode !== 'learn' || s.complete) return;

  const current = s.items[s.currentIndex];
  if (!current) return;

  const word = DATA.vocabulary.find(w => w.id === current.wordId);
  if (!word) {
    s.currentIndex++;
    s.revealed = false;
    if (s.currentIndex >= s.items.length) completePalaceSession();
    else renderPalace();
    return;
  }

  const oldWaters = word.waters || 0;
  const oldStage = word.stage || 'seed';
  const today = new Date().toISOString().slice(0, 10);

  const add = grade === 1 ? 1 : grade === 2 ? 2 : 3;
  word.waters = oldWaters + add;
  word.lastWatered = today;
  if (typeof updateWordStage === 'function') updateWordStage(word);

  s.results.push({
    slotId: current.slotId,
    wordId: current.wordId,
    grade,
    oldWaters,
    newWaters: word.waters,
    oldStage,
    newStage: word.stage
  });

  saveData(DATA);

  s.currentIndex++;
  s.revealed = false;

  if (s.currentIndex >= s.items.length) completePalaceSession();
  else renderPalace();
}

// ─── TEST MODE ACTIONS ───────────────────────
function handlePalaceTestSlotClick(slotId) {
  const s = palaceStudySession;
  if (!s || s.complete || s.mode === 'learn') return;

  if (s.results.some(r => r.slotId === slotId && r.grade === 2)) {
    flashSlotAlreadyFound(slotId);
    return;
  }

  const wordId = findWordIdForSlot(slotId);
  if (!wordId) { flashSlotWrong(slotId); return; }

  const item = s.items.find(it => it.slotId === slotId);
  if (!item) { flashSlotWrong(slotId); return; }

  if (s.mode === 'test-ordered') {
    if (s.pendingMiss) return;
    const target = s.items[s.currentIndex];
    if (slotId === target.slotId) {
      recordTestCorrect(slotId, wordId);
    } else {
      s.wrongTries = (s.wrongTries || 0) + 1;
      flashSlotWrong(slotId);
      if (s.wrongTries >= 3) {
        s.pendingMiss = true;
        const correctSlot = document.querySelector(`.palace-slot[data-slot-id="${target.slotId}"]`);
        if (correctSlot) {
          correctSlot.classList.add('reveal-hint');
          setTimeout(() => correctSlot.classList.remove('reveal-hint'), 1800);
        }
        setTimeout(() => {
          s.pendingMiss = false;
          recordTestMissed(target.slotId, target.wordId);
        }, 1600);
      }
    }
  } else {
    recordTestCorrect(slotId, wordId);
  }
}

function findWordIdForSlot(slotId) {
  const data = DATA.palaceRooms[palaceCurrentRoom];
  if (!data) return null;
  const slot = data.slots.find(s => s.id === slotId);
  if (!slot || !slot.words) return null;
  return slot.words[palaceStudySession.language] || null;
}

function recordTestCorrect(slotId, wordId) {
  const s = palaceStudySession;
  const word = DATA.vocabulary.find(w => w.id === wordId);
  if (!word) return;

  const oldWaters = word.waters || 0;
  const oldStage = word.stage || 'seed';
  const today = new Date().toISOString().slice(0, 10);
  const add = 2;
  word.waters = oldWaters + add;
  word.lastWatered = today;
  if (typeof updateWordStage === 'function') updateWordStage(word);

  s.results.push({
    slotId, wordId,
    grade: 2,
    oldWaters,
    newWaters: word.waters,
    oldStage,
    newStage: word.stage,
    timeMs: Date.now() - s.itemStartTime
  });

  saveData(DATA);

  if (s.mode === 'test-ordered') s.currentIndex++;
  s.wrongTries = 0;
  s.itemStartTime = Date.now();

  const foundCount = s.results.filter(r => r.grade === 2).length;
  if (foundCount >= s.items.length) completePalaceSession();
  else renderPalace();
}

function recordTestMissed(slotId, wordId) {
  const s = palaceStudySession;
  const word = DATA.vocabulary.find(w => w.id === wordId);
  if (!word) return;

  s.results.push({
    slotId, wordId,
    grade: 0,
    oldWaters: word.waters || 0,
    newWaters: word.waters || 0,
    oldStage: word.stage || 'seed',
    newStage: word.stage || 'seed',
    timeMs: Date.now() - s.itemStartTime
  });

  saveData(DATA);

  if (s.mode === 'test-ordered') s.currentIndex++;
  s.wrongTries = 0;
  s.itemStartTime = Date.now();

  const resolved = s.results.filter(r => r.grade === 2 || r.grade === 0).length;
  if (resolved >= s.items.length) completePalaceSession();
  else renderPalace();
}

// ─── COMPLETE SCREEN ─────────────────────────


// ─── COMPLETION TIERS ────────────────────────
function getPalaceCompletionTier(accuracy) {
  if (accuracy >= 80) return { slug: 'perfect',   label: 'Perfect! 🏆' };
  if (accuracy >= 60) return { slug: 'great',     label: 'Excellent! ⭐' };
  if (accuracy >= 50) return { slug: 'good',      label: 'Nice work! 🌱' };
  if (accuracy >= 30) return { slug: 'goodstart', label: 'Good start! 💪' };
  return                     { slug: 'wompwomp',  label: 'Fresh start! 🌿' };
}

function renderPalaceSessionComplete() {
  const s = palaceStudySession;
  if (!s) return '';
  const summary = buildPalaceSessionSummary(s);
  const room = PALACE_ROOM_MAP[s.roomId];
  const tier = getPalaceCompletionTier(summary.accuracy);

  const isLearn = s.mode === 'learn';

  const learnStats = isLearn ? `
    <div><span>Knew it</span><strong>${summary.knew}</strong></div>
    <div><span>Almost</span><strong>${summary.almost}</strong></div>
    <div><span>Didn't know</span><strong>${summary.didntKnow}</strong></div>
    <div><span>Recall rate</span><strong>${summary.accuracy}%</strong></div>
  ` : `
    <div><span>Found</span><strong>${summary.found}</strong></div>
    <div><span>Missed</span><strong>${summary.missed}</strong></div>
    <div><span>Accuracy</span><strong>${summary.accuracy}%</strong></div>
  `;

  const modeTitle = s.mode === 'learn' ? 'Learn' :
                    s.mode === 'test-ordered' ? 'Test (ordered)' :
                    s.mode === 'test-random'  ? 'Test (random)' :
                    s.mode === 'test-sprint'  ? 'Test (sprint)' : s.mode;

  const sprintNote = s.mode === 'test-sprint'
    ? (summary.found >= summary.itemsReviewed
        ? `<div class="palace-sprint-note">⚡ Found all ${summary.found} in ${s.elapsedSeconds}s</div>`
        : `<div class="palace-sprint-note">⚡ Time's up — found ${summary.found} of ${summary.itemsReviewed}</div>`)
    : '';

  const stageChanges = s.results
    .filter(r => r.oldStage !== r.newStage && r.newStage)
    .slice(0, 5);

  const changesHtml = stageChanges.length
    ? stageChanges.map(c => {
        const w = DATA.vocabulary.find(v => v.id === c.wordId);
        const label = w ? (formatClusterInline(w) || w.word) : c.wordId;
        const stageLabel = (typeof STAGE_LABELS !== 'undefined' && STAGE_LABELS[c.newStage])
          || c.newStage;
        return `
          <div class="palace-complete-change">
            🌱 ${escapeHtml(label)} (${c.oldWaters} → ${c.newWaters}) → ${stageLabel}
          </div>
        `;
      }).join('')
    : '<div class="palace-complete-empty">No stage changes this session.</div>';

  return `
    <div class="palace-task-panel-inner palace-complete" data-tier="${tier.slug}">
      <div class="palace-complete-gif">
        <img src="assets/palace/complete-${tier.slug}.gif"
             alt=""
             onerror="this.style.display='none'; this.parentElement.classList.add('fallback');">
        <div class="palace-complete-gif-fallback">${tier.label}</div>
      </div>

      <div class="palace-task-title palace-complete-title tier-${tier.slug}">${tier.label}</div>
      ${sprintNote}

      <div class="palace-task-stats palace-stats-stagger">
        <div><span>Room</span><strong>${room.icon} ${room.name}</strong></div>
        <div><span>Mode</span><strong>${modeTitle}</strong></div>
        <div><span>Language</span><strong>${LANGUAGES[s.language].flag} ${LANGUAGES[s.language].name}</strong></div>
        <div><span>Items</span><strong>${summary.itemsReviewed}</strong></div>
        ${learnStats}
        <div><span>Time</span><strong>${formatPalaceTime(s.elapsedSeconds)}</strong></div>
        <div><span>Waters added</span><strong>${summary.watersAdded}</strong></div>
      </div>

      <div class="palace-complete-changes-title">Plants that grew</div>
      <div class="palace-complete-changes">${changesHtml}</div>

      <div class="palace-task-actions">
        <button class="save-btn" onclick="palaceResetToSetup()">Another session</button>
        <button class="cancel-btn" onclick="palaceBackToRoom()">Back to room</button>
        <button class="add-btn small" onclick="copyPalaceSummary()">📋 Copy summary</button>
      </div>
    </div>
  `;
}

function copyPalaceSummary() {
  const s = palaceStudySession;
  if (!s) return;
  const summary = buildPalaceSessionSummary(s);
  const room = PALACE_ROOM_MAP[s.roomId];
  const isLearn = s.mode === 'learn';
  const modeTitle = isLearn ? 'Learn' :
                    s.mode === 'test-ordered' ? 'Test (ordered)' :
                    s.mode === 'test-random'  ? 'Test (random)' :
                    s.mode === 'test-sprint'  ? 'Test (sprint)' : s.mode;

  const lines = [
    `Memory Palace — ${room.name} (${LANGUAGES[s.language].name})`,
    `${modeTitle} · ${summary.itemsReviewed} items · ${summary.accuracy}% ${isLearn ? 'recall' : 'accuracy'}`,
    `Time: ${formatPalaceTime(s.elapsedSeconds)} · Waters: +${summary.watersAdded}`
  ];
  const text = lines.join('\n');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showPalaceToast('Summary copied');
    }).catch(() => {
      showPalaceToast('Copy failed');
    });
  } else {
    showPalaceToast('Copy not supported');
  }
}

function showPalaceToast(msg) {
  const existing = document.querySelector('.palace-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'palace-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}
// ═════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═════════════════════════════════════════════

document.addEventListener('keydown', (e) => {
  // Only when Palace tab is active
  if (typeof vocabTab === 'undefined' || vocabTab !== 'palace') return;
  const page = document.getElementById('vocabulary-page');
  if (!page || !page.classList.contains('active')) return;
  if (!palaceStudySession || palaceStudySession.complete) return;

  // Don't fire when typing in an input, textarea, or contenteditable
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

  const s = palaceStudySession;
  const isLearn = s.mode === 'learn';

  if (e.key === 'Escape') {
    e.preventDefault();
    requestAbandonPalaceSession();
    return;
  }

  if (!isLearn) return;

  if (e.key === ' ') {
    e.preventDefault();
    if (!s.revealed) {
      const current = s.items[s.currentIndex];
      if (current) {
        s.revealed = true;
        renderPalace();
      }
    }
    return;
  }

  if (s.revealed && (e.key === '1' || e.key === '2' || e.key === '3')) {
    e.preventDefault();
    gradePalaceLearn(parseInt(e.key));
  }
});

function palaceResetToSetup() {
  clearPalaceTimer();
  palaceStudySession = null;
  palaceTick = 0;
  renderPalace();
}

function palaceBackToRoom() {
  clearPalaceTimer();
  palaceStudySession = null;
  palaceTick = 0;
  palaceEditMode = isEditable();
  renderPalace();
}
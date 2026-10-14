/* ============================================
   MEMORY PALACE — Phase 5.5a
   Room picker + slot placement (no study logic yet)
   ============================================ */

// ─── MODULE STATE ────────────────────────────
let palaceCurrentRoom = null;      // room id, or null for picker
let palaceEditMode = false;        // true when placing/editing slots
let palaceAddingSlot = false;      // true when waiting for click to place
let palaceSelectedSlotId = null;   // currently open slot in edit panel

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
  palaceCurrentRoom = roomId;
  palaceEditMode = isEditable();  // admins land in edit mode by default
  palaceSelectedSlotId = null;
  renderPalace();
}

function closePalaceRoom() {
  palaceCurrentRoom = null;
  palaceEditMode = false;
  palaceAddingSlot = false;
  palaceSelectedSlotId = null;
  renderPalace();
}

// ─── ROOM PICKER ─────────────────────────────
function renderPalacePicker(container) {
  const cards = PALACE_ROOMS.map(room => {
    const data = DATA.palaceRooms[room.id] || { slots: [] };
    const totalSlots = data.slots.length;

    // Fill % per language: count slots that have a word for each lang
    const perLang = PALACE_LANGS.map(lang => {
      const filled = data.slots.filter(s => s.words && s.words[lang]).length;
      return { lang, filled, total: totalSlots };
    });

    // Total coverage across all language-slot pairs
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
      <div class="palace-room-grid">
        ${cards}
      </div>
    </div>
  `;
}

// ─── ROOM VIEW ───────────────────────────────
function renderPalaceRoom(container, roomId) {
  const room = PALACE_ROOM_MAP[roomId];
  if (!room) { closePalaceRoom(); return; }
  const data = DATA.palaceRooms[roomId] || { slots: [] };
  const admin = isEditable();

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
          <button class="palace-btn disabled" disabled title="Coming soon">▶ Study</button>
        </div>
      </div>

      <div class="palace-room-body">
        <div class="palace-scene-wrap" id="palace-scene-wrap">
          <div class="palace-scene" id="palace-scene"
               style="background-image: url('${room.background}'); background-color: ${room.placeholderColor};"
               onclick="onPalaceSceneClick(event)">
            ${renderPalaceSlots(data.slots, palaceEditMode, palaceSelectedSlotId)}
          </div>
          ${palaceAddingSlot ? `
            <div class="palace-add-slot-banner">
              Click on the scene to place the new slot — <button onclick="cancelAddSlot()">Cancel</button>
            </div>
          ` : ''}
        </div>

        ${palaceEditMode ? renderPalaceEditSidebar(room, data) : ''}
      </div>
    </div>
  `;
}

function renderPalaceSlots(slots, editing, selectedId) {
  return slots.map(slot => {
    const selected = slot.id === selectedId ? 'selected' : '';
    return `
      <div class="palace-slot ${selected}"
           data-slot-id="${slot.id}"
           style="left: ${slot.x}%; top: ${slot.y}%; --slot-color: ${slot.color};"
           onclick="onSlotClick(event, '${slot.id}')">
        <div class="palace-slot-dot"></div>
        ${editing ? `<div class="palace-slot-label">${escapeHtml(slot.label)}</div>` : ''}
      </div>
    `;
  }).join('');
}

function renderPalaceEditSidebar(room, data) {
  const slots = data.slots || [];
  const selected = slots.find(s => s.id === palaceSelectedSlotId);

  return `
    <div class="palace-edit-sidebar">

      <div class="palace-sidebar-section">
        <div class="palace-sidebar-title">Slots (${slots.length})</div>
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

      ${selected ? renderPalaceSlotEditor(selected) : ''}

      <div class="palace-sidebar-section">
        <div class="palace-sidebar-title">Room info</div>
        <div class="palace-sidebar-row"><span>Theme</span><strong>${room.theme}</strong></div>
        <div class="palace-sidebar-row"><span>Background</span><strong>${room.background.split('/').pop()}</strong></div>
      </div>

    </div>
  `;
}

function renderPalaceSlotEditor(slot) {
  return `
    <div class="palace-sidebar-section palace-slot-editor">
      <div class="palace-sidebar-title">Edit slot</div>

      <label class="palace-field">
        <span>Label</span>
        <input type="text" value="${escapeHtml(slot.label)}"
               onchange="updatePalaceSlotField('${slot.id}', 'label', this.value)">
      </label>

      <div class="palace-field">
        <span>Color</span>
        <div class="palace-color-picker">
          ${SLOT_COLORS.map(c => `
            <button class="palace-color-swatch ${c === slot.color ? 'active' : ''}"
                    style="background: ${c};"
                    onclick="updatePalaceSlotField('${slot.id}', 'color', '${c}')"
                    title="${c}"></button>
          `).join('')}
        </div>
      </div>

      <div class="palace-sidebar-row"><span>Position</span><strong>${slot.x}% / ${slot.y}%</strong></div>

      <div class="palace-sidebar-title" style="margin-top: 1rem;">Words (coming in 5.5b)</div>
      <div class="palace-empty-msg">Word assignment lands in the next phase.</div>
    </div>
  `;
}

// ─── EDIT MODE TOGGLE ────────────────────────
function togglePalaceEdit() {
  if (!isEditable()) return;
  palaceEditMode = !palaceEditMode;
  if (!palaceEditMode) {
    palaceAddingSlot = false;
    palaceSelectedSlotId = null;
  }
  renderPalace();
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
  // Ignore clicks on existing slots
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
  if (label === null) { renderPalace(); return; }   // user cancelled

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

function selectPalaceSlot(slotId) {
  palaceSelectedSlotId = palaceSelectedSlotId === slotId ? null : slotId;
  renderPalace();
}

function onSlotClick(event, slotId) {
  if (palaceAddingSlot) return;  // let scene handler take over
  if (!palaceEditMode) {
    // Study interaction will hook here in 5.5c
    return;
  }
  event.stopPropagation();
  selectPalaceSlot(slotId);
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

// ─── SLOT DRAG (admin only) ──────────────────
let palaceDragState = null;

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
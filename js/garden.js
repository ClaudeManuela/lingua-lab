/* ============================================
   LEXICAL GARDEN — Phase 5.2
   Soil, plants, branches, drag, focus mode
   ============================================ */

let gardenTab = 'all';
let gardenView = 'garden';  // 'garden' | 'list'
let gardenSortMode = 'auto';

const GARDEN_LANGUAGES = ['korean', 'portuguese', 'italian', 'arabic', 'japanese', 'spanish'];

// Stage thresholds
const STAGE_THRESHOLDS = {
  seed: 0,
  sprout: 1,
  seedling: 3,
  sapling: 6,
  trunk: 12,
  flowering: 20
};

// ═══════════════════════════════════════════════
// MAIN RENDER
// ═══════════════════════════════════════════════

function renderGarden() {
  const container = document.getElementById('garden-page');
  if (!container) return;

  const admin = isEditable();

  container.innerHTML = `
    <div class="garden-layout">

      <div class="garden-sidebar">
        <h2 style="font-size: 0.9rem; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 1rem; color: var(--paper-ink);">Lexical Garden</h2>

        <div class="garden-sidebar-section">
            <div class="garden-sidebar-title">Languages (hours · points)</div>
            <div id="seed-points-list"></div>
            </div>

        <div class="garden-sidebar-section">
          <div class="garden-sidebar-title">Summary</div>
          <div id="garden-summary-list"></div>
        </div>

        ${admin ? `
          <div class="garden-sidebar-section">
            <div class="garden-sidebar-title">Actions</div>
            <div class="garden-sidebar-actions">
              <button onclick="openAddWordsModal()">+ Add Words</button>
              <button onclick="openBackfillModal()">Backfill</button>
            </div>
          </div>
        ` : ''}
      </div>

      <div class="garden-main">
        <div class="garden-view-toggle">
          <button class="${gardenView === 'garden' ? 'active' : ''}" onclick="setGardenView('garden')">Garden</button>
          <button class="${gardenView === 'list' ? 'active' : ''}" onclick="setGardenView('list')">List</button>
        </div>

        <div class="garden-tabs" id="garden-tabs"></div>

        <div id="garden-view-container" style="flex:1; display:flex; overflow:hidden;"></div>
      </div>

    </div>

    <!-- Rotate prompt for mobile portrait -->
    <div class="rotate-prompt" id="rotate-prompt">
      <div class="rotate-prompt-icon">📱</div>
      <div class="rotate-prompt-text">
        Rotate your phone horizontally to walk through your garden.
      </div>
      <button onclick="dismissRotatePrompt()">Continue in portrait</button>
    </div>

    <!-- Modals -->
    <div id="add-words-modal" class="modal-overlay hidden">
      <div class="modal-box">
        <div class="modal-header">
          <h2>Add Words</h2>
          <button onclick="closeModal('add-words-modal')" class="remove-btn">X</button>
        </div>
        <form onsubmit="submitAddWords(event)">
          <div class="modal-body">
            <section class="settings-section">
              <label>Language:
                <select id="add-words-language" required>
                  ${GARDEN_LANGUAGES.map(slug => 
                    `<option value="${slug}">${LANGUAGES[slug].flag} ${LANGUAGES[slug].name}</option>`
                  ).join('')}
                </select>
              </label>
              <label>Words (comma-separated):
                <textarea id="add-words-list" rows="4" required placeholder="안녕, 감사, 물"></textarea>
              </label>
              <label>Date:
                <input type="date" id="add-words-date" value="${new Date().toISOString().slice(0,10)}">
              </label>
              <label>Meanings (optional, comma-separated):
                <textarea id="add-words-meanings" rows="2" placeholder="hello, thanks, water"></textarea>
              </label>
            </section>
          </div>
          <div class="modal-footer">
            <button type="submit" class="save-btn">Add Words</button>
            <button type="button" class="cancel-btn" onclick="closeModal('add-words-modal')">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div id="backfill-modal" class="modal-overlay hidden">
      <div class="modal-box">
        <div class="modal-header">
          <h2>Backfill Words</h2>
          <button onclick="closeModal('backfill-modal')" class="remove-btn">X</button>
        </div>
        <form onsubmit="submitBackfill(event)">
          <div class="modal-body">
            <section class="settings-section">
              <p style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.75rem;">
                Add words from past days you didn't log. Marked as backlog in the garden.
              </p>
              <label>Language:
                <select id="backfill-language" required>
                  ${GARDEN_LANGUAGES.map(slug => 
                    `<option value="${slug}">${LANGUAGES[slug].flag} ${LANGUAGES[slug].name}</option>`
                  ).join('')}
                </select>
              </label>
              <label>Date the word was learned:
                <input type="date" id="backfill-date" required>
              </label>
              <label>Words (comma-separated):
                <textarea id="backfill-list" rows="4" required placeholder="안녕, 감사, 물"></textarea>
              </label>
              <label>Meanings (optional):
                <textarea id="backfill-meanings" rows="2" placeholder="hello, thanks, water"></textarea>
              </label>
            </section>
          </div>
          <div class="modal-footer">
            <button type="submit" class="save-btn">Backfill</button>
            <button type="button" class="cancel-btn" onclick="closeModal('backfill-modal')">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div id="word-card-modal" class="modal-overlay hidden">
      <div class="modal-box" id="word-card-content"></div>
    </div>
  `;

  renderGardenSidebar();
  renderGardenTabs();
  renderGardenView();
  checkRotatePrompt();
}

// ═══════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════

function renderGardenSidebar() {
  const points = calculateSeedPoints();

  // Single combined list: flag / name / hours / points
  document.getElementById('seed-points-list').innerHTML = GARDEN_LANGUAGES.map(slug => {
    const meta = LANGUAGES[slug];
    const summary = getLanguageSummary(DATA, slug);
    const hours = (summary.totalMinutes / 60).toFixed(1);
    const pts = points[slug] || 0;
    return `<div class="garden-sidebar-row">
      <span>${meta.flag} ${meta.name}</span>
      <strong>${hours}h · ${pts}pts</strong>
    </div>`;
  }).join('');

  // Summary
  const words = DATA.vocabulary || [];
  const totalWaters = words.reduce((a, w) => a + (w.waters || 0), 0);
  const backlogCount = words.filter(w => w.backlog).length;
  document.getElementById('garden-summary-list').innerHTML = `
    <div class="garden-sidebar-row"><span>Total words</span><strong>${words.length}</strong></div>
    <div class="garden-sidebar-row"><span>Total waters</span><strong>${totalWaters}</strong></div>
    <div class="garden-sidebar-row"><span>Backfilled</span><strong>${backlogCount}</strong></div>
  `;
}

function calculateSeedPoints() {
  const result = {};
  GARDEN_LANGUAGES.forEach(slug => {
    const summary = getLanguageSummary(DATA, slug);
    const totalHours = summary.totalMinutes / 60;
    const spent = (DATA.gardenSpent && DATA.gardenSpent[slug]) || 0;
    result[slug] = Math.max(0, Math.floor(totalHours - spent));
  });
  return result;
}

// ═══════════════════════════════════════════════
// TABS + VIEW
// ═══════════════════════════════════════════════

function renderGardenTabs() {
  const container = document.getElementById('garden-tabs');
  if (!container) return;

  const tabs = [
    { key: 'all', label: 'All' },
    ...GARDEN_LANGUAGES.map(slug => ({ key: slug, label: LANGUAGES[slug].flag + ' ' + LANGUAGES[slug].name })),
    { key: 'recent', label: 'Recent' },
    { key: 'favorites', label: 'Favorites' }
  ];

  container.innerHTML = tabs.map(t => `
    <button class="garden-tab ${gardenTab === t.key ? 'active' : ''}" onclick="setGardenTab('${t.key}')">${t.label}</button>
  `).join('');
}

function setGardenTab(key) {
  gardenTab = key;
  renderGardenTabs();
  renderGardenView();
}

function setGardenView(view) {
  gardenView = view;
  renderGardenView();
  renderGarden();
}

function renderGardenView() {
  const container = document.getElementById('garden-view-container');
  if (!container) return;

  if (gardenView === 'list') {
    container.innerHTML = `<div class="garden-list-view" id="garden-list-view"></div>`;
    renderGardenList();
  } else {
    container.innerHTML = `
      <div class="garden-canvas-wrap" id="garden-canvas-wrap">
        <div class="garden-canvas" id="garden-canvas">
          <svg class="garden-branches-svg" id="garden-branches-svg"></svg>
        </div>
      </div>
    `;
    renderGardenPlants();
    if (typeof renderGardenBranches === 'function') {
      renderGardenBranches();
    }
    if (typeof initGardenDrag === 'function') {
      initGardenDrag();
    }
  }
}

// ═══════════════════════════════════════════════
// FILTER WORDS
// ═══════════════════════════════════════════════

function getFilteredWords() {
  let words = [...(DATA.vocabulary || [])];

  if (GARDEN_LANGUAGES.includes(gardenTab)) {
    words = words.filter(w => w.language === gardenTab);
  } else if (gardenTab === 'favorites') {
    words = words.filter(w => w.favorite);
  } else if (gardenTab === 'recent') {
    words = words.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)).slice(0, 100);
  }

  return words;
}

// ═══════════════════════════════════════════════
// LIST VIEW
// ═══════════════════════════════════════════════

function renderGardenList() {
  const container = document.getElementById('garden-list-view');
  if (!container) return;

  const words = getFilteredWords();

  if (!words.length) {
    container.innerHTML = `<div class="lang-empty">No words in this garden yet</div>`;
    return;
  }

  const stages = ['flowering', 'trunk', 'sapling', 'seedling', 'sprout', 'seed'];
  const groups = {};
  stages.forEach(s => groups[s] = []);

  words.forEach(w => {
    const stage = w.stage || 'seed';
    if (groups[stage]) groups[stage].push(w);
  });

  const stageLabels = {
    flowering: 'Flowering (20+ waters)',
    trunk: 'Trunk (12+ waters)',
    sapling: 'Sapling (6-11)',
    seedling: 'Seedling (3-5)',
    sprout: 'Sprout (1-2)',
    seed: 'Seed (0)'
  };

  container.innerHTML = stages.map(stage => {
    if (!groups[stage].length) return '';
    return `
      <div class="garden-stage-group">
        <div class="garden-stage-label">${stageLabels[stage]} (${groups[stage].length})</div>
        <div class="garden-word-rows">
          ${groups[stage].map(w => renderWordRow(w)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderWordRow(w) {
  const meta = LANGUAGES[w.language];
  if (!meta) return '';

  return `
    <div class="garden-word-row" onclick="openWordCard('${w.id}')">
      <span>${meta.flag}</span>
      <span class="garden-word-text">${escapeHtml(w.word)}</span>
      <span class="garden-word-meaning">${escapeHtml(w.meaning || '')}</span>
      <span class="garden-word-waters">${w.waters || 0}</span>
      ${w.favorite ? '<span class="garden-word-star">*</span>' : ''}
      <span>→</span>
    </div>
  `;
}

// ═══════════════════════════════════════════════
// GARDEN CANVAS VIEW
// ═══════════════════════════════════════════════

function renderGardenPlants() {
  const canvas = document.getElementById('garden-canvas');
  if (!canvas) return;

  const words = getFilteredWords();
  const admin = isEditable();

  if (!words.length) {
    const empty = document.createElement('div');
    empty.className = 'garden-empty';
    empty.textContent = 'The soil is ready. Add your first words to plant them.';
    canvas.appendChild(empty);
    return;
  }

  words.forEach(w => {
    const plant = createPlantElement(w, admin);
    canvas.appendChild(plant);
  });
}

function createPlantElement(w, admin) {
  const meta = LANGUAGES[w.language];
  const stage = w.stage || 'seed';
  const size = getPlantSize(stage);

  const el = document.createElement('div');
  el.className = 'garden-plant';
  el.dataset.id = w.id;
  el.style.left = (w.gardenX || 100) + 'px';
  el.style.top = (w.gardenY || 100) + 'px';
  el.style.width = size + 'px';

  el.innerHTML = `
    <svg class="garden-plant-svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      ${renderPlantSVG(stage, size, meta)}
    </svg>
    <div class="garden-plant-label">${escapeHtml(w.word)}</div>
  `;

  if (admin) {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.garden-plant')) {
        if (!el.classList.contains('dragging')) {
          openWordCard(w.id);
        }
      }
    });
  } else {
    el.addEventListener('click', () => openWordCard(w.id));
  }

  return el;
}

function getPlantSize(stage) {
  switch (stage) {
    case 'flowering': return 48;
    case 'trunk': return 40;
    case 'sapling': return 32;
    case 'seedling': return 24;
    case 'sprout': return 18;
    default: return 12;
  }
}

function renderPlantSVG(stage, size, meta) {
  const c = size / 2;
  const soilBrown = '#5a3a2a';
  const trunkBrown = '#a07850';
  const branchBrown = '#b8906a';
  const sproutGreen = '#6a9d4a';
  const leafGreen = '#5a8d3a';

  switch (stage) {
    case 'seed':
      return `<circle cx="${c}" cy="${c + 3}" r="2" fill="${soilBrown}"/>`;

    case 'sprout':
      return `
        <rect x="${c - 1}" y="${c}" width="2" height="6" fill="${sproutGreen}"/>
        <ellipse cx="${c - 2}" cy="${c}" rx="2" ry="1.5" fill="${sproutGreen}"/>
        <ellipse cx="${c + 2}" cy="${c}" rx="2" ry="1.5" fill="${sproutGreen}"/>
      `;

    case 'seedling':
      return `
        <rect x="${c - 1}" y="${c - 2}" width="2" height="10" fill="${trunkBrown}"/>
        <ellipse cx="${c - 4}" cy="${c - 4}" rx="4" ry="2" fill="${leafGreen}"/>
        <ellipse cx="${c + 4}" cy="${c - 6}" rx="4" ry="2" fill="${leafGreen}"/>
      `;

    case 'sapling':
      return `
        <rect x="${c - 2}" y="${c - 4}" width="4" height="14" fill="${trunkBrown}"/>
        <ellipse cx="${c - 6}" cy="${c - 6}" rx="5" ry="3" fill="${leafGreen}"/>
        <ellipse cx="${c + 6}" cy="${c - 8}" rx="5" ry="3" fill="${leafGreen}"/>
        <ellipse cx="${c}" cy="${c - 12}" rx="5" ry="3" fill="${leafGreen}"/>
      `;

    case 'trunk':
    case 'flowering':
      return `
        <rect x="${c - 3}" y="${c - 6}" width="6" height="18" fill="${trunkBrown}"/>
        <rect x="${c - 3}" y="${c - 6}" width="6" height="18" fill="none" stroke="${soilBrown}" stroke-width="0.5"/>
        <ellipse cx="${c - 8}" cy="${c - 8}" rx="6" ry="3" fill="${leafGreen}"/>
        <ellipse cx="${c + 8}" cy="${c - 10}" rx="6" ry="3" fill="${leafGreen}"/>
        <ellipse cx="${c}" cy="${c - 14}" rx="7" ry="4" fill="${leafGreen}"/>
        <ellipse cx="${c - 5}" cy="${c - 16}" rx="4" ry="3" fill="${leafGreen}"/>
        <ellipse cx="${c + 5}" cy="${c - 16}" rx="4" ry="3" fill="${leafGreen}"/>
      `;

    default:
      return `<circle cx="${c}" cy="${c}" r="3" fill="${soilBrown}"/>`;
  }
}

// ═══════════════════════════════════════════════
// ROTATE PROMPT
// ═══════════════════════════════════════════════

function checkRotatePrompt() {
  const dismissed = sessionStorage.getItem('gardenRotateDismissed');
  if (dismissed) return;
}

function dismissRotatePrompt() {
  sessionStorage.setItem('gardenRotateDismissed', 'true');
  document.getElementById('rotate-prompt').style.display = 'none';
}

// ═══════════════════════════════════════════════
// ADD WORDS / BACKFILL
// ═══════════════════════════════════════════════

function openAddWordsModal() {
  if (!isEditable()) return;
  document.getElementById('add-words-modal').classList.remove('hidden');
}

function openBackfillModal() {
  if (!isEditable()) return;
  document.getElementById('backfill-modal').classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function submitAddWords(event) {
  event.preventDefault();
  if (!isEditable()) return;
  const language = document.getElementById('add-words-language').value;
  const wordsText = document.getElementById('add-words-list').value;
  const date = document.getElementById('add-words-date').value || new Date().toISOString().slice(0,10);
  const meaningsText = document.getElementById('add-words-meanings').value;
  addWordsToGarden(language, wordsText, meaningsText, date, false);
  closeModal('add-words-modal');
  renderGarden();
}

function submitBackfill(event) {
  event.preventDefault();
  if (!isEditable()) return;
  const language = document.getElementById('backfill-language').value;
  const wordsText = document.getElementById('backfill-list').value;
  const date = document.getElementById('backfill-date').value;
  const meaningsText = document.getElementById('backfill-meanings').value;
  addWordsToGarden(language, wordsText, meaningsText, date, true);
  closeModal('backfill-modal');
  renderGarden();
}

function addWordsToGarden(language, wordsText, meaningsText, date, backlog) {
  const words = parseWordList(wordsText);
  const meanings = parseWordList(meaningsText);

  words.forEach((word, i) => {
    const existing = DATA.vocabulary.find(w => 
      w.language === language && w.word.toLowerCase() === word.toLowerCase()
    );

    if (existing) {
      existing.waters = (existing.waters || 0) + 1;
      existing.lastWatered = date;
      updateWordStage(existing);
    } else {
      // Auto-place: near same-language words or random
      const pos = findAutoPosition(language);
      DATA.vocabulary.push({
        id: generateUUID(),
        word: word,
        meaning: meanings[i] || '',
        language: language,
        dateAdded: date,
        waters: 1,
        lastWatered: date,
        stage: 'sprout',
        parentId: null,
        childIds: [],
        connections: [],
        favorite: false,
        notes: '',
        backlog: backlog,
        gardenX: pos.x,
        gardenY: pos.y,
        theme: ''
      });
    }
  });

  saveData(DATA);
}

function findAutoPosition(language) {
  // Try to cluster with same-language words; else random
  const sameLang = (DATA.vocabulary || []).filter(w => w.language === language && w.gardenX);
  if (sameLang.length) {
    const ref = sameLang[Math.floor(Math.random() * sameLang.length)];
    return {
      x: (ref.gardenX || 200) + (Math.random() - 0.5) * 160,
      y: (ref.gardenY || 200) + (Math.random() - 0.5) * 160
    };
  }
  return {
    x: 100 + Math.random() * 800,
    y: 100 + Math.random() * 600
  };
}

function parseWordList(text) {
  if (!text) return [];
  return text.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

function generateUUID() {
  return 'w-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function updateWordStage(w) {
  const waters = w.waters || 0;
  if (waters >= STAGE_THRESHOLDS.flowering) w.stage = 'flowering';
  else if (waters >= STAGE_THRESHOLDS.trunk) w.stage = 'trunk';
  else if (waters >= STAGE_THRESHOLDS.sapling) w.stage = 'sapling';
  else if (waters >= STAGE_THRESHOLDS.seedling) w.stage = 'seedling';
  else if (waters >= STAGE_THRESHOLDS.sprout) w.stage = 'sprout';
  else w.stage = 'seed';
}

// ═══════════════════════════════════════════════
// WORD CARD (basic — Phase 5.2 version)
// ═══════════════════════════════════════════════

function openWordCard(id) {
  const word = DATA.vocabulary.find(w => w.id === id);
  if (!word) return;

  const meta = LANGUAGES[word.language];
  const admin = isEditable();
  const content = document.getElementById('word-card-content');

  content.innerHTML = `
    <div class="modal-header">
      <h2>${meta.flag} ${escapeHtml(word.word)}</h2>
      <button onclick="closeModal('word-card-modal')" class="remove-btn">X</button>
    </div>
    <div class="modal-body">

      <div class="word-card-section">
        ${admin ? `
          <div class="word-card-field">
            <label>Word:</label>
            <input type="text" value="${escapeHtml(word.word)}" onchange="updateWordField('${word.id}', 'word', this.value)">
          </div>
          <div class="word-card-field">
            <label>Meaning:</label>
            <input type="text" value="${escapeHtml(word.meaning || '')}" onchange="updateWordField('${word.id}', 'meaning', this.value)">
          </div>
          <div class="word-card-field">
            <label>Reading (romanization):</label>
            <input type="text" value="${escapeHtml(word.reading || '')}" onchange="updateWordField('${word.id}', 'reading', this.value)">
          </div>
          <div class="word-card-field">
            <label>Theme (optional):</label>
            <input type="text" value="${escapeHtml(word.theme || '')}" onchange="updateWordField('${word.id}', 'theme', this.value)" placeholder="e.g., greetings, time adverbs">
          </div>
          <div class="word-card-field">
            <label>Notes:</label>
            <textarea onchange="updateWordField('${word.id}', 'notes', this.value)">${escapeHtml(word.notes || '')}</textarea>
          </div>
        ` : `
          <div class="word-card-field"><strong>Meaning:</strong> ${escapeHtml(word.meaning || '—')}</div>
          ${word.reading ? `<div class="word-card-field"><strong>Reading:</strong> ${escapeHtml(word.reading)}</div>` : ''}
          ${word.theme ? `<div class="word-card-field"><strong>Theme:</strong> ${escapeHtml(word.theme)}</div>` : ''}
          ${word.notes ? `<div class="word-card-field"><strong>Notes:</strong> ${escapeHtml(word.notes)}</div>` : ''}
        `}
      </div>

      <div class="word-card-section">
        <div class="word-card-section-title">Stats</div>
        <div class="word-card-field">Language: <strong>${meta.name}</strong></div>
        <div class="word-card-field">Stage: <strong>${word.stage || 'seed'}</strong></div>
        <div class="word-card-field">Waters: <strong>${word.waters || 0}</strong></div>
        <div class="word-card-field">Added: <strong>${word.dateAdded}</strong></div>
        <div class="word-card-field">Last watered: <strong>${word.lastWatered || '—'}</strong></div>
      </div>

      <div class="word-card-section">
        <div class="word-card-section-title">Branches</div>
        <div id="word-card-branches"></div>
        ${admin ? `<button class="add-btn" onclick="openAddBranchForm('${word.id}')">+ Add Branch</button>` : ''}
      </div>

      <div class="word-card-section">
        <div class="word-card-section-title">Connections</div>
        <div id="word-card-connections"></div>
        ${admin ? `<button class="add-btn" onclick="openAddConnectionForm('${word.id}')">+ Connect</button>` : ''}
      </div>

      ${admin ? `
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;">
          <button class="add-btn" onclick="waterWord('${word.id}')">Water +1</button>
          <button class="add-btn" onclick="toggleFavorite('${word.id}')">${word.favorite ? 'Unfavorite' : 'Favorite'}</button>
          <button class="add-btn" onclick="openFocusMode('${word.id}')">Focus Tree</button>
        </div>
      ` : ''}

    </div>
  `;

  renderWordCardBranches(word);
  renderWordCardConnections(word);

  document.getElementById('word-card-modal').classList.remove('hidden');
}

function renderWordCardBranches(word) {
  const container = document.getElementById('word-card-branches');
  if (!container) return;

  const branches = (word.childIds || []).map(id => DATA.vocabulary.find(w => w.id === id)).filter(Boolean);
  if (!branches.length) {
    container.innerHTML = `<div style="font-size:0.7rem; color: var(--text-dim); font-style: italic;">No branches yet</div>`;
    return;
  }

  container.innerHTML = branches.map(b => `
    <div class="word-card-branch-row">
      <span>${b.direction === 'up' ? '↑' : b.direction === 'down' ? '↓' : b.direction === 'left' ? '←' : '→'} ${escapeHtml(b.word)} (${escapeHtml(b.meaning || '')})</span>
      <button onclick="removeBranch('${word.id}', '${b.id}')">X</button>
    </div>
  `).join('');
}

function renderWordCardConnections(word) {
  const container = document.getElementById('word-card-connections');
  if (!container) return;

  const connections = (word.connections || []).map(id => DATA.vocabulary.find(w => w.id === id)).filter(Boolean);
  if (!connections.length) {
    container.innerHTML = `<div style="font-size:0.7rem; color: var(--text-dim); font-style: italic;">No connections yet</div>`;
    return;
  }

  container.innerHTML = connections.map(c => `
    <div class="word-card-connection-row">
      <span>↔ ${LANGUAGES[c.language].flag} ${escapeHtml(c.word)} (${escapeHtml(c.meaning || '')})</span>
      <button onclick="removeConnection('${word.id}', '${c.id}')">X</button>
    </div>
  `).join('');
}

function updateWordField(id, key, value) {
  if (!isEditable()) return;
  const word = DATA.vocabulary.find(w => w.id === id);
  if (!word) return;
  word[key] = value;
  saveData(DATA);
}

function waterWord(id) {
  if (!isEditable()) return;
  const word = DATA.vocabulary.find(w => w.id === id);
  if (!word) return;
  word.waters = (word.waters || 0) + 1;
  word.lastWatered = new Date().toISOString().slice(0, 10);
  updateWordStage(word);
  saveData(DATA);
  closeModal('word-card-modal');
  renderGarden();
}

function toggleFavorite(id) {
  if (!isEditable()) return;
  const word = DATA.vocabulary.find(w => w.id === id);
  if (!word) return;
  word.favorite = !word.favorite;
  saveData(DATA);
  openWordCard(id);
}

function removeBranch(parentId, childId) {
  if (!isEditable()) return;
  if (!confirm('Remove this branch?')) return;
  const parent = DATA.vocabulary.find(w => w.id === parentId);
  if (!parent) return;
  parent.childIds = (parent.childIds || []).filter(id => id !== childId);
  const child = DATA.vocabulary.find(w => w.id === childId);
  if (child) child.parentId = null;
  saveData(DATA);
  openWordCard(parentId);
  renderGarden();
}

function removeConnection(aId, bId) {
  if (!isEditable()) return;
  if (!confirm('Remove this connection?')) return;
  const a = DATA.vocabulary.find(w => w.id === aId);
  const b = DATA.vocabulary.find(w => w.id === bId);
  if (a) a.connections = (a.connections || []).filter(id => id !== bId);
  if (b) b.connections = (b.connections || []).filter(id => id !== aId);
  saveData(DATA);
  openWordCard(aId);
  renderGarden();
}
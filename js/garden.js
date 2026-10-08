/* ============================================
   LEXICAL GARDEN — Phase 5.2.5
   Tree-visual word card, fuzzy search
   ============================================ */

let gardenTab = 'all';
let gardenView = 'garden';
let currentZoom = 1.0;

const GARDEN_LANGUAGES = ['korean', 'portuguese', 'italian', 'arabic', 'japanese', 'spanish'];

const STAGE_THRESHOLDS = {
  seed: 0,
  sprout: 1,
  seedling: 3,
  sapling: 6,
  trunk: 12,
  flowering: 20
};

const DEFAULT_WORD_TYPES = [
  'Noun', 'Verb', 'Adjective', 'Adverb', 'Pronoun', 'Particle',
  'Conjunction', 'Preposition', 'Interjection',
  'Subject Marker', 'Topic Marker',
  'Idiom / Expression', 'Filler word', 'Counter',
  'Number', 'Phrase / Sentence', 'Other'
];

// ═══════════════════════════════════════════════
// MAIN RENDER
// ═══════════════════════════════════════════════

function renderGarden() {
  const container = document.getElementById('garden-page');
  if (!container) return;
  const admin = isEditable();

  document.querySelectorAll('.garden-modal-root').forEach(el => el.remove());

  container.innerHTML = `
    <div class="garden-layout">
      <div class="garden-sidebar">
        <h2 class="garden-sidebar-h2">Lexical Garden</h2>
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
              <button onclick="rearrangeByTheme()">Cluster by Theme</button>
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
        <div id="garden-view-container" style="flex:1; display:flex; overflow:hidden; position:relative;"></div>
      </div>
    </div>
  `;

  mountGardenModals(admin);
  mountRotatePrompt();
  renderGardenSidebar();
  renderGardenTabs();
  renderGardenView();
  checkRotatePrompt();
}

function mountGardenModals(admin) {
  const langOptions = GARDEN_LANGUAGES.map(slug => 
    `<option value="${slug}">${LANGUAGES[slug].flag} ${LANGUAGES[slug].name}</option>`
  ).join('');

  const html = `
    <div class="garden-modal-root">
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
                  <select id="add-words-language" required>${langOptions}</select>
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
                  <select id="backfill-language" required>${langOptions}</select>
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
        <div class="word-card-wide" id="word-card-content"></div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
}

function mountRotatePrompt() {
  if (document.getElementById('rotate-prompt-root')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="rotate-prompt" id="rotate-prompt-root" style="display:none;">
      <div class="rotate-prompt-icon">📱</div>
      <div class="rotate-prompt-text">Rotate your phone horizontally to walk through your garden.</div>
      <button onclick="dismissRotatePrompt()">Continue in portrait</button>
    </div>
  `);
}

// ═══════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════

function renderGardenSidebar() {
  const points = calculateSeedPoints();
  document.getElementById('seed-points-list').innerHTML = GARDEN_LANGUAGES.map(slug => {
    const meta = LANGUAGES[slug];
    const summary = getLanguageSummary(DATA, slug);
    const hours = (summary.totalMinutes / 60).toFixed(1);
    const pts = points[slug] || 0;
    return `<div class="garden-sidebar-row"><span>${meta.flag} ${meta.name}</span><strong>${hours}h · ${pts}pts</strong></div>`;
  }).join('');

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
      <div class="garden-zoom-controls">
        <button onclick="zoomIn()">+</button>
        <button onclick="zoomOut()">−</button>
        <button onclick="resetZoom()">⟲</button>
        <span class="garden-zoom-label" id="zoom-label">100%</span>
      </div>
      <div class="garden-canvas-wrap" id="garden-canvas-wrap">
        <div class="garden-canvas" id="garden-canvas">
          <svg class="garden-branches-svg" id="garden-branches-svg"></svg>
        </div>
      </div>
    `;
    applyZoom();
    renderGardenPlants();
    if (typeof renderGardenBranches === 'function') renderGardenBranches();
    if (typeof initGardenZoom === 'function') initGardenZoom();
    if (typeof initGardenDrag === 'function') initGardenDrag();
  }
  checkRotatePrompt();
}

function applyZoom() {
  const canvas = document.getElementById('garden-canvas');
  if (!canvas) return;
  canvas.style.transform = `scale(${currentZoom})`;
  canvas.style.transformOrigin = '0 0';
  const label = document.getElementById('zoom-label');
  if (label) label.textContent = Math.round(currentZoom * 100) + '%';
}
function zoomIn() { currentZoom = Math.min(3, currentZoom + 0.15); applyZoom(); }
function zoomOut() { currentZoom = Math.max(0.4, currentZoom - 0.15); applyZoom(); }
function resetZoom() { currentZoom = 1.0; applyZoom(); }

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
  const typeLabel = w.wordType ? `<span class="garden-word-type">${escapeHtml(w.wordType)}</span>` : '';
  return `
    <div class="garden-word-row" onclick="openWordCard('${w.id}')">
      <span>${meta.flag}</span>
      <span class="garden-word-text">${escapeHtml(w.word)}${typeLabel}</span>
      <span class="garden-word-meaning">${escapeHtml(w.meaning || '')}</span>
      <span class="garden-word-waters">${w.waters || 0}</span>
      ${w.favorite ? '<span class="garden-word-star">*</span>' : ''}
      <span>→</span>
    </div>
  `;
}

// ═══════════════════════════════════════════════
// GARDEN CANVAS
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
      ${renderPlantSVG(stage, size)}
    </svg>
    <div class="garden-plant-label">${escapeHtml(w.word)}</div>
  `;
  el.addEventListener('click', () => {
    if (el.dataset.dragged === 'true') {
      el.dataset.dragged = 'false';
      return;
    }
    openWordCard(w.id);
  });
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

function renderPlantSVG(stage, size) {
  const c = size / 2;
  const soilBrown = '#5a3a2a';
  const trunkBrown = '#a07850';
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
  const prompt = document.getElementById('rotate-prompt-root');
  if (!prompt) return;
  const dismissed = sessionStorage.getItem('gardenRotateDismissed');
  const isPortrait = window.matchMedia('(max-width: 700px) and (orientation: portrait)').matches;
  prompt.style.display = (gardenView === 'garden' && isPortrait && !dismissed) ? 'flex' : 'none';
}

function dismissRotatePrompt() {
  sessionStorage.setItem('gardenRotateDismissed', 'true');
  checkRotatePrompt();
}

// ═══════════════════════════════════════════════
// ADD WORDS / BACKFILL
// ═══════════════════════════════════════════════

function openAddWordsModal() { if (isEditable()) document.getElementById('add-words-modal').classList.remove('hidden'); }
function openBackfillModal() { if (isEditable()) document.getElementById('backfill-modal').classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

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
        theme: '',
        wordType: '',
        direction: ''
      });
    }
  });
  saveData(DATA);
}

function findAutoPosition(language) {
  const sameLang = (DATA.vocabulary || []).filter(w => w.language === language && w.gardenX);
  if (sameLang.length) {
    const ref = sameLang[Math.floor(Math.random() * sameLang.length)];
    return {
      x: (ref.gardenX || 200) + (Math.random() - 0.5) * 160,
      y: (ref.gardenY || 200) + (Math.random() - 0.5) * 160
    };
  }
  return { x: 100 + Math.random() * 800, y: 100 + Math.random() * 600 };
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

function rearrangeByTheme() {
  if (!isEditable()) return;
  if (!confirm('Rearrange all plants by theme?')) return;
  const words = DATA.vocabulary || [];
  const themes = {};
  words.forEach(w => {
    const t = (w.theme || '').trim().toLowerCase() || '__no_theme__';
    if (!themes[t]) themes[t] = [];
    themes[t].push(w);
  });
  let yOffset = 100;
  Object.keys(themes).forEach(theme => {
    const group = themes[theme];
    group.forEach((w, i) => {
      const col = i % 6;
      const row = Math.floor(i / 6);
      w.gardenX = 100 + col * 90;
      w.gardenY = yOffset + row * 90;
    });
    yOffset += 120 + Math.ceil(group.length / 6) * 90;
  });
  saveData(DATA);
  renderGarden();
}

// ═══════════════════════════════════════════════
// WORD CARD — Phase 5.2.5 redesign
// ═══════════════════════════════════════════════

function getWordTypeOptions() {
  const custom = (DATA.settings && DATA.settings.customWordTypes) || [];
  return [...new Set([...DEFAULT_WORD_TYPES, ...custom])];
}

function openWordCard(id) {
  const word = DATA.vocabulary.find(w => w.id === id);
  if (!word) return;

  const meta = LANGUAGES[word.language];
  const admin = isEditable();
  const content = document.getElementById('word-card-content');
  const typeOptions = getWordTypeOptions();
  const parent = word.parentId ? DATA.vocabulary.find(w => w.id === word.parentId) : null;
  const connections = (word.connections || []).map(cid => DATA.vocabulary.find(w => w.id === cid)).filter(Boolean);

  content.innerHTML = `
    <div class="word-card-header">
      <div class="word-card-header-title">${meta.flag} ${escapeHtml(word.word)}</div>
      <button onclick="closeModal('word-card-modal')" class="remove-btn">X</button>
    </div>

    <div class="word-card-body">

      <div class="word-card-left">
        <div class="word-card-tree-bg" id="word-card-tree"></div>
        <button class="word-card-show-all hidden" id="word-card-show-all" onclick="toggleAllBranches('${word.id}')">Show all branches</button>
      </div>

      <div class="word-card-right">
        <div class="word-card-ruled">

          <div class="word-card-line">
            <span class="word-card-label">Meaning</span>
            <span class="word-card-value">${escapeHtml(word.meaning || '—')}</span>
          </div>

          <div class="word-card-line">
            <span class="word-card-label">Type</span>
            <span class="word-card-value">${escapeHtml(word.wordType || '—')}</span>
          </div>

          <div class="word-card-line">
            <span class="word-card-label">Theme</span>
            <span class="word-card-value">${escapeHtml(word.theme || '—')}</span>
          </div>

          <div class="word-card-line">
            <span class="word-card-label">Stage</span>
            <span class="word-card-value">${word.stage || 'seed'}</span>
          </div>

          <div class="word-card-line">
            <span class="word-card-label">Waters</span>
            <span class="word-card-value">${word.waters || 0}</span>
          </div>

          <div class="word-card-line">
            <span class="word-card-label">Added</span>
            <span class="word-card-value">${word.dateAdded}</span>
          </div>

          <div class="word-card-line">
            <span class="word-card-label">Last watered</span>
            <span class="word-card-value">${word.lastWatered || '—'}</span>
          </div>

          <div class="word-card-divider"></div>

          <div class="word-card-line-full">
            <span class="word-card-label">Connections</span>
            <div class="word-card-connections">
          ${connections.length ? connections.map(c => `
            <span class="connection-pill-wrap">
              <button class="connection-pill" onclick="openWordCard('${c.id}')">
                ${LANGUAGES[c.language].flag} ${escapeHtml(c.word)}
              </button>
              ${admin ? `<button class="connection-pill-delete" onclick="event.stopPropagation(); disconnectWord('${word.id}', '${c.id}')" title="Remove connection">×</button>` : ''}
            </span>
          `).join('') : '<span class="word-card-empty">— none yet —</span>'}
        </div>
          </div>

          ${admin ? `
            <div class="word-card-actions">
              <button class="add-btn" onclick="waterWord('${word.id}')">Water +1</button>
              <button class="add-btn" onclick="toggleFavorite('${word.id}')">${word.favorite ? 'Unfavorite' : 'Favorite'}</button>
              <button class="add-btn" onclick="openAddBranchForm('${word.id}')">+ Branch</button>
              <button class="add-btn" onclick="openAddConnectionForm('${word.id}')">+ Connect</button>
            </div>

            <div class="word-card-edit-toggle" onclick="toggleEditSection()">
              <span>Edit</span>
              <span id="edit-toggle-icon">▼</span>
            </div>

            <div class="word-card-edit-section hidden" id="edit-section">
              <div class="word-card-field">
                <label>Word:</label>
                <input type="text" value="${escapeHtml(word.word)}" onchange="updateWordField('${word.id}', 'word', this.value)">
              </div>
              <div class="word-card-field">
                <label>Meaning:</label>
                <input type="text" value="${escapeHtml(word.meaning || '')}" onchange="updateWordField('${word.id}', 'meaning', this.value)">
              </div>
              <div class="word-card-field">
                <label>Reading:</label>
                <input type="text" value="${escapeHtml(word.reading || '')}" onchange="updateWordField('${word.id}', 'reading', this.value)">
              </div>
              <div class="word-card-field">
                <label>Word Type:</label>
                <select onchange="onWordTypeChange('${word.id}', this.value)">
                  <option value="">— pick —</option>
                  ${typeOptions.map(t => `<option value="${t}" ${word.wordType === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
              </div>
              <div class="word-card-field" id="custom-type-field-${word.id}" style="${word.wordType === 'Other' ? '' : 'display:none;'}">
                <label>Custom Type Name:</label>
                <input type="text" placeholder="e.g., Onomatopoeia" onchange="addCustomWordType(this.value, '${word.id}')">
              </div>
              <div class="word-card-field">
                <label>Theme:</label>
                <input type="text" value="${escapeHtml(word.theme || '')}" onchange="updateWordField('${word.id}', 'theme', this.value)">
              </div>
              <div class="word-card-field">
                <label>Notes:</label>
                <textarea onchange="updateWordField('${word.id}', 'notes', this.value)">${escapeHtml(word.notes || '')}</textarea>
              </div>
            </div>
          ` : ''}

        </div>
      </div>

    </div>
  `;

  document.getElementById('word-card-modal').classList.remove('hidden');

  setTimeout(() => drawWordCardTree(word, parent), 60);
}

function toggleEditSection() {
  const section = document.getElementById('edit-section');
  const icon = document.getElementById('edit-toggle-icon');
  if (!section) return;
  const isHidden = section.classList.toggle('hidden');
  icon.textContent = isHidden ? '▼' : '▲';
}

function toggleAllBranches(wordId) {
  window._showAllBranches = !window._showAllBranches;
  openWordCard(wordId);
}

// ═══════════════════════════════════════════════
// TREE DRAWING
// ═══════════════════════════════════════════════

function drawWordCardTree(word, parent) {
  const container = document.getElementById('word-card-tree');
  if (!container) return;

  const w = container.clientWidth;
  const h = container.clientHeight;
  if (!w || !h) return;

  // Gather children (direct branches)
  let children = (word.childIds || []).map(id => DATA.vocabulary.find(x => x.id === id)).filter(Boolean);
  const showAll = window._showAllBranches;
  const capped = !showAll && children.length > 8;
  const visibleChildren = capped ? children.slice(0, 8) : children;

  // Show "Show all" button if capped
  const showAllBtn = document.getElementById('word-card-show-all');
  if (showAllBtn) {
    if (capped) {
      showAllBtn.classList.remove('hidden');
      showAllBtn.textContent = `Show all ${children.length} branches`;
    } else if (showAll && children.length > 8) {
      showAllBtn.classList.remove('hidden');
      showAllBtn.textContent = 'Show fewer';
    } else {
      showAllBtn.classList.add('hidden');
    }
  }

  // Node sizes by stage
  const sizeFor = (stage) => {
    switch (stage) {
      case 'flowering': return 44;
      case 'trunk': return 38;
      case 'sapling': return 30;
      case 'seedling': return 24;
      case 'sprout': return 20;
      default: return 16;
    }
  };

  // Layout — trunk at bottom center, children higher up in tiers
  const centerX = w / 2;
  const baseY = h - 60;
  const tierHeight = 80;

  // Store positions
  const positions = {};

  // Trunk (current word) at bottom
  positions[word.id] = { x: centerX, y: baseY, size: sizeFor(word.stage), isCurrent: true };

  // Parent below (if any) — offset down and slightly to the side
  if (parent) {
    positions[parent.id] = { x: centerX + 100, y: baseY + 55, size: sizeFor(parent.stage), isParent: true };
  }

  // Distribute children in tiers (upward)
  // Simple approach: 1 tier if ≤ 4 children, 2 tiers if more
  const tiers = visibleChildren.length <= 4 ? 1 : 2;
  visibleChildren.forEach((child, i) => {
    const tierIndex = tiers === 1 ? 0 : Math.floor(i / Math.ceil(visibleChildren.length / 2));
    const indexInTier = tiers === 1 ? i : (i % Math.ceil(visibleChildren.length / 2));
    const tierCount = tiers === 1 ? visibleChildren.length : Math.ceil(visibleChildren.length / 2);
    
    const tierWidth = w * 0.8;
    const spacing = tierWidth / (tierCount + 1);
    const x = (w - tierWidth) / 2 + spacing * (indexInTier + 1);
    const y = baseY - 40 - (tierIndex + 1) * tierHeight;

    positions[child.id] = { x, y, size: sizeFor(child.stage) };
  });

  // Build SVG
  let svg = '';

  // Branch lines (parent → trunk, trunk → children)
  if (parent) {
    const p1 = positions[parent.id];
    const t = positions[word.id];
    const mx = (p1.x + t.x) / 2;
    const my = (p1.y + t.y) / 2 + 15;
    svg += `<path d="M ${p1.x} ${p1.y - p1.size/2} Q ${mx} ${my} ${t.x} ${t.y + t.size/2}" stroke="#b8906a" stroke-width="3" fill="none"/>`;
  }
  visibleChildren.forEach(child => {
    const c = positions[child.id];
    const t = positions[word.id];
    const mx = (c.x + t.x) / 2;
    const my = (c.y + t.y) / 2 + 20;
    svg += `<path d="M ${c.x} ${c.y + c.size/2} Q ${mx} ${my} ${t.x} ${t.y - t.size/2}" stroke="#b8906a" stroke-width="3" fill="none"/>`;
  });

  // Nodes
  Object.entries(positions).forEach(([id, pos]) => {
    const nodeWord = id === word.id ? word : (id === parent?.id ? parent : visibleChildren.find(c => c.id === id));
    if (!nodeWord) return;
    const meta = LANGUAGES[nodeWord.language];
    const isCurrent = pos.isCurrent;
    const fill = isCurrent ? '#a07850' : '#c8a878';
    const stroke = isCurrent ? '#5a3a2a' : '#8a6a4a';

    svg += `
      <g style="cursor:pointer" onclick="openWordCard('${nodeWord.id}')">
        <circle cx="${pos.x}" cy="${pos.y}" r="${pos.size / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${isCurrent ? 4 : 2}"/>
        <text x="${pos.x}" y="${pos.y + 4}" text-anchor="middle" font-size="${Math.max(8, pos.size / 4)}" fill="#fff" font-family="Courier New, monospace" font-weight="bold">
          ${escapeHtml((nodeWord.word || '').slice(0, 6))}
        </text>
      </g>
    `;
  });

  container.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
      ${svg}
    </svg>
  `;
}

// ═══════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════

function onWordTypeChange(wordId, value) {
  if (!isEditable()) return;
  const word = DATA.vocabulary.find(w => w.id === wordId);
  if (!word) return;
  word.wordType = value;
  saveData(DATA);
  const field = document.getElementById('custom-type-field-' + wordId);
  if (field) field.style.display = value === 'Other' ? '' : 'none';
}

function addCustomWordType(name, wordId) {
  if (!isEditable() || !name) return;
  if (!DATA.settings.customWordTypes) DATA.settings.customWordTypes = [];
  if (!DATA.settings.customWordTypes.includes(name)) {
    DATA.settings.customWordTypes.push(name);
  }
  const word = DATA.vocabulary.find(w => w.id === wordId);
  if (word) word.wordType = name;
  saveData(DATA);
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

// ═══════════════════════════════════════════════
// BRANCH FORM
// ═══════════════════════════════════════════════

function openAddBranchForm(parentId) {
  if (!isEditable()) return;
  const parent = DATA.vocabulary.find(w => w.id === parentId);
  if (!parent) return;

  window._branchParentId = parentId;
  window._branchSelected = null;
  window._branchDirection = 'right';

  const content = document.getElementById('word-card-content');
  content.innerHTML = `
    <div class="word-card-header">
      <div class="word-card-header-title">Add Branch to ${escapeHtml(parent.word)}</div>
      <button onclick="closeModal('word-card-modal')" class="remove-btn">X</button>
    </div>
    <div class="modal-body" style="padding: 1.5rem;">

      <div class="word-card-field">
        <label>Search existing words in ${LANGUAGES[parent.language].name}:</label>
        <input type="text" id="branch-search" placeholder="Type to filter (word, reading, or meaning)..." 
               oninput="renderBranchCandidates(this.value)" autocomplete="off">
      </div>

      <div id="branch-candidates" style="max-height: 280px; overflow-y: auto; border: 2px solid var(--border-main); padding: 0.5rem; background: var(--bg-input); margin-top: 0.5rem;"></div>

      <div id="branch-selected-display" class="branch-selected-display hidden"></div>

      <div id="branch-new-word-section" class="hidden" style="margin-top: 1rem;">
        <div class="word-card-field">
          <label>New Word:</label>
          <input type="text" id="branch-new-word" placeholder="e.g., 안녕하세요">
        </div>
        <div class="word-card-field">
          <label>Meaning:</label>
          <input type="text" id="branch-new-meaning" placeholder="e.g., formal hello">
        </div>
      </div>

      <div class="word-card-field" style="margin-top: 1rem;">
        <label>Direction:</label>
        <div class="branch-direction-picker" id="branch-direction-picker">
          <button data-dir="up" onclick="pickBranchDirection('up')">↑</button>
          <button data-dir="right" onclick="pickBranchDirection('right')" class="active">→</button>
          <button data-dir="down" onclick="pickBranchDirection('down')">↓</button>
          <button data-dir="left" onclick="pickBranchDirection('left')">←</button>
        </div>
      </div>

      <div class="modal-footer" style="margin-top: 1rem;">
        <button class="save-btn" onclick="submitBranch('${parentId}')">Add Branch</button>
        <button class="cancel-btn" onclick="openWordCard('${parentId}')">Cancel</button>
      </div>
    </div>
  `;

  renderBranchCandidates('');
  document.getElementById('word-card-modal').classList.remove('hidden');
}

function renderBranchCandidates(query) {
  const container = document.getElementById('branch-candidates');
  if (!container) return;

  const parentId = window._branchParentId;
  const parent = DATA.vocabulary.find(w => w.id === parentId);
  if (!parent) return;

  // Candidates: same language only, exclude self
  const candidates = (DATA.vocabulary || []).filter(w => 
    w.language === parent.language && w.id !== parentId
  );

  if (!candidates.length) {
    container.innerHTML = `
      <div style="font-size:0.75rem; color: var(--text-dim); text-align:center; padding: 0.75rem;">
        No existing words in ${LANGUAGES[parent.language].name}. Create a new one below.
      </div>
    `;
    showNewWordSection();
    return;
  }

  // Use fuzzy search
  let results;
  if (typeof fuzzySearch === 'function' && query && query.trim()) {
    results = fuzzySearch(query, candidates);
  } else {
    results = candidates.slice(0, 40);
  }

  if (!results.length) {
    container.innerHTML = `
      <div style="font-size:0.75rem; color: var(--text-dim); text-align:center; padding: 0.75rem;">
        No matching words. Create a new one below.
      </div>
    `;
    showNewWordSection();
    return;
  }

    container.innerHTML = results.map(w => `
    <div class="branch-candidate-row" data-id="${w.id}"
         onclick="selectBranchCandidate('${w.id}')"
         style="padding: 0.4rem 0.6rem; cursor: pointer; border-bottom: 1px solid var(--border-soft); font-size: 0.8rem; display:flex; gap:0.5rem; align-items:center;">
      <strong>${escapeHtml(w.word)}</strong>
      ${w.reading ? `<span style="color:var(--text-dim); font-size:0.7rem;">(${escapeHtml(w.reading)})</span>` : ''}
      <span style="color: var(--text-dim); font-size:0.7rem;">— ${escapeHtml(w.meaning || '')}</span>
    </div>
  `).join('');

  // Always show the create-new fallback at the bottom
  const fallbackHtml = `
    <div style="padding: 0.6rem; text-align:center; border-top: 1px dashed var(--border-soft); margin-top: 0.5rem;">
      <button class="add-btn" style="font-size:0.7rem;" onclick="showNewWordSection()">
        Not here? Create New Word
      </button>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', fallbackHtml);
}


function selectBranchCandidate(id) {
  const word = DATA.vocabulary.find(w => w.id === id);
  if (!word) return;
  window._branchSelected = id;

  // Highlight selection
  document.querySelectorAll('.branch-candidate-row').forEach(row => {
    row.style.background = row.dataset.id === id ? 'var(--accent-ice)' : 'transparent';
  });

  const display = document.getElementById('branch-selected-display');
  display.classList.remove('hidden');
  display.innerHTML = `
    <div style="padding: 0.5rem 0.75rem; background: var(--accent-ice); border: 2px solid var(--border-main); font-size: 0.8rem;">
      <strong>Selected:</strong> ${escapeHtml(word.word)} — ${escapeHtml(word.meaning || '')}
      <button class="remove-btn" style="float:right; width: 20px; height: 20px;" onclick="clearBranchSelection()">X</button>
    </div>
  `;

  // Hide new word section
  document.getElementById('branch-new-word-section').classList.add('hidden');
}

function clearBranchSelection() {
  window._branchSelected = null;
  document.getElementById('branch-selected-display').classList.add('hidden');
  document.querySelectorAll('.branch-candidate-row').forEach(row => {
    row.style.background = 'transparent';
  });
}

function showNewWordSection() {
  window._branchSelected = null;
  const section = document.getElementById('branch-new-word-section');
  if (section) section.classList.remove('hidden');
  const display = document.getElementById('branch-selected-display');
  if (display) display.classList.add('hidden');
}

function submitBranch(parentId) {
  if (!isEditable()) return;
  const parent = DATA.vocabulary.find(w => w.id === parentId);
  if (!parent) return;

  const direction = window._branchDirection || 'right';
  const selectedId = window._branchSelected;

  const offsets = {
    up: { x: 0, y: -120 }, down: { x: 0, y: 120 },
    left: { x: -140, y: 0 }, right: { x: 140, y: 0 }
  };
  const off = offsets[direction];

  if (selectedId) {
    // Attach an existing word as a branch
    const child = DATA.vocabulary.find(w => w.id === selectedId);
    if (!child) return;

    // Prevent cycle: if child is an ancestor of parent
    if (isAncestor(child.id, parent.id)) {
      alert('Cannot add: this would create a cycle.');
      return;
    }

    child.parentId = parentId;
    child.direction = direction;
    // Reposition child near the parent
    child.gardenX = (parent.gardenX || 200) + off.x;
    child.gardenY = (parent.gardenY || 200) + off.y;

    parent.childIds = parent.childIds || [];
    if (!parent.childIds.includes(child.id)) parent.childIds.push(child.id);

    saveData(DATA);
    renderGarden();
    openWordCard(parentId);
    return;
  }

  // Create new word
  const wordText = document.getElementById('branch-new-word')?.value.trim();
  const meaningText = document.getElementById('branch-new-meaning')?.value.trim();
  if (!wordText) {
    alert('Enter a word or select one from the list.');
    return;
  }

  const newWord = {
    id: generateUUID(),
    word: wordText,
    meaning: meaningText || '',
    reading: '',
    language: parent.language,
    dateAdded: new Date().toISOString().slice(0,10),
    waters: 1,
    lastWatered: new Date().toISOString().slice(0,10),
    stage: 'sprout',
    parentId: parentId,
    childIds: [],
    connections: [],
    favorite: false,
    notes: '',
    backlog: false,
    gardenX: (parent.gardenX || 200) + off.x,
    gardenY: (parent.gardenY || 200) + off.y,
    theme: parent.theme || '',
    wordType: '',
    direction: direction
  };
  DATA.vocabulary.push(newWord);
  parent.childIds = parent.childIds || [];
  parent.childIds.push(newWord.id);
  saveData(DATA);
  renderGarden();
  openWordCard(parentId);
}

function isAncestor(possibleAncestorId, wordId) {
  // Walk up from wordId to see if we hit possibleAncestorId
  let current = DATA.vocabulary.find(w => w.id === wordId);
  const visited = new Set();
  while (current && current.parentId) {
    if (visited.has(current.id)) break;
    visited.add(current.id);
    if (current.parentId === possibleAncestorId) return true;
    current = DATA.vocabulary.find(w => w.id === current.parentId);
  }
  return false;
}
function openAddConnectionForm(wordId) {
  if (!isEditable()) return;
  const word = DATA.vocabulary.find(w => w.id === wordId);
  if (!word) return;
  window._connectionSource = wordId;
  window._connectionSelected = null;

  const content = document.getElementById('word-card-content');
  content.innerHTML = `
    <div class="word-card-header">
      <div class="word-card-header-title">Connect ${escapeHtml(word.word)} (${LANGUAGES[word.language].flag} ${LANGUAGES[word.language].name})</div>
      <button onclick="closeModal('word-card-modal')" class="remove-btn">X</button>
    </div>
    <div class="modal-body" style="padding: 1.5rem;">

      <div class="word-card-field">
        <label>Search words in other languages:</label>
        <input type="text" id="connection-search" placeholder="Type to filter (cross-language results first)..." 
               oninput="renderConnectionCandidates(this.value)" autocomplete="off">
      </div>

      <div id="connection-candidates" style="max-height: 380px; overflow-y: auto; border: 2px solid var(--border-main); padding: 0.5rem; background: var(--bg-input); margin-top: 0.5rem;"></div>

      <div id="connection-selected-display" class="branch-selected-display hidden" style="margin-top: 0.75rem;"></div>

      <div class="modal-footer" style="margin-top: 1rem;">
        <button class="cancel-btn" onclick="openWordCard('${wordId}')">Cancel</button>
      </div>
    </div>
  `;
  renderConnectionCandidates('');
  document.getElementById('word-card-modal').classList.remove('hidden');
}

function renderConnectionCandidates(query) {
  const container = document.getElementById('connection-candidates');
  if (!container) return;

  const sourceId = window._connectionSource;
  const sourceWord = DATA.vocabulary.find(w => w.id === sourceId);
  if (!sourceWord) return;

  // Exclude self and already connected
  const existing = new Set(sourceWord.connections || []);
  existing.add(sourceId);
  const candidates = (DATA.vocabulary || []).filter(w => !existing.has(w.id));

  if (!candidates.length) {
    container.innerHTML = `<div style="font-size:0.75rem; color: var(--text-dim); text-align:center; padding: 1rem;">No candidates available</div>`;
    return;
  }

  // Use cross-language prioritized fuzzy search
  let results;
  if (typeof fuzzySearchCrossLang === 'function') {
    results = fuzzySearchCrossLang(query, candidates, sourceWord.language);
  } else if (typeof fuzzySearch === 'function' && query && query.trim()) {
    results = fuzzySearch(query, candidates);
  } else {
    results = candidates.slice(0, 60);
  }

  if (!results.length) {
    container.innerHTML = `<div style="font-size:0.75rem; color: var(--text-dim); text-align:center; padding: 1rem;">No matches</div>`;
    return;
  }

  // Group by: cross-language first, then same-language
  const crossLang = results.filter(w => w.language !== sourceWord.language);
  const sameLang = results.filter(w => w.language === sourceWord.language);

  let html = '';

  if (crossLang.length) {
    html += `<div style="font-size:0.65rem; letter-spacing:1.5px; text-transform:uppercase; color:var(--text-dim); padding:0.3rem 0.5rem; border-bottom:1px dashed var(--border-soft);">Cross-language</div>`;
    html += crossLang.map(w => renderConnectionRow(w)).join('');
  }

  if (sameLang.length) {
    html += `<div style="font-size:0.65rem; letter-spacing:1.5px; text-transform:uppercase; color:var(--text-dim); padding:0.5rem 0.5rem 0.3rem; border-bottom:1px dashed var(--border-soft); margin-top:0.5rem;">Same language</div>`;
    html += sameLang.map(w => renderConnectionRow(w)).join('');
  }

  container.innerHTML = html;
}

function renderConnectionRow(w) {
  return `
    <div class="connection-candidate-row" data-id="${w.id}"
         onclick="selectConnectionCandidate('${w.id}')"
         style="padding: 0.4rem 0.6rem; cursor: pointer; border-bottom: 1px solid var(--border-soft); font-size: 0.8rem; display:flex; gap:0.5rem; align-items:center;">
      <span>${LANGUAGES[w.language].flag}</span>
      <strong>${escapeHtml(w.word)}</strong>
      ${w.reading ? `<span style="color:var(--text-dim); font-size:0.7rem;">(${escapeHtml(w.reading)})</span>` : ''}
      <span style="color: var(--text-dim); font-size:0.7rem;">— ${escapeHtml(w.meaning || '')}</span>
    </div>
  `;
}

function selectConnectionCandidate(id) {
  const word = DATA.vocabulary.find(w => w.id === id);
  if (!word) return;
  window._connectionSelected = id;

  document.querySelectorAll('.connection-candidate-row').forEach(row => {
    row.style.background = row.dataset.id === id ? 'var(--accent-ice)' : 'transparent';
  });

  const display = document.getElementById('connection-selected-display');
  display.classList.remove('hidden');
  display.innerHTML = `
    <div style="padding: 0.5rem 0.75rem; background: var(--accent-ice); border: 2px solid var(--border-main); font-size: 0.8rem; display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
      <span><strong>${LANGUAGES[word.language].flag} ${escapeHtml(word.word)}</strong> — ${escapeHtml(word.meaning || '')}</span>
      <button class="save-btn" style="font-size:0.7rem; padding: 0.3rem 0.75rem;" onclick="submitConnection('${word.id}')">Connect</button>
    </div>
  `;
}

function submitConnection(targetId) {
  if (!isEditable()) return;
  const sourceId = window._connectionSource;
  if (!sourceId) return;
  const sourceWord = DATA.vocabulary.find(w => w.id === sourceId);
  const targetWord = DATA.vocabulary.find(w => w.id === targetId);
  if (!sourceWord || !targetWord || sourceWord.id === targetWord.id) return;

  sourceWord.connections = sourceWord.connections || [];
  targetWord.connections = targetWord.connections || [];
  if (!sourceWord.connections.includes(targetWord.id)) sourceWord.connections.push(targetWord.id);
  if (!targetWord.connections.includes(sourceWord.id)) targetWord.connections.push(sourceWord.id);

  saveData(DATA);
  renderGarden();
  openWordCard(sourceWord.id);
}

function disconnectWord(aId, bId) {
  if (!isEditable()) return;
  if (!confirm('Remove this connection?')) return;
  const a = DATA.vocabulary.find(w => w.id === aId);
  const b = DATA.vocabulary.find(w => w.id === bId);
  if (!a || !b) return;
  a.connections = (a.connections || []).filter(id => id !== bId);
  b.connections = (b.connections || []).filter(id => id !== aId);
  saveData(DATA);
  openWordCard(aId);
  renderGarden();
}
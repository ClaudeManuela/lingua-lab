
//Section 1: Vocabulary Hub

let vocabTab = 'garden';

function initVocabTab() {
  if (DATA && DATA.settings && DATA.settings.lastVocabTab) {
    vocabTab = DATA.settings.lastVocabTab;
  }
}

function renderVocabulary() {
  const container = document.getElementById('vocabulary-page');
  if (!container) return;

  initVocabTab();

  document.querySelectorAll('.garden-modal-root').forEach(el => el.remove());

  container.innerHTML = `
<div class="vocab-layout ${vocabTab === 'palace' ? 'palace-active' : ''}">
      <div class="vocab-sidebar" id="vocab-sidebar"></div>
      <div class="vocab-main">
        <div class="vocab-header">
          <div class="vocab-header-title">Vocabulary</div>
          <div class="vocab-tabs" id="vocab-tabs">
            <button class="vocab-pill pill-study ${vocabTab === 'study' ? 'active' : ''}"
                    onclick="setVocabTab('study')">Study</button>
            <button class="vocab-pill pill-garden ${vocabTab === 'garden' ? 'active' : ''}"
                    onclick="setVocabTab('garden')">Garden</button>
                    <button class="vocab-pill pill-palace ${vocabTab === 'palace' ? 'active' : ''}"
                    onclick="setVocabTab('palace')">
            Memory Palace
            </button>
          </div>
        </div>
        <div class="vocab-content" id="vocab-content"></div>
      </div>
    </div>
  `;

  renderVocabSidebar();
  renderVocabContent();
}

//incomplete function for sidebar

function jumpToIncomplete() {
  const wasOnGarden = vocabTab === 'garden';
  if (!wasOnGarden) {
    vocabTab = 'garden';
    if (DATA.settings) {
      DATA.settings.lastVocabTab = 'garden';
      saveData(DATA);
    }
    document.querySelectorAll('.vocab-pill').forEach(btn => {
      btn.classList.toggle('active', btn.classList.contains('pill-garden'));
    });
    renderVocabSidebar();
  }
  gardenView = 'gallery';
  gardenThemeFilter = '__incomplete__';
  renderGarden('vocab-content');
}

function setVocabTab(tab) {
  if (tab === 'palace' && typeof renderPalace !== 'function') return;

  // Abandon any running palace session when leaving the Palace tab
  if (typeof palaceStudySession !== 'undefined' && palaceStudySession &&
      !palaceStudySession.complete && tab !== 'palace') {
    clearPalaceTimer();
    palaceStudySession = null;
    palaceTick = 0;
  }

  vocabTab = tab;
  if (DATA.settings) {
    DATA.settings.lastVocabTab = tab;
    saveData(DATA);
  }

  document.querySelectorAll('.vocab-pill').forEach(btn => {
    btn.classList.toggle('active', btn.classList.contains('pill-' + tab));
  });

  const layout = document.querySelector('.vocab-layout');
  if (layout) {
    layout.classList.toggle('palace-active', tab === 'palace');
  }

  renderVocabSidebar();
  renderVocabContent();
}

function renderVocabContent() {
  const slot = document.getElementById('vocab-content');
  if (!slot) return;

  if (vocabTab === 'study') {
    // Study.js mounts into #vocab-content
    if (typeof renderStudySetup === 'function') {
      renderStudySetup('vocab-content');
    }
  } else if (vocabTab === 'garden') {
    if (typeof renderGarden === 'function') {
      renderGarden('vocab-content');
    }
        } else if (vocabTab === 'palace') {
        if (typeof renderPalace === 'function') {
            renderPalace('vocab-content');
        }
        }
}

let showFullHistory = false;

function toggleFullHistory() {
  showFullHistory = !showFullHistory;
  renderVocabSidebar();
}

function renderVocabSidebar() {
  const sidebar = document.getElementById('vocab-sidebar');
  if (!sidebar) return;
  const admin = isEditable();
  
  sidebar.innerHTML = `
    <h2 class="garden-sidebar-h2">Vocabulary</h2>
    <div class="garden-sidebar-section">
      <div class="garden-sidebar-title">Languages (hours · points)</div>
      <div id="seed-points-list"></div>
    </div>

    <div class="garden-sidebar-section">
      <div class="garden-sidebar-title">Study History</div>
      <div id="study-history-list">
         <!-- Populated below -->
      </div>
    </div>

    <div class="garden-sidebar-section">
      <div class="garden-sidebar-title">Summary</div>
      <div id="garden-summary-list"></div>
    </div>
    
    <div class="garden-sidebar-section">
      <div class="garden-sidebar-title">Themes</div>
      <div id="theme-clusters-list"></div>
    </div>

    <div class="garden-sidebar-section" id="vocab-mode-actions">
      <div class="garden-sidebar-title">Actions</div>
      <div class="garden-sidebar-actions" id="vocab-actions-list"></div>
    </div>
  `;

  // 1. Languages
  document.getElementById('seed-points-list').innerHTML = GARDEN_LANGUAGES.map(slug => {
    const meta = LANGUAGES[slug];
    const hours = (getLanguageSummary(DATA, slug).totalMinutes / 60).toFixed(1);
    return `<div class="garden-sidebar-row"><span>${meta.flag} ${meta.name}</span><strong>${hours}h</strong></div>`;
  }).join('');

  // 2. History
  const sessions = DATA.studySessions || [];
  const recent = [...sessions].reverse();
  const displaySessions = showFullHistory ? recent : recent.slice(0, 5);
  
  document.getElementById('study-history-list').innerHTML = `
    ${displaySessions.map(s => `
      <div class="garden-sidebar-row" style="font-size:0.65rem;">
        <span>${s.date}</span>
        <strong>${s.wordsReviewed} cards</strong>
      </div>
    `).join('')}
    ${!showFullHistory && recent.length > 5 ? `
      <button class="add-btn small" style="margin-top:0.5rem; width:100%;" onclick="toggleFullHistory()">Show All (${recent.length})</button>
    ` : ''}
    ${showFullHistory && recent.length > 5 ? `
      <button class="add-btn small" style="margin-top:0.5rem; width:100%;" onclick="toggleFullHistory()">Show Less</button>
    ` : ''}
  `;

  // 3. Summary
  const words = DATA.vocabulary || [];
  document.getElementById('garden-summary-list').innerHTML = `
    <div class="garden-sidebar-row"><span>Total words</span><strong>${words.length}</strong></div>
    <div class="garden-sidebar-row theme-sidebar-row" onclick="jumpToIncomplete()" style="color: var(--danger);">
      <span>⚠ Incomplete words</span>
      <strong>${words.filter(isIncompleteWord).length}</strong>
    </div>
  `;

  // 4. Actions
  const actions = document.getElementById('vocab-actions-list');
  actions.innerHTML = admin ? `
    <button onclick="openStudyMode()">Study</button>
    <button onclick="openAddWordsModal()">+ Add Words</button>
    <button onclick="openBackfillModal()">Backfill</button>
    <button onclick="toggleGardenEditMode()" class="${gardenEditMode ? 'active' : ''}">
      ${gardenEditMode ? '✓ Done editing' : '🗺️ Edit Garden'}
    </button>
    <button onclick="openBulkEditModal()">✏️ Bulk Edit Incomplete</button>
    <button onclick="findAndFixDuplicates()" style="margin-top: 1rem; background: var(--danger); color: white;">⚠ Find Duplicates</button>
  ` : '';
}

//study by theme
function jumpToTheme(slug) {
  // Ensure Garden tab is active — set state without triggering a render
  const wasOnGarden = vocabTab === 'garden';
  if (!wasOnGarden) {
    vocabTab = 'garden';
    if (DATA.settings) {
      DATA.settings.lastVocabTab = 'garden';
      saveData(DATA);
    }
    document.querySelectorAll('.vocab-pill').forEach(btn => {
      btn.classList.toggle('active', btn.classList.contains('pill-garden'));
    });
    renderVocabSidebar();
  }

  // Force Gallery view + apply the theme filter BEFORE rendering
  if (typeof gardenView !== 'undefined') gardenView = 'gallery';
  if (typeof gardenThemeFilter !== 'undefined') gardenThemeFilter = slug;

  // Render once, with everything already set
  renderGarden('vocab-content');
}
// Section 2: Garden
/* ============================================
   Tree-visual word card, fuzzy search, garden canvas
   ============================================ */

let gardenTab = 'all';
let gardenView = 'garden';
let currentZoom = 1.0;

let gardenThemeFilter = null;
let gardenGallerySort = 'newest';
let gardenThemesHidden = (typeof DATA !== 'undefined' && DATA?.settings?.galleryThemesHidden) || false;
let wordCardEditMode = false;

let gardenEditMode = false;
let gardenAmbientSprites = [];          // cached list of {src, x, y, rot, scale}
let gardenAmbientGenerated = false;     // has ambient been generated this session
let gardenRegionDrag = null;            // {slug, startX, startY, origX, origY}
let gardenPendingPlacement = null;      // {wordId} — user clicked "Place" and is choosing a point
let gardenPendingRegionSlug = null;

// ─── INCOMPLETE-WORD HELPERS ─────────────────
// Returns array of missing fields for a word:
//   'theme' | 'meaning' | 'type' (empty array = complete)
function isIncomplete(w) {
  const missing = [];
  if (!w.theme || !String(w.theme).trim()) missing.push('theme');
  if (!w.meaning || !String(w.meaning).trim()) missing.push('meaning');
  if (!w.wordType || !String(w.wordType).trim()) missing.push('type');
  return missing;
}

function isIncompleteWord(w) {
  return isIncomplete(w).length > 0;
}

// The special filter slug used for the "Incomplete" chip
const INCOMPLETE_SLUG = '__incomplete__';

function setGalleryThemeFilter(slug) {
  gardenThemeFilter = slug;
  renderGardenView();
}

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
  'Noun','Proper Noun', 'Verb', 'Adjective', 'Adverb', 'Pronoun', 'Particle',
  'Question', 'Conjunction', 'Preposition', 'Interjection',
  'Subject Marker', 'Topic Marker',
  'Idiom / Expression', 'Filler word', 'Counter',
  'Number', 'Phrase / Sentence', 'Other'
];

// ═══════════════════════════════════════════════
// MAIN RENDER
// ═══════════════════════════════════════════════

function renderGarden(targetId = 'vocab-content') {
  const container = document.getElementById(targetId);
  if (!container) return;
  const admin = isEditable();

  document.querySelectorAll('.garden-modal-root').forEach(el => el.remove());

  container.innerHTML = `
    <div class="garden-main-inner">
      <div class="garden-view-toggle">
        <button class="${gardenView === 'garden' ? 'active' : ''}" onclick="setGardenView('garden')">Garden</button>
        <button class="${gardenView === 'list' ? 'active' : ''}" onclick="setGardenView('list')">List</button>
        <button class="${gardenView === 'gallery' ? 'active' : ''}" onclick="setGardenView('gallery')">Gallery</button>
      </div>
      <div class="garden-tabs" id="garden-tabs"></div>
      <div id="garden-view-container"></div>
    </div>
  `;

  mountGardenModals(admin);
  mountRotatePrompt();
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
    <div class="garden-sidebar-row theme-sidebar-row"
         onclick="jumpToIncomplete()"
         style="color: var(--danger);">
      <span>⚠ Incomplete words</span>
      <strong>${words.filter(isIncompleteWord).length}</strong>
    </div>
  `;

  const historyEl = document.getElementById('study-history-list');
  if (historyEl) historyEl.innerHTML = renderStudyHistory();
}

//gamification and what not

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
  } else if (gardenView === 'gallery') {
    container.innerHTML = `<div class="garden-gallery-view" id="garden-gallery-view"></div>`;
    renderGardenGallery();
  } else {
    // Canvas view
    container.innerHTML = `
      ${gardenThemeFilter ? `
        <div class="garden-filter-badge">
          <span>Filtered: <strong>${THEME_MAP[gardenThemeFilter]?.icon || ''} ${THEME_MAP[gardenThemeFilter]?.label || gardenThemeFilter}</strong></span>
          <button onclick="setGalleryThemeFilter(null)" title="Clear filter">×</button>
        </div>
      ` : ''}
      <div class="garden-zoom-controls">
        <button onclick="zoomIn()">+</button>
        <button onclick="zoomOut()">−</button>
        <button onclick="resetZoom()">⟲</button>
        <span class="garden-zoom-label" id="zoom-label">100%</span>
      </div>
      ${gardenEditMode ? `
        <div class="garden-edit-banner">
          <span>🗺️ Edit mode: drag regions · ${gardenPendingPlacement ? 'click canvas to place word' : 'use sidebar to place unthemed words'}</span>
          ${gardenPendingPlacement ? `
            <button class="cancel-btn small" onclick="cancelGardenPlacement()">Cancel</button>
          ` : ''}
        </div>
      ` : ''}
      <div class="garden-canvas-wrap" id="garden-canvas-wrap">
        <div class="garden-canvas" id="garden-canvas">
          <div class="garden-ambient-layer" id="garden-ambient-layer"></div>
          <div class="garden-regions-layer" id="garden-regions-layer"></div>
          <svg class="garden-branches-svg" id="garden-branches-svg"></svg>
        </div>
      </div>
    `;
    applyZoom();
    renderGardenAmbient();
    renderGardenRegions();
    renderGardenPlants();
    if (typeof renderGardenBranches === 'function') renderGardenBranches();
    if (typeof initGardenZoom === 'function') initGardenZoom();
    if (typeof initGardenDrag === 'function') initGardenDrag();
    if (typeof initGardenRegionDrag === 'function') initGardenRegionDrag();
  }
  checkRotatePrompt();
}

// ─── GALLERY ─────────────────────────────────

function toggleGardenThemes() {
  gardenThemesHidden = !gardenThemesHidden;
  DATA.settings.galleryThemesHidden = gardenThemesHidden;
  saveData(DATA);
  renderGardenGallery();
}

function setGallerySort(val) {
  gardenGallerySort = val;
  renderGardenGallery();
}

function renderGardenGallery() {
  const container = document.getElementById('garden-gallery-view');
  if (!container) return;

  // Chips computed from the pool BEFORE theme filtering
  const poolForChips = [...(DATA.vocabulary || [])].filter(w => {
    if (GARDEN_LANGUAGES.includes(gardenTab)) return w.language === gardenTab;
    if (gardenTab === 'favorites') return w.favorite;
    return true;
  });

  const themeCounts = {};
  poolForChips.forEach(w => {
    if (w.theme) themeCounts[w.theme] = (themeCounts[w.theme] || 0) + 1;
  });
  const themesPresent = Object.keys(themeCounts).sort((a, b) => themeCounts[b] - themeCounts[a]);

  const incompleteCount = poolForChips.filter(isIncompleteWord).length;
  const showIncomplete = gardenThemeFilter === INCOMPLETE_SLUG;

 const chipRow = (themesPresent.length || incompleteCount) ? `
  <div class="gallery-theme-chips-header">
    <button class="theme-chips-toggle"
            onclick="toggleGardenThemes()">
      ${gardenThemesHidden ? '▸ Show themes' : '▾ Hide themes'}
    </button>
  </div>
  ${!gardenThemesHidden ? `
    <div class="gallery-theme-chips">
      <button class="theme-chip ${!gardenThemeFilter ? 'active' : ''}"
              onclick="setGalleryThemeFilter(null)">All</button>
      ${themesPresent.map(slug => `
        <button class="theme-chip ${gardenThemeFilter === slug ? 'active' : ''}"
                onclick="setGalleryThemeFilter('${slug}')">
          ${THEME_MAP[slug] ? THEME_MAP[slug].icon + ' ' + THEME_MAP[slug].label : slug}
          <span class="theme-chip-count">${themeCounts[slug]}</span>
        </button>
      `).join('')}
      ${incompleteCount ? `
        <button class="theme-chip theme-chip-incomplete ${showIncomplete ? 'active' : ''}"
                onclick="setGalleryThemeFilter('${INCOMPLETE_SLUG}')">
          ⚠ Incomplete
          <span class="theme-chip-count">${incompleteCount}</span>
        </button>
      ` : ''}
    </div>
  ` : ''}
` : '';

  const words = getFilteredWords();  // already theme/incomplete-filtered

  if (!words.length) {
    container.innerHTML = `
      ${chipRow}
      <div class="lang-empty">No words match this filter.</div>
    `;
    return;
  }

  const sorted = [...words];
  if (gardenGallerySort === 'waters') {
    sorted.sort((a, b) => (b.waters || 0) - (a.waters || 0));
  } else if (gardenGallerySort === 'alpha') {
    sorted.sort((a, b) => (a.word || '').localeCompare(b.word || ''));
  } else if (gardenGallerySort === 'theme') {
    sorted.sort((a, b) => (a.theme || 'zzz').localeCompare(b.theme || 'zzz'));
  } else {
    sorted.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
  }

  const avgWaters = (words.reduce((a, w) => a + (w.waters || 0), 0) / words.length).toFixed(1);
  const flowering = words.filter(w => (w.waters || 0) >= STAGE_THRESHOLDS.flowering).length;
  const label = GARDEN_LANGUAGES.includes(gardenTab)
    ? `${LANGUAGES[gardenTab].flag} ${LANGUAGES[gardenTab].name}`
    : gardenTab === 'favorites' ? '★ Favorites'
    : gardenTab === 'recent' ? '🕐 Recent'
    : '🌍 All languages';

  container.innerHTML = `
    <div class="gallery-header">
      <div class="gallery-header-title">${label}</div>
      <div class="gallery-header-stats">
        <span><strong>${words.length}</strong> words</span>
        <span>avg <strong>${avgWaters}</strong> waters</span>
        <span><strong>${flowering}</strong> flowering</span>
      </div>
      <select class="gallery-sort" onchange="setGallerySort(this.value)">
        <option value="newest" ${gardenGallerySort === 'newest' ? 'selected' : ''}>Newest</option>
        <option value="waters" ${gardenGallerySort === 'waters' ? 'selected' : ''}>Most watered</option>
        <option value="alpha" ${gardenGallerySort === 'alpha' ? 'selected' : ''}>A → Z</option>
        <option value="theme" ${gardenGallerySort === 'theme' ? 'selected' : ''}>By theme</option>
      </select>
    </div>

    ${chipRow}

    <div class="gallery-grid">
      ${sorted.map(renderGalleryCard).join('')}
    </div>
  `;
}

function renderGalleryCard(w) {
  const meta = LANGUAGES[w.language];
  if (!meta) return '';
  const waters = w.waters || 0;
  const pips = Math.min(20, waters);
  const missing = isIncomplete(w);
  const badge = missing.length
    ? `<div class="gallery-card-badge" title="Missing: ${missing.join(', ')}">⚠ ${missing.join(', ')}</div>`
    : '';
  const cluster = renderWordCluster(w).filter(f => f.text);
  const inline = cluster.map(formatFormEntry).join(' / ');

  return `
    <div class="gallery-card" onclick="openWordCard('${w.id}')" style="--lang-accent: ${meta.accent};">
      <div class="gallery-card-flag">${meta.flag}</div>
      <div class="gallery-card-word">${escapeHtml(inline)}</div>
      <div class="gallery-card-meaning">${escapeHtml(w.meaning || '—')}</div>
      <div class="gallery-card-pips">
        ${'<span class="gallery-pip"></span>'.repeat(pips)}
        ${waters > 20 ? `<span class="gallery-pip-more">+${waters - 20}</span>` : ''}
      </div>
      <div class="gallery-card-stage">${w.stage || 'seed'}</div>
      ${badge}
    </div>
  `;
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

//get filtered words with incomplete filter

function getFilteredWords() {
  let words = [...(DATA.vocabulary || [])];
  if (GARDEN_LANGUAGES.includes(gardenTab)) {
    words = words.filter(w => w.language === gardenTab);
  } else if (gardenTab === 'favorites') {
    words = words.filter(w => w.favorite);
  } else if (gardenTab === 'recent') {
    words = words.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)).slice(0, 100);
  }

  // Theme filter applies everywhere (canvas, list, gallery).
  // Special slug '__incomplete__' shows words missing theme/meaning/type.
  if (gardenThemeFilter === INCOMPLETE_SLUG) {
    words = words.filter(isIncompleteWord);
  } else if (gardenThemeFilter) {
    words = words.filter(w => w.theme === gardenThemeFilter);
  }

  return words;
}

// ═══════════════════════════════════════════════
// LIST VIEW
// ═══════════════════════════════════════════════

function renderGardenList() {
  const container = document.getElementById('garden-list-view');
  if (!container) return;

  // Chips computed from the pool BEFORE theme filtering
  const poolForChips = [...(DATA.vocabulary || [])].filter(w => {
    if (GARDEN_LANGUAGES.includes(gardenTab)) return w.language === gardenTab;
    if (gardenTab === 'favorites') return w.favorite;
    return true;
  });

  const themeCounts = {};
  poolForChips.forEach(w => {
    if (w.theme) themeCounts[w.theme] = (themeCounts[w.theme] || 0) + 1;
  });
  const themesPresent = Object.keys(themeCounts).sort((a, b) => themeCounts[b] - themeCounts[a]);

  const incompleteCount = poolForChips.filter(isIncompleteWord).length;
  const showIncomplete = gardenThemeFilter === INCOMPLETE_SLUG;

  const chipRow = (themesPresent.length || incompleteCount) ? `
    <div class="gallery-theme-chips">
      <button class="theme-chip ${!gardenThemeFilter ? 'active' : ''}"
              onclick="setGalleryThemeFilter(null)">All</button>
      ${themesPresent.map(slug => `
        <button class="theme-chip ${gardenThemeFilter === slug ? 'active' : ''}"
                onclick="setGalleryThemeFilter('${slug}')">
          ${THEME_MAP[slug] ? THEME_MAP[slug].icon + ' ' + THEME_MAP[slug].label : slug}
          <span class="theme-chip-count">${themeCounts[slug]}</span>
        </button>
      `).join('')}
      ${incompleteCount ? `
        <button class="theme-chip theme-chip-incomplete ${showIncomplete ? 'active' : ''}"
                onclick="setGalleryThemeFilter('${INCOMPLETE_SLUG}')">
          ⚠ Incomplete
          <span class="theme-chip-count">${incompleteCount}</span>
        </button>
      ` : ''}
    </div>
  ` : '';

  const words = getFilteredWords();  // already theme/incomplete-filtered

  if (!words.length) {
    container.innerHTML = `
      ${chipRow}
      <div class="lang-empty">${gardenThemeFilter ? 'No words match this filter.' : 'No words in this garden yet'}</div>
    `;
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

  const groupsHtml = stages.map(stage => {
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

  container.innerHTML = chipRow + groupsHtml;
}

function renderWordRow(w) {
  const meta = LANGUAGES[w.language];
  if (!meta) return '';
  const typeLabel = w.wordType ? `<span class="garden-word-type">${escapeHtml(w.wordType)}</span>` : '';
  const missing = isIncomplete(w);
  const warn = missing.length
    ? `<span class="garden-word-warn" title="Missing: ${missing.join(', ')}">⚠</span>`
    : '';
  const inline = formatClusterInline(w) || w.word;
  return `
    <div class="garden-word-row" onclick="openWordCard('${w.id}')">
      <span>${meta.flag}</span>
      <span class="garden-word-text">${escapeHtml(inline)}${typeLabel}${warn}</span>
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
  const plantType = w.plantType || 'leafy';

  // Hub words (have children) render 15% larger
  const isHub = (w.childIds || []).length > 0;
  const baseSize = getPlantSize(stage);
  const size = isHub ? Math.round(baseSize * 1.15) : baseSize;

  const el = document.createElement('div');
  el.className = 'garden-plant';
  if (plantType === 'leafy' || plantType === 'flowering') {
    el.classList.add('garden-plant-sway');
  }
  el.dataset.id = w.id;
  el.dataset.plantType = plantType;
  if (isHub) el.dataset.hub = 'true';

  el.style.left = (w.gardenX || 100) + 'px';
  el.style.top = (w.gardenY || 100) + 'px';
  el.style.width = size + 'px';

  el.innerHTML = `
    <svg class="garden-plant-svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
${renderPlantSVG(stage, size, plantType, w.flowerColor)}
    </svg>
    <div class="garden-plant-label">${escapeHtml(formatClusterShort(w) || w.word)}</div>
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

function renderPlantSVG(stage, size, plantType = 'leafy') {
  const fn = {
    flowering: renderFloweringPlant,
    pine: renderPineTree,
    leafy: renderLeafyTree
  }[plantType] || renderLeafyTree;
  return fn(stage, size);
}

// ─── SHARED PALETTE ──────────────────────────
const PLANT_PALETTE = {
  soilDark:   '#4a2e1e',
  trunkDark:  '#6b4522',
  trunkMid:   '#a07850',
  trunkLight: '#c19a68',
  leafDark:   '#3d6b2a',
  leafMid:    '#5a8d3a',
  leafLight:  '#7aad52',
  pineDark:   '#2e4d24',
  pineMid:    '#4a7238',
  pineLight:  '#6a9248',
  blossom1:   '#f0a8c0',
  blossom2:   '#e888a8',
  blossom3:   '#ffffff',
  blossomCtr: '#f5d878'
};

// ═══ PLANT SILHOUETTES & FLOWER COLORS ═══
function renderFloweringPlant(stage, size, flowerColor) {
  const c = size / 2;
  const P = PLANT_PALETTE;
  const F = flowerColor || '#f0a8c0'; // Default pink

  switch (stage) {
    case 'seed':
      return `<circle cx="${c}" cy="${c}" r="${size * 0.1}" fill="${P.soilDark}"/>`;
    case 'sprout':
      return `
        <rect x="${c - 1}" y="${c}" width="2" height="${size * 0.2}" fill="${P.leafMid}"/>
        <ellipse cx="${c - size * 0.08}" cy="${c}" rx="${size * 0.08}" ry="${size * 0.04}" fill="${P.leafLight}"/>
        <ellipse cx="${c + size * 0.08}" cy="${c}" rx="${size * 0.08}" ry="${size * 0.04}" fill="${P.leafLight}"/>
      `;
    case 'seedling':
      return `
        <rect x="${c - 1.5}" y="${c - size * 0.1}" width="3" height="${size * 0.3}" fill="${P.leafMid}"/>
        <ellipse cx="${c - size * 0.12}" cy="${c - size * 0.1}" rx="${size * 0.1}" ry="${size * 0.06}" fill="${P.leafLight}"/>
        <ellipse cx="${c + size * 0.12}" cy="${c - size * 0.2}" rx="${size * 0.1}" ry="${size * 0.06}" fill="${P.leafLight}"/>
        <circle cx="${c}" cy="${c - size * 0.15}" r="${size * 0.05}" fill="${F}"/>
      `;
    default: // sapling, trunk, flowering
      return `
        <rect x="${c - size * 0.04}" y="${c - size * 0.3}" width="${size * 0.08}" height="${size * 0.6}" fill="${P.trunkMid}"/>
        <ellipse cx="${c - size * 0.2}" cy="${c - size * 0.2}" rx="${size * 0.12}" ry="${size * 0.08}" fill="${P.leafMid}"/>
        <ellipse cx="${c + size * 0.2}" cy="${c - size * 0.35}" rx="${size * 0.12}" ry="${size * 0.08}" fill="${P.leafMid}"/>
        <circle cx="${c}" cy="${c - size * 0.4}" r="${size * 0.15}" fill="${F}"/>
        <circle cx="${c - size * 0.15}" cy="${c - size * 0.15}" r="${size * 0.08}" fill="${F}"/>
        <circle cx="${c + size * 0.18}" cy="${c - size * 0.25}" r="${size * 0.06}" fill="${F}"/>
      `;
  }
}

function renderPineTree(stage, size) {
  const c = size / 2;
  const P = PLANT_PALETTE;

  switch (stage) {
    case 'seed':
      return `<circle cx="${c}" cy="${c}" r="${size * 0.1}" fill="${P.soilDark}"/>`;
    case 'sprout':
    case 'seedling':
      return `
        <rect x="${c - 1}" y="${c}" width="2" height="${size * 0.15}" fill="${P.trunkMid}"/>
        <polygon points="${c},${c - size * 0.25} ${c - size * 0.15},${c} ${c + size * 0.15},${c}" fill="${P.pineDark}"/>
        <polygon points="${c},${c - size * 0.4} ${c - size * 0.1},${c - size * 0.2} ${c + size * 0.1},${c - size * 0.2}" fill="${P.pineMid}"/>
      `;
    default: // sapling, trunk, flowering
      return `
        <rect x="${c - size * 0.05}" y="${c - size * 0.1}" width="${size * 0.1}" height="${size * 0.4}" fill="${P.trunkMid}"/>
        <polygon points="${c},${c - size * 0.5} ${c - size * 0.25},${c - size * 0.1} ${c + size * 0.25},${c - size * 0.1}" fill="${P.pineDark}"/>
        <polygon points="${c},${c - size * 0.7} ${c - size * 0.18},${c - size * 0.35} ${c + size * 0.18},${c - size * 0.35}" fill="${P.pineMid}"/>
        <polygon points="${c},${c - size * 0.9} ${c - size * 0.12},${c - size * 0.6} ${c + size * 0.12},${c - size * 0.6}" fill="${P.pineLight}"/>
      `;
  }
}

function renderLeafyTree(stage, size) {
  const c = size / 2;
  const P = PLANT_PALETTE;

  switch (stage) {
    case 'seed':
      return `<circle cx="${c}" cy="${c}" r="${size * 0.1}" fill="${P.soilDark}"/>`;
    case 'sprout':
    case 'seedling':
      return `
        <rect x="${c - 2}" y="${c - size * 0.05}" width="4" height="${size * 0.2}" fill="${P.trunkMid}"/>
        <circle cx="${c}" cy="${c - size * 0.15}" r="${size * 0.2}" fill="${P.leafMid}"/>
      `;
    default: // sapling, trunk, flowering
      return `
        <rect x="${c - size * 0.06}" y="${c - size * 0.2}" width="${size * 0.12}" height="${size * 0.5}" fill="${P.trunkMid}"/>
        <circle cx="${c}" cy="${c - size * 0.35}" r="${size * 0.25}" fill="${P.leafDark}"/>
        <circle cx="${c - size * 0.15}" cy="${c - size * 0.25}" r="${size * 0.18}" fill="${P.leafMid}"/>
        <circle cx="${c + size * 0.15}" cy="${c - size * 0.25}" r="${size * 0.18}" fill="${P.leafLight}"/>
      `;
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
    // Normalize for checking (lowercase, trim)
    const normWord = word.trim().toLowerCase();
    
    // Find if it already exists
    const existing = DATA.vocabulary.find(w => 
      w.language === language && w.word.trim().toLowerCase() === normWord
    );
    
    if (existing) {
      // It's a duplicate — don't add it again, just increment water
      existing.waters = (existing.waters || 0) + 1;
      existing.lastWatered = date;
      updateWordStage(existing);
    } else {
      // It's new — add it
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
        direction: '',
        plantType: 'flowering' 
      });
    }
  });
  saveData(DATA);
}

// ═══════════════════════════════════════════════
// DUPLICATE CLEANUP TOOL
// ═══════════════════════════════════════════════

function findAndFixDuplicates() {
  if (!isEditable()) return;
  
  const seen = {};
  const duplicates = []; // Array of { primaryId, duplicateId }
  
  (DATA.vocabulary || []).forEach(w => {
    // Create a unique key based on language + word (normalized)
    const key = `${w.language}-${w.word.trim().toLowerCase()}`;
    
    if (!seen[key]) {
      // First time seeing this word — mark it as the primary
      seen[key] = w;
    } else {
      // We've seen this word before — it's a duplicate
      duplicates.push({
        primary: seen[key],
        duplicate: w
      });
    }
  });

  if (!duplicates.length) {
    alert('No duplicate words found! 🎉');
    return;
  }

  // Show prompt with options
  let msg = `Found ${duplicates.length} duplicate words:\n\n`;
  duplicates.slice(0, 10).forEach(d => {
    msg += `• ${d.primary.word} (${d.primary.language})\n`;
  });
  if (duplicates.length > 10) msg += `...and ${duplicates.length - 10} more.\n`;
  
  msg += `\nDelete the duplicates? (Their waters will be added to the primary word, and any Palace assignments will be updated).`;
  
  if (!confirm(msg)) return;

  // Do the merge
  duplicates.forEach(d => {
    const { primary, duplicate } = d;

    // 1. Merge waters
    primary.waters = (primary.waters || 0) + (duplicate.waters || 0);
    
    // 2. Merge dates (keep the older lastWatered)
    if (duplicate.lastWatered && (!primary.lastWatered || duplicate.lastWatered < primary.lastWatered)) {
      primary.lastWatered = duplicate.lastWatered;
    }
    if (duplicate.dateAdded && (!primary.dateAdded || duplicate.dateAdded < primary.dateAdded)) {
      primary.dateAdded = duplicate.dateAdded;
    }

    // 3. Merge connections (to avoid orphaned references)
    const conns = new Set([...(primary.connections || []), ...(duplicate.connections || [])]);
    conns.delete(duplicate.id); // remove self-reference
    conns.delete(primary.id);
    primary.connections = Array.from(conns);
    
    // Update the connection arrays of those other words
    primary.connections.forEach(cid => {
      const cw = DATA.vocabulary.find(x => x.id === cid);
      if (cw && cw.connections) {
        cw.connections = cw.connections.map(id => id === duplicate.id ? primary.id : id);
        cw.connections = [...new Set(cw.connections)]; // deduplicate
      }
    });

    // 4. Merge children (if the duplicate had children)
    (duplicate.childIds || []).forEach(cid => {
      const child = DATA.vocabulary.find(x => x.id === cid);
      if (child) {
        child.parentId = primary.id;
        if (!primary.childIds) primary.childIds = [];
        if (!primary.childIds.includes(cid)) primary.childIds.push(cid);
      }
    });

    // 5. Fix Palace assignments
    Object.keys(DATA.palaceRooms || {}).forEach(roomId => {
      const room = DATA.palaceRooms[roomId];
      (room.slots || []).forEach(slot => {
        Object.keys(slot.words || {}).forEach(lang => {
          if (slot.words[lang] === duplicate.id) {
            slot.words[lang] = primary.id; // Repoint to primary
          }
        });
      });
    });

    // 6. Remove the duplicate from vocabulary
    DATA.vocabulary = DATA.vocabulary.filter(w => w.id !== duplicate.id);
  });

  saveData(DATA);
  renderGarden();
  alert(`✅ Cleaned up ${duplicates.length} duplicate words.`);
}

function findAutoPosition(language) {
  const sameLang = (DATA.vocabulary || []).filter(w => w.language === language && w.gardenX);

  // If no words of this language yet, place at the center of the canvas
  if (!sameLang.length) {
    return { x: 600, y: 400 };
  }

  // Compute centroid of same-language words as the anchor
  const cx = sameLang.reduce((a, w) => a + w.gardenX, 0) / sameLang.length;
  const cy = sameLang.reduce((a, w) => a + w.gardenY, 0) / sameLang.length;

  // Spiral outward, looking for a spot with no neighbors within 60px
  const MIN_DIST = 60;
  for (let radius = 50; radius < 900; radius += 40) {
    const steps = Math.max(8, Math.floor(radius / 20));
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2 + radius * 0.1;  // rotate spiral
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      // Clamp to canvas bounds
      if (x < 40 || x > 1960 || y < 40 || y > 1560) continue;
      if (!hasNeighborWithin(x, y, MIN_DIST)) {
        return { x, y };
      }
    }
  }

  // Fallback — random offset
  return {
    x: cx + (Math.random() - 0.5) * 200,
    y: cy + (Math.random() - 0.5) * 200
  };
}

function hasNeighborWithin(x, y, distance) {
  return (DATA.vocabulary || []).some(w =>
    w.gardenX !== undefined &&
    Math.abs(w.gardenX - x) < distance &&
    Math.abs(w.gardenY - y) < distance
  );
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


function restoreGardenPlacement() {
  if (!isEditable()) return;
  const snap = DATA.settings._lastGardenSnapshot;
  if (!snap || !snap.length) {
    alert('No saved placement to restore.');
    return;
  }
  if (!confirm('Restore the placement from before the last "Cluster by Theme"?')) return;

  snap.forEach(s => {
    const w = DATA.vocabulary.find(x => x.id === s.id);
    if (w) {
      w.gardenX = s.gardenX;
      w.gardenY = s.gardenY;
    }
  });

  DATA.settings._lastGardenSnapshot = null;
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

// ═══════════════════════════════════════════════
// WORD CARD — (display / edit modes)
// ═══════════════════════════════════════════════

function toggleWordCardEdit() {
  wordCardEditMode = !wordCardEditMode;
  const id = document.getElementById('word-card-modal')?.dataset.wordId;
  if (id) openWordCard(id);
}

function openWordCard(id) {
  const word = DATA.vocabulary.find(w => w.id === id);
  if (!word) return;

  const meta = LANGUAGES[word.language];
  const admin = isEditable();
  const content = document.getElementById('word-card-content');
  const modal = document.getElementById('word-card-modal');
  const typeOptions = getWordTypeOptions();
  const parent = word.parentId ? DATA.vocabulary.find(w => w.id === word.parentId) : null;
  const connections = (word.connections || []).map(cid => DATA.vocabulary.find(w => w.id === cid)).filter(Boolean);
  const branches = (word.childIds || []).map(id => DATA.vocabulary.find(w => w.id === id)).filter(Boolean);

  // Reset edit mode when opening a new card
  if (modal?.dataset.wordId !== id) wordCardEditMode = false;
  if (modal) modal.dataset.wordId = id;

  const editing = wordCardEditMode && admin;
  const cluster = renderWordCluster(word);
  const headerTitle = formatClusterInline(word) || word.word;

  content.innerHTML = `
    <div class="word-card-header">
      <div class="word-card-header-title">${meta.flag} ${escapeHtml(headerTitle)}</div>
      <div class="word-card-header-actions">
        ${admin ? `<button class="word-card-edit-btn ${editing ? 'active' : ''}"
                          onclick="toggleWordCardEdit()"
                          title="${editing ? 'Done editing' : 'Edit word'}">
          ${editing ? '✓ Done' : '✏ Edit'}
        </button>` : ''}
        <button onclick="closeModal('word-card-modal')" class="remove-btn">X</button>
      </div>
    </div>

    <div class="word-card-body">

      <div class="word-card-left">
        <div class="word-card-tree-bg" id="word-card-tree"></div>
        <button class="word-card-show-all hidden" id="word-card-show-all" onclick="toggleAllBranches('${word.id}')">Show all branches</button>
      </div>

      <div class="word-card-right">
        <div class="word-card-ruled">

          ${renderWordCardFormsSection(word, editing, admin)}

          <div class="word-card-divider"></div>
          <div class="word-card-section-title">Details</div>

          ${renderWordCardField(word, editing, 'Meaning', 'meaning', escapeHtml(word.meaning || '—'))}
          ${renderWordCardSelect(word, editing, 'Type', 'wordType', typeOptions, word.wordType)}
         
<div class="word-card-field">
  <label>Plant type:</label>
  <div class="plant-type-picker">
    <button class="plant-type-btn ${(word.plantType || 'leafy') === 'flowering' ? 'active' : ''}" onclick="updatePlantType('${word.id}', 'flowering')">🌸 Flowering</button>
    <button class="plant-type-btn ${word.plantType === 'pine' ? 'active' : ''}" onclick="updatePlantType('${word.id}', 'pine')">🌲 Pine</button>
    <button class="plant-type-btn ${(word.plantType || 'leafy') === 'leafy' ? 'active' : ''}" onclick="updatePlantType('${word.id}', 'leafy')">🌳 Leafy</button>
  </div>
  ${(word.plantType === 'flowering' || !word.plantType) ? `
    <div style="margin-top: 0.5rem;">
      <label style="font-size:0.65rem; color:var(--paper-ink-soft);">Flower Color:</label>
      <div style="display:flex; gap:0.3rem; margin-top:0.2rem;">
        ${['#f0a8c0', '#d94b4b', '#f5d878', '#7bb6e8'].map(c => `
          <button style="width:20px; height:20px; border-radius:50%; background:${c}; border:2px solid ${word.flowerColor === c ? 'var(--text-main)' : 'transparent'};" 
                  onclick="updateFlowerColor('${word.id}', '${c}')"></button>
        `).join('')}
      </div>
    </div>
  ` : ''}
</div>
          ${renderWordCardThemeSelect(word, editing, word.theme)}
          ${renderWordCardField(word, editing, 'Reading', 'reading', escapeHtml(word.reading || '—'))}
          ${renderWordCardTextarea(word, editing, 'Notes', 'notes', escapeHtml(word.notes || ''))}

          <div class="word-card-divider"></div>
          <div class="word-card-section-title">Stats</div>

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
            <span class="word-card-value">${word.dateAdded || '—'}</span>
          </div>
          <div class="word-card-line">
            <span class="word-card-label">Last watered</span>
            <span class="word-card-value">${word.lastWatered || '—'}</span>
          </div>

          <div class="word-card-divider"></div>
          <div class="word-card-section-title">Connections</div>

          <div class="word-card-connections">
            ${connections.length ? connections.map(c => `
              <span class="connection-pill-wrap">
                <button class="connection-pill" onclick="openWordCard('${c.id}')">
                  ${LANGUAGES[c.language].flag} ${escapeHtml(c.word)}
                </button>
                ${admin ? `<button class="connection-pill-delete"
                                    onclick="event.stopPropagation(); disconnectWord('${word.id}', '${c.id}')"
                                    title="Remove connection">×</button>` : ''}
              </span>
            `).join('') : '<span class="word-card-empty">— none yet —</span>'}
          </div>
          ${admin ? `<div class="word-card-inline-add">
            <button class="add-btn small" onclick="openAddConnectionForm('${word.id}')">+ Connect</button>
          </div>` : ''}

          <div class="word-card-divider"></div>
          <div class="word-card-section-title">Branches</div>

          <div class="word-card-branch-list">
            ${branches.length ? branches.map(b => `
              <div class="word-card-branch-item">
                <button class="connection-pill" onclick="openWordCard('${b.id}')">
                  ${LANGUAGES[b.language].flag} ${escapeHtml(b.word)}
                </button>
                ${admin ? `<button class="connection-pill-delete"
                                    onclick="event.stopPropagation(); removeBranch('${word.id}', '${b.id}')"
                                    title="Remove branch">×</button>` : ''}
              </div>
            `).join('') : '<span class="word-card-empty">— none yet —</span>'}
          </div>
          ${admin ? `<div class="word-card-inline-add">
            <button class="add-btn small" onclick="openAddBranchForm('${word.id}')">+ Branch</button>
          </div>` : ''}

          ${admin ? `
            <div class="word-card-actions">
              <button class="add-btn" onclick="waterWord('${word.id}')">Water +1</button>
              <button class="add-btn" onclick="toggleFavorite('${word.id}')">${word.favorite ? 'Unfavorite' : 'Favorite'}</button>
            </div>
          ` : ''}

        </div>
      </div>

    </div>
  `;

  modal.classList.remove('hidden');
  setTimeout(() => drawWordCardTree(word, parent), 60);
}

function updatePlantType(wordId, type) {
  if (!isEditable()) return;
  const word = DATA.vocabulary.find(w => w.id === wordId);
  if (!word) return;
  word.plantType = type;
  saveData(DATA);
  openWordCard(wordId);
}

// ─── RENDER HELPERS ─────────────────────────

function renderWordCardFormsSection(w, editing, admin) {
  const forms = renderWordCluster(w);

  if (!editing) {
    // Display mode — clean list of forms with markers
    return `
      <div class="word-card-section-title">Forms</div>
      <div class="word-card-forms-display">
        ${forms.map(f => `
          <div class="word-card-form-row">
            <span class="word-card-form-text">${escapeHtml(formatFormEntry(f))}</span>
            <span class="word-card-form-markers">
              ${f.gender ? `<span class="form-gender" title="${f.gender}">${genderIcon(f.gender)}</span>` : ''}
              ${f.number ? `<span class="form-number">${numberLabel(f.number)}</span>` : ''}
            </span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Edit mode — inputs for base + each alt
  return `
    <div class="word-card-section-title">Forms</div>

    <div class="word-card-form-edit">
      <div class="word-card-form-edit-label">Base form</div>

      <div class="word-card-field">
        <label>Word:</label>
        <input type="text" value="${escapeHtml(w.word || '')}"
               onchange="updateWordField('${w.id}', 'word', this.value)">
      </div>

      <div class="word-card-field-row">
        <div class="word-card-field">
          <label>Gender:</label>
          <select onchange="updateWordField('${w.id}', 'gender', this.value)">
            ${GENDER_OPTIONS.map(o => `<option value="${o.value}" ${w.gender === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
        </div>
        <div class="word-card-field">
          <label>Number:</label>
          <select onchange="updateWordField('${w.id}', 'number', this.value)">
            ${NUMBER_OPTIONS.map(o => `<option value="${o.value}" ${w.number === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="word-card-field">
        <label>Article / Pronoun:</label>
        <input type="text" value="${escapeHtml(w.article || '')}"
               placeholder="e.g., la / el / elle"
               onchange="updateWordField('${w.id}', 'article', this.value)">
      </div>
    </div>

    ${(w.forms || []).map((f, i) => `
      <div class="word-card-form-edit alt">
        <div class="word-card-form-edit-label">
          Alt form ${i + 1}
          <button class="form-remove-btn"
                  onclick="removeWordForm('${w.id}', ${i})"
                  title="Remove this form">×</button>
        </div>

        <div class="word-card-field">
          <label>Word:</label>
          <input type="text" value="${escapeHtml(f.text || '')}"
                 onchange="updateWordFormField('${w.id}', ${i}, 'text', this.value)">
        </div>

        <div class="word-card-field-row">
          <div class="word-card-field">
            <label>Gender:</label>
            <select onchange="updateWordFormField('${w.id}', ${i}, 'gender', this.value)">
              ${GENDER_OPTIONS.map(o => `<option value="${o.value}" ${f.gender === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
            </select>
          </div>
          <div class="word-card-field">
            <label>Number:</label>
            <select onchange="updateWordFormField('${w.id}', ${i}, 'number', this.value)">
              ${NUMBER_OPTIONS.map(o => `<option value="${o.value}" ${f.number === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="word-card-field">
          <label>Article / Pronoun:</label>
          <input type="text" value="${escapeHtml(f.article || '')}"
                 placeholder="e.g., il / lo / lui"
                 onchange="updateWordFormField('${w.id}', ${i}, 'article', this.value)">
        </div>
      </div>
    `).join('')}

    <div class="word-card-inline-add">
      <button class="add-btn small" onclick="addWordForm('${w.id}')">+ Add alt form</button>
    </div>
  `;
}

function renderWordCardField(word, editing, label, key, displayValue) {
  if (!editing) {
    return `
      <div class="word-card-line">
        <span class="word-card-label">${label}</span>
        <span class="word-card-value">${displayValue}</span>
      </div>
    `;
  }
  return `
    <div class="word-card-field">
      <label>${label}:</label>
      <input type="text" value="${escapeHtml(word[key] || '')}"
             onchange="updateWordField('${word.id}', '${key}', this.value)">
    </div>
  `;
}

function renderWordCardTextarea(word, editing, label, key, displayValue) {
  if (!editing) {
    return `
      <div class="word-card-line">
        <span class="word-card-label">${label}</span>
        <span class="word-card-value">${displayValue || '—'}</span>
      </div>
    `;
  }
  return `
    <div class="word-card-field">
      <label>${label}:</label>
      <textarea onchange="updateWordField('${word.id}', '${key}', this.value)">${escapeHtml(word[key] || '')}</textarea>
    </div>
  `;
}

function renderWordCardSelect(word, editing, label, key, options, current) {
  if (!editing) {
    return `
      <div class="word-card-line">
        <span class="word-card-label">${label}</span>
        <span class="word-card-value">${escapeHtml(current || '—')}</span>
      </div>
    `;
  }
  return `
    <div class="word-card-field">
      <label>${label}:</label>
      <select onchange="onWordTypeChange('${word.id}', this.value)">
        <option value="">— pick —</option>
        ${options.map(t => `<option value="${t}" ${current === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
    </div>
  `;
}

function renderWordCardThemeSelect(word, editing, current) {
  if (!editing) {
    const t = current ? THEME_MAP[current] : null;
    const label = t ? `${t.icon} ${t.label}` : '—';
    return `
      <div class="word-card-line">
        <span class="word-card-label">Theme</span>
        <span class="word-card-value">${label}</span>
      </div>
    `;
  }
  return `
    <div class="word-card-field">
      <label>Theme:</label>
      <select onchange="updateWordTheme('${word.id}', this.value)">
        <option value="">— none —</option>
        ${THEMES.map(t => `
          <option value="${t.slug}" ${current === t.slug ? 'selected' : ''}>
            ${t.icon} ${t.label}
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

// ─── FORM MUTATIONS ────────────────────────

function addWordForm(id) {
  if (!isEditable()) return;
  const word = DATA.vocabulary.find(w => w.id === id);
  if (!word) return;
  if (!Array.isArray(word.forms)) word.forms = [];
  word.forms.push({ text: '', gender: '', number: '', article: '', notes: '' });
  saveData(DATA);
  openWordCard(id);
}

function removeWordForm(id, index) {
  if (!isEditable()) return;
  const word = DATA.vocabulary.find(w => w.id === id);
  if (!word || !Array.isArray(word.forms)) return;
  if (!confirm('Remove this alt form?')) return;
  word.forms.splice(index, 1);
  saveData(DATA);
  openWordCard(id);
}

function updateWordFormField(id, index, key, value) {
  if (!isEditable()) return;
  const word = DATA.vocabulary.find(w => w.id === id);
  if (!word || !word.forms || !word.forms[index]) return;
  word.forms[index][key] = value;
  saveData(DATA);
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

//change the colors of the flowering plants
function updateFlowerColor(id, color) {
  if (!isEditable()) return;
  const word = DATA.vocabulary.find(w => w.id === id);
  if (!word) return;
  word.flowerColor = color;
  saveData(DATA);
  openWordCard(id);
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

  // Nodes — use plant sprites instead of circles
Object.entries(positions).forEach(([id, pos]) => {
  const nodeWord = id === word.id ? word : (id === parent?.id ? parent : visibleChildren.find(c => c.id === id));
  if (!nodeWord) return;

  const nodeStage = nodeWord.stage || 'seed';
  const nodeType = nodeWord.plantType || 'leafy';
  const nodeSize = pos.size;

  // Wrap the plant SVG in a foreignObject so it renders inside the tree SVG
  svg += `
    <g style="cursor:pointer" onclick="openWordCard('${nodeWord.id}')">
      <foreignObject x="${pos.x - nodeSize / 2}" y="${pos.y - nodeSize / 2}"
                     width="${nodeSize}" height="${nodeSize}">
        <div xmlns="http://www.w3.org/1999/xhtml"
             style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 ${nodeSize} ${nodeSize}" width="${nodeSize}" height="${nodeSize}">
            ${renderPlantSVG(nodeStage, nodeSize, nodeType)}
          </svg>
        </div>
      </foreignObject>
      <text x="${pos.x}" y="${pos.y + nodeSize / 2 + 12}"
            text-anchor="middle"
            font-size="10"
            fill="#3a2520"
            font-family="Courier New, monospace"
            font-weight="bold">
        ${escapeHtml((nodeWord.word || '').slice(0, 8))}
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

//changing the theme
function updateWordTheme(id, slug) {
  if (!isEditable()) return;
  const word = DATA.vocabulary.find(w => w.id === id);
  if (!word) return;
  word.theme = slug || '';
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
  if (!confirm('Remove this branch? The child word will remain in the garden as its own root.')) return;
  const parent = DATA.vocabulary.find(w => w.id === parentId);
  if (!parent) return;
  parent.childIds = (parent.childIds || []).filter(id => id !== childId);
  const child = DATA.vocabulary.find(w => w.id === childId);
  if (child) child.parentId = null;
  saveData(DATA);
  renderGarden();
  openWordCard(parentId);
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

// ═══════════════════════════════════════════════
// BRANCH FORM
// ═══════════════════════════════════════════════

function openAddBranchForm(parentId) {
  if (!isEditable()) return;
  const parent = DATA.vocabulary.find(w => w.id === parentId);
  if (!parent) return;

  window._branchParentId = parentId;
  window._branchSelected = null;

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

  const candidates = (DATA.vocabulary || []).filter(w => 
    w.language === parent.language && w.id !== parentId
  );

  let results;
  if (candidates.length && typeof fuzzySearch === 'function' && query && query.trim()) {
    results = fuzzySearch(query, candidates);
  } else {
    results = candidates.slice(0, 40);
  }

  let html = '';

  if (!candidates.length) {
    html += `<div style="font-size:0.75rem; color: var(--text-dim); text-align:center; padding: 0.75rem;">No existing words in ${LANGUAGES[parent.language].name}. Create a new one below.</div>`;
  } else if (!results.length) {
    html += `<div style="font-size:0.75rem; color: var(--text-dim); text-align:center; padding: 0.75rem;">No matching words. Create a new one below.</div>`;
  } else {
    html += results.map(w => `
      <div class="branch-candidate-row" data-id="${w.id}"
           onclick="selectBranchCandidate('${w.id}')"
           style="padding: 0.4rem 0.6rem; cursor: pointer; border-bottom: 1px solid var(--border-soft); font-size: 0.8rem; display:flex; gap:0.5rem; align-items:center;">
        <strong>${escapeHtml(w.word)}</strong>
        ${w.reading ? `<span style="color:var(--text-dim); font-size:0.7rem;">(${escapeHtml(w.reading)})</span>` : ''}
        <span style="color: var(--text-dim); font-size:0.7rem;">— ${escapeHtml(w.meaning || '')}</span>
      </div>
    `).join('');
  }

  // Always show the create-new fallback
  html += `
    <div style="padding: 0.6rem; text-align:center; border-top: 1px dashed var(--border-soft); margin-top: 0.5rem;">
      <button class="add-btn" style="font-size:0.7rem;" onclick="showNewWordSection()">
        Not here? Create New Word
      </button>
    </div>
  `;

  container.innerHTML = html;
}

function selectBranchCandidate(id) {
  const word = DATA.vocabulary.find(w => w.id === id);
  if (!word) return;
  window._branchSelected = id;

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

  const selectedId = window._branchSelected;
  const position = findBranchPosition(parent, selectedId);

  if (selectedId) {
    const child = DATA.vocabulary.find(w => w.id === selectedId);
    if (!child) return;

    if (isAncestor(child.id, parent.id)) {
      alert('Cannot add: this would create a cycle.');
      return;
    }

    child.parentId = parentId;
    child.gardenX = position.x;
    child.gardenY = position.y;
    delete child.direction;

    parent.childIds = parent.childIds || [];
    if (!parent.childIds.includes(child.id)) parent.childIds.push(child.id);

    saveData(DATA);
    renderGarden();
    openWordCard(parentId);
    return;
  }

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
    gardenX: position.x,
    gardenY: position.y,
    theme: parent.theme || '',
    wordType: '',
      plantType: 'flowering'
  };
  DATA.vocabulary.push(newWord);
  parent.childIds = parent.childIds || [];
  parent.childIds.push(newWord.id);
  saveData(DATA);
  renderGarden();
  openWordCard(parentId);
}

function findBranchPosition(parent, excludeId) {
  const parentX = parent.gardenX || 200;
  const parentY = parent.gardenY || 200;

  // Tighter spacing than before
  const TIGHT_RADIUS = 90;      // was 110
  const TIGHT_SPACING = 100;    // was 130

  // Gather existing sibling positions (children of parent)
  const siblings = (parent.childIds || [])
    .filter(id => id !== excludeId)
    .map(id => DATA.vocabulary.find(w => w.id === id))
    .filter(Boolean);

  // Available directions with their offsets (tighter)
  const directions = [
    { key: 'up',    dx: 0,           dy: -TIGHT_RADIUS },
    { key: 'right', dx: TIGHT_SPACING, dy: 0 },
    { key: 'down',  dx: 0,           dy: TIGHT_RADIUS },
    { key: 'left',  dx: -TIGHT_SPACING, dy: 0 }
  ];

  // Count how many siblings occupy each direction
  const counts = { up: 0, right: 0, down: 0, left: 0 };
  siblings.forEach(s => {
    const sx = (s.gardenX || 0) - parentX;
    const sy = (s.gardenY || 0) - parentY;
    if (Math.abs(sx) < Math.abs(sy)) {
      counts[sy < 0 ? 'up' : 'down']++;
    } else {
      counts[sx < 0 ? 'left' : 'right']++;
    }
  });

  // Pick least-used direction
  const sorted = directions.slice().sort((a, b) => counts[a.key] - counts[b.key]);
  const chosen = sorted[0];

  // Small jitter to avoid perfect overlap
  const jitterX = (Math.random() - 0.5) * 20;
  const jitterY = (Math.random() - 0.5) * 20;

  return {
    x: parentX + chosen.dx + jitterX,
    y: parentY + chosen.dy + jitterY
  };
}

// ═══════════════════════════════════════════════
// TIDY BRANCHES (5.6e)
// Recursively re-place every child near its parent,
// preserving tree structure but compressing long branches.
// ═══════════════════════════════════════════════

function tidyBranches() {
  if (!isEditable()) return;
  if (!confirm('Tidy branch layout? Children will be re-placed near their parents. You can undo with Restore Placement.')) return;

  // Snapshot for undo (reuse the same field the Cluster button used)
  DATA.settings._lastGardenSnapshot = (DATA.vocabulary || []).map(w => ({
    id: w.id,
    gardenX: w.gardenX,
    gardenY: w.gardenY
  }));

  const roots = (DATA.vocabulary || []).filter(w => !w.parentId);
  const placed = new Set();
  let cursorX = 200;
  const START_Y = 200;

  roots.forEach(root => {
    if (placed.has(root.id)) return;
    // Place the root if it doesn't have a coherent position
    // (we don't move roots, only their descendants)
    placeSubtree(root, root.gardenX || cursorX, root.gardenY || START_Y);
    placed.add(root.id);

    // Advance the horizontal cursor for the next root's family if this one
    // was not previously positioned
    if (!root.gardenX) {
      cursorX += 400;
      if (cursorX > 1700) cursorX = 200;
    }
  });

  saveData(DATA);
  renderGarden();
  if (typeof renderGardenBranches === 'function') renderGardenBranches();
}

function placeSubtree(node, cx, cy) {
  const children = (node.childIds || [])
    .map(id => DATA.vocabulary.find(w => w.id === id))
    .filter(Boolean);

  if (!children.length) return;

  // Distribute children in a circle around the node
  const count = children.length;
  const radius = 90 + Math.min(count * 8, 80);  // grows slowly with count
  children.forEach((child, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const jitterX = (Math.random() - 0.5) * 15;
    const jitterY = (Math.random() - 0.5) * 15;
    child.gardenX = Math.round(cx + Math.cos(angle) * radius + jitterX);
    child.gardenY = Math.round(cy + Math.sin(angle) * radius + jitterY);

    // Clamp to canvas
    child.gardenX = Math.max(40, Math.min(1960, child.gardenX));
    child.gardenY = Math.max(40, Math.min(1560, child.gardenY));

    // Recurse for the child's own children
    placeSubtree(child, child.gardenX, child.gardenY);
  });
}

function isAncestor(possibleAncestorId, wordId) {
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

  // Check FIRST — before modifying anything
  if (hasBranchRelation(sourceWord.id, targetWord.id)) {
    alert('These words are already connected as parent/child. Remove the branch first if you want to connect them instead.');
    return;
  }

  // Now safe to add the connection
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

//change parent as learning goes on
function openChangeParentForm(wordId) {
  if (!isEditable()) return;
  const word = DATA.vocabulary.find(w => w.id === wordId);
  if (!word) return;
  window._changeParentTargetId = wordId;
  window._changeParentSelected = word.parentId || '';

  const content = document.getElementById('word-card-content');
  content.innerHTML = `
    <div class="word-card-header">
      <div class="word-card-header-title">Change Parent for ${escapeHtml(word.word)}</div>
      <button onclick="closeModal('word-card-modal')" class="remove-btn">X</button>
    </div>
    <div class="modal-body" style="padding: 1.5rem;">
      <div class="word-card-field">
        <label>Search candidates in ${LANGUAGES[word.language].name}:</label>
        <input type="text" id="parent-search" placeholder="Type to filter..." 
               oninput="renderParentCandidates(this.value)" autocomplete="off">
      </div>
      <div id="parent-candidates" style="max-height: 320px; overflow-y: auto; border: 2px solid var(--border-main); padding: 0.5rem; background: var(--bg-input); margin-top: 0.5rem;"></div>
      <div class="modal-footer" style="margin-top: 1rem;">
        <button class="save-btn" onclick="submitParentChange()">Confirm</button>
        <button class="cancel-btn" onclick="openWordCard('${wordId}')">Cancel</button>
      </div>
    </div>
  `;
  renderParentCandidates('');
  document.getElementById('word-card-modal').classList.remove('hidden');
}

function renderParentCandidates(query) {
  const container = document.getElementById('parent-candidates');
  if (!container) return;
  const wordId = window._changeParentTargetId;
  const word = DATA.vocabulary.find(w => w.id === wordId);
  if (!word) return;

  // Candidates: same language, not self, not descendants of self
  const candidates = (DATA.vocabulary || []).filter(w => {
    if (w.language !== word.language) return false;
    if (w.id === wordId) return false;
    if (isDescendant(w.id, wordId)) return false;
    return true;
  });

  let results;
  if (candidates.length && typeof fuzzySearch === 'function' && query && query.trim()) {
    results = fuzzySearch(query, candidates);
  } else {
    results = candidates.slice(0, 40);
  }

  let html = `
    <div class="parent-candidate-row ${!word.parentId ? 'active' : ''}" data-id=""
         onclick="selectParentCandidate('')"
         style="padding: 0.5rem 0.75rem; cursor: pointer; border-bottom: 1px solid var(--border-soft); font-size: 0.8rem; font-style: italic;">
      (no parent — make root)
    </div>
  `;

  html += results.map(w => `
    <div class="parent-candidate-row ${word.parentId === w.id ? 'active' : ''}" data-id="${w.id}"
         onclick="selectParentCandidate('${w.id}')"
         style="padding: 0.5rem 0.75rem; cursor: pointer; border-bottom: 1px solid var(--border-soft); font-size: 0.8rem;">
      <strong>${escapeHtml(w.word)}</strong>
      <span style="color: var(--text-dim); font-size: 0.7rem;">— ${escapeHtml(w.meaning || '')}</span>
    </div>
  `).join('');

  container.innerHTML = html;
}

function selectParentCandidate(id) {
  window._changeParentSelected = id;
  document.querySelectorAll('.parent-candidate-row').forEach(row => {
    row.style.background = row.dataset.id === id ? 'var(--accent-ice)' : 'transparent';
  });
}

function submitParentChange() {
  if (!isEditable()) return;
  const wordId = window._changeParentTargetId;
  const newParentId = window._changeParentSelected || null;
  const word = DATA.vocabulary.find(w => w.id === wordId);
  if (!word) return;

  // Detach from old parent
  if (word.parentId) {
    const oldParent = DATA.vocabulary.find(w => w.id === word.parentId);
    if (oldParent) oldParent.childIds = (oldParent.childIds || []).filter(id => id !== wordId);
  }

  // Attach to new parent
  if (newParentId) {
    const newParent = DATA.vocabulary.find(w => w.id === newParentId);
    if (newParent) {
      newParent.childIds = newParent.childIds || [];
      if (!newParent.childIds.includes(wordId)) newParent.childIds.push(wordId);
      word.parentId = newParentId;
    }
  } else {
    word.parentId = null;
  }

  saveData(DATA);
  renderGarden();
  openWordCard(wordId);
}

function isDescendant(possibleDescendantId, wordId) {
  // Walk down from wordId to see if we hit possibleDescendantId
  const queue = [wordId];
  const visited = new Set();
  while (queue.length) {
    const current = DATA.vocabulary.find(w => w.id === queue.shift());
    if (!current) continue;
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    if (current.id === possibleDescendantId) return true;
    (current.childIds || []).forEach(id => queue.push(id));
  }
  return false;
}

function hasBranchRelation(aId, bId) {
  const a = DATA.vocabulary.find(w => w.id === aId);
  const b = DATA.vocabulary.find(w => w.id === bId);
  if (!a || !b) return false;
  if (a.parentId === bId || b.parentId === aId) return true;
  if ((a.childIds || []).includes(bId) || (b.childIds || []).includes(aId)) return true;
  return false;
}

// ═ garden decor// ═══════════════════════════════════════════════

const AMBIENT_SPRITES = [
  'grass-1.png',
  'grass-2.png',
  'grass-3.png',
  'rock-1.png',
  'rock-2.png',
  'flower-1.png',
  'flower-2.png',
  'mushroom-1.png',
  'bush-1.png',
  'log-1.png'
];

const AMBIENT_COUNT = 40;               // total sprites scattered
const AMBIENT_AVOID_RADIUS = 40;        // px — avoid placing near plants

function renderGardenAmbient() {
  const layer = document.getElementById('garden-ambient-layer');
  if (!layer) return;
  layer.innerHTML = '';

  // Generate once per session, deterministic per data snapshot
  if (!gardenAmbientGenerated) {
    gardenAmbientSprites = generateAmbientSprites();
    gardenAmbientGenerated = true;
  }

  gardenAmbientSprites.forEach(s => {
    const img = document.createElement('img');
    img.src = `assets/garden/ambient/${s.src}`;
    img.className = 'garden-ambient-sprite';
    img.style.left = s.x + 'px';
    img.style.top = s.y + 'px';
    img.style.transform = `rotate(${s.rot}deg) scale(${s.scale})`;
    img.style.width = s.size + 'px';
    img.style.height = s.size + 'px';
    img.onerror = () => img.remove();  // silently drop missing sprites
    layer.appendChild(img);
  });
}

function generateAmbientSprites() {
  const CANVAS_W = 2000;
  const CANVAS_H = 1600;
  const out = [];
  const words = DATA.vocabulary || [];
  let attempts = 0;
  const MAX_ATTEMPTS = AMBIENT_COUNT * 8;

  // Seeded random for deterministic layout
  const seed = hashString('garden-ambient-v1');
  const rng = mulberry32(seed);

  while (out.length < AMBIENT_COUNT && attempts < MAX_ATTEMPTS) {
    attempts++;
    const x = rng() * (CANVAS_W - 40) + 20;
    const y = rng() * (CANVAS_H - 40) + 20;

    // Avoid plants
    const tooClose = words.some(w => {
      const dx = (w.gardenX || 0) - x;
      const dy = (w.gardenY || 0) - y;
      return dx * dx + dy * dy < AMBIENT_AVOID_RADIUS * AMBIENT_AVOID_RADIUS;
    });
    if (tooClose) continue;

    out.push({
      src: AMBIENT_SPRITES[Math.floor(rng() * AMBIENT_SPRITES.length)],
      x: Math.round(x),
      y: Math.round(y),
      rot: Math.round((rng() - 0.5) * 40),
      scale: 0.7 + rng() * 0.6,
      size: 28 + Math.round(rng() * 24)
    });
  }

  return out;
}

// Simple deterministic PRNG
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// ════════════════theme sorting// ═══════════════════════════════════════════════

function toggleGardenEditMode() {
  gardenEditMode = !gardenEditMode;
  DATA.settings.gardenEditMode = gardenEditMode;
  saveData(DATA);
  renderVocabSidebar();     // ← refresh sidebar buttons
  renderGarden();           // ← refresh canvas
}

function renderGardenRegions() {
  const layer = document.getElementById('garden-regions-layer');
  if (!layer) return;
  layer.innerHTML = '';

  if (!gardenEditMode) {
    layer.style.display = 'none';
    return;
  }
  layer.style.display = 'block';

  const regions = DATA.gardenThemeRegions || {};
  const themeSlugs = Object.keys(regions);

  themeSlugs.forEach(slug => {
    const r = regions[slug];
    const t = THEME_MAP[slug];
    if (!t) return;

    const el = document.createElement('div');
    el.className = 'garden-region';
    el.dataset.slug = slug;
    el.style.left = r.x + 'px';
    el.style.top = r.y + 'px';
    el.style.width = r.w + 'px';
    el.style.height = r.h + 'px';
    el.style.borderColor = hexToRgba(t.color, 0.6);
    el.style.background = hexToRgba(t.color, 0.12);

    const wordCount = (DATA.vocabulary || []).filter(w => w.theme === slug).length;

    el.innerHTML = `
  <div class="garden-region-label"
       style="background: ${hexToRgba(t.color, 0.9)}; color: #2a2520;"
       onclick="event.stopPropagation(); zoomToRegion('${slug}')">
    <span>${t.icon} ${t.label}</span>
    <span class="garden-region-count">${wordCount}</span>
    <button class="garden-region-zoom"
            onclick="event.stopPropagation(); zoomToRegion('${slug}')"
            title="Zoom to region">⤢</button>
    <button class="garden-region-delete"
            onclick="event.stopPropagation(); deleteGardenRegion('${slug}')"
            title="Delete region">×</button>
  </div>
  <div class="garden-region-resize"
       onmousedown="event.stopPropagation(); startRegionResize(event, '${slug}')"></div>
`;

    // Region drag
    el.addEventListener('mousedown', (e) => {
      if (e.target.closest('.garden-region-label')) return;
      if (e.target.closest('.garden-region-resize')) return;
      startRegionDrag(e, slug);
    });

    layer.appendChild(el);
  });
}

function initGardenRegionDrag() {
  // Drag is handled per-element on mousedown; nothing global needed
}

function startRegionDrag(e, slug) {
  if (!gardenEditMode || !isEditable()) return;
  e.preventDefault();
  const r = DATA.gardenThemeRegions[slug];
  if (!r) return;

  gardenRegionDrag = {
    slug,
    startX: e.clientX,
    startY: e.clientY,
    origX: r.x,
    origY: r.y,
    mode: 'move'
  };

  document.addEventListener('mousemove', onRegionDragMove);
  document.addEventListener('mouseup', onRegionDragEnd);
}

function startRegionResize(e, slug) {
  if (!gardenEditMode || !isEditable()) return;
  e.preventDefault();
  const r = DATA.gardenThemeRegions[slug];
  if (!r) return;

  gardenRegionDrag = {
    slug,
    startX: e.clientX,
    startY: e.clientY,
    origX: r.x,
    origY: r.y,
    origW: r.w,
    origH: r.h,
    mode: 'resize'
  };

  document.addEventListener('mousemove', onRegionDragMove);
  document.addEventListener('mouseup', onRegionDragEnd);
}

function onRegionDragMove(e) {
  if (!gardenRegionDrag) return;
  const d = gardenRegionDrag;
  const r = DATA.gardenThemeRegions[d.slug];
  if (!r) return;

  const scale = currentZoom || 1;
  const dx = (e.clientX - d.startX) / scale;
  const dy = (e.clientY - d.startY) / scale;

  if (d.mode === 'move') {
    r.x = Math.round(d.origX + dx);
    r.y = Math.round(d.origY + dy);
  } else {
    r.w = Math.max(120, Math.round(d.origW + dx));
    r.h = Math.max(100, Math.round(d.origH + dy));
  }

  const el = document.querySelector(`.garden-region[data-slug="${d.slug}"]`);
  if (el) {
    el.style.left = r.x + 'px';
    el.style.top = r.y + 'px';
    el.style.width = r.w + 'px';
    el.style.height = r.h + 'px';
  }
}

function onRegionDragEnd() {
  if (!gardenRegionDrag) return;
  saveData(DATA);
  gardenRegionDrag = null;
  document.removeEventListener('mousemove', onRegionDragMove);
  document.removeEventListener('mouseup', onRegionDragEnd);
}

function zoomToRegion(slug) {
  const r = DATA.gardenThemeRegions[slug];
  const wrap = document.getElementById('garden-canvas-wrap');
  if (!r || !wrap) return;

  const padding = 100;
  const viewportW = wrap.clientWidth;
  const viewportH = wrap.clientHeight;

  // Compute zoom to fit region
  const zoomX = viewportW / (r.w + padding * 2);
  const zoomY = viewportH / (r.h + padding * 2);
  const newZoom = Math.min(2, Math.max(0.4, Math.min(zoomX, zoomY)));

  currentZoom = newZoom;
  applyZoom();

  // Scroll so region center is in view
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  wrap.scrollTo({
    left: cx * newZoom - viewportW / 2,
    top: cy * newZoom - viewportH / 2,
    behavior: 'smooth'
  });
}

// ─── UNTHEMED WORD PLACEMENT ────────────────
function startGardenPlacement(wordId) {
  const word = DATA.vocabulary.find(w => w.id === wordId);
  if (!word) return;
  gardenPendingPlacement = { wordId };
  renderGarden();

  const scene = document.getElementById('palace-scene') || document.getElementById('garden-canvas');
  if (!scene) return;

  // Attach a one-shot click handler to the canvas
  const canvas = document.getElementById('garden-canvas');
  if (canvas) {
    canvas.style.cursor = 'crosshair';
    canvas.addEventListener('click', onGardenPlacementClick, { once: false });
  }
}

function onGardenPlacementClick(e) {
  if (!gardenPendingPlacement) {
    const canvas = document.getElementById('garden-canvas');
    if (canvas) canvas.removeEventListener('click', onGardenPlacementClick);
    return;
  }
  // Ignore clicks inside existing plants or region labels
  if (e.target.closest('.garden-plant')) return;
  if (e.target.closest('.garden-region-label')) return;
  if (e.target.closest('.garden-region-resize')) return;

  const canvas = document.getElementById('garden-canvas');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const scale = currentZoom || 1;
  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;

  const word = DATA.vocabulary.find(w => w.id === gardenPendingPlacement.wordId);
  if (word) {
    word.gardenX = Math.round(x);
    word.gardenY = Math.round(y);

    // Check if this point is inside a theme region
    const regionTheme = findRegionAt(x, y);
    if (regionTheme) {
      word.theme = regionTheme;
    }
    // If outside all regions, we do nothing to the theme (per D1 = A)

    saveData(DATA);
  }

  cancelGardenPlacement();
  renderGarden();
}

function cancelGardenPlacement() {
  gardenPendingPlacement = null;
  const canvas = document.getElementById('garden-canvas');
  if (canvas) {
    canvas.removeEventListener('click', onGardenPlacementClick);
    canvas.style.cursor = '';
  }
  renderGarden();
}

function findRegionAt(x, y) {
  const regions = DATA.gardenThemeRegions || {};
  for (const slug of Object.keys(regions)) {
    const r = regions[slug];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      return slug;
    }
  }
  return null;
}

// ─── UNTHEMED LIST (sidebar) ─────────────────
function renderUnthemedWordsList() {
  const unthemed = (DATA.vocabulary || []).filter(w => !w.theme);

  if (!unthemed.length) {
    return `<div class="lang-empty" style="font-size:0.7rem;">All words have themes! 🎉</div>`;
  }

  return unthemed.slice(0, 40).map(w => {
    const meta = LANGUAGES[w.language];
    const display = formatClusterInline(w) || w.word;
    return `
      <div class="garden-unthemed-row">
        <span class="garden-unthemed-flag">${meta.flag}</span>
        <span class="garden-unthemed-word">${escapeHtml(display)}</span>
        <button class="garden-unthemed-place"
                onclick="startGardenPlacement('${w.id}')"
                ${gardenPendingPlacement ? 'disabled' : ''}>
          Place
        </button>
      </div>
    `;
  }).join('') + (unthemed.length > 40
    ? `<div class="garden-unthemed-more">+${unthemed.length - 40} more</div>`
    : '');
}
// ═══════════════════════════════════════════════
// REGION DRAWING 
// ═══════════════════════════════════════════════

let gardenRegionDrawing = null;   // {startX, startY, el}

function openNewRegionFlow() {
  if (!isEditable()) return;
  const available = THEMES.filter(t => !DATA.gardenThemeRegions[t.slug]);

  if (!available.length) {
    alert('All themes already have regions. Delete one first.');
    return;
  }

  const options = available.map((t, i) => `${i + 1}. ${t.icon} ${t.label}`).join('\n');
  const input = prompt(
    `Which theme?\n\n${options}\n\nEnter the number:`,
    '1'
  );
  if (!input) return;

  const idx = parseInt(input) - 1;
  if (isNaN(idx) || idx < 0 || idx >= available.length) {
    alert('Invalid choice.');
    return;
  }

  const themeSlug = available[idx].slug;
  startRegionDrawing(themeSlug);
}

function startRegionDrawing(slug) {
  gardenPendingRegionSlug = slug;

  const layer = document.getElementById('garden-regions-layer');
  if (!layer) return;

  layer.style.pointerEvents = 'auto';
  layer.style.cursor = 'crosshair';

  const canvas = document.getElementById('garden-canvas');
  if (canvas) canvas.style.cursor = 'crosshair';

  // Listen for mousedown on the layer
  layer.addEventListener('mousedown', onRegionDrawStart);
  layer.addEventListener('mousemove', onRegionDrawMove);
  document.addEventListener('mouseup', onRegionDrawEnd);
}

function onRegionDrawStart(e) {
  if (!gardenPendingRegionSlug) return;
  if (e.target.closest('.garden-region')) return;

  const canvas = document.getElementById('garden-canvas');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const scale = currentZoom || 1;
  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;

  gardenRegionDrawing = {
    startX: x,
    startY: y,
    el: document.createElement('div')
  };

  gardenRegionDrawing.el.className = 'garden-region drawing';
  gardenRegionDrawing.el.style.left = x + 'px';
  gardenRegionDrawing.el.style.top = y + 'px';
  gardenRegionDrawing.el.style.width = '0px';
  gardenRegionDrawing.el.style.height = '0px';

  const themeColor = (THEME_MAP[gardenPendingRegionSlug]?.color) || '#c8c8c8';
  gardenRegionDrawing.el.style.borderColor = hexToRgba(themeColor, 0.6);
  gardenRegionDrawing.el.style.background = hexToRgba(themeColor, 0.12);

  const layer = document.getElementById('garden-regions-layer');
  layer.appendChild(gardenRegionDrawing.el);
}

function onRegionDrawMove(e) {
  if (!gardenRegionDrawing) return;
  const canvas = document.getElementById('garden-canvas');
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const scale = currentZoom || 1;
  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;

  const x1 = Math.min(gardenRegionDrawing.startX, x);
  const y1 = Math.min(gardenRegionDrawing.startY, y);
  const w = Math.abs(x - gardenRegionDrawing.startX);
  const h = Math.abs(y - gardenRegionDrawing.startY);

  gardenRegionDrawing.el.style.left = x1 + 'px';
  gardenRegionDrawing.el.style.top = y1 + 'px';
  gardenRegionDrawing.el.style.width = w + 'px';
  gardenRegionDrawing.el.style.height = h + 'px';
}

function onRegionDrawEnd(e) {
  if (!gardenRegionDrawing) return;

  const canvas = document.getElementById('garden-canvas');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const scale = currentZoom || 1;
  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;

  const x1 = Math.min(gardenRegionDrawing.startX, x);
  const y1 = Math.min(gardenRegionDrawing.startY, y);
  const w = Math.abs(x - gardenRegionDrawing.startX);
  const h = Math.abs(y - gardenRegionDrawing.startY);

  const MIN_W = 100;
  const MIN_H = 80;

  if (w < MIN_W || h < MIN_H) {
    // Too small — discard and clean up
    gardenRegionDrawing.el.remove();
    gardenRegionDrawing = null;
    cleanupRegionDrawing();
    return;
  }

  // Commit the region
  DATA.gardenThemeRegions[gardenPendingRegionSlug] = {
    x: Math.round(x1),
    y: Math.round(y1),
    w: Math.round(w),
    h: Math.round(h)
  };
  saveData(DATA);

  gardenRegionDrawing = null;
  cleanupRegionDrawing();
  renderGarden();
}

function cleanupRegionDrawing() {
  gardenPendingRegionSlug = null;

  const layer = document.getElementById('garden-regions-layer');
  if (layer) {
    layer.removeEventListener('mousedown', onRegionDrawStart);
    layer.removeEventListener('mousemove', onRegionDrawMove);
    layer.style.pointerEvents = 'none';
    layer.style.cursor = '';
  }
  document.removeEventListener('mouseup', onRegionDrawEnd);

  const canvas = document.getElementById('garden-canvas');
  if (canvas) canvas.style.cursor = '';
}

function cancelRegionDrawing() {
  if (gardenRegionDrawing) {
    gardenRegionDrawing.el.remove();
    gardenRegionDrawing = null;
  }
  cleanupRegionDrawing();
  renderGarden();
}

// ─── REGION DELETION ────────────────────────
function deleteGardenRegion(slug) {
  if (!isEditable()) return;
  const t = THEME_MAP[slug];
  if (!t) return;
  if (!confirm(`Delete the ${t.label} region? Words keep their theme.`)) return;
  delete DATA.gardenThemeRegions[slug];
  saveData(DATA);
  renderGarden();
}

// ─── COLOR HELPERS ───────────────────────────
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function openBulkEditModal() {
  if (!isEditable()) return;
  
  const incomplete = DATA.vocabulary.filter(isIncompleteWord).slice(0, 20);
  if (!incomplete.length) {
    alert('No incomplete words found! 🎉');
    return;
  }

  const existing = document.getElementById('bulk-edit-modal');
  if (existing) existing.remove();

  const html = `
    <div class="modal-overlay" id="bulk-edit-modal">
      <div class="modal-box" style="max-width: 700px;">
        <div class="modal-header">
          <h2>Bulk Edit Incomplete Words</h2>
          <button class="remove-btn" onclick="document.getElementById('bulk-edit-modal').remove()">X</button>
        </div>
        <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
          ${incomplete.map(w => `
            <div style="border-bottom: 1px dashed var(--border-soft); padding: 0.5rem 0; display: flex; gap: 0.5rem; align-items: center;">
              <span style="width: 120px; font-weight: bold; font-size: 0.8rem;">${w.word}</span>
              
              <select class="bulk-theme" data-id="${w.id}" style="flex: 1; font-size: 0.7rem;">
                <option value="">— Theme —</option>
                ${THEMES.map(t => `<option value="${t.slug}" ${w.theme === t.slug ? 'selected' : ''}>${t.icon} ${t.label}</option>`).join('')}
              </select>

              <select class="bulk-type" data-id="${w.id}" style="flex: 1; font-size: 0.7rem;">
                <option value="">— Type —</option>
                ${DEFAULT_WORD_TYPES.map(t => `<option value="${t}" ${w.wordType === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>

              <input type="text" class="bulk-meaning" data-id="${w.id}" value="${w.meaning || ''}" placeholder="Meaning" style="flex: 1; font-size: 0.7rem;">
            </div>
          `).join('')}
        </div>
        <div class="modal-footer">
          <button class="save-btn" onclick="saveBulkEdit()">Save All</button>
          <button class="cancel-btn" onclick="document.getElementById('bulk-edit-modal').remove()">Cancel</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}

function saveBulkEdit() {
  document.querySelectorAll('.bulk-theme').forEach(el => {
    const w = DATA.vocabulary.find(v => v.id === el.dataset.id);
    if (w) w.theme = el.value;
  });
  document.querySelectorAll('.bulk-type').forEach(el => {
    const w = DATA.vocabulary.find(v => v.id === el.dataset.id);
    if (w) w.wordType = el.value;
  });
  document.querySelectorAll('.bulk-meaning').forEach(el => {
    const w = DATA.vocabulary.find(v => v.id === el.dataset.id);
    if (w) w.meaning = el.value;
  });
  saveData(DATA);
  document.getElementById('bulk-edit-modal').remove();
  renderGarden();
  renderVocabSidebar();
}

//Section 3.1 Garden branches

/* ============================================
   GARDEN BRANCHES — SVG rendering
   ============================================ */

function renderGardenBranches() {
  const svg = document.getElementById('garden-branches-svg');
  const canvas = document.getElementById('garden-canvas');
  if (!svg || !canvas) return;

  svg.innerHTML = '';

  const words = DATA.vocabulary || [];
  const visibleIds = new Set(getFilteredWords().map(w => w.id));

  // Parent → child branches
  words.forEach(w => {
    if (!visibleIds.has(w.id)) return;
    if (!w.parentId) return;
    const parent = words.find(p => p.id === w.parentId);
    if (!parent || !visibleIds.has(parent.id)) return;

    const x1 = (parent.gardenX || 100) + 20;
    const y1 = (parent.gardenY || 100) + 20;
    const x2 = (w.gardenX || 100) + 20;
    const y2 = (w.gardenY || 100) + 20;

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 - 20;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`);
    svg.appendChild(path);
  });

  
}

//Section 3.2 Garden Repositionning

/* ============================================
   GARDEN DRAG + ZOOM
   ============================================ */

let dragState = null;

function initGardenDrag() {
  const canvas = document.getElementById('garden-canvas');
  if (!canvas) return;

  // Set up mousedown/touchstart on plants via delegation
  canvas.addEventListener('mousedown', onPlantMouseDown);
  canvas.addEventListener('touchstart', onPlantTouchStart, { passive: false });
}

function onPlantMouseDown(e) {
  if (!isEditable()) return;
  const plant = e.target.closest('.garden-plant');
  if (!plant) return;
  e.preventDefault();
  startDrag(plant, e.clientX, e.clientY);
}

function onPlantTouchStart(e) {
  if (!isEditable()) return;
  const plant = e.target.closest('.garden-plant');
  if (!plant) return;
  const touch = e.touches[0];
  startDrag(plant, touch.clientX, touch.clientY);
}

function startDrag(plant, clientX, clientY) {
  const canvas = document.getElementById('garden-canvas');
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const plantRect = plant.getBoundingClientRect();
  const offsetX = clientX - plantRect.left;
  const offsetY = clientY - plantRect.top;

  dragState = {
    plant,
    id: plant.dataset.id,
    offsetX,
    offsetY,
    startX: clientX,
    startY: clientY,
    moved: false
  };

  plant.classList.add('dragging');

  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchmove', onDragTouchMove, { passive: false });
  document.addEventListener('touchend', onDragEnd);
}

function onDragMove(e) {
  if (!dragState) return;
  handleDragMove(e.clientX, e.clientY);
}

function onDragTouchMove(e) {
  if (!dragState) return;
  const touch = e.touches[0];
  handleDragMove(touch.clientX, touch.clientY);
  e.preventDefault();
}

function handleDragMove(clientX, clientY) {
  const { plant, offsetX, offsetY, startX, startY } = dragState;
  const canvas = document.getElementById('garden-canvas');
  if (!canvas) return;

  // Detect movement
  if (Math.abs(clientX - startX) > 4 || Math.abs(clientY - startY) > 4) {
    dragState.moved = true;
    plant.dataset.dragged = 'true';
  }

  const canvasRect = canvas.getBoundingClientRect();
  // Account for zoom scale
  const scale = currentZoom || 1;
  const newLeft = (clientX - canvasRect.left) / scale - offsetX / scale;
  const newTop = (clientY - canvasRect.top) / scale - offsetY / scale;

  plant.style.left = newLeft + 'px';
  plant.style.top = newTop + 'px';
}

function onDragEnd() {
  if (!dragState) return;
  const { plant, id, moved } = dragState;

  plant.classList.remove('dragging');

  if (moved) {
    const word = DATA.vocabulary.find(w => w.id === id);
    if (word) {
      const oldX = word.gardenX || 100;
      const oldY = word.gardenY || 100;
      const newX = parseInt(plant.style.left) || 100;
      const newY = parseInt(plant.style.top) || 100;

      const dx = newX - oldX;
      const dy = newY - oldY;

      // Move the primary word
      word.gardenX = newX;
      word.gardenY = newY;

      // Recursively move all descendants by the same delta
      const descendants = collectDescendants(word.id);
      descendants.forEach(d => {
        d.gardenX = (d.gardenX || 100) + dx;
        d.gardenY = (d.gardenY || 100) + dy;
        // Also update the DOM element if it exists
        const el = document.querySelector(`.garden-plant[data-id="${d.id}"]`);
        if (el) {
          el.style.left = d.gardenX + 'px';
          el.style.top = d.gardenY + 'px';
        }
      });

      saveData(DATA);

      // Re-render branch lines
      if (typeof renderGardenBranches === 'function') {
        renderGardenBranches();
      }
    }
  }

  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
  document.removeEventListener('touchmove', onDragTouchMove);
  document.removeEventListener('touchend', onDragEnd);

  dragState = null;
}

function collectDescendants(wordId) {
  const result = [];
  const visited = new Set();
  const queue = [wordId];

  while (queue.length) {
    const currentId = queue.shift();
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const current = DATA.vocabulary.find(w => w.id === currentId);
    if (!current) continue;

    (current.childIds || []).forEach(childId => {
      if (!visited.has(childId)) {
        const child = DATA.vocabulary.find(w => w.id === childId);
        if (child) {
          result.push(child);
          queue.push(childId);
        }
      }
    });
  }

  return result;
}

// ═══════════════════════════════════════════════
// ZOOM (wheel + pinch)
// ═══════════════════════════════════════════════

function initGardenZoom() {
  const wrap = document.getElementById('garden-canvas-wrap');
  if (!wrap) return;

  wrap.addEventListener('wheel', onGardenWheel, { passive: false });

  // Pinch zoom
  let lastDist = 0;
  wrap.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      lastDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });

  wrap.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && lastDist) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (dist - lastDist) / 300;
      currentZoom = Math.max(0.4, Math.min(3, currentZoom + delta));
      applyZoom();
      lastDist = dist;
      e.preventDefault();
    }
  }, { passive: false });

  wrap.addEventListener('touchend', () => { lastDist = 0; });
}

function onGardenWheel(e) {
  if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 40) return;
  e.preventDefault();
  const delta = -e.deltaY / 500;
  currentZoom = Math.max(0.4, Math.min(3, currentZoom + delta));
  applyZoom();
}
//Section 4: study and Flashcards

/* ============================================
   FLASHCARD STUDY MODE — Phase 5.3b / 5.3c
   ============================================ */

// ─── STATE ───────────────────────────────────
let studySession = null;
let studyTimerInterval = null;
let studyTick = 0;
let studyFlipped = false;

const STAGE_LABELS = {
  seed: 'Seed', sprout: 'Sprout', seedling: 'Seedling',
  sapling: 'Sapling', trunk: 'Trunk', flowering: 'Flowering'
};

// ─── ENTRY POINT ─────────────────────────────
function openStudyMode() {
  if (!DATA.vocabulary || !DATA.vocabulary.length) {
    alert('No words in the garden yet. Add some words first.');
    return;
  }
  // ← 5.3c: ensure we're on the Vocabulary page + Study tab
  if (typeof showPage === 'function') showPage('vocabulary-page');
  if (typeof vocabTab !== 'undefined' && vocabTab !== 'study') {
    setVocabTab('study');
  } else {
    renderStudySetup('vocab-content');
  }
}

function closeStudyMode() {
  if (studySession && !studySession.complete) {
    if (!confirm('Exit study session? Your progress will be saved.')) return;
    persistStudyState();
  }
  clearStudyTimer();
  studySession = null;
  // ← 5.3c: return to the Garden tab inside Vocabulary
  if (typeof setVocabTab === 'function') {
    setVocabTab('garden');
  }
}

// ─── TIMER ───────────────────────────────────
function startStudyTimer() {
  clearStudyTimer();
  studyTick = studySession?.elapsedSeconds || 0;
  studyTimerInterval = setInterval(() => {
    studyTick++;
    const el = document.getElementById('study-timer');
    if (el) el.textContent = formatStudyTime(studyTick);
  }, 1000);
}

function clearStudyTimer() {
  if (studyTimerInterval) {
    clearInterval(studyTimerInterval);
    studyTimerInterval = null;
  }
}

function formatStudyTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

// ─── CARD SELECTION ──────────────────────────
function selectStudyCards() {
  const settings = DATA.settings.study;
  const filter = settings.languageFilter;
  const themeFilter = settings.themeFilter;
  const threshold = settings.dueThreshold;
  const size = settings.sessionSize;
  const today = new Date().toISOString().slice(0, 10);

  let pool = DATA.vocabulary.filter(w =>
    (filter === 'all' || w.language === filter) &&
    (!themeFilter || w.theme === themeFilter)
  );

  const daysSince = w => {
    if (!w.lastWatered) return Infinity;
    return Math.floor((new Date(today) - new Date(w.lastWatered)) / 86400000);
  };

  const tiers = {
    never:   pool.filter(w => !w.lastWatered),
    overdue: pool.filter(w => w.lastWatered && daysSince(w) >= threshold),
    due:     pool.filter(w => w.lastWatered && daysSince(w) >= 7 && daysSince(w) < threshold),
    high:    pool.filter(w => (w.waters || 0) >= 12 && daysSince(w) < 7),
    rest:    pool.filter(w => w.lastWatered && daysSince(w) < 7 && (w.waters || 0) < 12)
  };

  const picked = [];
  const usedIds = new Set();
  const take = (arr, n) => {
    shuffle(arr);
    for (const w of arr) {
      if (picked.length >= n) break;
      if (usedIds.has(w.id)) continue;
      picked.push(w);
      usedIds.add(w.id);
    }
  };

  take(tiers.never, size);
  take(tiers.overdue, size);
  take(tiers.due, size);
  take(tiers.high, size);
  take(tiers.rest, size);

  return picked.slice(0, size);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ─── SETUP SCREEN ────────────────────────────
// ← 5.3c: takes optional target container ID
function renderStudySetup(targetId = 'vocab-content') {
  const container = document.getElementById(targetId);
  if (!container) return;
  const s = DATA.settings.study;
  const today = new Date().toISOString().slice(0, 10);
  const daysSince = w => w.lastWatered
    ? Math.floor((new Date(today) - new Date(w.lastWatered)) / 86400000)
    : null;

  const pool = DATA.vocabulary.filter(w =>
  (s.languageFilter === 'all' || w.language === s.languageFilter) &&
  (!s.themeFilter || w.theme === s.themeFilter)
);

  const never = pool.filter(w => !w.lastWatered).length;
  const overdue = pool.filter(w => w.lastWatered && daysSince(w) >= s.dueThreshold).length;
  const due = pool.filter(w => w.lastWatered && daysSince(w) >= 7 && daysSince(w) < s.dueThreshold).length;

  const resume = DATA.studyState && !DATA.studyState.complete
    ? `<div class="study-resume-banner">
         <div>Resume last session? (Card ${DATA.studyState.currentIndex + 1}/${DATA.studyState.wordIds.length}, ${formatStudyTime(DATA.studyState.elapsedSeconds)} elapsed)</div>
         <div class="study-resume-actions">
           <button class="save-btn" onclick="resumeStudySession()">Resume</button>
           <button class="cancel-btn" onclick="discardStudyState()">Start Fresh</button>
         </div>
       </div>`
    : '';

  const langOptions = ['all', ...GARDEN_LANGUAGES]
    .map(slug => {
      const label = slug === 'all' ? 'All (mixed)' : `${LANGUAGES[slug].flag} ${LANGUAGES[slug].name}`;
      return `<option value="${slug}" ${s.languageFilter === slug ? 'selected' : ''}>${label}</option>`;
    }).join('');
    const themeCounts = {};
DATA.vocabulary.forEach(w => {
  if (w.theme && (s.languageFilter === 'all' || w.language === s.languageFilter)) {
    themeCounts[w.theme] = (themeCounts[w.theme] || 0) + 1;
  }
});
const themesPresent = Object.keys(themeCounts).sort((a, b) => themeCounts[b] - themeCounts[a]);

// Inside the setup card, after the language row:
`
  ${themesPresent.length ? `
    <div class="study-theme-filter">
      <label>Theme filter:</label>
      <div class="gallery-theme-chips">
        <button class="theme-chip ${!s.themeFilter ? 'active' : ''}"
                onclick="setStudyThemeFilter(null)">All</button>
        ${themesPresent.map(slug => `
          <button class="theme-chip ${s.themeFilter === slug ? 'active' : ''}"
                  onclick="setStudyThemeFilter('${slug}')">
            ${THEME_MAP[slug].icon} ${THEME_MAP[slug].label}
            <span class="theme-chip-count">${themeCounts[slug]}</span>
          </button>
        `).join('')}
      </div>
    </div>
  ` : ''}
`

  container.innerHTML = `
    <div class="study-setup-wrap">
      <div class="study-setup-card">
        <h2>Study Session</h2>
        ${resume}
        <div class="study-setup-stats">
          <div><span>Words due:</span><strong>${due}</strong></div>
          <div><span>Never studied:</span><strong>${never}</strong></div>
          <div><span>Overdue (&gt;${s.dueThreshold}d):</span><strong>${overdue}</strong></div>
        </div>
        <div class="study-setup-form">
          <label>Session size:
            <input type="number" id="study-size" min="1" max="100" value="${s.sessionSize}">
          </label>
          <label>Language:
            <select id="study-lang">${langOptions}</select>
          </label>
          <label class="study-reverse-label">
            <input type="checkbox" id="study-reverse" ${s.reverseMode ? 'checked' : ''}>
            Reverse mode (show meaning, guess word)
          </label>
        </div>
        <div class="study-setup-actions">
          <button class="save-btn" onclick="startStudySession()">Start Session</button>
          <button class="cancel-btn" onclick="closeStudyMode()">Cancel</button>
        </div>
      </div>
    </div>
  `;
}

function startStudySession() {
  const size = Math.max(1, Math.min(100, parseInt(document.getElementById('study-size').value) || 25));
  const lang = document.getElementById('study-lang').value;
  const reverse = document.getElementById('study-reverse').checked;

  DATA.settings.study.sessionSize = size;
  DATA.settings.study.languageFilter = lang;
  DATA.settings.study.reverseMode = reverse;

  const words = selectStudyCards();
  if (!words.length) {
    alert('No words match your filters.');
    return;
  }

  studySession = {
    id: 'session-' + Date.now(),
    date: new Date().toISOString().slice(0, 10),
    startTime: new Date().toTimeString().slice(0, 5),
    language: lang,
    reverseMode: reverse,
    wordIds: words.map(w => w.id),
    currentIndex: 0,
    knew: 0,
    almost: 0,
    didntKnow: 0,
    watersAdded: 0,
    wordChanges: [],
    elapsedSeconds: 0,
    complete: false
  };

  saveData(DATA);
  renderStudyCard();
  startStudyTimer();
}

// ─── RESUME ──────────────────────────────────
function resumeStudySession() {
  const st = DATA.studyState;
  if (!st) return;
  studySession = { ...st };
  renderStudyCard();
  startStudyTimer();
}

function discardStudyState() {
  DATA.studyState = null;
  saveData(DATA);
  renderStudySetup();
}

function persistStudyState() {
  if (!studySession) return;
  studySession.elapsedSeconds = studyTick;
  DATA.studyState = { ...studySession };
  saveData(DATA);
}

// ─── CARD RENDER ─────────────────────────────

function renderStudyCard(targetId = 'vocab-content') {
  const container = document.getElementById(targetId);
  if (!container) return;
  const s = studySession;
  const word = DATA.vocabulary.find(w => w.id === s.wordIds[s.currentIndex]);
  if (!word) { completeStudySession(targetId); return; }

  const reverse = s.reverseMode;
  const cluster = renderWordCluster(word).filter(f => f.text);
  const clusterInline = cluster.map(formatFormEntry).join(' / ');
  const meta = LANGUAGES[word.language];
  const total = s.wordIds.length;                  // ← ADD this line

  const front = reverse
    ? `<div class="study-card-meaning">${escapeHtml(word.meaning || '—')}</div>`
    : `<div class="study-card-word">${meta.flag} ${escapeHtml(clusterInline)}</div>
       ${word.reading ? `<div class="study-card-reading">(${escapeHtml(word.reading)})</div>` : ''}`;

  const back = `
    <div class="study-card-back-inner">
      <div class="study-card-word">${meta.flag} ${escapeHtml(clusterInline)}</div>
      ${word.reading ? `<div class="study-card-reading">(${escapeHtml(word.reading)})</div>` : ''}
      <div class="study-card-divider"></div>
      <div class="study-card-meaning">${escapeHtml(word.meaning || '—')}</div>
      <div class="study-card-meta">
        <span>Type: ${escapeHtml(word.wordType || '—')}</span>
        <span>Theme: ${escapeHtml(word.theme || '—')}</span>
        <span>Waters: ${word.waters || 0}</span>
      </div>
    </div>
  `;

  container.innerHTML = `
    <div class="study-session-wrap">
      <div class="study-session-header">
        <span>Card ${s.currentIndex + 1} / ${total}</span>
        <button class="study-exit-btn" onclick="closeStudyMode()">Exit</button>
      </div>
      <div class="study-card ${studyFlipped ? 'flipped' : ''}" id="study-card" onclick="flipStudyCard()">
        <div class="study-card-inner">
          <div class="study-card-face study-card-front">
            ${front}
            ${studyFlipped ? '' : '<div class="study-card-hint">[ Tap to reveal ]</div>'}
          </div>
          <div class="study-card-face study-card-back">
            ${back}
            <div class="study-grade-row">
              <button class="study-grade didnt" onclick="event.stopPropagation(); gradeStudyCard(1)">idk</button>
              <button class="study-grade almost" onclick="event.stopPropagation(); gradeStudyCard(2)">Almost</button>
              <button class="study-grade knew" onclick="event.stopPropagation(); gradeStudyCard(3)">Knew it</button>
            </div>
          </div>
        </div>
      </div>
      <div class="study-timer" id="study-timer">${formatStudyTime(studyTick)}</div>
    </div>
  `;

  studyFlipped = false;
  document.getElementById('study-card')?.classList.remove('flipped');
}

function flipStudyCard() {
  const card = document.getElementById('study-card');
  if (!card) return;
  studyFlipped = !studyFlipped;
  card.classList.toggle('flipped', studyFlipped);
}

// ─── GRADING ─────────────────────────────────
function gradeStudyCard(grade) {
  if (!studyFlipped) return;
  const s = studySession;
  const word = DATA.vocabulary.find(w => w.id === s.wordIds[s.currentIndex]);
  if (!word) return;

  const oldWaters = word.waters || 0;
  const oldStage = word.stage || 'seed';
  const today = new Date().toISOString().slice(0, 10);

  const add = grade === 1 ? 1 : grade === 2 ? 2 : 3;
  word.waters = oldWaters + add;
  word.lastWatered = today;
  updateWordStage(word);

  s.watersAdded += add;
  if (grade === 1) s.didntKnow++;
  else if (grade === 2) s.almost++;
  else s.knew++;

  s.wordChanges.push({
    wordId: word.id,
    word: word.word,
    oldWaters,
    newWaters: word.waters,
    oldStage,
    newStage: word.stage
  });

  s.currentIndex++;
  saveData(DATA);

  if (s.currentIndex >= s.wordIds.length) {
    completeStudySession();
  } else {
    renderStudyCard();
  }
}

// ─── COMPLETE ────────────────────────────────
// ← 5.3c: takes optional target container ID
function completeStudySession(targetId = 'vocab-content') {
  const s = studySession;
  clearStudyTimer();
  s.complete = true;
  s.elapsedSeconds = studyTick;
  s.durationMinutes = Math.max(1, Math.round(studyTick / 60));

  DATA.studySessions.push({
    id: s.id,
    date: s.date,
    startTime: s.startTime,
    durationMinutes: s.durationMinutes,
    language: s.language,
    reverseMode: s.reverseMode,
    wordsReviewed: s.wordIds.length,
    knew: s.knew,
    almost: s.almost,
    didntKnow: s.didntKnow,
    watersAdded: s.watersAdded,
    wordIds: s.wordIds,
    wordChanges: s.wordChanges
  });

  addStudyTimeToDailyLog(s);

  DATA.studyState = null;
  saveData(DATA);

  renderStudyComplete(targetId);
}

function addStudyTimeToDailyLog(s) {
  const today = s.date;
  let log = DATA.dailyLogs.find(l => l.date === today);

  const sessionEntry = {
    startTime: s.startTime,
    endTime: '',
    durationMinutes: s.durationMinutes,
    language: s.language === 'all' ? 'Mixed' : LANGUAGES[s.language].name,
    activity: 'Flashcard Study',
    customActivity: '',
    subtitleLanguage: '',
    splitTime: false,
    notes: `Study session: ${s.wordIds.length} cards, ${s.knew} knew`
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

function renderStudyComplete(targetId = 'vocab-content') {
  const container = document.getElementById(targetId);
  if (!container) return;
  const s = studySession;
  const total = s.wordIds.length;
  const recall = total ? Math.round((s.knew / total) * 100) : 0;

  const topChanges = [...s.wordChanges]
    .filter(c => c.oldStage !== c.newStage)
    .slice(0, 5);

  const changesHtml = topChanges.length
    ? topChanges.map(c => `
  <div class="study-change-row">
    🌱 ${escapeHtml(c.word)} (${c.oldWaters} → ${c.newWaters})
    → ${STAGE_LABELS[c.newStage] || c.newStage}
  </div>
`).join('')
    : '<div class="study-change-empty">No stage changes this session.</div>';

  container.innerHTML = `
    <div class="study-setup-wrap">
      <div class="study-setup-card study-complete-card">
        <h2>Session Complete</h2>
        <div class="study-setup-stats">
          <div><span>Words reviewed:</span><strong>${total}</strong></div>
          <div><span>Knew it:</span><strong>${s.knew}</strong></div>
          <div><span>Almost:</span><strong>${s.almost}</strong></div>
          <div><span>idk:</span><strong>${s.didntKnow}</strong></div>
          <div><span>Recall rate:</span><strong>${recall}%</strong></div>
          <div><span>Time:</span><strong>${formatStudyTime(s.elapsedSeconds)}</strong></div>
          <div><span>Waters added:</span><strong>${s.watersAdded}</strong></div>
        </div>
        <div class="study-changes-title">Plants that grew:</div>
        <div class="study-changes-list">${changesHtml}</div>
        <div class="study-setup-actions">
          <button class="save-btn" onclick="closeStudyMode()">View Garden</button>
          <button class="add-btn" onclick="startStudySession()">Another Session</button>
        </div>
      </div>
    </div>
  `;

  studySession = null;
}

// ─── KEYBOARD ────────────────────────────────
// ← 5.3c: only fire when Study tab is active inside Vocabulary
document.addEventListener('keydown', e => {
  if (typeof vocabTab === 'undefined' || vocabTab !== 'study') return;
  const page = document.getElementById('vocabulary-page');
  if (!page || !page.classList.contains('active')) return;
  if (!studySession || studySession.complete) return;

  if (e.key === ' ') { e.preventDefault(); flipStudyCard(); }
  else if (e.key === '1') gradeStudyCard(1);
  else if (e.key === '2') gradeStudyCard(2);
  else if (e.key === '3') gradeStudyCard(3);
  else if (e.key === 'Escape') closeStudyMode();
});

// ─── HISTORY VIEW ────────────────────────────
function renderStudyHistory() {
  const sessions = DATA.studySessions || [];
  if (!sessions.length) {
    return '<div class="lang-empty">No study sessions yet.</div>';
  }
  const totalTime = sessions.reduce((a, s) => a + (s.durationMinutes || 0), 0);
  const totalReviewed = sessions.reduce((a, s) => a + (s.wordsReviewed || 0), 0);
  const totalKnew = sessions.reduce((a, s) => a + (s.knew || 0), 0);
  const avgRecall = totalReviewed ? Math.round((totalKnew / totalReviewed) * 100) : 0;

  const recent = [...sessions].reverse().slice(0, 10).map(s => {
    const recall = s.wordsReviewed ? Math.round((s.knew / s.wordsReviewed) * 100) : 0;
    return `<div class="garden-sidebar-row">
      <span>${s.date}</span>
      <strong>${s.wordsReviewed} cards · ${recall}% · ${s.durationMinutes}m</strong>
    </div>`;
  }).join('');

  return `
    <div class="garden-sidebar-row"><span>Total sessions</span><strong>${sessions.length}</strong></div>
    <div class="garden-sidebar-row"><span>Total time</span><strong>${totalTime}m</strong></div>
    <div class="garden-sidebar-row"><span>Avg recall</span><strong>${avgRecall}%</strong></div>
    <div class="garden-sidebar-title" style="margin-top:0.75rem;">Recent</div>
    ${recent}
  `;
}
//theme selector for study mode
function setStudyThemeFilter(slug) {
  DATA.settings.study.themeFilter = slug;
  saveData(DATA);
  renderStudySetup('vocab-content');
}

// Section5 : Memory Palace
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

  // On mobile, entering study mode should immediately open the setup modal
  if (typeof isPalaceMobile === 'function' && isPalaceMobile()) {
    palaceSetupModalOpen = true;
  }

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
  // Study mode drawer is handled by renderPalaceMobileStudyDrawer()
  if (!editing) return '';

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
  // If a session is running, show the task panel in the drawer
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

  // If we are in setup mode, the drawer should be completely empty.
  // The setup UI lives exclusively inside the modal on mobile.
  return '';
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
    plantType: 'flowering',
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
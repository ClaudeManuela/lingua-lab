/* ============================================
   VOCABULARY PAGE — Study / Garden / Palace
   Phase 5.3c — tab dispatcher + persistent sidebar
   ============================================ */

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

function renderVocabSidebar() {
  const sidebar = document.getElementById('vocab-sidebar');
  if (!sidebar) return;
  const admin = isEditable();
  const points = typeof calculateSeedPoints === 'function' ? calculateSeedPoints() : {};

  sidebar.innerHTML = `
    <h2 class="garden-sidebar-h2">Vocabulary</h2>

    <div class="garden-sidebar-section">
      <div class="garden-sidebar-title">Languages (hours · points)</div>
      <div id="seed-points-list"></div>
    </div>

    <div class="garden-sidebar-section">
      <div class="garden-sidebar-title">Study History</div>
      <div id="study-history-list"></div>
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

    <div class="garden-sidebar-section" id="garden-unthemed-section" style="display:none;">
  <div class="garden-sidebar-title">Unthemed words</div>
  <div id="garden-unthemed-list"></div>
</div>
  `;

  // Populate shared sidebar sections (reuse garden's logic)
  if (typeof renderGardenSidebar === 'function') {
    renderGardenSidebar();
  }
  const themesList = document.getElementById('theme-clusters-list');
if (themesList) {
  const counts = {};
  (DATA.vocabulary || []).forEach(w => {
    if (w.theme) counts[w.theme] = (counts[w.theme] || 0) + 1;
  });
  const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  if (!sorted.length) {
    themesList.innerHTML = `<div class="lang-empty" style="font-size:0.7rem;">No themed words yet.</div>`;
  } else {
    themesList.innerHTML = sorted.map(slug => {
      const t = THEME_MAP[slug];
      if (!t) return '';
      return `<div class="garden-sidebar-row theme-sidebar-row"
                   onclick="jumpToTheme('${slug}')">
        <span>${t.icon} ${t.label}</span>
        <strong>${counts[slug]}</strong>
      </div>`;
    }).join('');
  }
}

  // Populate mode-specific actions
  const actions = document.getElementById('vocab-actions-list');
  if (!actions) return;

  if (vocabTab === 'study') {
    actions.innerHTML = `
      <button onclick="openStudyMode()">Start / Resume Study</button>
    `;
  } else if (vocabTab === 'garden') {
  const canPlaceRegion = gardenEditMode && isEditable();
  actions.innerHTML = admin ? `
    <button onclick="openStudyMode()">Study</button>
    <button onclick="openAddWordsModal()">+ Add Words</button>
    <button onclick="openBackfillModal()">Backfill</button>
    <button onclick="toggleGardenEditMode()"
            class="${gardenEditMode ? 'active' : ''}">
      ${gardenEditMode ? '✓ Done editing' : '🗺️ Edit Garden'}
    </button>
    ${canPlaceRegion ? `
      <button onclick="openNewRegionFlow()">+ New Region</button>
      <button onclick="tidyBranches()">Tidy Branches</button>
    ` : ''}
    <button onclick="restoreGardenPlacement()"
            ${DATA.settings._lastGardenSnapshot?.length ? '' : 'disabled'}>
      Restore Placement
    </button>
  ` : '';

  // Also render the unthemed words list if edit mode is on
  const unthemedSection = document.getElementById('garden-unthemed-list');
  if (unthemedSection) {
    unthemedSection.innerHTML = gardenEditMode ? renderUnthemedWordsList() : '';
    unthemedSection.parentElement.style.display = gardenEditMode ? '' : 'none';
  }

  } else if (vocabTab === 'palace') {
    actions.innerHTML = typeof renderPalaceSidebarActions === 'function'
      ? renderPalaceSidebarActions(admin)
      : '';
  }
        // Toggle unthemed section visibility based on garden edit mode
      const unthemedSection = document.getElementById('garden-unthemed-section');
      if (unthemedSection) {
        unthemedSection.style.display = (vocabTab === 'garden' && gardenEditMode) ? '' : 'none';
      }
      const unthemedList = document.getElementById('garden-unthemed-list');
      if (unthemedList && gardenEditMode) {
        unthemedList.innerHTML = renderUnthemedWordsList();
      }
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
// garden edit mode toggle
function toggleGardenEditMode() {
  gardenEditMode = !gardenEditMode;
  DATA.settings.gardenEditMode = gardenEditMode;
  saveData(DATA);
  renderVocabSidebar();
  renderGarden();
}
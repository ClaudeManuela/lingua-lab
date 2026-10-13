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
    <div class="vocab-layout">
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
                    onclick="setVocabTab('palace')"
                    ${typeof renderPalace === 'function' ? '' : 'disabled title="Coming soon"'}>
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

function setVocabTab(tab) {
  if (tab === 'palace' && typeof renderPalace !== 'function') return;
  vocabTab = tab;
  if (DATA.settings) {
    DATA.settings.lastVocabTab = tab;
    saveData(DATA);
  }

  document.querySelectorAll('.vocab-pill').forEach(btn => {
    btn.classList.toggle('active',
      btn.classList.contains('pill-' + tab));
  });

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

    <div class="garden-sidebar-section" id="vocab-mode-actions">
      <div class="garden-sidebar-title">Actions</div>
      <div class="garden-sidebar-actions" id="vocab-actions-list"></div>
    </div>
  `;

  // Populate shared sidebar sections (reuse garden's logic)
  if (typeof renderGardenSidebar === 'function') {
    renderGardenSidebar();
  }

  // Populate mode-specific actions
  const actions = document.getElementById('vocab-actions-list');
  if (!actions) return;

  if (vocabTab === 'study') {
    actions.innerHTML = `
      <button onclick="openStudyMode()">Start / Resume Study</button>
    `;
  } else if (vocabTab === 'garden') {
    actions.innerHTML = admin ? `
      <button onclick="openStudyMode()">Study</button>
      <button onclick="openAddWordsModal()">+ Add Words</button>
      <button onclick="openBackfillModal()">Backfill</button>
      <button onclick="rearrangeByTheme()">Cluster by Theme</button>
      <button onclick="restoreGardenPlacement()"
              ${DATA.settings._lastGardenSnapshot?.length ? '' : 'disabled'}>
        Restore Placement
      </button>
    ` : '';
  } else if (vocabTab === 'palace') {
    actions.innerHTML = typeof renderPalaceSidebarActions === 'function'
      ? renderPalaceSidebarActions(admin)
      : '';
  }
}
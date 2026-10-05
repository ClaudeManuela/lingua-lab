/* ============================================
   LEXICAL GARDEN — Phase 5.1 Skeleton
   ============================================ */

let gardenTab = 'all';        // 'all' | 'korean' | ... | 'recent' | 'favorites'
let gardenLanguageFilter = null;

// ─── RENDER GARDEN PAGE ──────────────────────
function renderGarden() {
  const container = document.getElementById('garden-page');
  if (!container) return;

  const admin = isEditable();
  const words = DATA.vocabulary || [];

  container.innerHTML = `
    <div class="book-spread">

      <!-- LEFT PAGE -->
      <div class="book-page">
        <h2>Lexical Garden</h2>

        <div class="index-card">
          <div class="index-card-title">Seed Points (spendable)</div>
          <div class="seed-points-grid" id="seed-points-grid"></div>
        </div>

        <div class="index-card">
          <div class="index-card-title">Total Hours (permanent record)</div>
          <div class="total-hours-grid" id="total-hours-grid"></div>
        </div>

        <div class="index-card">
          <div class="index-card-title">Garden Summary</div>
          <div class="garden-summary" id="garden-summary"></div>
        </div>

        ${admin ? `
          <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="add-btn" onclick="openAddWordsModal()">+ Add Words</button>
            <button class="add-btn" onclick="openBackfillModal()">Backfill Words</button>
          </div>
        ` : ''}
      </div>

      <!-- RIGHT PAGE -->
      <div class="book-page">
        <div class="garden-tabs" id="garden-tabs"></div>

        <div class="garden-word-list" id="garden-word-list"></div>
      </div>

    </div>

    <!-- MODALS -->
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
              <label>Meanings (optional, one per word, comma-separated):
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

  renderGardenTabs();
  renderGardenWords();
  renderSeedPoints();
  renderTotalHours();
  renderGardenSummary();
}

// ─── GARDEN LANGUAGES ────────────────────────
const GARDEN_LANGUAGES = ['korean', 'portuguese', 'italian', 'arabic', 'japanese', 'spanish'];

// ─── TABS ────────────────────────────────────
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
    <button class="garden-tab ${gardenTab === t.key ? 'active' : ''}" 
            onclick="setGardenTab('${t.key}')" style="${t.key !== 'all' && t.key !== 'recent' && t.key !== 'favorites' ? `--lang-accent: ${LANGUAGES[t.key].accent};` : ''}">
      ${t.label}
    </button>
  `).join('');
}

function setGardenTab(key) {
  gardenTab = key;
  renderGardenTabs();
  renderGardenWords();
}

// ─── WORD LIST ───────────────────────────────
function renderGardenWords() {
  const container = document.getElementById('garden-word-list');
  if (!container) return;

  let words = [...(DATA.vocabulary || [])];

  // Filter by tab
  if (GARDEN_LANGUAGES.includes(gardenTab)) {
    words = words.filter(w => w.language === gardenTab);
  } else if (gardenTab === 'favorites') {
    words = words.filter(w => w.favorite);
  } else if (gardenTab === 'recent') {
    words = words.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)).slice(0, 100);
  }

  // Sort: favorites first, then by date added (newest)
  if (gardenTab !== 'recent') {
    words.sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return new Date(b.dateAdded) - new Date(a.dateAdded);
    });
  }

  if (!words.length) {
    container.innerHTML = `<div class="lang-empty">No words in this garden yet</div>`;
    return;
  }

  // Group by stage
  const stages = ['flowering', 'mature', 'young', 'seedling', 'sprout', 'seed'];
  const groups = {};
  stages.forEach(s => groups[s] = []);

  words.forEach(w => {
    const stage = w.stage || 'seed';
    if (groups[stage]) groups[stage].push(w);
  });

  const stageLabels = {
    flowering: 'Flowering',
    mature: 'Mature',
    young: 'Young',
    seedling: 'Seedling',
    sprout: 'Sprout',
    seed: 'Seed'
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
    <div class="garden-word-row" style="--lang-accent: ${meta.accent};"
         onclick="openWordCard('${w.id}')">
      <span class="garden-word-flag">${meta.flag}</span>
      <span class="garden-word-text">${escapeHtml(w.word)}</span>
      <span class="garden-word-meaning">${escapeHtml(w.meaning || '')}</span>
      <span class="garden-word-waters">${w.waters || 0}</span>
      ${w.favorite ? '<span class="garden-word-star">*</span>' : ''}
      <span class="garden-word-arrow">→</span>
    </div>
  `;
}

// ─── SEED POINTS ─────────────────────────────
function renderSeedPoints() {
  const container = document.getElementById('seed-points-grid');
  if (!container) return;

  const points = calculateSeedPoints();
  const rows = GARDEN_LANGUAGES.map(slug => {
    const meta = LANGUAGES[slug];
    const points_val = points[slug] || 0;
    return `
      <div class="seed-point-row" style="--lang-accent: ${meta.accent};">
        <span>${meta.flag} ${meta.name}</span>
        <strong>${points_val} pts</strong>
      </div>
    `;
  }).join('');

  container.innerHTML = rows;
}

function renderTotalHours() {
  const container = document.getElementById('total-hours-grid');
  if (!container) return;

  const rows = GARDEN_LANGUAGES.map(slug => {
    const meta = LANGUAGES[slug];
    const summary = getLanguageSummary(DATA, slug);
    const hours = (summary.totalMinutes / 60).toFixed(1);
    return `
      <div class="seed-point-row" style="--lang-accent: ${meta.accent};">
        <span>${meta.flag} ${meta.name}</span>
        <strong>${hours}h</strong>
      </div>
    `;
  }).join('');

  container.innerHTML = rows;
}

function calculateSeedPoints() {
  // seed points = total hours studied (with subtitle split) − seed points already spent
  const result = {};
  GARDEN_LANGUAGES.forEach(slug => {
    const summary = getLanguageSummary(DATA, slug);
    const totalHours = summary.totalMinutes / 60;
    const spent = (DATA.gardenSpent && DATA.gardenSpent[slug]) || 0;
    result[slug] = Math.max(0, Math.floor(totalHours - spent));
  });
  return result;
}

function renderGardenSummary() {
  const container = document.getElementById('garden-summary');
  if (!container) return;

  const words = DATA.vocabulary || [];
  const totalWords = words.length;
  const totalWaters = words.reduce((a, w) => a + (w.waters || 0), 0);
  const backlogCount = words.filter(w => w.backlog).length;

  container.innerHTML = `
    <div class="garden-summary-row"><span>Total words:</span> <strong>${totalWords}</strong></div>
    <div class="garden-summary-row"><span>Total waters:</span> <strong>${totalWaters}</strong></div>
    <div class="garden-summary-row"><span>Backfilled:</span> <strong>${backlogCount}</strong></div>
  `;
}

// ─── ADD WORDS ───────────────────────────────
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
    // Check if word already exists in this language
    const existing = DATA.vocabulary.find(w => 
      w.language === language && w.word.toLowerCase() === word.toLowerCase()
    );

    if (existing) {
      // Water it instead
      existing.waters = (existing.waters || 0) + 1;
      existing.lastWatered = new Date().toISOString().slice(0, 10);
      updateWordStage(existing);
    } else {
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
        backlog: backlog
      });
    }
  });

  saveData(DATA);
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
  if (waters >= 20) w.stage = 'flowering';
  else if (waters >= 12) w.stage = 'mature';
  else if (waters >= 6) w.stage = 'young';
  else if (waters >= 3) w.stage = 'seedling';
  else if (waters >= 1) w.stage = 'sprout';
  else w.stage = 'seed';
}

// ─── WORD CARD ───────────────────────────────
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
      <section class="settings-section">
        ${admin 
          ? `<label>Meaning: <input type="text" value="${escapeHtml(word.meaning || '')}" 
                                     onchange="updateWordField('${word.id}', 'meaning', this.value)"></label>`
          : `<div><strong>Meaning:</strong> ${escapeHtml(word.meaning || '—')}</div>`}
      </section>
      <section class="settings-section">
        <div class="word-card-stats">
          <div><span>Language:</span> <strong>${meta.name}</strong></div>
          <div><span>Stage:</span> <strong>${word.stage || 'seed'}</strong></div>
          <div><span>Waters:</span> <strong>${word.waters || 0}</strong></div>
          <div><span>Added:</span> <strong>${word.dateAdded}</strong></div>
          <div><span>Last watered:</span> <strong>${word.lastWatered || '—'}</strong></div>
          ${word.backlog ? '<div><span>Backlog:</span> <strong>yes</strong></div>' : ''}
        </div>
      </section>
      <section class="settings-section">
        ${admin 
          ? `<label>Notes: <textarea rows="2" onchange="updateWordField('${word.id}', 'notes', this.value)">${escapeHtml(word.notes || '')}</textarea></label>`
          : (word.notes ? `<div><strong>Notes:</strong> ${escapeHtml(word.notes)}</div>` : '')}
      </section>
      ${admin ? `
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;">
          <button class="add-btn" onclick="waterWord('${word.id}')">Water +1</button>
          <button class="add-btn" onclick="toggleFavorite('${word.id}')">${word.favorite ? 'Unfavorite' : 'Favorite'}</button>
          <button class="delete-btn" onclick="deleteWord('${word.id}')">Delete</button>
        </div>
      ` : ''}
    </div>
  `;

  document.getElementById('word-card-modal').classList.remove('hidden');
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
  closeModal('word-card-modal');
  renderGarden();
}

function deleteWord(id) {
  if (!isEditable()) return;
  if (!confirm('Delete this word from the garden?')) return;
  DATA.vocabulary = DATA.vocabulary.filter(w => w.id !== id);
  saveData(DATA);
  closeModal('word-card-modal');
  renderGarden();
}
/* ============================================
   RESULTS PILLAR — Phase 5.8a
   ============================================ */

let resultsFilter = 'all'; // 'all' | 'test' | 'achievement' | 'challenge' | 'cognitive' | 'milestone'


function cefrToNumber(cefr) {
  const map = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 };
  return map[cefr?.toUpperCase()] || 0;
}

function getCurrentCEFRLevel(language) {
  // Find all results for this language that have a cefrImpact
  const results = (DATA.testResults || []).filter(r => 
    r.language === language && r.cefrImpact
  );
  
  if (!results.length) return null;
  
  // Sort by CEFR level (highest first), then by date (newest first)
  results.sort((a, b) => {
    const diff = cefrToNumber(b.cefrImpact) - cefrToNumber(a.cefrImpact);
    if (diff !== 0) return diff;
    return new Date(b.date) - new Date(a.date);
  });

  return results[0].cefrImpact;
}

function renderResultsPage() {
  const container = document.getElementById('results-page');
  if (!container) return;
  
  const admin = isEditable();
  
  // Build the Dashboard for the 6 main languages
  const activeLanguages = ['korean', 'portuguese', 'italian', 'arabic', 'japanese', 'spanish'];
  const dashboardHtml = activeLanguages.map(lang => {
    const meta = LANGUAGES[lang];
    const currentLevel = getCurrentCEFRLevel(lang);
    if (!currentLevel) return '';
    const percentage = (cefrToNumber(currentLevel) / 6) * 100;

    return `
      <div class="result-dashboard-row">
        <span class="result-dashboard-lang">${meta.flag} ${meta.name}</span>
        <div class="result-dashboard-bar-bg">
          <div class="result-dashboard-bar-fill" style="width: ${percentage}%; background: ${meta.accent};"></div>
        </div>
        <span class="result-dashboard-value">${currentLevel}</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="book-spread">
      <div class="book-page" style="padding: 2rem; max-width: 100%; display: flex; flex-direction: column;">
        
        <div class="results-layout" style="margin: 0;">
          <div class="results-header">
            <div class="results-title">Performance Ledger</div>
          </div>

          ${dashboardHtml ? `
            <div class="results-dashboard-card">
              <div class="results-dashboard-title">Current CEFR Benchmarks</div>
              <div class="results-dashboard-grid">
                ${dashboardHtml}
              </div>
            </div>
          ` : ''}

          <div class="results-filters">
            ${['all', 'test', 'achievement', 'challenge', 'cognitive', 'milestone'].map(f => `
              <button class="results-filter-btn ${resultsFilter === f ? 'active' : ''}" 
                      onclick="setResultsFilter('${f}')">
                ${f === 'all' ? 'All Results' : f}
              </button>
            `).join('')}
          </div>

          <div class="results-feed" id="results-feed">
            ${renderResultsFeed()}
          </div>
        </div>

      </div>
    </div>
    
    ${admin ? `
      <button class="notes-fab" onclick="openAddResultModal()" title="Add Result">+</button>
    ` : ''}
  `;
}

function setResultsFilter(filter) {
  resultsFilter = filter;
  renderResultsPage();
}

function renderResultsFeed() {
  let results = [...(DATA.testResults || [])];

  // Filter
  if (resultsFilter !== 'all') {
    results = results.filter(r => r.type === resultsFilter);
  }

  // Sort newest first
  results.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!results.length) {
    return `<div class="results-empty">No results logged yet. Click the + button to add one.</div>`;
  }

  return results.map(r => {
    const langMeta = LANGUAGES[r.language] || { flag: '🌍', name: 'Mixed' };
    
    // Build score display
    let scoreHtml = '';
    if (r.type === 'test' && r.score !== undefined) {
      scoreHtml = `<div class="result-score">${r.score}/${r.maxScore}</div>`;
    } else if (r.type === 'cognitive' && r.value !== undefined) {
      scoreHtml = `<div class="result-score" style="font-size: 1rem;">${r.value} ${r.unit || ''}</div>`;
    } else if (r.cefrImpact) {
      scoreHtml = `<div class="result-score" style="font-size: 1rem; color: var(--success);">${r.cefrImpact}</div>`;
    }

    return `
      <div class="result-card ${r.type}" onclick="viewResultDetails('${r.id}')">
        <div class="result-main">
          <div class="result-top">
            <span class="result-date">${r.date}</span>
            <span class="result-lang">${langMeta.flag}</span>
            <span class="result-badge">${r.type}</span>
          </div>
          <div class="result-title">${escapeHtml(r.title)}</div>
          ${r.notes ? `<div class="result-notes">${escapeHtml(r.notes)}</div>` : ''}
        </div>
        ${scoreHtml}
      </div>
    `;
  }).join('');
}

function viewResultDetails(id) {
  const result = (DATA.testResults || []).find(r => r.id === id);
  if (!result) return;

  const existing = document.getElementById('view-result-modal');
  if (existing) existing.remove();

  const langMeta = LANGUAGES[result.language] || { flag: '🌍', name: 'Mixed' };
  const admin = isEditable();

  let detailsHtml = '';
  if (result.type === 'test') {
    detailsHtml = `<div style="font-size:2rem; font-weight:bold; color:var(--accent-ink); text-align:center;">${result.score} / ${result.maxScore}</div>`;
    if (result.cefrImpact) detailsHtml += `<div style="text-align:center; margin-top:0.5rem;"><strong>CEFR:</strong> ${result.cefrImpact}</div>`;
  } else if (result.type === 'cognitive') {
    detailsHtml = `<div style="font-size:1.5rem; font-weight:bold; color:var(--accent-blue); text-align:center;">${result.value} ${result.unit || ''}</div>`;
  } else if (result.cefrImpact) {
    detailsHtml = `<div style="text-align:center; margin-top:0.5rem;"><strong>CEFR:</strong> ${result.cefrImpact}</div>`;
  }

  const modalHtml = `
    <div class="modal-overlay" id="view-result-modal">
      <div class="note-editor-panel" style="max-width: 500px;">
        
        <div class="note-editor-header">
          <div class="note-editor-tab">${langMeta.flag} ${result.type}</div>
          <button class="cancel-btn small" onclick="document.getElementById('view-result-modal').remove()">X</button>
        </div>

        <div class="note-editor-body" style="padding: 1.5rem;">
          <h2 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--paper-ink);">${escapeHtml(result.title)}</h2>
          <div style="font-size: 0.75rem; color: var(--paper-ink-soft); margin-bottom: 1.5rem;">
            ${result.date}
          </div>

          ${detailsHtml}

          ${result.notes ? `
            <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(0,0,0,0.03); border-left: 3px solid var(--border-soft); font-style: italic; font-size: 0.85rem;">
              "${escapeHtml(result.notes)}"
            </div>
          ` : ''}
        </div>

        ${admin ? `
          <div class="modal-footer" style="justify-content: space-between;">
            <button class="delete-btn small" onclick="deleteResult('${result.id}')">Delete</button>
            <button class="cancel-btn small" onclick="document.getElementById('view-result-modal').remove()">Close</button>
          </div>
        ` : ''}

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function deleteResult(id) {
  if (!confirm('Delete this result permanently?')) return;
  
  DATA.testResults = DATA.testResults.filter(r => r.id !== id);
  saveData(DATA);
  
  document.getElementById('view-result-modal').remove();
  renderResultsPage();
}

// ═══════════════════════════════════════════════
// ADD RESULT MODAL
// ═══════════════════════════════════════════════

function openAddResultModal() {
  if (!isEditable()) return;
  
  const existing = document.getElementById('result-modal');
  if (existing) existing.remove();

  const langOptions = Object.keys(LANGUAGES).map(l => 
    `<option value="${l}">${LANGUAGES[l].flag} ${LANGUAGES[l].name}</option>`
  ).join('');

  const modalHtml = `
    <div class="modal-overlay" id="result-modal">
      <div class="note-editor-panel" style="max-width: 600px;">
        
        <div class="note-editor-header">
          <div class="note-editor-tab">Log New Result</div>
          <button class="cancel-btn small" onclick="closeResultModal()">X</button>
        </div>

        <div class="note-editor-body" style="padding: 1.5rem;">
          <div class="note-edit-form">
            
            <div class="note-field-row">
              <label class="note-field">
                <span>Language</span>
                <select id="res-lang">${langOptions}</select>
              </label>
              <label class="note-field">
                <span>Date</span>
                <input type="date" id="res-date" value="${localDateStr()}">
              </label>
            </div>

            <div class="note-field">
              <span>Result Type</span>
              <select id="res-type" onchange="toggleResultFields(this.value)">
                <option value="test">Test / Benchmark (Score)</option>
                <option value="milestone">App Milestone (Completion)</option>
                <option value="achievement">Achievement (Text)</option>
                <option value="challenge">Challenge (Task)</option>
                <option value="cognitive">Cognitive Metric (Number)</option>
              </select>
            </div>

            <div class="note-field">
              <span>Title</span>
              <input type="text" id="res-title" placeholder="e.g., Busuu A1 Final Test">
            </div>

            <!-- TEST FIELDS -->
            <div class="result-form-group" id="fields-test">
              <div class="note-field-row">
                <label class="note-field">
                  <span>Score</span>
                  <input type="number" id="res-score" placeholder="85">
                </label>
                <label class="note-field">
                  <span>Max Score</span>
                  <input type="number" id="res-maxscore" placeholder="100">
                </label>
                <label class="note-field">
                  <span>CEFR Level (Optional)</span>
                  <input type="text" id="res-cefr" placeholder="e.g., A1">
                </label>
              </div>
            </div>

            <!-- MILESTONE FIELDS -->
            <div class="result-form-group hidden" id="fields-milestone">
              <label class="note-field">
                <span>CEFR Level (Optional)</span>
                <input type="text" id="res-cefr-ms" placeholder="e.g., A1">
              </label>
            </div>

            <!-- COGNITIVE FIELDS -->
            <div class="result-form-group hidden" id="fields-cognitive">
              <div class="note-field-row">
                <label class="note-field">
                  <span>Metric</span>
                  <select id="res-metric">
                    <option value="working_memory">Working Memory Span</option>
                    <option value="typing_speed">Typing Speed</option>
                    <option value="custom">Custom Metric...</option>
                  </select>
                </label>
                <label class="note-field">
                  <span>Value</span>
                  <input type="number" id="res-value" placeholder="e.g., 6">
                </label>
                <label class="note-field">
                  <span>Unit</span>
                  <input type="text" id="res-unit" placeholder="e.g., words, WPM">
                </label>
              </div>
            </div>

            <div class="note-field">
              <span>Notes (Optional)</span>
              <textarea id="res-notes" rows="2" placeholder="Any extra context..."></textarea>
            </div>

          </div>
        </div>

        <div class="modal-footer">
          <button class="save-btn" onclick="saveResult()">Save Result</button>
          <button class="cancel-btn" onclick="closeResultModal()">Cancel</button>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function toggleResultFields(type) {
  document.getElementById('fields-test').classList.add('hidden');
  document.getElementById('fields-milestone').classList.add('hidden');
  document.getElementById('fields-cognitive').classList.add('hidden');

  if (type === 'test') document.getElementById('fields-test').classList.remove('hidden');
  if (type === 'milestone') document.getElementById('fields-milestone').classList.remove('hidden');
  if (type === 'cognitive') document.getElementById('fields-cognitive').classList.remove('hidden');
}

function closeResultModal() {
  const modal = document.getElementById('result-modal');
  if (modal) modal.remove();
}

function saveResult() {
  if (!isEditable()) return;

  const type = document.getElementById('res-type').value;
  const lang = document.getElementById('res-lang').value;
  const date = document.getElementById('res-date').value;
  const title = document.getElementById('res-title').value.trim();
  const notes = document.getElementById('res-notes').value.trim();

  if (!title) {
    alert('Please enter a title.');
    return;
  }

  const newResult = {
    id: 'res-' + Date.now().toString(36),
    type,
    language: lang,
    date,
    title,
    notes
  };

  if (type === 'test') {
    newResult.score = parseFloat(document.getElementById('res-score').value) || 0;
    newResult.maxScore = parseFloat(document.getElementById('res-maxscore').value) || 100;
    newResult.cefrImpact = document.getElementById('res-cefr').value.trim();
  } else if (type === 'milestone') {
    newResult.cefrImpact = document.getElementById('res-cefr-ms').value.trim();
  } else if (type === 'cognitive') {
    newResult.metric = document.getElementById('res-metric').value;
    newResult.value = parseFloat(document.getElementById('res-value').value) || 0;
    newResult.unit = document.getElementById('res-unit').value.trim();
  }

  DATA.testResults.push(newResult);
  saveData(DATA);
  closeResultModal();
  renderResultsPage();
}
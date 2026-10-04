/* ============================================
   LEVELS PAGE + INDIVIDUAL LANGUAGE PAGES
   ============================================ */

// ─── MAIN LEVELS INDEX ───────────────────────
function renderLevelsIndex() {
  const container = document.getElementById('levels-page');
  const cards = LANGUAGE_ORDER.map(slug => renderLanguageCard(slug)).join('');

  container.innerHTML = `
    <div class="levels-index">
      <div class="levels-header">
        <h2>Levels & Stats</h2>
        <p class="levels-subtitle">Click a language to open its page</p>
      </div>
      <div class="levels-grid">
        ${cards}
      </div>
    </div>
  `;
}

function renderLanguageCard(slug) {
  const meta = LANGUAGES[slug];
  const data = DATA.languageLevels[slug] || {};
  const official = data.official || meta.defaultOfficial;
  const target = data.target || meta.target || 'C2 Low';
  const daysSince = getDaysSinceLastStudied(DATA, slug);
  const recColor = getRecencyColor(daysSince);
  const summary = getLanguageSummary(DATA, slug);

  const lastStudiedText = daysSince === null ? 'never'
    : daysSince === 0 ? 'today'
    : daysSince === 1 ? '1 day ago'
    : daysSince + ' days ago';

  return `
    <div class="lang-card" style="--lang-accent: ${meta.accent}; --lang-accent-soft: ${meta.accentSoft};" 
         onclick="openLanguagePage('${slug}')">
      <div class="lang-card-header">
        <span class="lang-card-flag">${meta.flag}</span>
        <span class="lang-card-name">${meta.name.toUpperCase()}</span>
        <span class="lang-card-arrow">→</span>
      </div>
      <div class="lang-card-body">
        <div class="lang-card-row">
          <span>Official:</span>
          <strong>${official}</strong>
        </div>
        <div class="lang-card-row">
          <span>Target:</span>
          <strong>${target}</strong>
        </div>
        <div class="lang-card-row">
          <span>Last studied:</span>
          <strong style="color: ${recColor};">${lastStudiedText}</strong>
        </div>
        <div class="lang-card-row">
          <span>Hours:</span>
          <strong>${formatHoursShort(summary.totalMinutes)}</strong>
        </div>
        <div class="lang-card-row">
          <span>Media:</span>
          <strong>${formatHoursShort(summary.mediaMinutes)}</strong>
        </div>
      </div>
    </div>
  `;
}

// ─── INDIVIDUAL LANGUAGE PAGE ────────────────
function openLanguagePage(slug) {
  const meta = LANGUAGES[slug];
  if (!meta) return;
  currentLanguage = slug;
  renderLanguagePage(slug);
  showPage('language-page');
}

let currentLanguage = null;

function renderLanguagePage(slug) {
  const container = document.getElementById('language-page');
  const meta = LANGUAGES[slug];
  const data = DATA.languageLevels[slug] || {};
  const official = data.official || meta.defaultOfficial;
  const target = data.target || meta.target || 'C2 Low';
  const skills = data.skills || meta.defaultSkills;
  const daysSince = getDaysSinceLastStudied(DATA, slug);
  const summary = getLanguageSummary(DATA, slug);
  const tests = getLanguageTests(DATA, slug);
  const reflections = getLanguageReflections(DATA, slug);
  const admin = isEditable();

  const lastStudiedText = daysSince === null ? 'never'
    : daysSince === 0 ? 'today'
    : daysSince === 1 ? '1 day ago'
    : daysSince + ' days ago';

  container.innerHTML = `
    <div class="lang-page" style="--lang-accent: ${meta.accent}; --lang-accent-soft: ${meta.accentSoft};">

      <div class="lang-page-header">
        <button class="lang-back-btn" onclick="goToLevels()">← Back to Levels</button>
        <div class="lang-page-title">
          <span class="lang-page-flag">${meta.flag}</span>
          <span>${meta.name.toUpperCase()}</span>
        </div>
      </div>

      <section class="lang-section">
        <h3>Official Level</h3>
        <div class="lang-official-grid">
          <div class="lang-official-cell">
            <div class="lang-official-label">Current</div>
            ${admin 
              ? `<select class="lang-select" onchange="updateLanguageField('${slug}', 'official', this.value)">
                   ${SKILL_LEVELS.map(l => `<option value="${l}" ${l === official ? 'selected' : ''}>${l}</option>`).join('')}
                 </select>`
              : `<div class="lang-official-value">${official}</div>`}
          </div>
          <div class="lang-official-cell">
            <div class="lang-official-label">Target</div>
            ${admin
              ? `<select class="lang-select" onchange="updateLanguageField('${slug}', 'target', this.value)">
                   ${SKILL_LEVELS.map(l => `<option value="${l}" ${l === target ? 'selected' : ''}>${l}</option>`).join('')}
                 </select>`
              : `<div class="lang-official-value">${target}</div>`}
          </div>
        </div>
        ${data.lastOfficialTest ? `
          <div class="lang-official-test">
            <span>Last official test:</span>
            <strong>${data.lastOfficialTest.name || '—'}</strong>
            <span>on ${formatDate(data.lastOfficialTest.date)}</span>
            ${data.lastOfficialTest.link ? `<a href="${data.lastOfficialTest.link}" target="_blank">view</a>` : ''}
          </div>
        ` : ''}
      </section>

      <section class="lang-section">
        <h3>Skill Breakdown</h3>
        <div class="lang-skills">
          ${renderSkillRow(slug, 'reading', 'Reading', skills.reading)}
          ${renderSkillRow(slug, 'writing', 'Writing', skills.writing)}
          ${renderSkillRow(slug, 'listening', 'Listening', skills.listening)}
          ${renderSkillRow(slug, 'speaking', 'Speaking', skills.speaking)}
          ${renderSkillRow(slug, 'spelling', 'Spelling', skills.spelling)}
        </div>
      </section>

      <section class="lang-section">
        <h3>Auto Stats (from daily logs)</h3>
        <div class="lang-stats-grid">
          <div class="lang-stat-cell">
            <div class="lang-stat-label">Total hours</div>
            <div class="lang-stat-value">${formatHoursShort(summary.totalMinutes)}</div>
          </div>
          <div class="lang-stat-cell">
            <div class="lang-stat-label">Media hours</div>
            <div class="lang-stat-value">${formatHoursShort(summary.mediaMinutes)}</div>
          </div>
          <div class="lang-stat-cell">
            <div class="lang-stat-label">Sessions</div>
            <div class="lang-stat-value">${summary.sessionCount}</div>
          </div>
          <div class="lang-stat-cell">
            <div class="lang-stat-label">Media items</div>
            <div class="lang-stat-value">${summary.mediaCount}</div>
          </div>
          <div class="lang-stat-cell">
            <div class="lang-stat-label">Last studied</div>
            <div class="lang-stat-value">${lastStudiedText}</div>
          </div>
          <div class="lang-stat-cell">
            <div class="lang-stat-label">First session</div>
            <div class="lang-stat-value">${summary.firstDate ? formatDateShort(summary.firstDate) : '—'}</div>
          </div>
        </div>
      </section>

      <section class="lang-section">
        <h3>Custom Tests</h3>
        ${admin ? `
          <form class="lang-test-form" onsubmit="submitTest(event, '${slug}')">
            <div class="lang-test-grid">
              <label>Test Name: <input type="text" name="name" required></label>
              <label>Score: <input type="number" name="score" required></label>
              <label>Max Score: <input type="number" name="maxScore" required></label>
              <label>Date: <input type="date" name="date"></label>
              <label>Source: <input type="text" name="source" placeholder="e.g., Busuu, TOPIK Mock"></label>
              <label>Link: <input type="url" name="link" placeholder="optional"></label>
            </div>
            <label class="lang-test-notes-label">Notes: <input type="text" name="notes" placeholder="optional"></label>
            <button type="submit" class="add-btn">+ ADD TEST RESULT</button>
          </form>
        ` : ''}

        <div class="lang-tests-list">
          ${tests.length ? tests.map(t => renderTestRow(t)).join('') : '<div class="lang-empty">No test results yet</div>'}
        </div>
      </section>

      <section class="lang-section">
        <h3>Permanent Notes</h3>
        ${admin 
          ? `<textarea class="lang-permanent-note" rows="4" 
                       onchange="updateLanguageField('${slug}', 'permanentNote', this.value)"
                       placeholder="About this language, how you study, your strategy...">${data.permanentNote || ''}</textarea>`
          : `<div class="lang-permanent-note-readonly">${data.permanentNote || 'No notes yet.'}</div>`}
      </section>

      <section class="lang-section">
        <h3>Reflections</h3>
        ${admin ? `
          <form class="lang-reflection-form" onsubmit="submitReflection(event, '${slug}')">
            <textarea name="text" rows="2" required placeholder="What did you notice? What improved? What's frustrating?"></textarea>
            <button type="submit" class="add-btn">+ ADD REFLECTION</button>
          </form>
        ` : ''}

        <div class="lang-reflections-list">
          ${reflections.length 
            ? reflections.map(r => `
                <div class="lang-reflection">
                  <div class="lang-reflection-date">${formatDate(r.date)}</div>
                  <div class="lang-reflection-text">${escapeHtml(r.text)}</div>
                </div>
              `).join('')
            : '<div class="lang-empty">No reflections yet</div>'}
        </div>
      </section>

      <section class="lang-section">
        <h3>Level Progress</h3>
        <div class="lang-sparkline">
          <div class="lang-sparkline-bar">
            <div class="lang-sparkline-fill" style="width: ${getLevelProgress(official)}%; background: ${meta.accent};"></div>
          </div>
          <div class="lang-sparkline-labels">
            <span>A0</span>
            <span>A1</span>
            <span>A2</span>
            <span>B1</span>
            <span>B2</span>
            <span>C1</span>
            <span>C2</span>
          </div>
          <div class="lang-sparkline-info">${official} → target ${target}</div>
        </div>
      </section>

    </div>
  `;
}

function renderSkillRow(slug, key, label, value) {
  const meta = LANGUAGES[slug];
  const progress = getLevelProgress(value);
  const admin = isEditable();

  return `
    <div class="lang-skill-row">
      <span class="lang-skill-label">${label}</span>
      <div class="lang-skill-bar">
        <div class="lang-skill-fill" style="width: ${progress}%; background: ${meta.accent};"></div>
      </div>
      ${admin 
        ? `<select class="lang-skill-select" onchange="updateSkill('${slug}', '${key}', this.value)">
             ${SKILL_LEVELS.map(l => `<option value="${l}" ${l === value ? 'selected' : ''}>${l}</option>`).join('')}
           </select>`
        : `<span class="lang-skill-value">${value}</span>`}
    </div>
  `;
}

function renderTestRow(t) {
  const pctColor = t.percentage >= 80 ? '#4a9d6e'
    : t.percentage >= 60 ? '#d99b3d'
    : '#c73e5c';

  return `
    <div class="lang-test-row">
      <div class="lang-test-main">
        <span class="lang-test-date">${formatDate(t.date)}</span>
        <span class="lang-test-name">${escapeHtml(t.name)}</span>
        ${t.source ? `<span class="lang-test-source">${escapeHtml(t.source)}</span>` : ''}
      </div>
      <div class="lang-test-score">
        <span>${t.score}/${t.maxScore}</span>
        <span class="lang-test-pct" style="color: ${pctColor};">${t.percentage}%</span>
        ${t.link ? `<a class="lang-test-link" href="${t.link}" target="_blank">link</a>` : ''}
      </div>
    </div>
  `;
}

// ─── ACTIONS ─────────────────────────────────
function submitTest(event, slug) {
  event.preventDefault();
  if (!isEditable()) return;
  const form = event.target;
  const fd = new FormData(form);
  const score = parseInt(fd.get('score')) || 0;
  const maxScore = parseInt(fd.get('maxScore')) || 1;
  const percentage = Math.round((score / maxScore) * 100);
  const date = fd.get('date') || new Date().toISOString().slice(0, 10);

  if (!DATA.languageTests) DATA.languageTests = [];
  DATA.languageTests.push({
    language: slug,
    date: date,
    name: fd.get('name'),
    score: score,
    maxScore: maxScore,
    percentage: percentage,
    link: fd.get('link') || '',
    source: fd.get('source') || '',
    notes: fd.get('notes') || ''
  });
  saveData(DATA);
  renderLanguagePage(slug);
}

function submitReflection(event, slug) {
  event.preventDefault();
  if (!isEditable()) return;
  const text = new FormData(event.target).get('text');
  if (!text) return;

  if (!DATA.languageReflections) DATA.languageReflections = [];
  DATA.languageReflections.push({
    language: slug,
    date: new Date().toISOString().slice(0, 10),
    text: text
  });
  saveData(DATA);
  renderLanguagePage(slug);
}

function updateLanguageField(slug, key, value) {
  if (!isEditable()) return;
  if (!DATA.languageLevels[slug]) DATA.languageLevels[slug] = {};
  DATA.languageLevels[slug][key] = value;
  saveData(DATA);
  if (key === 'official' || key === 'target') {
    renderLanguagePage(slug);
  }
}

function updateSkill(slug, skill, value) {
  if (!isEditable()) return;
  if (!DATA.languageLevels[slug]) DATA.languageLevels[slug] = {};
  if (!DATA.languageLevels[slug].skills) DATA.languageLevels[slug].skills = {};
  DATA.languageLevels[slug].skills[skill] = value;
  saveData(DATA);
  renderLanguagePage(slug);
}

function goToLevels() {
  renderLevelsIndex();
  showPage('levels-page');
}

// ─── HELPERS ─────────────────────────────────
function getDaysSinceLastStudied(data, slug) {
  const meta = LANGUAGES[slug];
  if (!meta) return null;

  const target = meta.name.toLowerCase();
  let mostRecentDate = null;

  (data.dailyLogs || []).forEach(log => {
    (log.sessions || []).forEach(s => {
      if ((s.language || '').toLowerCase() === target) {
        if (!mostRecentDate || new Date(log.date) > new Date(mostRecentDate)) {
          mostRecentDate = log.date;
        }
      }
    });
    (log.mediaConsumed || []).forEach(m => {
      if ((m.language || '').toLowerCase() === target || (m.audioLanguage || '').toLowerCase() === target) {
        if (!mostRecentDate || new Date(log.date) > new Date(mostRecentDate)) {
          mostRecentDate = log.date;
        }
      }
    });
  });

  if (!mostRecentDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const then = new Date(mostRecentDate);
  then.setHours(0, 0, 0, 0);
  return Math.round((today - then) / (1000 * 60 * 60 * 24));
}

function getLanguageSummary(data, slug) {
  const meta = LANGUAGES[slug];
  const target = meta.name.toLowerCase();

  let totalMinutes = 0;
  let sessionCount = 0;
  let mediaMinutes = 0;
  let mediaCount = 0;
  let firstDate = null;

  (data.dailyLogs || []).forEach(log => {
    (log.sessions || []).forEach(s => {
      if ((s.language || '').toLowerCase() === target) {
        totalMinutes += s.durationMinutes || 0;
        sessionCount++;
        if (!firstDate || new Date(log.date) < new Date(firstDate)) firstDate = log.date;
      }
    });
    (log.mediaConsumed || []).forEach(m => {
      if ((m.language || '').toLowerCase() === target || (m.audioLanguage || '').toLowerCase() === target) {
        mediaMinutes += m.durationMinutes || 0;
        mediaCount++;
        if (!firstDate || new Date(log.date) < new Date(firstDate)) firstDate = log.date;
      }
    });
  });

  return { totalMinutes, mediaMinutes, sessionCount, mediaCount, firstDate };
}

function getLanguageTests(data, slug) {
  if (!data.languageTests) return [];
  return data.languageTests
    .filter(t => t.language === slug)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getLanguageReflections(data, slug) {
  if (!data.languageReflections) return [];
  return data.languageReflections
    .filter(r => r.language === slug)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function formatHoursShort(minutes) {
  if (!minutes) return '0h';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}
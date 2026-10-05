/* ============================================
   LEVELS PAGE + INDIVIDUAL LANGUAGE PAGES
   Everything lives inside notebook spreads
   ============================================ */

// ─── MAIN LEVELS INDEX ───────────────────────
function renderLevelsIndex() {
  const container = document.getElementById('levels-page');

  const rows = LANGUAGE_ORDER.map(slug => {
    const meta = LANGUAGES[slug];
    const data = DATA.languageLevels[slug] || {};
    const official = data.official || meta.defaultOfficial;
    const daysSince = getDaysSinceLastStudied(DATA, slug);
    const recColor = getRecencyColor(daysSince);
    const lastText = daysSince === null ? 'never'
      : daysSince === 0 ? 'today'
      : daysSince === 1 ? '1d ago'
      : daysSince + 'd ago';

    return `
      <div class="toc-lang-row" onclick="openLanguagePage('${slug}')" 
           style="--lang-accent: ${meta.accent}; --lang-accent-soft: ${meta.accentSoft};">
        <span class="toc-lang-flag">${meta.flag}</span>
        <span class="toc-lang-name">${meta.name}</span>
        <span class="toc-lang-level">${official}</span>
        <span class="toc-lang-days">${lastText}</span>
        <span class="toc-lang-dot" style="background: ${recColor};"></span>
        <span class="toc-lang-arrow" style="color: ${meta.accent};">→</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="book-spread">

      <div class="book-page">
        <h2>Levels & Stats</h2>
        <p style="font-size: 0.85rem; color: var(--paper-ink); margin-bottom: 1rem;">
          Click a language on the right to open its notebook page.
        </p>

        <div class="index-card" style="margin-top: 1.5rem;">
          <div class="index-card-title">Recency Legend</div>
          <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.8rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="toc-lang-dot" style="background: #4a9d6e;"></span>
              <span>Studied within 7 days</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="toc-lang-dot" style="background: #d99b3d;"></span>
              <span>Not studied 8–21 days</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="toc-lang-dot" style="background: #c73e5c;"></span>
              <span>Not studied 22+ days</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="toc-lang-dot" style="background: #c8c8c8;"></span>
              <span>Never studied</span>
            </div>
          </div>
        </div>

        <div class="index-card" style="margin-top: 1rem;">
          <div class="index-card-title">About Levels</div>
          <div style="font-size: 0.8rem; color: var(--paper-ink); line-height: 1.6;">
            Each language has its own page with official level, five skill
            breakdowns, custom test results, permanent notes, and reflections.
            All levels use granular CEFR tiers: A0 Low → C2 High.
          </div>
        </div>
      </div>

      <div class="book-page">
        <h2>All Languages</h2>
        <div class="toc-lang-list">
          ${rows}
        </div>
      </div>

    </div>
  `;
}

// ─── INDIVIDUAL LANGUAGE PAGE ────────────────
let currentLanguage = null;

function openLanguagePage(slug) {
  const meta = LANGUAGES[slug];
  if (!meta) return;
  currentLanguage = slug;
  renderLanguagePage(slug);
  showPage('language-page');
}

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
    <div class="book-spread" style="--lang-accent: ${meta.accent}; --lang-accent-soft: ${meta.accentSoft};">

      <!-- LEFT PAGE -->
      <div class="book-page">
        <h2>${meta.flag} ${meta.name}</h2>

        <div class="index-card">
          <div class="index-card-title">Official Level</div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
              <span>Current:</span>
              ${admin 
                ? `<select class="lang-select" onchange="updateLanguageField('${slug}', 'official', this.value)" style="max-width: 140px;">
                     ${SKILL_LEVELS.map(l => `<option value="${l}" ${l === official ? 'selected' : ''}>${l}</option>`).join('')}
                   </select>`
                : `<strong>${official}</strong>`}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
              <span>Target:</span>
              ${admin
                ? `<select class="lang-select" onchange="updateLanguageField('${slug}', 'target', this.value)" style="max-width: 140px;">
                     ${SKILL_LEVELS.map(l => `<option value="${l}" ${l === target ? 'selected' : ''}>${l}</option>`).join('')}
                   </select>`
                : `<strong>${target}</strong>`}
            </div>
            ${data.lastOfficialTest ? `
              <div style="font-size: 0.75rem; color: var(--paper-ink-soft); margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed var(--paper-ruling);">
                Last official test: <strong>${data.lastOfficialTest.name || '—'}</strong> 
                on ${formatDate(data.lastOfficialTest.date)}
                ${data.lastOfficialTest.link ? `<a href="${data.lastOfficialTest.link}" target="_blank" style="color: var(--accent-ink);">view</a>` : ''}
              </div>
            ` : ''}
          </div>
        </div>

        <div class="index-card">
          <div class="index-card-title">Skill Breakdown</div>
          <div class="lang-skills">
            ${renderSkillRow(slug, 'reading', 'Reading', skills.reading)}
            ${renderSkillRow(slug, 'writing', 'Writing', skills.writing)}
            ${renderSkillRow(slug, 'listening', 'Listening', skills.listening)}
            ${renderSkillRow(slug, 'speaking', 'Speaking', skills.speaking)}
            ${renderSkillRow(slug, 'spelling', 'Spelling', skills.spelling)}
          </div>
        </div>

        <div class="index-card">
          <div class="index-card-title">Level Progress</div>
          <div class="lang-sparkline">
            <div class="lang-sparkline-bar">
              <div class="lang-sparkline-fill" style="width: ${getLevelProgress(official)}%; background: ${meta.accent};"></div>
            </div>
            <div class="lang-sparkline-labels">
              <span>A0</span><span>A1</span><span>A2</span><span>B1</span><span>B2</span><span>C1</span><span>C2</span>
            </div>
            <div class="lang-sparkline-info">${official} → target ${target}</div>
          </div>
        </div>

        <div style="margin-top: 1.5rem;">
          <button class="lang-back-btn" onclick="goToLevels()" style="background: ${meta.accent};">← Back to Levels</button>
        </div>
      </div>

      <!-- RIGHT PAGE -->
      <div class="book-page">

        <div class="index-card">
          <div class="index-card-title">Auto Stats (from daily logs)</div>
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
        </div>

        <div class="index-card">
          <div class="index-card-title">Custom Tests</div>
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
              <button type="submit" class="add-btn">+ Add Test Result</button>
            </form>
          ` : ''}

          <div class="lang-tests-list">
            ${tests.length ? tests.map(t => renderTestRow(t)).join('') : '<div class="lang-empty">No test results yet</div>'}
          </div>
        </div>

        <div class="index-card">
          <div class="index-card-title">Permanent Notes</div>
          ${admin 
            ? `<textarea class="lang-permanent-note" rows="4" 
                         onchange="updateLanguageField('${slug}', 'permanentNote', this.value)"
                         placeholder="About this language, how you study, your strategy...">${data.permanentNote || ''}</textarea>`
            : `<div class="lang-permanent-note-readonly">${data.permanentNote || 'No notes yet.'}</div>`}
        </div>

        <div class="index-card">
          <div class="index-card-title">Reflections</div>
          ${admin ? `
            <form class="lang-reflection-form" onsubmit="submitReflection(event, '${slug}')">
              <textarea name="text" rows="2" required placeholder="What did you notice? What improved? What's frustrating?"></textarea>
              <button type="submit" class="add-btn">+ Add Reflection</button>
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
        </div>

      </div>

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
    const audioLang = (s.language || '').toLowerCase();
    const subLang = (s.subtitleLanguage || '').toLowerCase();
    if (audioLang === target || subLang === target) {
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

  let totalMinutes = 0, sessionCount = 0, mediaMinutes = 0, mediaCount = 0, firstDate = null;

  (data.dailyLogs || []).forEach(log => {
  (log.sessions || []).forEach(s => {
    const audioLang = (s.language || '').toLowerCase();
    const subLang = (s.subtitleLanguage || '').toLowerCase();
    
    if (audioLang === target) {
      totalMinutes += s.splitTime ? (s.durationMinutes || 0) * 0.6 : (s.durationMinutes || 0);
      sessionCount++;
      if (!firstDate || new Date(log.date) < new Date(firstDate)) firstDate = log.date;
    }
    if (subLang === target && s.splitTime) {
      totalMinutes += (s.durationMinutes || 0) * 0.4;
      sessionCount++;
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
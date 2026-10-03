/* ============================================
   ENTRY LIST — Logs Landing + Filters + Search
   ============================================ */

// ─── STATE ───────────────────────────────────
let entryFilter = {
  type: 'korean',       // 'all' | 'korean' | 'maintenance' | 'multilang' | 'backlog' | 'highconfidence' | 'last7' | 'last30'
  language: null,       // null = any, otherwise 'Korean' | 'Portuguese' | ...
  search: '',
  sort: 'newest'        // 'newest' | 'oldest' | 'hours' | 'intrusions'
};

// Language metadata for consistent ordering and colors
const LANGUAGE_META = {
  'Korean':     { order: 1,  css: 'korean',     flag: '🇰🇷' },
  'Portuguese': { order: 2,  css: 'portuguese', flag: '🇵🇹' },
  'Italian':    { order: 3,  css: 'italian',    flag: '🇮🇹' },
  'Arabic':     { order: 4,  css: 'arabic',     flag: '🇸🇦' },
  'Japanese':   { order: 5,  css: 'japanese',   flag: '🇯🇵' },
  'Spanish':    { order: 6,  css: 'spanish',    flag: '🇪🇸' },
  'French':     { order: 7,  css: 'french',     flag: '🇫🇷' },
  'English':    { order: 8,  css: 'english',    flag: '🇬🇧' }
};

// ─── RENDER LOGS LANDING PAGE ────────────────
function renderLogsLanding() {
  const container = document.getElementById('logs-page');
  container.innerHTML = `
    <div class="logs-landing">
      <div class="logs-tabs">
        <button class="logs-tab active" onclick="renderEntryList()">📋 ALL ENTRIES</button>
        <button class="logs-tab" onclick="openLogForm()">📝 TODAY'S LOG</button>
      </div>

      <div class="logs-actions">
        <button onclick="openLogForm()">+ NEW ENTRY</button>
        <button onclick="openLogForm(getBacklogSuggestionDate())">+ BACKFILL PREVIOUS DAY</button>
      </div>

      <div id="entry-list-target"></div>
    </div>
  `;

  renderEntryList();
}

// ─── RENDER ENTRY LIST ───────────────────────
function renderEntryList() {
  const target = document.getElementById('entry-list-target');
  if (!target) return;

  // Sort logs
  const sorted = [...DATA.dailyLogs].sort((a, b) => {
    if (entryFilter.sort === 'newest') return new Date(b.date) - new Date(a.date);
    if (entryFilter.sort === 'oldest') return new Date(a.date) - new Date(b.date);
    if (entryFilter.sort === 'hours') return totalStudyMinutes(b) - totalStudyMinutes(a);
    if (entryFilter.sort === 'intrusions') return (b.koreanOutput?.intrusions || 0) - (a.koreanOutput?.intrusions || 0);
    return 0;
  });

  // Filter logs
  const filtered = sorted.filter(log => matchesFilter(log));

  // Compute summary from filtered set
  const summary = computeSummary(filtered);

  target.innerHTML = `
    <div class="entry-list-header">
      <h2>📖 Entry Archive</h2>
      <div class="entry-summary-strip">
        <div><span>Total entries:</span> <strong>${filtered.length}</strong></div>
        <div><span>Backlog:</span> <strong>${filtered.filter(l => l.backlog).length}</strong></div>
        <div><span>Live:</span> <strong>${filtered.filter(l => !l.backlog).length}</strong></div>
        <div><span>Total study time:</span> <strong>${formatHours(summary.totalMinutes)}</strong></div>
        <div><span>Avg headache:</span> <strong>${summary.avgHeadache || '—'}</strong></div>
        <div><span>Avg intrusions/day:</span> <strong>${summary.avgIntrusions || '—'}</strong></div>
      </div>
    </div>

    ${renderFilterBar()}
    ${renderLanguageStats(filtered)}
    ${filtered.length ? filtered.map(renderEntryCard).join('') : renderEmptyState()}
  `;
}

// ─── FILTER BAR ──────────────────────────────
function renderFilterBar() {
  const types = [
    { key: 'korean',         label: '🇰🇷 Korean Days' },
    { key: 'all',            label: '📚 All Entries' },
    { key: 'maintenance',    label: '🔧 Maintenance Only' },
    { key: 'multilang',      label: '🌍 Multi-language' },
    { key: 'backlog',        label: '🕐 Backlog' },
    { key: 'highconfidence', label: '✅ High Confidence' },
    { key: 'last7',          label: '📅 Last 7 days' },
    { key: 'last30',         label: '📅 Last 30 days' }
  ];

  const languages = ['Korean', 'Portuguese', 'Italian', 'Arabic', 'Japanese', 'Spanish', 'French', 'English'];

  return `
    <div class="filter-bar">
      <div class="filter-row">
        <span class="filter-label">Filter:</span>
        ${types.map(t => `
          <button class="filter-chip ${entryFilter.type === t.key ? 'active' : ''}" 
                  onclick="setEntryFilter('${t.key}')">${t.label}</button>
        `).join('')}
      </div>

      <div class="filter-row">
        <span class="filter-label">Language:</span>
        <button class="filter-chip language ${entryFilter.language === null ? 'active' : ''}" 
                onclick="setLanguageFilter(null)">Any</button>
        ${languages.map(l => `
          <button class="filter-chip language ${entryFilter.language === l ? 'active' : ''}" 
                  onclick="setLanguageFilter('${l}')">${LANGUAGE_META[l].flag} ${l}</button>
        `).join('')}
      </div>

      <div class="filter-row">
        <input type="text" class="filter-search" placeholder="🔍 Search dates, notes, media, languages..." 
               value="${entryFilter.search}" oninput="setSearch(this.value)">
        <select class="filter-sort" onchange="setSort(this.value)">
          <option value="newest" ${entryFilter.sort === 'newest' ? 'selected' : ''}>Newest first</option>
          <option value="oldest" ${entryFilter.sort === 'oldest' ? 'selected' : ''}>Oldest first</option>
          <option value="hours" ${entryFilter.sort === 'hours' ? 'selected' : ''}>Most hours</option>
          <option value="intrusions" ${entryFilter.sort === 'intrusions' ? 'selected' : ''}>Most intrusions</option>
        </select>
      </div>
    </div>
  `;
}

// ─── LANGUAGE STATS CARD ─────────────────────
function renderLanguageStats(logs) {
  if (!logs.length) return '';

  const stats = {};
  Object.keys(LANGUAGE_META).forEach(lang => {
    stats[lang] = { minutes: 0, sessions: 0, media: 0, lastDate: null };
  });

  logs.forEach(log => {
    (log.sessions || []).forEach(s => {
      if (!s.language || !stats[s.language]) return;
      stats[s.language].minutes += s.durationMinutes || 0;
      stats[s.language].sessions += 1;
      if (!stats[s.language].lastDate || new Date(log.date) > new Date(stats[s.language].lastDate)) {
        stats[s.language].lastDate = log.date;
      }
    });
    (log.mediaConsumed || []).forEach(m => {
      if (!m.language || !stats[m.language]) return;
      stats[m.language].media += 1;
      if (!stats[m.language].lastDate || new Date(log.date) > new Date(stats[m.language].lastDate)) {
        stats[m.language].lastDate = log.date;
      }
    });
  });

  const rows = Object.keys(stats)
    .filter(lang => stats[lang].minutes > 0 || stats[lang].media > 0)
    .map(lang => {
      const s = stats[lang];
      const daysAgo = s.lastDate ? daysBetween(s.lastDate, new Date().toISOString().slice(0, 10)) : '—';
      return `<div><span>${LANGUAGE_META[lang].flag} ${lang}</span> <strong>${formatHours(s.minutes)} • ${s.sessions}s • ${s.media}m • ${daysAgo}d ago</strong></div>`;
    }).join('');

  return `
    <div class="lang-stats-card">
      <h3>🌍 Language Breakdown (filtered set)</h3>
      <div class="lang-stats-grid">${rows || '<div>No data yet</div>'}</div>
    </div>
  `;
}

// ─── ENTRY CARD ──────────────────────────────
function renderEntryCard(log) {
  const langMinutes = computeLanguageMinutes(log);
  const maxMinutes = Math.max(...Object.values(langMinutes), 1);
  const sortedLangs = Object.keys(langMinutes)
    .filter(l => langMinutes[l] > 0)
    .sort((a, b) => LANGUAGE_META[a].order - LANGUAGE_META[b].order);

  const langRows = sortedLangs.map(lang => `
    <div class="entry-lang-row ${LANGUAGE_META[lang].css}">
      <span class="entry-lang-name">${LANGUAGE_META[lang].flag} ${lang}</span>
      <div class="entry-lang-bar">
        <div class="entry-lang-bar-fill" style="width: ${(langMinutes[lang] / maxMinutes) * 100}%"></div>
      </div>
      <span class="entry-lang-time">${formatHours(langMinutes[lang])}</span>
    </div>
  `).join('');

  const mediaTags = (log.mediaConsumed || [])
    .filter(m => m.title)
    .map(m => `<span class="media-tag">${m.language ? LANGUAGE_META[m.language]?.flag || '' : ''} ${m.title} ${m.modeCode ? '• ' + m.modeCode : ''}</span>`)
    .join('');

  const dateFormatted = formatDate(log.date);
  const dayNum = log.day || '—';
  const intrusions = log.koreanOutput?.intrusions || 0;
  const headache = log.physiological?.headacheAfterKorean || 0;
  const newWords = log.koreanOutput?.newWords || 0;
  const sleep = log.physiological?.sleepHours || 0;

  const backlogMarker = log.backlog ? `<span class="entry-marker backlog">🕐 BACKLOG</span>` : '';
  const confidence = log.confidence || 'HIGH';
  const confidenceMarker = log.backlog ? `<span class="entry-marker confidence-${confidence.toLowerCase()}">${confidence}</span>` : '';

  return `
    <div class="entry-card">
      <div class="entry-card-header">
        <div class="entry-card-date">
          ${dateFormatted}
          <span class="entry-card-day">Day ${dayNum}</span>
          ${backlogMarker}
          ${confidenceMarker}
        </div>
        <div class="entry-card-actions">
          <button class="entry-btn edit" onclick="editEntry('${log.date}')">✏️ EDIT</button>
          <button class="entry-btn delete" onclick="deleteEntry('${log.date}')">🗑 DELETE</button>
        </div>
      </div>

      <div class="entry-languages">${langRows || '<div style="padding-left:20px;color:var(--paper-ink-soft);font-size:0.75rem;">No sessions logged</div>'}</div>

      ${intrusions || headache || newWords || sleep ? `
        <div class="entry-meta">
          <div><span>New words:</span> <strong>${newWords}</strong></div>
          <div><span>Intrusions:</span> <strong>${intrusions}</strong></div>
          <div><span>Headache:</span> <strong>${headache}/10</strong></div>
          <div><span>Sleep:</span> <strong>${sleep}h</strong></div>
          <div><span>Sessions:</span> <strong>${(log.sessions || []).length}</strong></div>
          <div><span>Media:</span> <strong>${(log.mediaConsumed || []).length}</strong></div>
        </div>
      ` : ''}

      ${mediaTags ? `<div class="entry-media">${mediaTags}</div>` : ''}

      ${log.labNote ? `
        <div class="entry-note">"${escapeHtml(log.labNote.slice(0, 200))}${log.labNote.length > 200 ? '...' : ''}"</div>
      ` : '<div class="entry-note empty">No lab note</div>'}
    </div>
  `;
}

// ─── EMPTY STATE ─────────────────────────────
function renderEmptyState() {
  return `
    <div class="entry-empty">
      <strong>📭 No entries match your filters</strong>
      Try changing the filter, or click "+ NEW ENTRY" to log a day.
    </div>
  `;
}

// ─── FILTER LOGIC ────────────────────────────
function matchesFilter(log) {
  // Type filter
  if (entryFilter.type === 'korean') {
    if (!hasLanguage(log, 'Korean')) return false;
  }
  if (entryFilter.type === 'maintenance') {
    const hasMaint = (log.sessions || []).some(s => s.language && s.language !== 'Korean');
    if (!hasMaint) return false;
  }
  if (entryFilter.type === 'multilang') {
    const langs = new Set((log.sessions || []).map(s => s.language).filter(Boolean));
    if (langs.size < 2) return false;
  }
  if (entryFilter.type === 'backlog') {
    if (!log.backlog) return false;
  }
  if (entryFilter.type === 'highconfidence') {
    if (log.confidence !== 'HIGH') return false;
  }
  if (entryFilter.type === 'last7') {
    const days = daysBetween(log.date, new Date().toISOString().slice(0, 10));
    if (days > 7) return false;
  }
  if (entryFilter.type === 'last30') {
    const days = daysBetween(log.date, new Date().toISOString().slice(0, 10));
    if (days > 30) return false;
  }

  // Language filter
  if (entryFilter.language) {
    if (!hasLanguage(log, entryFilter.language)) return false;
  }

  // Search
  if (entryFilter.search) {
    const s = entryFilter.search.toLowerCase();
    const haystack = [
      log.date,
      log.labNote || '',
      ...(log.sessions || []).map(x => `${x.language} ${x.activity} ${x.customActivity || ''}`),
      ...(log.mediaConsumed || []).map(m => `${m.title} ${m.language} ${m.modeCode || ''}`),
      log.koreanOutput?.dominantIntruder || ''
    ].join(' ').toLowerCase();
    if (!haystack.includes(s)) return false;
  }

  return true;
}

function hasLanguage(log, lang) {
  if ((log.sessions || []).some(s => s.language === lang)) return true;
  if ((log.mediaConsumed || []).some(m => m.language === lang || m.audioLanguage === lang)) return true;
  return false;
}

// ─── SUMMARY CALCULATION ─────────────────────
function computeSummary(logs) {
  let totalMinutes = 0, headacheSum = 0, headacheCount = 0, intrusionSum = 0, intrusionDays = 0;
  logs.forEach(log => {
    totalMinutes += totalStudyMinutes(log);
    const h = log.physiological?.headacheAfterKorean || 0;
    if (h > 0) { headacheSum += h; headacheCount++; }
    const i = log.koreanOutput?.intrusions || 0;
    if (i > 0) { intrusionSum += i; intrusionDays++; }
  });
  return {
    totalMinutes,
    avgHeadache: headacheCount ? (headacheSum / headacheCount).toFixed(1) : null,
    avgIntrusions: intrusionDays ? (intrusionSum / intrusionDays).toFixed(1) : null
  };
}

function totalStudyMinutes(log) {
  return (log.sessions || []).reduce((a, s) => a + (s.durationMinutes || 0), 0);
}

function computeLanguageMinutes(log) {
  const result = {};
  (log.sessions || []).forEach(s => {
    if (!s.language) return;
    result[s.language] = (result[s.language] || 0) + (s.durationMinutes || 0);
  });
  // Also count media time per language
  (log.mediaConsumed || []).forEach(m => {
    if (!m.language) return;
    result[m.language] = (result[m.language] || 0) + (m.durationMinutes || 0);
  });
  return result;
}

// ─── ACTION HANDLERS ─────────────────────────
function setEntryFilter(type) {
  entryFilter.type = type;
  renderEntryList();
}

function setLanguageFilter(lang) {
  entryFilter.language = (entryFilter.language === lang) ? null : lang;
  renderEntryList();
}

function setSearch(value) {
  entryFilter.search = value;
  // Debounce not needed for small data
  renderEntryList();
  // Keep focus on the search input
  const input = document.querySelector('.filter-search');
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}

function setSort(value) {
  entryFilter.sort = value;
  renderEntryList();
}

function editEntry(dateStr) {
  if (!isEditable()) {
    alert('Read-only mode. Add ?admin=true to the URL to edit.');
    return;
  }
  openLogForm(dateStr);
}

function deleteEntry(dateStr) {
  if (!isEditable()) {
    alert('Read-only mode. Add ?admin=true to the URL to delete.');
    return;
  }
  const dateFormatted = formatDate(dateStr);
  if (!confirm(`Delete the entry for ${dateFormatted}?\n\nThis cannot be undone.`)) return;

  DATA.dailyLogs = DATA.dailyLogs.filter(l => l.date !== dateStr);
  saveData(DATA);
  DATA = recalculateAll();
  updateCoverPage();
  updateTOCPage();
  renderEntryList();
}

// ─── HELPERS ─────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatHours(minutes) {
  if (!minutes) return '0h';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getBacklogSuggestionDate() {
  // Suggest the most recent date with no entry
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const datesWithEntries = new Set(DATA.dailyLogs.map(l => l.date));
  for (let i = 1; i <= 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    if (!datesWithEntries.has(ds)) return ds;
  }
  return todayStr;
}
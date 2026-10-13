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
  const threshold = settings.dueThreshold;
  const size = settings.sessionSize;
  const today = new Date().toISOString().slice(0, 10);

  let pool = DATA.vocabulary.filter(w =>
    filter === 'all' || w.language === filter
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
    s.languageFilter === 'all' || w.language === s.languageFilter
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
// ← 5.3c: takes optional target container ID
function renderStudyCard(targetId = 'vocab-content') {
  const container = document.getElementById(targetId);
  if (!container) return;
  const s = studySession;
  const word = DATA.vocabulary.find(w => w.id === s.wordIds[s.currentIndex]);
  if (!word) { completeStudySession(targetId); return; }

  const meta = LANGUAGES[word.language];
  const reverse = s.reverseMode;
  const total = s.wordIds.length;

  const front = reverse
    ? `<div class="study-card-meaning">${escapeHtml(word.meaning || '—')}</div>`
    : `<div class="study-card-word">${meta.flag} ${escapeHtml(word.word)}</div>
       ${word.reading ? `<div class="study-card-reading">(${escapeHtml(word.reading)})</div>` : ''}`;

  const back = `
    <div class="study-card-back-inner">
      <div class="study-card-word">${meta.flag} ${escapeHtml(word.word)}</div>
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
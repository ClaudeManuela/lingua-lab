/* ============================================
   APP CONTROLLER — Lingua Lab
   ============================================ */

let DATA = null;

// ─── INIT ──────────im talking about inniiiiiiiit──────────────────────────
async function init() {
  console.log('Lingua Lab booting...');

  DATA = await loadFromCloud();
  console.log('Loaded', DATA.dailyLogs?.length || 0, 'entries');

  checkEditMode();
  initMode();
  updateCoverPage();
  updateTOCPage();
  if (typeof refreshCoverAvatar === 'function') {
    refreshCoverAvatar();
  }
  console.log('Lingua Lab ready.');
}

// ─── LIGHT / DARK MODE ───────────────────────
function initMode() {
  const saved = localStorage.getItem('linguaLabMode') || 'light';
  applyMode(saved);
}

function applyMode(mode) {
  const btn = document.getElementById('mode-toggle');
  if (mode === 'dark') {
    document.body.classList.add('dark-mode');
    if (btn) btn.textContent = 'NIGHT';
  } else {
    document.body.classList.remove('dark-mode');
    if (btn) btn.textContent = 'DAY';
  }
}

function toggleMode() {
  const isDark = document.body.classList.contains('dark-mode');
  const newMode = isDark ? 'light' : 'dark';
  localStorage.setItem('linguaLabMode', newMode);
  applyMode(newMode);
}

// ─── PAGE ROUTING ────────────────────────────
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');

  // Nav bar visible only on interior pages
  const navBar = document.getElementById('nav-bar');
  if (navBar) {
    if (pageId === 'cover-page') {
      navBar.classList.add('hidden');
      document.body.classList.remove('has-nav');
    } else {
      navBar.classList.remove('hidden');
      document.body.classList.add('has-nav');
    }
  }

  window.scrollTo(0, 0);
}

function openNotebook() {
  const notebook = document.getElementById('notebook');
  notebook.classList.add('book-opening');
  setTimeout(() => {
    showPage('notebook-page');
    notebook.classList.remove('book-opening');
  }, 500);
}

function closeBook() {
  showPage('cover-page');
}

function closeNotebook() {
  showPage('cover-page');
}

function goToSection(section) {
  if (section === 'toc') {
    showPage('notebook-page');
    return;
  }
  if (section === 'logs') {
    if (typeof renderLogsLanding === 'function') {
      showPage('logs-page');
      renderLogsLanding();
      return;
    }
  }
  showPage(section + '-page');
}

// ─── COVER PAGE UPDATE ───────────────────────
function updateCoverPage() {
  const day = getCurrentDay(DATA);
  const studyHours = getKoreanStudyHours(DATA);
  const mediaHours = getKoreanMediaHours(DATA);
  const totalHours = studyHours + mediaHours;
  const maintHours = getMaintenanceHours(DATA);
  const streak = calculateStreak(DATA);

  setText('cover-day', day);
  setText('cover-streak', streak);
  setText('cover-name', DATA.metadata.userName || 'Claude Manuela');

  const miniStatus = document.getElementById('avatar-mini-status');
  if (miniStatus) miniStatus.setAttribute('data-day', day);

  const latest = DATA.dailyLogs[DATA.dailyLogs.length - 1];
  const energy = latest?.physiological?.eveningEnergy || '—';
  setText('cover-energy', energy);

  setText('val-study', studyHours.toFixed(1) + 'h');
  setText('val-media', mediaHours.toFixed(1) + 'h');
  setText('val-total', totalHours.toFixed(1) + 'h');

  setBarWidth('bar-study', studyHours, DATA.settings.koreanStudyTargetHours);
  setBarWidth('bar-media', mediaHours, DATA.settings.koreanMediaTargetHours);
  setBarWidth('bar-total', totalHours, 
    DATA.settings.koreanStudyTargetHours + DATA.settings.koreanMediaTargetHours);

  setText('glance-korean', totalHours.toFixed(1) + 'h');
  setText('glance-maint', maintHours.toFixed(1) + 'h');
  setText('glance-intrusions', getWeeklyIntrusions(DATA));
  setText('glance-headache', getAverageHeadache(DATA) || '—');
  setText('glance-words', getTotalNewWords(DATA));
  setText('glance-vocab', '—');

  const favWord = getFavouriteWord(DATA);
  setText('fav-word-kr', favWord.korean);
  setText('fav-word-meaning', favWord.meaning);
}

function getFavouriteWord(data) {
  if (data.favouriteWords && data.favouriteWords.length) {
    const latest = data.favouriteWords[data.favouriteWords.length - 1];
    return { korean: latest.korean, meaning: latest.meaning };
  }
  return { korean: '—', meaning: 'Add one from the notes section' };
}

// ─── TOC PAGE UPDATE ─────────────────────────
function updateTOCPage() {
  const day = getCurrentDay(DATA);
  const studyHours = getKoreanStudyHours(DATA);
  const mediaHours = getKoreanMediaHours(DATA);
  const totalHours = studyHours + mediaHours;
  const maintHours = getMaintenanceHours(DATA);

  setText('toc-day', day);
  setText('toc-korean', totalHours.toFixed(1));
  setText('toc-maint', maintHours.toFixed(1));
  setText('toc-streak', calculateStreak(DATA));
  setText('toc-entries', DATA.dailyLogs.length);
  setText('toc-backlog', getBacklogCount(DATA));

  Object.keys(DATA.languageLevels).forEach(lang => {
    setText(`toc-lv-${lang}`, DATA.languageLevels[lang].official);
  });
}

// ─── UTILITIES ───────────────────────────────
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setBarWidth(id, value, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  el.style.width = pct + '%';
}

// ─── BOOT ────────────────────────────────────
window.addEventListener('DOMContentLoaded', init);
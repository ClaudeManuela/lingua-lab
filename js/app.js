/* ============================================
   APP CONTROLLER — Lingua Lab
   Page routing + UI updates
   ============================================ */

let DATA = null;

// ─── INIT ────────────────────────────────────
function init() {
  DATA = recalculateAll();
  checkEditMode();
  updateCoverPage();
  updateTOCPage();
  console.log('✅ Lingua Lab loaded.', DATA);
}

// ─── PAGE ROUTING ────────────────────────────
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');
  window.scrollTo(0, 0);
}

function openNotebook() {
  const notebook = document.getElementById('notebook');
  notebook.classList.add('notebook-opening');
  setTimeout(() => {
    showPage('notebook-page');
    notebook.classList.remove('notebook-opening');
  }, 500);
}

function closeNotebook() {
  showPage('cover-page');
}

function goToSection(section) {
  if (section === 'toc') {
    showPage('notebook-page');
    return;
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

  // Avatar status
  setText('day-counter', day);
  setText('cover-day', day);
  setText('cover-streak', streak);
  setText('cover-name', DATA.metadata.userName);

  // Latest energy
  const latest = DATA.dailyLogs[DATA.dailyLogs.length - 1];
  const energy = latest?.physiological?.eveningEnergy || '—';
  setText('cover-energy', energy);

  // Hours bars
  setText('val-study', studyHours.toFixed(1) + 'h');
  setText('val-media', mediaHours.toFixed(1) + 'h');
  setText('val-total', totalHours.toFixed(1) + 'h');

  setBarWidth('bar-study', studyHours, DATA.settings.koreanStudyTargetHours);
  setBarWidth('bar-media', mediaHours, DATA.settings.koreanMediaTargetHours);
  setBarWidth('bar-total', totalHours, 
    DATA.settings.koreanStudyTargetHours + DATA.settings.koreanMediaTargetHours);

  // Glance panel
  setText('glance-korean', totalHours.toFixed(1) + 'h');
  setText('glance-maint', maintHours.toFixed(1) + 'h');
  setText('glance-intrusions', getWeeklyIntrusions(DATA));
  setText('glance-headache', getAverageHeadache(DATA) || '—');
  setText('glance-words', getTotalNewWords(DATA));
  setText('glance-vocab', '—');
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

  // Language levels
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
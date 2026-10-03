/* ============================================
   DATA LAYER — Lingua Lab
   Handles localStorage, recalculation, totals
   ============================================ */

const STORAGE_KEY = 'linguaLab';

// ─── DEFAULT STRUCTURE ───────────────────────
function getDefaultData() {
  return {
    metadata: {
      experimentStartDate: '2026-09-08', // ← CHANGE THIS to your Day 1
      experimentEndDate: '2026-12-13',
      userName: 'Claude Manuela',              // ← CHANGE THIS
      createdAt: new Date().toISOString()
    },
    dailyLogs: [],
    weeklySummaries: [],
    testResults: [],
    labNotes: [],
    favouriteWords: [],
    researchFindings: [],
    languageLevels: {
      
        korean:     { reading: 'A0', writing: 'A0', spelling: 'A0', listening: 'A0', speaking: 'A0', official: 'A0', lastStudied: null },
  portuguese: { reading: 'B1', writing: 'B1', spelling: 'B1', listening: 'B2', speaking: 'B1', official: 'B1', lastStudied: null },
  italian:    { reading: 'B1', writing: 'B1', spelling: 'B1', listening: 'B1', speaking: 'B1', official: 'B1', lastStudied: null },
  arabic:     { reading: 'A2', writing: 'A2', spelling: 'A2', listening: 'A2', speaking: 'A2', official: 'A2', lastStudied: null },
  japanese:   { reading: 'A1', writing: 'A1', spelling: 'A1', listening: 'A1', speaking: 'A1', official: 'A1', lastStudied: null },
  spanish:    { reading: '—', writing: '—', spelling: '—', listening: '—', speaking: '—', official: '—', lastStudied: null },
  french:     { reading: '—', writing: '—', spelling: '—', listening: '—', speaking: '—', official: '—', lastStudied: null },
  english:    { reading: '—', writing: '—', spelling: '—', listening: '—', speaking: '—', official: '—', lastStudied: null }
    },
    
    settings: {
  koreanStudyTargetHours: 60,
  koreanMediaTargetHours: 90,
  editMode: false,
  hangulAppName: 'Hangul App',       
  customActivities: []                 // ← Stores any custom "Other" methods you've used
}
  };
}
//function loadData

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const fresh = getDefaultData();
    saveData(fresh);
    return fresh;
  }
  try {
    const parsed = JSON.parse(raw);
    // Migration: fill in any fields added in later phases
    const migrated = migrateData(parsed);
    return migrated;
  } catch (e) {
    console.error('Corrupt data, resetting.', e);
    const fresh = getDefaultData();
    saveData(fresh);
    return fresh;
  }
}

// ─── MIGRATION ───────────────────────────────
// Fills in missing fields from the default shape without overwriting existing data.
function migrateData(data) {
  const defaults = getDefaultData();

  // Ensure metadata fields exist
  data.metadata = { ...defaults.metadata, ...(data.metadata || {}) };

  // Ensure settings fields exist
  data.settings = { ...defaults.settings, ...(data.settings || {}) };

  // Ensure settings.customActivities is an array
  if (!Array.isArray(data.settings.customActivities)) {
    data.settings.customActivities = [];
  }

  // Ensure top-level arrays exist
  if (!Array.isArray(data.dailyLogs)) data.dailyLogs = [];
  if (!Array.isArray(data.weeklySummaries)) data.weeklySummaries = [];
  if (!Array.isArray(data.testResults)) data.testResults = [];
  if (!Array.isArray(data.labNotes)) data.labNotes = [];
  if (!Array.isArray(data.researchFindings)) data.researchFindings = [];
  if (!Array.isArray(data.favouriteWords)) data.favouriteWords = [];

  // Ensure languageLevels exists for all languages
  if (!data.languageLevels) data.languageLevels = {};
  Object.keys(defaults.languageLevels).forEach(lang => {
    if (!data.languageLevels[lang]) {
      data.languageLevels[lang] = defaults.languageLevels[lang];
    }
  });

  // Persist the migrated data
  saveData(data);
  return data;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── CALCULATIONS ────────────────────────────
function daysBetween(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diff = Math.floor((b - a) / (1000 * 60 * 60 * 24));
  return diff;
}

function getCurrentDay(data) {
  const start = new Date(data.metadata.experimentStartDate);
  const today = new Date();
  return Math.max(1, daysBetween(start, today) + 1);
}

function sumDuration(logs, filterFn) {
  let total = 0;
  logs.forEach(log => {
    (log.sessions || []).forEach(s => {
      if (filterFn(s, log)) total += (s.durationMinutes || 0);
    });
  });
  return total;
}

function sumMediaDuration(logs, filterFn) {
  let total = 0;
  logs.forEach(log => {
    (log.mediaConsumed || []).forEach(m => {
      if (filterFn(m, log)) total += (m.durationMinutes || 0);
    });
  });
  return total;
}

function getKoreanStudyHours(data) {
  return sumDuration(data.dailyLogs, s => s.language === 'Korean') / 60;
}

function getKoreanMediaHours(data) {
  return sumMediaDuration(data.dailyLogs, m => m.language === 'Korean') / 60;
}

function getMaintenanceHours(data) {
  return sumDuration(data.dailyLogs, s => s.language !== 'Korean') / 60;
}

function calculateStreak(data) {
  if (!data.dailyLogs.length) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const datesWithEntries = new Set(
    data.dailyLogs.map(l => {
      const d = new Date(l.date);
      d.setHours(0, 0, 0, 0);
      return d.toISOString().slice(0, 10);
    })
  );

  let streak = 0;
  const cursor = new Date(today);
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (datesWithEntries.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0 && key === today.toISOString().slice(0, 10)) {
      // Allow today to be missing without breaking the streak
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
    if (streak > 400) break; // safety
  }
  return streak;
}

function getWeeklyIntrusions(data) {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  let total = 0;
  data.dailyLogs.forEach(log => {
    const logDate = new Date(log.date);
    if (logDate >= weekAgo && logDate <= today) {
      total += (log.koreanOutput?.intrusions || 0);
    }
  });
  return total;
}

function getAverageHeadache(data) {
  const withData = data.dailyLogs
    .filter(l => l.physiological?.headacheAfterKorean > 0);
  if (!withData.length) return null;
  const sum = withData.reduce((a, l) => a + l.physiological.headacheAfterKorean, 0);
  return (sum / withData.length).toFixed(1);
}

function getTotalNewWords(data) {
  return data.dailyLogs.reduce((a, l) => a + (l.koreanOutput?.newWords || 0), 0);
}

function getBacklogCount(data) {
  return data.dailyLogs.filter(l => l.backlog === true).length;
}

// ─── RECALCULATION ENGINE ────────────────────
function recalculateAll() {
  const data = loadData();

  // Sort logs by date (ascending)
  data.dailyLogs.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Recompute day numbers
  data.dailyLogs.forEach(log => {
    log.day = daysBetween(data.metadata.experimentStartDate, log.date) + 1;
  });

  saveData(data);
  return data;
}

// ─── ENTRY HELPERS ───────────────────────────
function findLogByDate(data, dateStr) {
  return data.dailyLogs.find(l => l.date === dateStr);
}

function upsertLog(dateStr, logEntry) {
  const data = loadData();
  const existing = data.dailyLogs.findIndex(l => l.date === dateStr);
  if (existing >= 0) {
    data.dailyLogs[existing] = { ...data.dailyLogs[existing], ...logEntry };
  } else {
    data.dailyLogs.push(logEntry);
  }
  saveData(data);
  return recalculateAll();
}
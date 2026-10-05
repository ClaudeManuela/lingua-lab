/* ============================================
   DATA LAYER — Lingua Lab (Cloud Sync)
   Reads/writes via Cloudflare Worker KV
   ============================================ */

const STORAGE_KEY = 'linguaLab';
const API_URL = 'https://lingua-lab-api.manuelaekotto.workers.dev/api/data';
const ADMIN_KEY_SESSION = 'linguaLabAdminKey';

let adminKey = null;

// ─── DEFAULT STRUCTURE ───────────────────────
function getDefaultData() {
  return {
    metadata: {
      experimentStartDate: '2026-09-08',
      experimentEndDate: '2026-12-13',
      userName: 'Claude Manuela',
      createdAt: new Date().toISOString(),
      lastSaved: null
    },
    dailyLogs: [],
    weeklySummaries: [],
    testResults: [],
    labNotes: [],
    researchFindings: [],
    favouriteWords: [],
    languageLevels: {
      korean:     { reading: 'A0 Low', writing: 'A0 Low', spelling: 'A0 Low', listening: 'A0 Low', speaking: 'A0 Low', official: 'A0 Low', target: 'C2 Low', lastStudied: null, permanentNote: '', skills: null },
      portuguese: { reading: 'B1 Mid', writing: 'B1 Mid', spelling: 'B1 Mid', listening: 'B2 Low', speaking: 'B1 Mid', official: 'B1 Mid', target: 'C2 Low', lastStudied: null, permanentNote: '', skills: null },
      italian:    { reading: 'B1 Mid', writing: 'B1 Mid', spelling: 'B1 Mid', listening: 'B1 Mid', speaking: 'B1 Mid', official: 'B1 Mid', target: 'C2 Low', lastStudied: null, permanentNote: '', skills: null },
      arabic:     { reading: 'A2 Mid', writing: 'A2 Mid', spelling: 'A2 Mid', listening: 'A2 Mid', speaking: 'A2 Mid', official: 'A2 Mid', target: 'C2 Low', lastStudied: null, permanentNote: '', skills: null },
      japanese:   { reading: 'A1 Mid', writing: 'A1 Mid', spelling: 'A1 Mid', listening: 'A1 Mid', speaking: 'A1 Mid', official: 'A1 Mid', target: 'C2 Low', lastStudied: null, permanentNote: '', skills: null },
      spanish:    { reading: 'A0 Low', writing: 'A0 Low', spelling: 'A0 Low', listening: 'A0 Low', speaking: 'A0 Low', official: 'A0 Low', target: 'C2 Low', lastStudied: null, permanentNote: '', skills: null },
      french:     { reading: 'A0 Low', writing: 'A0 Low', spelling: 'A0 Low', listening: 'A0 Low', speaking: 'A0 Low', official: 'A0 Low', target: 'C2 Low', lastStudied: null, permanentNote: '', skills: null },
      english:    { reading: 'A0 Low', writing: 'A0 Low', spelling: 'A0 Low', listening: 'A0 Low', speaking: 'A0 Low', official: 'A0 Low', target: 'C2 Low', lastStudied: null, permanentNote: '', skills: null }
    },
  languageTests: [],
  languageReflections: [],
  vocabulary: [],
  seedPoints: {},
  gardenSessions: [],
  gardenSpent: {},
    
    settings: {
      koreanStudyTargetHours: 60,
      koreanMediaTargetHours: 90,
      editMode: false,
      hangulAppName: 'Hangul App',
      customActivities: []
    }
  };
}

// ─── MIGRATION ───────────────────────────────
function migrateData(data) {

      // Ensure new top-level arrays exist
    if (!Array.isArray(data.languageTests)) data.languageTests = [];
    if (!Array.isArray(data.languageReflections)) data.languageReflections = [];
    //garden array checks
    if (!Array.isArray(data.vocabulary)) data.vocabulary = [];
    if (!Array.isArray(data.gardenSessions)) data.gardenSessions = [];
    if (!data.seedPoints) data.seedPoints = {};
    if (!data.gardenSpent) data.gardenSpent = {};

    // Ensure vocabulary entries have position fields
    (data.vocabulary || []).forEach(w => {
      if (w.gardenX === undefined) w.gardenX = 100 + Math.random() * 800;
      if (w.gardenY === undefined) w.gardenY = 100 + Math.random() * 600;
      if (!w.reading) w.reading = '';
      if (!w.theme) w.theme = '';
      if (!Array.isArray(w.childIds)) w.childIds = [];
      if (!Array.isArray(w.connections)) w.connections = [];
    });

    // Migrate language level format (A0 → A0 Low, etc.)
    const levelMigrate = {
      'A0': 'A0 Low', 'A1': 'A1 Low', 'A2': 'A2 Low',
      'B1': 'B1 Low', 'B2': 'B2 Low', 'C1': 'C1 Low', 'C2': 'C2 Low'
    };
    Object.keys(data.languageLevels).forEach(slug => {
      const lang = data.languageLevels[slug];
      if (levelMigrate[lang.official]) lang.official = levelMigrate[lang.official];
      if (!lang.target) lang.target = 'C2 Low';
      if (!lang.permanentNote) lang.permanentNote = '';
      // Consolidate skills into a nested object
      if (!lang.skills) {
        lang.skills = {
          reading: levelMigrate[lang.reading] || lang.reading || 'A0 Low',
          writing: levelMigrate[lang.writing] || lang.writing || 'A0 Low',
          listening: levelMigrate[lang.listening] || lang.listening || 'A0 Low',
          speaking: levelMigrate[lang.speaking] || lang.speaking || 'A0 Low',
          spelling: levelMigrate[lang.spelling] || lang.spelling || 'A0 Low'
        };
      }
    });

  const defaults = getDefaultData();
  data.metadata = { ...defaults.metadata, ...(data.metadata || {}) };
  data.settings = { ...defaults.settings, ...(data.settings || {}) };
  if (!Array.isArray(data.settings.customActivities)) data.settings.customActivities = [];
  if (!Array.isArray(data.dailyLogs)) data.dailyLogs = [];
  if (!Array.isArray(data.weeklySummaries)) data.weeklySummaries = [];
  if (!Array.isArray(data.testResults)) data.testResults = [];
  if (!Array.isArray(data.labNotes)) data.labNotes = [];
  if (!Array.isArray(data.researchFindings)) data.researchFindings = [];
  if (!Array.isArray(data.favouriteWords)) data.favouriteWords = [];
  if (!data.languageLevels) data.languageLevels = {};
  Object.keys(defaults.languageLevels).forEach(lang => {
    if (!data.languageLevels[lang]) data.languageLevels[lang] = defaults.languageLevels[lang];
  });
  return data;
}

// ─── LOCAL CACHE ─────────────────────────────
function cacheData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Cache write failed (probably quota):', e);
  }
}

function getCachedData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// ─── CLOUD SYNC ──────────────────────────────
async function fetchFromCloud() {
  try {
    const res = await fetch(API_URL + '?t=' + Date.now()); // cache-bust
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.empty) return null;
    return migrateData(data);
  } catch (e) {
    console.warn('Cloud fetch failed, using cache:', e);
    return null;
  }
}

async function saveToCloud(data) {
  const key = getAdminKey();
  if (!key) {
    console.warn('No admin key set. Save to cloud skipped.');
    return { success: false, error: 'No admin key' };
  }

  data.metadata.lastSaved = new Date().toISOString();

  try {
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        'X-Admin-Key': key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || ('HTTP ' + res.status));
    }
    return await res.json();
  } catch (e) {
    console.error('Cloud save failed:', e);
    return { success: false, error: e.message };
  }
}

// ─── ADMIN KEY MANAGEMENT ────────────────────
function setAdminKey(key) {
  adminKey = key;
  sessionStorage.setItem(ADMIN_KEY_SESSION, key);
}

function getAdminKey() {
  if (adminKey) return adminKey;
  adminKey = sessionStorage.getItem(ADMIN_KEY_SESSION);
  return adminKey;
}

function clearAdminKey() {
  adminKey = null;
  sessionStorage.removeItem(ADMIN_KEY_SESSION);
}

// ─── LOAD / SAVE ─────────────────────────────
// Kept for compatibility with existing code.
// In cloud mode, loadData() returns the cached copy.
// App init calls loadFromCloud() for the real fetch.
function loadData() {
  const cached = getCachedData();
  if (cached) return migrateData(cached);
  const fresh = getDefaultData();
  cacheData(fresh);
  return fresh;
}

function saveData(data) {
  // Always cache locally
  cacheData(data);
  // Fire and forget cloud save (only succeeds in admin mode)
  if (getAdminKey()) {
    saveToCloud(data).then(result => {
      if (result.success) {
        console.log('☁️ Cloud save:', result.savedAt);
      } else {
        console.warn('⚠️ Cloud save failed:', result.error);
      }
    });
  }
}

// ─── LOAD FROM CLOUD (called on app init) ────
async function loadFromCloud() {
  const cloudData = await fetchFromCloud();
  if (cloudData) {
    cacheData(cloudData);
    return cloudData;
  }
  return loadData();
}

// ─── CALCULATIONS ────────────────────────────
function daysBetween(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
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
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
    if (streak > 400) break;
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
  const withData = data.dailyLogs.filter(l => l.physiological?.headacheAfterKorean > 0);
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
  data.dailyLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
  data.dailyLogs.forEach(log => {
    log.day = daysBetween(data.metadata.experimentStartDate, log.date) + 1;
  });
  cacheData(data);
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
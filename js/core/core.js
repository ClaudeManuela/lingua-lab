// core.js all the main scripts

/* ============================================
   SECTION 1: LANGUAGE METADATA Flags, pastel colors, slugs, order, skills
   but also themes, gender, number, and word cluster rendering
   and days since last studied, recency color, and skill level progress
   ============================================ */

const LANGUAGES = {
  korean: {
    name: 'Korean',
    flag: '🇰🇷',
    slug: 'korean',
    accent: '#e8a8a8',
    accentSoft: 'rgba(232, 168, 168, 0.25)',
    defaultOfficial: 'A0 Low',
    defaultSkills: { reading: 'A0 Low', writing: 'A0 Low', listening: 'A0 Low', speaking: 'A0 Low', spelling: 'A0 Low' },
    lastStudied: null,
    permanentNote: '',
    target: 'C2 Low'
  },
  portuguese: {
    name: 'Portuguese',
    flag: '🇧🇷',
    slug: 'portuguese',
    accent: '#a8e8c8',
    accentSoft: 'rgba(168, 232, 200, 0.25)',
    defaultOfficial: 'B1 Mid',
    defaultSkills: { reading: 'B1 Mid', writing: 'B1 Mid', listening: 'B2 Low', speaking: 'B1 Mid', spelling: 'B1 Mid' },
    lastStudied: null,
    permanentNote: '',
    target: 'C2 Low'
  },
  italian: {
    name: 'Italian',
    flag: '🇮🇹',
    slug: 'italian',
    accent: '#e8e0a8',
    accentSoft: 'rgba(232, 224, 168, 0.25)',
    defaultOfficial: 'B1 Mid',
    defaultSkills: { reading: 'B1 Mid', writing: 'B1 Mid', listening: 'B1 Mid', speaking: 'B1 Mid', spelling: 'B1 Mid' },
    lastStudied: null,
    permanentNote: '',
    target: 'C2 Low'
  },
  arabic: {
    name: 'Arabic',
    flag: '🇸🇦',
    slug: 'arabic',
    accent: '#c8a8e8',
    accentSoft: 'rgba(200, 168, 232, 0.25)',
    defaultOfficial: 'A2 Mid',
    defaultSkills: { reading: 'A2 Mid', writing: 'A2 Mid', listening: 'A2 Mid', speaking: 'A2 Mid', spelling: 'A2 Mid' },
    lastStudied: null,
    permanentNote: '',
    target: 'C2 Low'
  },
  japanese: {
    name: 'Japanese',
    flag: '🇯🇵',
    slug: 'japanese',
    accent: '#a8c8e8',
    accentSoft: 'rgba(168, 200, 232, 0.25)',
    defaultOfficial: 'A1 Mid',
    defaultSkills: { reading: 'A1 Mid', writing: 'A1 Mid', listening: 'A1 Mid', speaking: 'A1 Mid', spelling: 'A1 Mid' },
    lastStudied: null,
    permanentNote: '',
    target: 'C2 Low'
  },
  spanish: {
    name: 'Spanish',
    flag: '🇪🇸',
    slug: 'spanish',
    accent: '#e8c8a8',
    accentSoft: 'rgba(232, 200, 168, 0.25)',
    defaultOfficial: 'A0 Low',
    defaultSkills: { reading: 'A0 Low', writing: 'A0 Low', listening: 'A0 Low', speaking: 'A0 Low', spelling: 'A0 Low' },
    lastStudied: null,
    permanentNote: '',
    target: 'C2 Low'
  },
  french: {
    name: 'French',
    flag: '🇫🇷',
    slug: 'french',
    accent: '#e8a8c8',
    accentSoft: 'rgba(232, 168, 200, 0.25)',
    defaultOfficial: 'A0 Low',
    defaultSkills: { reading: 'A0 Low', writing: 'A0 Low', listening: 'A0 Low', speaking: 'A0 Low', spelling: 'A0 Low' },
    lastStudied: null,
    permanentNote: '',
    target: 'C2 Low'
  },
  english: {
    name: 'English',
    flag: '🇬🇧',
    slug: 'english',
    accent: '#c8c8c8',
    accentSoft: 'rgba(200, 200, 200, 0.25)',
    defaultOfficial: 'A0 Low',
    defaultSkills: { reading: 'A0 Low', writing: 'A0 Low', listening: 'A0 Low', speaking: 'A0 Low', spelling: 'A0 Low' },
    lastStudied: null,
    permanentNote: '',
    target: 'C2 Low'
  }
};

const LANGUAGE_ORDER = ['korean', 'portuguese', 'italian', 'arabic', 'japanese', 'spanish', 'french', 'english'];

// skill levels ordered from lowest to highest
const SKILL_LEVELS = [
  'A0 Low', 'A0 Mid', 'A0 High',
  'A1 Low', 'A1 Mid', 'A1 High',
  'A2 Low', 'A2 Mid', 'A2 High',
  'B1 Low', 'B1 Mid', 'B1 High',
  'B2 Low', 'B2 Mid', 'B2 High',
  'C1 Low', 'C1 Mid', 'C1 High',
  'C2 Low', 'C2 Mid', 'C2 High'
];

function getLevelIndex(level) {
  const idx = SKILL_LEVELS.indexOf(level);
  return idx >= 0 ? idx : 0;
}

function getLevelProgress(level) {
  const idx = getLevelIndex(level);
  return ((idx + 1) / SKILL_LEVELS.length) * 100;
}

function getRecencyColor(daysSince) {
  if (daysSince === null || daysSince === undefined) return '#c8c8c8';
  if (daysSince <= 7) return '#4a9d6e';
  if (daysSince <= 21) return '#d99b3d';
  return '#c73e5c';
}

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
/* ============================================
   THEMES — VERY IMPORTANT, add here if you want more palace rooms pls & ty
   ============================================ */

const THEMES = [
  { slug: 'time',        label: 'Time',         icon: '⏱',  color: '#c4a8d9' },
  { slug: 'people',      label: 'People',       icon: '👥', color: '#d9b8a8' },
  { slug: 'family',      label: 'Family',       icon: '🏠', color: '#e8a8a8' },
  { slug: 'events',       label: 'Events',       icon: '📅', color: '#a8d9e8' },
  { slug: 'slang',        label: 'Slang',        icon: '🗯', color: '#a158ab' },
  { slug: 'body',        label: 'Body',         icon: '🫀', color: '#710e6d' },
  { slug: 'food',        label: 'Food',         icon: '🍚', color: '#e8c8a8' },
  { slug: 'drink',       label: 'Drink',        icon: '🍵', color: '#a8d9c8' },
  { slug: 'market',      label: 'Market',       icon: '🛒', color: '#e8d9a8' },
  { slug: 'store',       label: 'Store',        icon: '🛍️', color: '#a8c8d9' },
  { slug: 'school',      label: 'School',       icon: '🎓', color: '#a8c8e8' },
  { slug: 'work',        label: 'Work',         icon: '💼', color: '#8a9bc4' },
  { slug: 'home',        label: 'Home',         icon: '🏡', color: '#c8a898' },
  { slug: 'kitchen',     label: 'Kitchen',      icon: '🍳', color: '#e8b898' },
  { slug: 'bathroom',    label: 'Bathroom',     icon: '🚿', color: '#a8d9e8' },
  { slug: 'clothing',    label: 'Clothing',     icon: '👕', color: '#c8a8d9' },
  { slug: 'transport',   label: 'Transport',    icon: '🚌', color: '#98b8a8' },
  { slug: 'travel',      label: 'Travel',       icon: '✈️', color: '#8ac8d9' },
  { slug: 'city',        label: 'City',         icon: '🏙',  color: '#a8b8c8' },
  { slug: 'nature',      label: 'Nature',       icon: '🌳', color: '#98c898' },
  { slug: 'weather',     label: 'Weather',      icon: '🌤', color: '#a8c8e8' },
  { slug: 'animals',     label: 'Animals',      icon: '🐈', color: '#d9a888' },
  { slug: 'colors',      label: 'Colors',       icon: '🎨', color: '#d9a8c8' },
  { slug: 'numbers',     label: 'Numbers',      icon: '🔢', color: '#a8b8d9' },
  { slug: 'emotions',    label: 'Emotions',     icon: '💭', color: '#d9b8d9' },
  { slug: 'health',      label: 'Health',       icon: '💊', color: '#a8d9b8' },
  { slug: 'tech',        label: 'Tech',         icon: '💻', color: '#98a8b8' },
  { slug: 'media',       label: 'Media',        icon: '🎬', color: '#c8a8b8' },
  { slug: 'music',       label: 'Music',        icon: '🎵', color: '#d9a8d9' },
  { slug: 'sports',      label: 'Sports',       icon: '⚽', color: '#a8d9a8' },
  { slug: 'hobbies',     label: 'Hobbies',      icon: '🎮', color: '#b8a8d9' },
  { slug: 'greetings',   label: 'Greetings',    icon: '👋', color: '#e8b8a8' },
  { slug: 'grammar',     label: 'Grammar',      icon: '📐', color: '#a8c8b8' },
  { slug: 'phrases',     label: 'Phrases',      icon: '💬', color: '#c8c8a8' },
  { slug: 'abstract',    label: 'Abstract',     icon: '🌀', color: '#b8b8c8' },
  { slug: 'other',       label: 'Other',        icon: '📦', color: '#c8b8a8' }
];

const THEME_MAP = Object.fromEntries(THEMES.map(t => [t.slug, t]));


function normalizeTheme(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s) return null;
  // Direct slug match
  if (THEME_MAP[s]) return s;
  // Label match
  const byLabel = THEMES.find(t => t.label.toLowerCase() === s);
  if (byLabel) return byLabel.slug;
  return null;
}
/* ============================================
   WORD FORM HELPERS   Gender, number, cluster rendering
   ============================================ */

// Languages that use gendered articles / pronouns
const GENDERED_LANGUAGES = ['italian', 'french', 'portuguese', 'spanish', 'arabic'];

function languageHasGender(slug) {
  return GENDERED_LANGUAGES.includes(slug);
}

// Option lists for the word card dropdowns
const GENDER_OPTIONS = [
  { value: '',        label: '— not set —' },
  { value: 'fem',     label: '♀ Feminine' },
  { value: 'masc',    label: '♂ Masculine' },
  { value: 'both',    label: '♀♂ Both' },
  { value: 'neither', label: '◦ Neither' }
];

const NUMBER_OPTIONS = [
  { value: '',     label: '— not set —' },
  { value: 'sing', label: 'Singular' },
  { value: 'plur', label: 'Plural' },
  { value: 'both', label: 'Both' }
];

// Small icon for a form's gender
function genderIcon(gender) {
  switch (gender) {
    case 'fem':  return '♀';
    case 'masc': return '♂';
    case 'both': return '♀♂';
    default:     return '';
  }
}

function numberLabel(number) {
  switch (number) {
    case 'sing': return 'Singular';
    case 'plur': return 'Plural';
    case 'both': return 'Both';
    default:     return '';
  }
}

// Return the full cluster for a word: [baseForm, ...altForms]
function renderWordCluster(w) {
  const out = [{
    text: w.word || '',
    article: w.article || '',
    gender: w.gender || '',
    number: w.number || '',
    isBase: true
  }];
  (w.forms || []).forEach(f => {
    out.push({
      text: f.text || '',
      article: f.article || '',
      gender: f.gender || '',
      number: f.number || '',
      isBase: false
    });
  });
  return out;
}

// Single form → "(la) professoressa"
function formatFormEntry(entry) {
  if (!entry.text) return '';
  return entry.article ? `(${entry.article}) ${entry.text}` : entry.text;
}

// Whole cluster → "(la) professoressa / (il) professore"
function formatClusterInline(w) {
  return renderWordCluster(w)
    .filter(e => e.text)
    .map(formatFormEntry)
    .join(' / ');
}

// Compact cluster for garden plant label — base only
function formatClusterShort(w) {
  const first = renderWordCluster(w)[0];
  return first ? formatFormEntry(first) : '';
}

// Escape helper for safety in HTML — already exists elsewhere but
// declared here so lang-data.js is self-contained.
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  }


/* ============================================
   SECTION 2:FUZZY SEARCH — cross-script, multi-field. Searches word, reading, and meaning
   ============================================ */

function levenshtein(a, b) {
  a = (a || '').toLowerCase();
  b = (b || '').toLowerCase();
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Score a single field: returns best score across exact, prefix, substring, fuzzy
function scoreField(query, field) {
  if (!field || !query) return Infinity;
  const q = query.toLowerCase().trim();
  const f = field.toLowerCase();

  if (!q) return Infinity;

  // Exact match
  if (f === q) return 0;

  // Starts with
  if (f.startsWith(q)) return 1;

  // Contains
  if (f.includes(q)) return 2;

  // Word-boundary match (query is a full word inside field)
  const words = f.split(/[\s,.\-!?]+/);
  if (words.includes(q)) return 1;

  // Fuzzy — edit distance against the whole field
  const fullDist = levenshtein(q, f);
  if (fullDist <= 2) return 3 + fullDist;

  // Fuzzy — against prefix of similar length
  const prefix = f.slice(0, q.length + 1);
  const prefixDist = levenshtein(q, prefix);
  if (prefixDist <= 2) return 5 + prefixDist;

  // Fuzzy — against any substring of similar length
  let bestSub = Infinity;
  for (let i = 0; i + q.length <= f.length; i++) {
    const sub = f.slice(i, i + q.length);
    const d = levenshtein(q, sub);
    if (d < bestSub) bestSub = d;
    if (bestSub === 0) break;
  }
  if (bestSub <= 1) return 6;
  if (bestSub <= 2) return 8;

  // Fuzzy — against individual words in the field
  let bestWord = Infinity;
  for (const w of words) {
    if (!w) continue;
    const d = levenshtein(q, w);
    if (d < bestWord) bestWord = d;
  }
  if (bestWord <= 2) return 9 + bestWord;

  return Infinity;
}

// Score a vocabulary entry across all searchable fields
function scoreWord(query, w) {
  if (!query || !query.trim()) return 0; 

  const scores = [
    scoreField(query, w.word),
    scoreField(query, w.reading),
    scoreField(query, w.meaning)
  ];

  return Math.min(...scores);
}

// Search with ranking: returns sorted array
function fuzzySearch(query, candidates) {
  if (!query || !query.trim()) {
    return candidates.slice(0, 60);
  }

  const scored = candidates.map(c => ({
    item: c,
    score: scoreWord(query, c)
  }))
  .filter(s => s.score !== Infinity)
  .sort((a, b) => a.score - b.score);

  return scored.map(s => s.item).slice(0, 60);
}

// For connection picker: prioritize cross-language
function fuzzySearchCrossLang(query, candidates, sourceLang) {
  if (!query || !query.trim()) {
    // No query → sort cross-language first, then alphabetical
    return candidates.slice().sort((a, b) => {
      const aCross = a.language !== sourceLang ? 0 : 1;
      const bCross = b.language !== sourceLang ? 0 : 1;
      if (aCross !== bCross) return aCross - bCross;
      return (a.word || '').localeCompare(b.word || '');
    }).slice(0, 60);
  }

  const scored = candidates.map(c => {
    let score = scoreWord(query, c);
    if (score === Infinity) return { item: c, score: Infinity };

    // Boost cross-language matches (lower score = better)
    if (c.language !== sourceLang) score -= 2;

    return { item: c, score };
  })
  .filter(s => s.score !== Infinity)
  .sort((a, b) => a.score - b.score);

  return scored.map(s => s.item).slice(0, 60);
}

/* ============================================
// Palace constants here so migratedata can use them without loading the whole app   
creating new palace rooms ez: add as variable, design on canva, upload to assets/palace

   ============================================ */

const PALACE_ROOMS = [
  {
    id: 'market',
    name: 'Market',
    theme: 'market',
    icon: '🛒',
    background: 'assets/palace/market.png',
    placeholderColor: '#c9a87c'
  },
  {
    id: 'school',
    name: 'School',
    theme: 'school',
    icon: '🎓',
    background: 'assets/palace/school.png',
    placeholderColor: '#a8c8e8'
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    theme: 'home',
    icon: '🛏',
    background: 'assets/palace/bedroom.png',
    placeholderColor: '#e8c8d8'
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    theme: 'bathroom',
    icon: '🚿',
    background: 'assets/palace/bathroom.png',
    placeholderColor: '#a8e8e0'
  },
  {
    id: 'store',
    name: 'Store',
    theme: 'store',
    icon: '�',
    background: 'assets/palace/store.png',
    placeholderColor: '#e8d4a8'
  },
  {
    id: 'closet',
    name: 'Closet',
    theme: 'clothing',
    icon: '👗',
    background: 'assets/palace/closet.png',
    placeholderColor: '#d9a8c8',
  },
  {
    id: 'numbers',
    name: 'Numbers',
    theme: 'numbers',
    icon: '🔢',
    background: 'assets/palace/numbers.png',
    placeholderColor: '#a8d9c8',
  },
  {
    id: 'colors',
    name: 'Colors',
    theme: 'colors',
    icon: '🎨',
    background: 'assets/palace/colors.png',
    placeholderColor: '#d9a8c5',
  }
];

const PALACE_ROOM_MAP = Object.fromEntries(PALACE_ROOMS.map(r => [r.id, r]));

// Curated slot color palette
const SLOT_COLORS = [
  '#4a9d6e', // green
  '#d99b3d', // amber
  '#9b7bd9', // violet
  '#c73e5c', // red
  '#5a7fb5', // blue
  '#d97b7b', // coral
  '#5a3a2a', // brown
  '#2a2520'  // ink
];

// Language slug → flag, for gap markers
const PALACE_LANGS = ['korean', 'portuguese', 'italian', 'arabic', 'japanese', 'spanish'];

/* ============================================================
   SECTION 3: STATE + PERSISTENCE  (from data.js)
   getDefaultData() returns the default structure for a new user
   migrateData() updates an old data object to the latest structure
   ============================================================ */

let DATA = null;             

const STORAGE_KEY = 'linguaLab';
const API_URL = 'https://lingua-lab-api.manuelaekotto.workers.dev/api/data';
const ADMIN_KEY_SESSION = 'linguaLabAdminKey';

let adminKey = null;

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
    studySessions: [],
    studyState: null,
    palaceRooms: [],
    literatureNotes: [],
    zIndexNotes: [],
    learningLogs: [],
    testResults: [],
    gardenThemeRegions: {}, 
    seedPoints: {},
    gardenSessions: [],
    gardenSpent: {},

    settings: {
      koreanStudyTargetHours: 60,
      koreanMediaTargetHours: 90,
      editMode: false,
      study: {
            sessionSize: 25,
            languageFilter: 'all',
            themeFilter: null,
            reverseMode: false,
            dueThreshold: 14
          },
      lastVocabTab: 'garden',
      hangulAppName: 'Hangul App',
      customActivities: [],
      galleryThemesHidden: false,
      gardenEditMode: false,
      _lastGardenSnapshot: null
    }
  };
}

// ─── MIGRATION ───────────────────────────────
function migrateData(data) {
  // Ensure top-level arrays exist
  if (!Array.isArray(data.languageTests)) data.languageTests = [];
  if (!Array.isArray(data.languageReflections)) data.languageReflections = [];

    // Notes & results Pillar arrays
  if (!Array.isArray(data.literatureNotes)) data.literatureNotes = [];
  if (!Array.isArray(data.zIndexNotes)) data.zIndexNotes = [];
  if (!Array.isArray(data.learningLogs)) data.learningLogs = [];
  if (!Array.isArray(data.testResults)) data.testResults = [];

  // Garden array checks
  if (!Array.isArray(data.vocabulary)) data.vocabulary = [];
  if (!Array.isArray(data.gardenSessions)) data.gardenSessions = [];
  if (!data.seedPoints) data.seedPoints = {};
  if (!data.gardenSpent) data.gardenSpent = {};

  // Ensure settings exists BEFORE any nested guards
  if (!data.settings) data.settings = {};

  // Last-viewed vocab tab
  if (!data.settings.lastVocabTab) data.settings.lastVocabTab = 'garden';

  // Garden placement snapshot
  if (data.settings._lastGardenSnapshot === undefined) {
    data.settings._lastGardenSnapshot = null;
  }

  if (data.settings.galleryThemesHidden === undefined) {
  data.settings.galleryThemesHidden = false;
}
  // Study mode additions
  if (!Array.isArray(data.studySessions)) data.studySessions = [];
  if (data.studyState === undefined) data.studyState = null;
  if (!data.settings.study) {
      data.settings.study = {
    sessionSize: 25,
    languageFilter: 'all',
    themeFilter: null,
    reverseMode: false,
    dueThreshold: 14
  };
} else if (data.settings.study.themeFilter === undefined) {
  data.settings.study.themeFilter = null;
}

  
      // Palace additions (Phase 5.5) — palaceRooms is now an OBJECT keyed by room id
      if (!data.palaceRooms || Array.isArray(data.palaceRooms)) {
        data.palaceRooms = {};
      }
      PALACE_ROOMS.forEach(room => {
        if (!data.palaceRooms[room.id]) {
          data.palaceRooms[room.id] = { slots: [] };
        }
        if (!Array.isArray(data.palaceRooms[room.id].slots)) {
          data.palaceRooms[room.id].slots = [];
        }
        // Sanitize slot fields
        data.palaceRooms[room.id].slots.forEach(s => {
          if (!s.id) s.id = 'slot-' + Math.random().toString(36).slice(2, 10);
          if (!s.label) s.label = 'Slot';
          if (typeof s.x !== 'number') s.x = 50;
          if (typeof s.y !== 'number') s.y = 50;
          if (!s.color) s.color = SLOT_COLORS[0];
          if (!s.words || typeof s.words !== 'object') s.words = {};
        });
      });
      // Garden theme regions
        if (!data.gardenThemeRegions || typeof data.gardenThemeRegions !== 'object') {
          data.gardenThemeRegions = {};
        }
        // Sanitize any existing regions
        Object.keys(data.gardenThemeRegions).forEach(themeSlug => {
          const r = data.gardenThemeRegions[themeSlug];
          if (typeof r.x !== 'number') r.x = 200;
          if (typeof r.y !== 'number') r.y = 200;
          if (typeof r.w !== 'number') r.w = 400;
          if (typeof r.h !== 'number') r.h = 300;
        });

    // Ensure vocabulary entries have position fields
  (data.vocabulary || []).forEach(w => {
    if (w.gardenX === undefined) w.gardenX = 100 + Math.random() * 800;
    if (w.gardenY === undefined) w.gardenY = 100 + Math.random() * 600;
    if (!w.reading) w.reading = '';
    if (!w.theme) w.theme = '';
    w.theme = normalizeTheme(w.theme) || '';

    // Phase 5.4 — form / gender / number additions
    if (w.gender === undefined) w.gender = '';
    if (w.number === undefined) w.number = '';
    if (w.article === undefined) w.article = '';
    if (!Array.isArray(w.forms)) w.forms = [];
    w.forms.forEach(f => {
      if (f.text === undefined) f.text = '';
      if (f.gender === undefined) f.gender = '';
      if (f.number === undefined) f.number = '';
      if (f.article === undefined) f.article = '';
      if (f.notes === undefined) f.notes = '';
    });

    if (!Array.isArray(w.childIds)) w.childIds = [];
    if (!Array.isArray(w.connections)) w.connections = [];
    if (!w.plantType) w.plantType = 'leafy';  // existing words default to leafy
  });

  // Migrate language level format (A0 → A0 Low, etc.)
  const levelMigrate = {
    'A0': 'A0 Low', 'A1': 'A1 Low', 'A2': 'A2 Low',
    'B1': 'B1 Low', 'B2': 'B2 Low', 'C1': 'C1 Low', 'C2': 'C2 Low'
  };
  // Fix during core.js merge: guard languageLevels at top.
// Original data.js used it at line ~710 but guarded it at the bottom,
// so migrateData({}) crashed. Production data always has it; this protects partial inputs.
  if (!data.languageLevels) data.languageLevels = {};
  Object.keys(data.languageLevels).forEach(slug => {
    const lang = data.languageLevels[slug];
    if (levelMigrate[lang.official]) lang.official = levelMigrate[lang.official];
    if (!lang.target) lang.target = 'C2 Low';
    if (!lang.permanentNote) lang.permanentNote = '';
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
  // Deep merge nested study settings so new fields backfill
  data.settings.study = { ...defaults.settings.study, ...(data.settings.study || {}) };
  if (data.settings.gardenEditMode === undefined) {
  data.settings.gardenEditMode = false;
}

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

// ─── CLOUD SYNC ──────────────────────────────
async function fetchFromCloud() {
  try {
    const res = await fetch(API_URL + '?t=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.empty) return null;
    return migrateData(data);
  } catch (e) {
    console.warn('Cloud fetch failed, using cache:', e);
    return null;
  }
}

// ─── CLOUD SYNC (QUEUED) ─────────────────────
let isCloudSaving = false;
let cloudSavePending = false;

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

function saveData(data) {
  // 1. Always cache locally FIRST (instant, no data loss)
  cacheData(data);
  
  // 2. If no admin key, we can't save to cloud anyway
  if (!getAdminKey()) return;

  // 3. Queue the cloud save
  if (isCloudSaving) {
    // If a save is already in progress, mark that we need to save again
    cloudSavePending = true;
    return;
  }

  executeQueuedSave(data);
}

async function executeQueuedSave(data) {
  isCloudSaving = true;
  cloudSavePending = false;

  const result = await saveToCloud(data);
  
  if (result.success) {
    console.log('☁️ Cloud save success');
  } else {
    console.warn('⚠️ Cloud save failed:', result.error);
  }

  isCloudSaving = false;

  // If another save was requested while we were saving, do it again now.
  // We use the latest cached data from localStorage to ensure we send the most up-to-date state.
  if (cloudSavePending) {
    const latestData = getCachedData();
    if (latestData) {
      executeQueuedSave(latestData);
    }
  }
}

// ─── LOAD / SAVE ─────────────────────────────
function loadData() {
  const cached = getCachedData();
  if (cached) return migrateData(cached);
  const fresh = getDefaultData();
  cacheData(fresh);
  return fresh;
}

async function loadFromCloud() {
  const cloudData = await fetchFromCloud();
  if (cloudData) {
    cacheData(cloudData);
    return cloudData;
  }
  return loadData();
}

// Pure Calculations - all the raw numbers

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

//cleaning up numbers ─── RECALCULATION ENGINE ────────────────────

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

/* ============================================
   AUTH — Admin key for cloud writes and edit mode
   ============================================ */

const ADMIN_KEY_STORAGE = 'linguaLabAdminKey';

function checkEditMode() {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('admin') === 'true') {
    let key = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (!key) {
      key = prompt('Enter admin key (Cloudflare secret):');
      if (key) {
        setAdminKey(key);
      }
    }
    if (getAdminKey()) {
      activateEditMode();
      return true;
    }
  }
  
  if (getAdminKey()) {
    activateEditMode();
    return true;
  }
  
  return false;
}

function activateEditMode() {
  const banner = document.getElementById('edit-banner');
  if (banner) banner.classList.remove('hidden');
  document.body.classList.add('edit-mode');
}

function exitEditMode() {
  clearAdminKey();
  document.body.classList.remove('edit-mode');
  const banner = document.getElementById('edit-banner');
  if (banner) banner.classList.add('hidden');
  window.history.replaceState({}, '', window.location.pathname);
}

function isEditable() {
  return !!getAdminKey();
}

/* ============================================
   SETTINGS MODAL — open, close, save, export, reset
   ============================================ */

function openSettings() {
  if (!isEditable()) {
    alert('Read-only mode. Add ?admin=true to the URL to edit settings.');
    return;
  }

  const modal = document.getElementById('settings-modal');
  modal.classList.remove('hidden');

  // Populate current values
  document.getElementById('setting-hangul-app').value = DATA.settings.hangulAppName || '';
  document.getElementById('setting-study-target').value = DATA.settings.koreanStudyTargetHours || 60;
  document.getElementById('setting-media-target').value = DATA.settings.koreanMediaTargetHours || 90;
  document.getElementById('setting-name').value = DATA.metadata.userName || '';
  document.getElementById('setting-start-date').value = DATA.metadata.experimentStartDate || '';

  renderCustomActivitiesList();
}

function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
}

function renderCustomActivitiesList() {
  const container = document.getElementById('custom-activities-list');
  const activities = DATA.settings.customActivities || [];

  if (!activities.length) {
    container.innerHTML = '<p class="settings-hint">No custom activities yet. Add one via the "Other…" option in a session.</p>';
    return;
  }

  container.innerHTML = activities.map((act, i) => `
    <div class="custom-activity-item">
      <span>${act}</span>
      <button onclick="removeCustomActivity(${i})">✕</button>
    </div>
  `).join('');
}

function removeCustomActivity(index) {
  if (!confirm('Remove this custom activity from quick-picks?')) return;
  DATA.settings.customActivities.splice(index, 1);
  saveData(DATA);
  renderCustomActivitiesList();
}

function saveSettings() {
  DATA.settings.hangulAppName = document.getElementById('setting-hangul-app').value.trim() || 'Hangul App';
  DATA.settings.koreanStudyTargetHours = parseInt(document.getElementById('setting-study-target').value) || 60;
  DATA.settings.koreanMediaTargetHours = parseInt(document.getElementById('setting-media-target').value) || 90;
  DATA.metadata.userName = document.getElementById('setting-name').value.trim() || 'Your Name';
  DATA.metadata.experimentStartDate = document.getElementById('setting-start-date').value;

  saveData(DATA);
  DATA = recalculateAll();
  updateCoverPage();
  updateTOCPage();
  closeSettings();
  alert('✅ Settings saved.');
}

// ─── DATA EXPORT / RESET ─────────────────────
function exportData() {
  const json = JSON.stringify(DATA, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lingua-lab-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function confirmReset() {
  const answer = prompt('This will delete ALL your data. Type "RESET" to confirm:');
  if (answer !== 'RESET') return;
  localStorage.removeItem('linguaLab');
  location.reload();
}


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
  if (section === 'notes') {
    if (typeof renderNotesPage === 'function') {
      showPage('notes-page');
      renderNotesPage();
      return;
    }
  }
 if (section === 'results') {
    if (typeof renderResultsPage === 'function') {
      showPage('results-page');
      renderResultsPage();
      return;
    }
  }
  if (section === 'vocabulary') {
    if (typeof renderVocabulary === 'function') {
    renderVocabulary();
    showPage('vocabulary-page');
    return;
  }
}
  if (section === 'levels') {
    if (typeof renderLevelsIndex === 'function') {
      renderLevelsIndex();
      showPage('levels-page');
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
  
  if (typeof renderTOCLanguages === 'function') {
  renderTOCLanguages();
}
}

function renderTOCLanguages() {
  const container = document.getElementById('toc-lang-list');
  if (!container) return;

  const rows = LANGUAGE_ORDER.map(slug => {
    const meta = LANGUAGES[slug];
    const data = DATA.languageLevels[slug] || {};
    const official = data.official || meta.defaultOfficial;
    const daysSince = getDaysSinceLastStudied(DATA, slug);
    const recColor = getRecencyColor(daysSince);
    const lastText = daysSince === null ? 'never'
      : daysSince === 0 ? 'today'
      : daysSince + 'd ago';

    return `
      <div class="toc-lang-row" onclick="openLanguagePage('${slug}')" 
           style="--lang-accent: ${meta.accent};">
        <span class="toc-lang-flag">${meta.flag}</span>
        <span class="toc-lang-name">${meta.name}</span>
        <span class="toc-lang-level">${official}</span>
        <span class="toc-lang-days">${lastText}</span>
        <span class="toc-lang-dot" style="background: ${recColor};"></span>
        <span class="toc-lang-arrow" style="color: ${meta.accent};">→</span>
      </div>
    `;
  }).join('');

  container.innerHTML = rows;
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
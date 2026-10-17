/* ============================================
   LANGUAGE METADATA
   Flags, pastel colors, slugs, order
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

// Skill levels ordered from lowest to highest
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

/* ============================================
   THEMES —  taxonomy for vocabulary grouping and color coding
   slug is the internal ID; label is what shows in the UI
   ============================================ */

const THEMES = [
  { slug: 'time',        label: 'Time',         icon: '⏱',  color: '#c4a8d9' },
  { slug: 'people',      label: 'People',       icon: '👥', color: '#d9b8a8' },
  { slug: 'family',      label: 'Family',       icon: '🏠', color: '#e8a8a8' },
  { slug: 'body',        label: 'Body',         icon: '🫀', color: '#d9a8b8' },
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

// Normalize a free-text theme to a canonical slug (or null if unknown)
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
   WORD FORM HELPERS — Phase 5.4
   Gender, number, cluster rendering
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
// Each entry is a plain object; no mutation of the source.
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
if (typeof escapeHtml !== 'function') {
  window.escapeHtml = function (str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };
}
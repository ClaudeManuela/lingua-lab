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
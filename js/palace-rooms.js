/* ============================================
   PALACE ROOM DEFINITIONS — Phase 5.5a
   Room meta only. Slots live in DATA.palaceRooms.
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
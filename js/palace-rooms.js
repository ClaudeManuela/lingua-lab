/* ============================================
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
/* ============================================
   FUZZY SEARCH — cross-script, multi-field
   Searches word, reading, and meaning
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
  if (!query || !query.trim()) return 0; // no query → all match equally

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
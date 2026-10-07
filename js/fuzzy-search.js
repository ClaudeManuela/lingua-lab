/* ============================================
   FUZZY SEARCH — Levenshtein distance matching
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

function fuzzyMatch(query, word, meaning, threshold = 2) {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  const w = (word || '').toLowerCase();
  const m = (meaning || '').toLowerCase();

  if (w.includes(q) || m.includes(q)) return true;

  // Fuzzy: any word within edit distance ≤ threshold
  if (w.length && levenshtein(q, w.slice(0, q.length + 2)) <= threshold) return true;

  // Try matching against any substring of similar length
  for (let i = 0; i + q.length <= w.length; i++) {
    if (levenshtein(q, w.slice(i, i + q.length)) <= threshold) return true;
  }

  // Meaning words
  const meaningWords = m.split(/\s+/);
  for (const mw of meaningWords) {
    if (levenshtein(q, mw) <= threshold) return true;
  }

  return false;
}

function fuzzySearch(query, candidates) {
  // candidates: array of { word, meaning, ... }
  if (!query || !query.trim()) return candidates.slice(0, 60);
  const q = query.trim();

  const scored = candidates.map(c => {
    const wordScore = levenshtein(q, (c.word || '').toLowerCase().slice(0, q.length + 2));
    const meaningScore = (c.meaning || '').toLowerCase().includes(q.toLowerCase()) ? 0 : 3;
    const startsWith = (c.word || '').toLowerCase().startsWith(q.toLowerCase()) ? 0 : 1;
    return {
      item: c,
      score: wordScore + meaningScore + startsWith
    };
  });

  return scored
    .filter(s => s.score <= 6)
    .sort((a, b) => a.score - b.score)
    .map(s => s.item)
    .slice(0, 60);
}
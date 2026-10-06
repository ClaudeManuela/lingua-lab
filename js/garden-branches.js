/* ============================================
   GARDEN BRANCHES — SVG rendering
   ============================================ */

function renderGardenBranches() {
  const svg = document.getElementById('garden-branches-svg');
  const canvas = document.getElementById('garden-canvas');
  if (!svg || !canvas) return;

  svg.innerHTML = '';

  const words = DATA.vocabulary || [];
  const visibleIds = new Set(getFilteredWords().map(w => w.id));

  // Parent → child branches
  words.forEach(w => {
    if (!visibleIds.has(w.id)) return;
    if (!w.parentId) return;
    const parent = words.find(p => p.id === w.parentId);
    if (!parent || !visibleIds.has(parent.id)) return;

    const x1 = (parent.gardenX || 100) + 20;
    const y1 = (parent.gardenY || 100) + 20;
    const x2 = (w.gardenX || 100) + 20;
    const y2 = (w.gardenY || 100) + 20;

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 - 20;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`);
    svg.appendChild(path);
  });

  // Connections (cross-links) — dotted vines
  const drawnPairs = new Set();
  words.forEach(w => {
    if (!visibleIds.has(w.id)) return;
    (w.connections || []).forEach(cid => {
      const pairKey = [w.id, cid].sort().join('-');
      if (drawnPairs.has(pairKey)) return;
      drawnPairs.add(pairKey);

      const other = words.find(x => x.id === cid);
      if (!other || !visibleIds.has(other.id)) return;

      const x1 = (w.gardenX || 100) + 20;
      const y1 = (w.gardenY || 100) + 20;
      const x2 = (other.gardenX || 100) + 20;
      const y2 = (other.gardenY || 100) + 20;

      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1} ${y1} Q ${mx} ${my - 30} ${x2} ${y2}`);
      path.classList.add('vine');
      svg.appendChild(path);
    });
  });
}
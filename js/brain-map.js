/* ============================================
   BRAIN MAP — Interactive Headache Location
   ============================================ */

// Brain pixel layout — 20×20 grid (1 = filled, 0 = empty)
// Shaped roughly like a side-view brain
const BRAIN_PATTERN = [
  "00000000001111000000",
  "00000000111111100000",
  "00000011111111111000",
  "00000111111111111100",
  "00001111111111111110",
  "00011111111111111110",
  "00111111111111111110",
  "00111111111111111110",
  "01111111111111111100",
  "01111111111111111000",
  "01111111111111110000",
  "00111111111111100000",
  "00111111111111000000",
  "00011111111110000000",
  "00001111111100000000",
  "00000111111000000000",
  "00000011110000000000",
  "00000001100000000000",
  "00000000000000000000",
  "00000000000000000000"
];

function renderBrainMap(containerId, selectedZone, intensity) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Build pixel grid
  let pixels = '';
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 20; col++) {
      const filled = BRAIN_PATTERN[row][col] === '1';
      pixels += `<div class="brain-pixel ${filled ? 'filled' : ''}"></div>`;
    }
  }

  container.innerHTML = `
    <div class="brain-map-title">🧠 Where does it hurt?</div>
    <div class="brain-wrapper" id="brain-wrapper">
      <div class="brain-outline">${pixels}</div>
      <div class="brain-zone zone-frontal ${selectedZone === 'Frontal' ? 'selected' : ''}" 
           onclick="selectHeadacheZone('Frontal')" title="Forehead / Frontal Lobe"></div>
      <div class="brain-zone zone-temporal-left ${selectedZone === 'Temporal' ? 'selected' : ''}" 
           onclick="selectHeadacheZone('Temporal')" title="Left Temple"></div>
      <div class="brain-zone zone-temporal-right ${selectedZone === 'Temporal' ? 'selected' : ''}" 
           onclick="selectHeadacheZone('Temporal')" title="Right Temple"></div>
      <div class="brain-zone zone-occipital ${selectedZone === 'Occipital' ? 'selected' : ''}" 
           onclick="selectHeadacheZone('Occipital')" title="Back of Head"></div>
      <div class="headache-glow ${selectedZone ? 'active' : ''}" 
           id="headache-glow"
           style="--glow-intensity: ${Math.max(0.2, (intensity || 0) / 10)}; 
                  top: ${getZoneTop(selectedZone)}%; 
                  left: ${getZoneLeft(selectedZone)}%; 
                  width: ${getZoneSize(selectedZone)}%; 
                  height: ${getZoneSize(selectedZone)}%;"></div>
    </div>
    <div class="brain-legend">
      <span><div class="swatch"></div>Brain</span>
      <span><div class="swatch active"></div>Selected</span>
    </div>
    <div class="intensity-slider-row">
      <label>Intensity:</label>
      <input type="range" min="0" max="10" step="1" 
             value="${intensity || 0}" 
             oninput="updateHeadacheIntensity(this.value)">
      <span class="intensity-value" id="intensity-display">${intensity || 0}/10</span>
    </div>
    <div class="brain-selection-display ${selectedZone ? '' : 'empty'}" id="brain-selection">
      ${selectedZone ? `Selected: ${selectedZone}` : 'Click a region above'}
    </div>
  `;
}

function getZoneTop(zone) {
  const map = { Frontal: 18, Temporal: 42, Occipital: 70 };
  return map[zone] || 40;
}

function getZoneLeft(zone) {
  const map = { Frontal: 35, Temporal: 30, Occipital: 40 };
  return map[zone] || 35;
}

function getZoneSize(zone) {
  const map = { Frontal: 30, Temporal: 25, Occipital: 20 };
  return map[zone] || 25;
}

// ─── STATE ───────────────────────────────────
let currentHeadacheZone = '';
let currentHeadacheIntensity = 0;

function selectHeadacheZone(zone) {
  // Toggle off if same zone clicked
  if (currentHeadacheZone === zone) {
    currentHeadacheZone = '';
  } else {
    currentHeadacheZone = zone;
  }

  // Sync hidden input
  const hidden = document.getElementById('phys-hloc');
  if (hidden) hidden.value = currentHeadacheZone;

  // Re-render map with new selection
  renderBrainMap('brain-map-slot', currentHeadacheZone, currentHeadacheIntensity);

  // Recalc glow
  updateHeadacheGlow();
}

function updateHeadacheIntensity(value) {
  currentHeadacheIntensity = parseInt(value) || 0;
  const display = document.getElementById('intensity-display');
  if (display) display.textContent = `${currentHeadacheIntensity}/10`;

  // Sync hidden intensity field (uses existing "after Korean" headache)
  const hidden = document.getElementById('phys-hak');
  if (hidden) hidden.value = currentHeadacheIntensity;

  updateHeadacheGlow();
}

function updateHeadacheGlow() {
  const glow = document.getElementById('headache-glow');
  if (!glow) return;
  glow.style.setProperty('--glow-intensity', Math.max(0.2, currentHeadacheIntensity / 10));
  glow.classList.toggle('active', !!currentHeadacheZone && currentHeadacheIntensity > 0);
}
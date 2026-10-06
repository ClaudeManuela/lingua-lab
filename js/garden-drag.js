/* ============================================
   GARDEN DRAG + ZOOM
   ============================================ */

let dragState = null;

function initGardenDrag() {
  const canvas = document.getElementById('garden-canvas');
  if (!canvas) return;

  // Set up mousedown/touchstart on plants via delegation
  canvas.addEventListener('mousedown', onPlantMouseDown);
  canvas.addEventListener('touchstart', onPlantTouchStart, { passive: false });
}

function onPlantMouseDown(e) {
  if (!isEditable()) return;
  const plant = e.target.closest('.garden-plant');
  if (!plant) return;
  e.preventDefault();
  startDrag(plant, e.clientX, e.clientY);
}

function onPlantTouchStart(e) {
  if (!isEditable()) return;
  const plant = e.target.closest('.garden-plant');
  if (!plant) return;
  const touch = e.touches[0];
  startDrag(plant, touch.clientX, touch.clientY);
}

function startDrag(plant, clientX, clientY) {
  const canvas = document.getElementById('garden-canvas');
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const plantRect = plant.getBoundingClientRect();
  const offsetX = clientX - plantRect.left;
  const offsetY = clientY - plantRect.top;

  dragState = {
    plant,
    id: plant.dataset.id,
    offsetX,
    offsetY,
    startX: clientX,
    startY: clientY,
    moved: false
  };

  plant.classList.add('dragging');

  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchmove', onDragTouchMove, { passive: false });
  document.addEventListener('touchend', onDragEnd);
}

function onDragMove(e) {
  if (!dragState) return;
  handleDragMove(e.clientX, e.clientY);
}

function onDragTouchMove(e) {
  if (!dragState) return;
  const touch = e.touches[0];
  handleDragMove(touch.clientX, touch.clientY);
  e.preventDefault();
}

function handleDragMove(clientX, clientY) {
  const { plant, offsetX, offsetY, startX, startY } = dragState;
  const canvas = document.getElementById('garden-canvas');
  if (!canvas) return;

  // Detect movement
  if (Math.abs(clientX - startX) > 4 || Math.abs(clientY - startY) > 4) {
    dragState.moved = true;
    plant.dataset.dragged = 'true';
  }

  const canvasRect = canvas.getBoundingClientRect();
  // Account for zoom scale
  const scale = currentZoom || 1;
  const newLeft = (clientX - canvasRect.left) / scale - offsetX / scale;
  const newTop = (clientY - canvasRect.top) / scale - offsetY / scale;

  plant.style.left = newLeft + 'px';
  plant.style.top = newTop + 'px';
}

function onDragEnd() {
  if (!dragState) return;
  const { plant, id, moved } = dragState;

  plant.classList.remove('dragging');

  if (moved) {
    const word = DATA.vocabulary.find(w => w.id === id);
    if (word) {
      word.gardenX = parseInt(plant.style.left) || 100;
      word.gardenY = parseInt(plant.style.top) || 100;
      saveData(DATA);
    }
  }

  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
  document.removeEventListener('touchmove', onDragTouchMove);
  document.removeEventListener('touchend', onDragEnd);

  dragState = null;
}

// ═══════════════════════════════════════════════
// ZOOM (wheel + pinch)
// ═══════════════════════════════════════════════

function initGardenZoom() {
  const wrap = document.getElementById('garden-canvas-wrap');
  if (!wrap) return;

  wrap.addEventListener('wheel', onGardenWheel, { passive: false });

  // Pinch zoom
  let lastDist = 0;
  wrap.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      lastDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });

  wrap.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && lastDist) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (dist - lastDist) / 300;
      currentZoom = Math.max(0.4, Math.min(3, currentZoom + delta));
      applyZoom();
      lastDist = dist;
      e.preventDefault();
    }
  }, { passive: false });

  wrap.addEventListener('touchend', () => { lastDist = 0; });
}

function onGardenWheel(e) {
  if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 40) return;
  e.preventDefault();
  const delta = -e.deltaY / 500;
  currentZoom = Math.max(0.4, Math.min(3, currentZoom + delta));
  applyZoom();
}
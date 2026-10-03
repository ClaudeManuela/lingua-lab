/* ============================================
   SPRITE SLICER — Cuts sprite sheets into frames
   Cycles frames one at a time (no sliding)
   ============================================ */

const slicedFrames = {};   // state → [dataURL, dataURL, ...]
let spriteInterval = null;
let currentFrameIndex = 0;

// ─── SLICE ONE SPRITE SHEET ──────────────────
function sliceSpriteSheet(img, frameCount) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const frameWidth = Math.floor(img.width / frameCount);
  const frameHeight = img.height;

  canvas.width = frameWidth;
  canvas.height = frameHeight;

  const frames = [];
  for (let i = 0; i < frameCount; i++) {
    ctx.clearRect(0, 0, frameWidth, frameHeight);
    ctx.drawImage(
      img,
      i * frameWidth, 0, frameWidth, frameHeight,  // source rect
      0, 0, frameWidth, frameHeight                 // dest rect
    );
    frames.push(canvas.toDataURL('image/png'));
  }
  return frames;
}

// ─── LOAD + SLICE A SPRITE ───────────────────
async function loadAndSliceSprite(state, frameCount = 4) {
  if (slicedFrames[state]) return slicedFrames[state];

  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      try {
        const frames = sliceSpriteSheet(img, frameCount);
        slicedFrames[state] = frames;
        console.log(`✅ Sliced ${state} → ${frames.length} frames (${img.width}×${img.height})`);
        resolve(frames);
      } catch (e) {
        console.error(`❌ Slice failed for ${state}`, e);
        resolve(null);
      }
    };
    img.onerror = () => {
      console.log(`ℹ️ No sprite for ${state}, will use CSS fallback`);
      resolve(null);
    };
    img.src = `assets/sprites/avatar-${state}.png`;
  });
}

// ─── PLAY A SPRITE STATE ─────────────────────
async function playSprite(state, frameCount = 4, speedMs = 800) {
  const avatar = document.getElementById('avatar');
  if (!avatar) return;

  const frames = await loadAndSliceSprite(state, frameCount);

  if (!frames) {
    // No sprite file — fall back to CSS placeholder
    if (spriteInterval) { clearInterval(spriteInterval); spriteInterval = null; }
    avatar.dataset.sprite = 'false';
    return;
  }

  // Clear previous animation
  if (spriteInterval) { clearInterval(spriteInterval); spriteInterval = null; }

  // Set the sprite mode on the avatar
  avatar.dataset.sprite = 'true';
  avatar.style.backgroundImage = 'none';

  // Preserve the headache halo if it was there
  const existingHalo = avatar.querySelector('.avatar-headache-halo');
  const haloHTML = existingHalo ? existingHalo.outerHTML : '<div class="avatar-headache-halo"></div>';

  avatar.innerHTML = `
    ${haloHTML}
    <img class="sprite-frame" id="sprite-frame" 
         src="${frames[0]}" 
         alt="">
  `;

  currentFrameIndex = 0;

  // Cycle through frames
  spriteInterval = setInterval(() => {
    currentFrameIndex = (currentFrameIndex + 1) % frames.length;
    const img = document.getElementById('sprite-frame');
    if (img) img.src = frames[currentFrameIndex];
  }, speedMs);
}

// ─── PAUSE WHEN TAB HIDDEN (battery saver) ──
document.addEventListener('visibilitychange', () => {
  const avatar = document.getElementById('avatar');
  if (!avatar) return;

  if (document.hidden) {
    if (spriteInterval) { clearInterval(spriteInterval); spriteInterval = null; }
  } else {
    // Resume the current state
    const state = avatar.dataset.state || 'idle';
    const frames = SPRITE_FRAMES[state] || 4;
    if (avatar.dataset.sprite === 'true') {
      playSprite(state, frames);
    }
  }
});

// ─── DEBUG HELPER ────────────────────────────
function debugSprites() {
  console.log('─── SPRITE STATUS ───');
  Object.keys(SPRITE_FRAMES).forEach(state => {
    console.log(`${state}: ${slicedFrames[state] ? '✅ loaded (' + slicedFrames[state].length + ' frames)' : '⚠️ not loaded'}`);
  });
}

// Expose globally for console testing
window.debugSprites = debugSprites;
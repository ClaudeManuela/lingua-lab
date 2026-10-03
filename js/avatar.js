/* ============================================
   AVATAR STATE MACHINE
   Decides which state to render based on data
   ============================================ */

// Sprite sheet config (frames per state)
const SPRITE_FRAMES = {
  idle: 4,
  slouch: 4,
  energetic: 4,
  headache: 4,
  sleepy: 4,
  excited: 4,
  frustrated: 4,
  focused: 4
};

// Check if sprite sheets exist (cached results)
const spriteCache = {};

function spriteExists(state) {
  return new Promise(resolve => {
    if (spriteCache[state] !== undefined) return resolve(spriteCache[state]);
    try {
      const img = new Image();
      img.onload = () => { spriteCache[state] = true; resolve(true); };
      img.onerror = () => { spriteCache[state] = false; resolve(false); };
      img.src = `assets/sprites/avatar-${state}.png`;
    } catch (e) {
      spriteCache[state] = false;
      resolve(false);
    }
  });
}

// ─── DECIDE STATE FROM DATA ───
function decideAvatarState(latestLog) {
  if (!latestLog) return 'idle';

  const phys = latestLog.physiological || {};
  const output = latestLog.koreanOutput || {};

  // Priority order (highest first)
  if ((phys.headacheAfterKorean || 0) >= 7) return 'headache';
  if ((output.intrusions || 0) >= 15) return 'frustrated';
  if ((phys.sleepHours || 8) < 5) return 'sleepy';
  if ((phys.eveningEnergy || 5) >= 8) return 'energetic';
  if ((phys.morningEnergy || 5) <= 3) return 'slouch';
  if ((output.newWords || 0) >= 20) return 'excited';
  if ((phys.motivation || 3) >= 4 && (phys.eveningEnergy || 5) >= 6) return 'focused';

  return 'idle';
}

// ─── RENDER AVATAR ───
async function renderAvatar(latestLog) {
  const avatar = document.getElementById('avatar');
  if (!avatar) return;

  const state = decideAvatarState(latestLog);
  const headacheIntensity = latestLog?.physiological?.headacheAfterKorean || 0;

  // Check for sprite
  const hasSprite = await spriteExists(state);
if (hasSprite) {
  // Sprite mode — JS slicer handles the frames
  avatar.dataset.state = state;
  if (typeof playSprite === 'function') {
    playSprite(state, SPRITE_FRAMES[state] || 4);
  }
} else {
  // CSS placeholder mode
  if (typeof spriteInterval !== 'undefined' && spriteInterval) {
    clearInterval(spriteInterval);
    spriteInterval = null;
  }
  avatar.dataset.sprite = 'false';
  avatar.dataset.state = state;
  avatar.style.backgroundImage = '';
  avatar.innerHTML = `
    <div class="avatar-headache-halo" style="--halo-intensity: ${Math.max(0.2, headacheIntensity / 10)}"></div>
    <div class="css-head"></div>
    <div class="css-body"></div>
  `;
}

  // Set headache attribute for halo
  if (headacheIntensity > 0) {
    avatar.dataset.headache = 'active';
  } else {
    avatar.dataset.headache = 'inactive';
  }

  // Update state label
  const label = document.getElementById('avatar-state-label');
  if (label) {
    label.textContent = `state: ${state}`;
  }
}

// ─── RENDER AVATAR TO COVER ───
function refreshCoverAvatar() {
  const latest = DATA.dailyLogs[DATA.dailyLogs.length - 1];
  renderAvatar(latest);
}
/* ============================================
   AVATAR STATE MACHINE
   Persists last state until new entry saved
   ============================================ */

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

function decideAvatarState(latestLog) {
  if (!latestLog) return 'idle';

  const phys = latestLog.physiological || {};
  const output = latestLog.koreanOutput || {};

  if ((phys.headacheAfterKorean || 0) >= 7) return 'headache';
  if ((output.intrusions || 0) >= 15) return 'frustrated';
  if ((phys.sleepHours || 8) < 5) return 'sleepy';
  if ((phys.eveningEnergy || 5) >= 8) return 'energetic';
  if ((phys.morningEnergy || 5) <= 3) return 'slouch';
  if ((output.newWords || 0) >= 20) return 'excited';
  if ((phys.motivation || 3) >= 4 && (phys.eveningEnergy || 5) >= 6) return 'focused';

  return 'idle';
}

async function renderAvatar(latestLog) {
  const avatar = document.getElementById('avatar');
  if (!avatar) return;

  const state = decideAvatarState(latestLog);

  const hasSprite = await spriteExists(state);

  if (hasSprite) {
    avatar.dataset.state = state;
    if (typeof playSprite === 'function') {
      playSprite(state, SPRITE_FRAMES[state] || 4);
    }
  } else {
    if (typeof spriteInterval !== 'undefined' && spriteInterval) {
      clearInterval(spriteInterval);
      spriteInterval = null;
    }
    avatar.dataset.sprite = 'false';
    avatar.dataset.state = state;
    avatar.style.backgroundImage = '';
    avatar.innerHTML = `
      <div class="css-head"></div>
      <div class="css-body"></div>
    `;
    avatar.classList.add('ready');
  }

  const label = document.getElementById('avatar-state-label');
  if (label) {
    label.textContent = state;
  }
}

function refreshCoverAvatar() {
  const latest = DATA.dailyLogs[DATA.dailyLogs.length - 1];
  renderAvatar(latest);
}
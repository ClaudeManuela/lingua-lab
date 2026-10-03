/* ============================================
   SPRITE SLICER
   ============================================ */

const slicedFrames = {};
let spriteInterval = null;
let currentFrameIndex = 0;

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
      i * frameWidth, 0, frameWidth, frameHeight,
      0, 0, frameWidth, frameHeight
    );
    frames.push(canvas.toDataURL('image/png'));
  }
  return frames;
}

async function loadAndSliceSprite(state, frameCount = 4) {
  if (slicedFrames[state]) return slicedFrames[state];

  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      try {
        const frames = sliceSpriteSheet(img, frameCount);
        slicedFrames[state] = frames;
        resolve(frames);
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = `assets/sprites/avatar-${state}.png`;
  });
}

async function playSprite(state, frameCount = 4, speedMs = 800) {
  const avatar = document.getElementById('avatar');
  if (!avatar) return;

  const frames = await loadAndSliceSprite(state, frameCount);

  if (!frames) {
    if (spriteInterval) { clearInterval(spriteInterval); spriteInterval = null; }
    avatar.dataset.sprite = 'false';
    avatar.classList.add('ready');
    return;
  }

  if (spriteInterval) { clearInterval(spriteInterval); spriteInterval = null; }

  avatar.dataset.sprite = 'true';
  avatar.style.backgroundImage = 'none';

  avatar.innerHTML = `<img class="sprite-frame" id="sprite-frame" src="${frames[0]}" alt="">`;

  currentFrameIndex = 0;

  spriteInterval = setInterval(() => {
    currentFrameIndex = (currentFrameIndex + 1) % frames.length;
    const img = document.getElementById('sprite-frame');
    if (img) img.src = frames[currentFrameIndex];
  }, speedMs);

  avatar.classList.add('ready');
}

document.addEventListener('visibilitychange', () => {
  const avatar = document.getElementById('avatar');
  if (!avatar) return;

  if (document.hidden) {
    if (spriteInterval) { clearInterval(spriteInterval); spriteInterval = null; }
  } else {
    const state = avatar.dataset.state || 'idle';
    if (avatar.dataset.sprite === 'true') {
      playSprite(state, SPRITE_FRAMES[state] || 4);
    }
  }
});
/* ============================================
   AUTH — Admin key for cloud writes
   ============================================ */

const ADMIN_KEY_STORAGE = 'linguaLabAdminKey';

function checkEditMode() {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('admin') === 'true') {
    // Check if we already have a key this session
    let key = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (!key) {
      key = prompt('Enter admin key (Cloudflare secret):');
      if (key) {
        setAdminKey(key);
      }
    }
    if (getAdminKey()) {
      activateEditMode();
      return true;
    }
  }
  
  if (getAdminKey()) {
    activateEditMode();
    return true;
  }
  
  return false;
}

function activateEditMode() {
  const banner = document.getElementById('edit-banner');
  if (banner) banner.classList.remove('hidden');
  document.body.classList.add('edit-mode');
}

function exitEditMode() {
  clearAdminKey();
  document.body.classList.remove('edit-mode');
  const banner = document.getElementById('edit-banner');
  if (banner) banner.classList.add('hidden');
  window.history.replaceState({}, '', window.location.pathname);
}

function isEditable() {
  return !!getAdminKey();
}
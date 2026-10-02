/* ============================================
   AUTH — Simple Edit Mode
   Activation: add ?admin=true to URL, enter password
   ============================================ */

const EDIT_PASSWORD = 'Books3077'; // ← CHANGE THIS to your own password

function checkEditMode() {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('admin') === 'true') {
    const entered = prompt('Enter edit password:');
    if (entered === EDIT_PASSWORD) {
      sessionStorage.setItem('editMode', 'true');
      activateEditMode();
      return true;
    } else {
      alert('Wrong password. Read-only mode.');
    }
  }
  
  // Persist within session
  if (sessionStorage.getItem('editMode') === 'true') {
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
  sessionStorage.removeItem('editMode');
  document.body.classList.remove('edit-mode');
  const banner = document.getElementById('edit-banner');
  if (banner) banner.classList.add('hidden');
  // Clean URL
  window.history.replaceState({}, '', window.location.pathname);
}

function isEditable() {
  return sessionStorage.getItem('editMode') === 'true';
}
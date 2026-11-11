/* ============================================
   SETTINGS MODAL — Lingua Lab
   ============================================ */

function openSettings() {
  if (!isEditable()) {
    alert('Read-only mode. Add ?admin=true to the URL to edit settings.');
    return;
  }

  const modal = document.getElementById('settings-modal');
  modal.classList.remove('hidden');

  // Populate current values
  document.getElementById('setting-hangul-app').value = DATA.settings.hangulAppName || '';
  document.getElementById('setting-study-target').value = DATA.settings.koreanStudyTargetHours || 60;
  document.getElementById('setting-media-target').value = DATA.settings.koreanMediaTargetHours || 90;
  document.getElementById('setting-name').value = DATA.metadata.userName || '';
  document.getElementById('setting-start-date').value = DATA.metadata.experimentStartDate || '';

  renderCustomActivitiesList();
}

function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden');
}

function renderCustomActivitiesList() {
  const container = document.getElementById('custom-activities-list');
  const activities = DATA.settings.customActivities || [];

  if (!activities.length) {
    container.innerHTML = '<p class="settings-hint">No custom activities yet. Add one via the "Other…" option in a session.</p>';
    return;
  }

  container.innerHTML = activities.map((act, i) => `
    <div class="custom-activity-item">
      <span>${act}</span>
      <button onclick="removeCustomActivity(${i})">✕</button>
    </div>
  `).join('');
}

function removeCustomActivity(index) {
  if (!confirm('Remove this custom activity from quick-picks?')) return;
  DATA.settings.customActivities.splice(index, 1);
  saveData(DATA);
  renderCustomActivitiesList();
}

function saveSettings() {
  DATA.settings.hangulAppName = document.getElementById('setting-hangul-app').value.trim() || 'Hangul App';
  DATA.settings.koreanStudyTargetHours = parseInt(document.getElementById('setting-study-target').value) || 60;
  DATA.settings.koreanMediaTargetHours = parseInt(document.getElementById('setting-media-target').value) || 90;
  DATA.metadata.userName = document.getElementById('setting-name').value.trim() || 'Your Name';
  DATA.metadata.experimentStartDate = document.getElementById('setting-start-date').value;

  saveData(DATA);
  DATA = recalculateAll();
  updateCoverPage();
  updateTOCPage();
  closeSettings();
  alert('✅ Settings saved.');
}

// ─── DATA EXPORT / RESET ─────────────────────
function exportData() {
  const json = JSON.stringify(DATA, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lingua-lab-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function confirmReset() {
  const answer = prompt('This will delete ALL your data. Type "RESET" to confirm:');
  if (answer !== 'RESET') return;
  localStorage.removeItem('linguaLab');
  location.reload();
}
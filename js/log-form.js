/* ============================================
   DAILY LOG FORM — Lingua Lab
   Handles entry creation, editing, backlog mode
   ============================================ */

let currentFormDate = null;
let formMode = 'today'; // 'today' or 'backlog'

// ─── OPEN THE FORM ───────────────────────────
function openLogForm(dateStr = null) {
  if (!isEditable()) {
    alert('Read-only mode. Add ?admin=true to the URL and enter password to edit.');
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  currentFormDate = dateStr || today;
  formMode = (currentFormDate === today) ? 'today' : 'backlog';

  renderLogForm();
  showPage('logs-page');
}

// ─── RENDER FORM ─────────────────────────────
function renderLogForm() {
    if (!isEditable()) {
   
    const container = document.getElementById('logs-page');
    container.innerHTML = `
      <div class="book-spread single-page">
        <div class="book-page">
          <div class="log-form-container">
            <!-- existing log form content here -->
          </div>
        </div>
      </div>
    `;

    showPage('logs-page');
    return;
  }
  const existing = findLogByDate(DATA, currentFormDate);
  const dayNumber = daysBetween(DATA.metadata.experimentStartDate, currentFormDate) + 1;

  const container = document.getElementById('logs-page');
  container.innerHTML = `
    <div class="log-form-container">
      <div class="log-header">
        <h2>📓 DAILY LOG — Day ${dayNumber}</h2>
        <div class="mode-toggle">
          <button class="${formMode === 'today' ? 'active' : ''}" onclick="switchFormMode('today')">TODAY</button>
          <button class="${formMode === 'backlog' ? 'active' : ''}" onclick="switchFormMode('backlog')">BACKLOG</button>
        </div>
      </div>

      <div class="log-date-row">
        <label>DATE:</label>
        <input type="date" id="form-date" value="${currentFormDate}" 
               onchange="onDateChange(this.value)">
        ${formMode === 'backlog' ? `
          <label>CONFIDENCE:</label>
          <select id="form-confidence">
            <option value="HIGH">HIGH (remember exactly)</option>
            <option value="MEDIUM" selected>MEDIUM (roughly)</option>
            <option value="LOW">LOW (estimating)</option>
          </select>
        ` : ''}
      </div>

      ${formMode === 'backlog' ? `
        <div class="backlog-notice">🕐 BACKLOG MODE — This entry counts toward all totals.</div>
      ` : ''}

    <section class="form-section">
        <h3> PHYSIOLOGICAL</h3>
        <div class="field-grid">
          <label>Sleep (hrs): <input type="number" step="0.5" id="phys-sleep" value="${existing?.physiological?.sleepHours || ''}"></label>
          <label>Sleep Quality (1-5): <input type="number" min="1" max="5" id="phys-sleepq" value="${existing?.physiological?.sleepQuality || ''}"></label>
          <label>Morning Energy (1-10): <input type="number" min="1" max="10" id="phys-me" value="${existing?.physiological?.morningEnergy || ''}"></label>
          <label>Evening Energy (1-10): <input type="number" min="1" max="10" id="phys-ee" value="${existing?.physiological?.eveningEnergy || ''}"></label>
          <label>Headache AM (1-10): <input type="number" min="1" max="10" id="phys-ham" value="${existing?.physiological?.headacheMorning || ''}"></label>
          <label>Headache After Maint (1-10): <input type="number" min="1" max="10" id="phys-hamaint" value="${existing?.physiological?.headacheAfterMaintenance || ''}"></label>
          <label>Headache After Korean (1-10): <input type="number" min="1" max="10" id="phys-hak" value="${existing?.physiological?.headacheAfterKorean || ''}"></label>
          <label>Stress (1-10): <input type="number" min="1" max="10" id="phys-stress" value="${existing?.physiological?.stress || ''}"></label>
          <label>Mood (1-10): <input type="number" min="1" max="10" id="phys-mood" value="${existing?.physiological?.mood || ''}"></label>
          <label>Motivation (1-5): <input type="number" min="1" max="5" id="phys-mot" value="${existing?.physiological?.motivation || ''}"></label>
        </div>
        <div class="headache-location">
  <input type="hidden" id="phys-hloc" value="${existing?.physiological?.headacheLocation || ''}">
  <input type="hidden" id="phys-hak" value="${existing?.physiological?.headacheAfterKorean || 0}">
  <div id="brain-map-slot"></div>
    </div>
      </section>

      <section class="form-section">
        <h3>⏱ STUDY SESSIONS</h3>
        <div id="sessions-container"></div>
        <button class="add-btn" onclick="addSession()">+ ADD SESSION</button>
      </section>

      <section class="form-section">
        <h3>📺 MEDIA CONSUMED</h3>
        <div id="media-container"></div>
        <button class="add-btn" onclick="addMedia()">+ ADD MEDIA</button>
      </section>

     

      <section class="form-section">
        <h3>🇰🇷 KOREAN OUTPUT</h3>
        <div class="field-grid">
          <label>New Words: <input type="number" id="kor-words" value="${existing?.koreanOutput?.newWords || ''}"></label>
          <label>Subtitle Ignore %: <input type="number" min="0" max="100" id="kor-subignore" value="${existing?.koreanOutput?.subtitleIgnore || ''}"></label>
          <label>Intrusions: <input type="number" id="kor-intrusions" value="${existing?.koreanOutput?.intrusions || ''}"></label>
          <label>Working Memory Span: <input type="number" id="kor-wm" value="${existing?.koreanOutput?.workingMemorySpan || ''}"></label>
          <label>Dominant Intruder:
            <select id="kor-dominant">
              <option value="">— none —</option>
              <option value="Portuguese" ${existing?.koreanOutput?.dominantIntruder === 'Portuguese' ? 'selected' : ''}>Portuguese</option>
              <option value="Italian" ${existing?.koreanOutput?.dominantIntruder === 'Italian' ? 'selected' : ''}>Italian</option>
              <option value="Arabic" ${existing?.koreanOutput?.dominantIntruder === 'Arabic' ? 'selected' : ''}>Arabic</option>
              <option value="Japanese" ${existing?.koreanOutput?.dominantIntruder === 'Japanese' ? 'selected' : ''}>Japanese</option>
            <option value="Spanish" ${existing?.koreanOutput?.dominantIntruder === 'Spanish' ? 'selected' : ''}>Spanish</option>
            <option value="French" ${existing?.koreanOutput?.dominantIntruder === 'French' ? 'selected' : ''}>French</option>
            <option value="English" ${existing?.koreanOutput?.dominantIntruder === 'English' ? 'selected' : ''}>English</option>
            </select>
          </label>
        </div>
         <label>Words learned today (comma-separated):
        <textarea id="kor-words-list" rows="2" placeholder="안녕, 감사, 물">${existing?.koreanOutput?.wordsList || ''}</textarea>
      </label>
      </section>

      <section class="form-section">
      <h3>OTHER LANGUAGES — Words Learned</h3>
      <div id="other-words-container"></div>
      <button type="button" class="add-btn" onclick="addOtherWordRow()">+ Add Language</button>
    </section>

      <section class="form-section">
        <h3> LAB NOTE</h3>
        <textarea id="lab-note" rows="4" placeholder="What did you learn? What clicked? What struggled?">${existing?.labNote || ''}</textarea>
      </section>

      <div class="form-actions">
        <button class="save-btn" onclick="saveLog()"> Save entry</button>
        ${existing ? `<button class="delete-btn" onclick="deleteLog()">🗑 DELETE</button>` : ''}
        <button class="cancel-btn" onclick="closeLogForm()">CANCEL</button>
      </div>
    </div>
  `;
  // Initialize brain map
currentHeadacheZone = existing?.physiological?.headacheLocation || '';
currentHeadacheIntensity = existing?.physiological?.headacheAfterKorean || 0;
renderBrainMap('brain-map-slot', currentHeadacheZone, currentHeadacheIntensity);

  // Populate sessions
  const sessionsContainer = document.getElementById('sessions-container');
  const sessions = existing?.sessions || [createEmptySession()];
  sessions.forEach((s, i) => renderSession(sessionsContainer, s, i));

  // Populate media
  const mediaContainer = document.getElementById('media-container');
  const media = existing?.mediaConsumed || [];
  media.forEach((m, i) => renderMedia(mediaContainer, m, i));

  // Populate other-languages words rows from existing entry
if (existing?.otherLanguagesWords && Array.isArray(existing.otherLanguagesWords)) {
  const container = document.getElementById('other-words-container');
  existing.otherLanguagesWords.forEach((entry, i) => {
    renderOtherWordRow(container, entry, i);
  });
}
}

// ─── SESSION RENDERING ───────────────────────
function createEmptySession() {
  return { 
    startTime: '', 
    endTime: '', 
    durationMinutes: 0, 
    language: '', 
    activity: '', 
    customActivity: '',
    subtitleLanguage: '',   // new
    splitTime: false,       // new
    notes: '' 
  };
}

function renderSession(container, session, index) {
  const hangulAppName = DATA.settings.hangulAppName || 'Hangul App';
  const customActivities = DATA.settings.customActivities || [];

  // Build activity options
  const standardActivities = [
    'Busuu',
    hangulAppName,
    'Shadowing',
    'K-drama',
    'K-pop',
    'Flashcards (Anki)',
    'Textbook',
    'Tutor/Language Partner',
    'Writing Practice',
    'Reading Practice'
  ];

  // Merge in custom activities (avoid duplicates)
  const allActivities = [...new Set([...standardActivities, ...customActivities])];

  const div = document.createElement('div');
  div.className = 'session-card';
  div.dataset.index = index;
  div.innerHTML = `
    <div class="session-header">
      <span>SESSION ${index + 1}</span>
      <button class="remove-btn" onclick="removeSession(${index})">✕</button>
    </div>
    <div class="session-grid">
      <label>Start: <input type="time" class="sess-start" value="${session.startTime}" onchange="recalcDuration(${index})"></label>
      <label>End: <input type="time" class="sess-end" value="${session.endTime}" onchange="recalcDuration(${index})"></label>
      <label>Duration: <span class="sess-duration" id="dur-${index}">${session.durationMinutes || 0} min</span></label>
      <label>Language:
        <select class="sess-lang">
          <option value="">— pick —</option>
          ${['Korean','Portuguese','Italian','Arabic','Japanese','Spanish','French','English'].map(l => 
            `<option value="${l}" ${session.language === l ? 'selected' : ''}>${l}</option>`
          ).join('')}
        </select>
      </label>
            <label>Activity:
        <select class="sess-act" onchange="onActivityChange(${index})">
          <option value="">— pick —</option>
          ${allActivities.map(a => 
            `<option value="${a}" ${session.activity === a ? 'selected' : ''}>${a}</option>`
          ).join('')}
          <option value="Other" ${session.activity === 'Other' ? 'selected' : ''}>Other…</option>
        </select>
      </label>
      <label>Subtitle Language:
        <select class="sess-subtitle">
          <option value="">— none —</option>
          ${['Korean','Portuguese','Italian','Arabic','Japanese','Spanish','French','English'].map(l => 
            `<option value="${l}" ${session.subtitleLanguage === l ? 'selected' : ''}>${l}</option>`
          ).join('')}
        </select>
      </label>
      <label>Split Time:
        <span style="display:flex; align-items:center; gap:0.4rem; font-size:0.7rem;">
          <input type="checkbox" class="sess-split" ${session.splitTime ? 'checked' : ''}>
          <span>60/40</span>
        </span>
      </label>
    </div>
    <div class="custom-activity-row" id="custom-${index}" style="display: ${session.activity === 'Other' ? 'flex' : 'none'}; margin-top: 0.5rem; gap: 0.5rem; align-items: center;">
      <label style="font-size: 0.75rem; color: var(--text-dim); letter-spacing: 0.5px;">Custom Method:</label>
      <input type="text" class="sess-custom" placeholder="e.g., HelloTalk, TTMIK, LingoDeer" value="${session.customActivity || ''}" style="flex: 1; background: var(--bg-input); color: var(--text-main); border: 2px solid var(--border-main); padding: 0.4rem; font-family: var(--font-pixel); font-size: 0.85rem;">
    </div>
    <input type="text" class="sess-notes" placeholder="Optional notes" value="${session.notes || ''}">
  `;
  container.appendChild(div);
}

function onActivityChange(index) {
  const card = document.querySelectorAll('.session-card')[index];
  const select = card.querySelector('.sess-act');
  const customRow = document.getElementById(`custom-${index}`);
  if (select.value === 'Other') {
    customRow.style.display = 'flex';
    customRow.querySelector('.sess-custom').focus();
  } else {
    customRow.style.display = 'none';
  }
}

function recalcDuration(index) {
  const card = document.querySelectorAll('.session-card')[index];
  const start = card.querySelector('.sess-start').value;
  const end = card.querySelector('.sess-end').value;
  const durEl = document.getElementById(`dur-${index}`);

  if (start && end) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let minutes = (eh * 60 + em) - (sh * 60 + sm);
    if (minutes < 0) minutes += 1440; // overnight
    durEl.textContent = `${minutes} min`;
  }
}

function addSession() {
  const container = document.getElementById('sessions-container');
  const index = container.children.length;
  renderSession(container, createEmptySession(), index);
}

function removeSession(index) {
  const cards = document.querySelectorAll('.session-card');
  if (cards.length === 1) {
    alert('Need at least one session.');
    return;
  }
  cards[index].remove();
  reindexSessions();
}

function reindexSessions() {
  const container = document.getElementById('sessions-container');
  const sessions = Array.from(container.children).map(card => ({
    startTime: card.querySelector('.sess-start').value,
    endTime: card.querySelector('.sess-end').value,
    durationMinutes: parseInt(card.querySelector('.sess-duration').textContent) || 0,
    language: card.querySelector('.sess-lang').value,
    activity: card.querySelector('.sess-act').value,
    customActivity: card.querySelector('.sess-custom')?.value || '',
    subtitleLanguage: card.querySelector('.sess-subtitle')?.value || '',
    splitTime: card.querySelector('.sess-split')?.checked || false,
    notes: card.querySelector('.sess-notes').value
  }));
  container.innerHTML = '';
  sessions.forEach((s, i) => renderSession(container, s, i));
}

// ─── MEDIA RENDERING ─────────────────────────
function renderMedia(container, media, index) {
  const div = document.createElement('div');
  div.className = 'media-card';
  div.innerHTML = `
    <div class="session-header">
      <span>MEDIA ${index + 1}</span>
      <button class="remove-btn" onclick="removeMedia(${index})">✕</button>
    </div>
    <div class="media-grid">
      <label>Title: <input type="text" class="med-title" value="${media.title || ''}"></label>
      <label>Language:
  <select class="med-lang">
    ${['Korean','Portuguese','Italian','Arabic','Japanese','Spanish','French','English'].map(l => 
      `<option value="${l}" ${media.language === l ? 'selected' : ''}>${l}</option>`
    ).join('')}
  </select>
</label>
      <label>Type:
        <select class="med-type">
          ${['Anime','Drama','Movie','YouTube','Music','Podcast','Book'].map(t => 
            `<option value="${t}" ${media.type === t ? 'selected' : ''}>${t}</option>`
          ).join('')}
        </select>
      </label>
      <label>Duration (min): <input type="number" class="med-dur" value="${media.durationMinutes || ''}"></label>
    <label>Audio:
  <select class="med-audio">
    ${['Korean','Portuguese','Italian','Arabic','Japanese','Spanish','French','English'].map(a => 
      `<option value="${a}" ${media.audioLanguage === a ? 'selected' : ''}>${a}</option>`
    ).join('')}
  </select>
</label>
<label>Subtitles:
  <select class="med-sub">
    ${['None','Korean','Portuguese','Italian','Arabic','Japanese','Spanish','French','English'].map(s => 
      `<option value="${s}" ${media.subtitleLanguage === s ? 'selected' : ''}>${s}</option>`
    ).join('')}
  </select>
</label>
      
    </div>
    <textarea class="med-learned" rows="2" placeholder="What I learned from this media">${media.whatILearned || ''}</textarea>
  `;
  container.appendChild(div);
}

function addMedia() {
  const container = document.getElementById('media-container');
  const index = container.children.length;
  renderMedia(container, {}, index);
}

function removeMedia(index) {
  const cards = document.querySelectorAll('.media-card');
  cards[index].remove();
}

// ─── SAVE ────────────────────────────────────
function saveLog() {
  const dateStr = document.getElementById('form-date').value;
  const dayNumber = daysBetween(DATA.metadata.experimentStartDate, dateStr) + 1;

  // Gather sessions
  const sessions = Array.from(document.querySelectorAll('.session-card')).map(card => {
    const start = card.querySelector('.sess-start').value;
    const end = card.querySelector('.sess-end').value;
    let duration = 0;
    if (start && end) {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      duration = (eh * 60 + em) - (sh * 60 + sm);
      if (duration < 0) duration += 1440;
    }
    const activity = card.querySelector('.sess-act').value;
    const customActivity = activity === 'Other' 
      ? (card.querySelector('.sess-custom')?.value || '').trim()
      : '';

    return {
      startTime: start,
      endTime: end,
      durationMinutes: duration,
      language: card.querySelector('.sess-lang').value,
      activity: activity,
      customActivity: customActivity,
      subtitleLanguage: card.querySelector('.sess-subtitle')?.value || '',
      splitTime: card.querySelector('.sess-split')?.checked || false,
      notes: card.querySelector('.sess-notes').value
    };
  }).filter(s => s.language);

    // Persist any new custom activities for future quick-pick
  if (!Array.isArray(DATA.settings.customActivities)) {
    DATA.settings.customActivities = [];
  }
  sessions.forEach(s => {
    if (s.customActivity && !DATA.settings.customActivities.includes(s.customActivity)) {
      DATA.settings.customActivities.push(s.customActivity);
    }
  });

  // Gather media
  const mediaConsumed = Array.from(document.querySelectorAll('.media-card')).map(card => {
    const audio = card.querySelector('.med-audio').value;
    const sub = card.querySelector('.med-sub').value;
    const modeCode = buildModeCode(audio, sub);
    return {
      title: card.querySelector('.med-title').value,
      language: card.querySelector('.med-lang').value,
      type: card.querySelector('.med-type').value,
      audioLanguage: audio,
      subtitleLanguage: sub,
      modeCode: modeCode,
      durationMinutes: parseInt(card.querySelector('.med-dur').value) || 0,
      whatILearned: card.querySelector('.med-learned').value
    };
  }).filter(m => m.title);

  const entry = {
    date: dateStr,
    day: dayNumber,
    createdAt: new Date().toISOString(),
    backlog: formMode === 'backlog',
    confidence: document.getElementById('form-confidence')?.value || 'HIGH',
    sessions: sessions,
    mediaConsumed: mediaConsumed,
    physiological: {
      sleepHours: parseFloat(document.getElementById('phys-sleep').value) || 0,
      sleepQuality: parseInt(document.getElementById('phys-sleepq').value) || 0,
      morningEnergy: parseInt(document.getElementById('phys-me').value) || 0,
      eveningEnergy: parseInt(document.getElementById('phys-ee').value) || 0,
      headacheMorning: parseInt(document.getElementById('phys-ham').value) || 0,
      headacheAfterMaintenance: parseInt(document.getElementById('phys-hamaint').value) || 0,
      headacheAfterKorean: parseInt(document.getElementById('phys-hak').value) || 0,
      headacheLocation: document.getElementById('phys-hloc').value,
      stress: parseInt(document.getElementById('phys-stress').value) || 0,
      mood: parseInt(document.getElementById('phys-mood').value) || 0,
      motivation: parseInt(document.getElementById('phys-mot').value) || 0
    },
    koreanOutput: {
      newWords: parseInt(document.getElementById('kor-words').value) || 0,
      wordsList: document.getElementById('kor-words-list')?.value || '',
      subtitleIgnore: parseInt(document.getElementById('kor-subignore').value) || 0,
      intrusions: parseInt(document.getElementById('kor-intrusions').value) || 0,
      dominantIntruder: document.getElementById('kor-dominant').value,
      workingMemorySpan: parseInt(document.getElementById('kor-wm').value) || 0
    },
    otherLanguagesWords: Array.from(document.querySelectorAll('#other-words-container .session-card')).map(card => ({
        language: card.querySelector('.other-words-lang').value,
        words: card.querySelector('.other-words-list').value,
        meanings: card.querySelector('.other-words-meanings').value
      })).filter(e => e.language),
    labNote: document.getElementById('lab-note').value
  };
        // Push Korean words to garden
      const korWords = parseWordList(entry.koreanOutput.wordsList);
      korWords.forEach(w => {
        const existing = DATA.vocabulary.find(v => 
          v.language === 'korean' && v.word.toLowerCase() === w.toLowerCase()
        );
        if (existing) {
          existing.waters = (existing.waters || 0) + 1;
          existing.lastWatered = dateStr;
          updateWordStage(existing);
        } else {
          DATA.vocabulary.push({
            id: generateUUID(),
            word: w,
            meaning: '',
            language: 'korean',
            dateAdded: dateStr,
            waters: 1,
            lastWatered: dateStr,
            stage: 'sprout',
            parentId: null,
            childIds: [],
            connections: [],
            favorite: false,
            notes: '',
            backlog: formMode === 'backlog'
          });
        }
      });

      // Push other-language words to garden
      document.querySelectorAll('#other-words-container .session-card').forEach(card => {
        const lang = card.querySelector('.other-words-lang').value;
        if (!lang) return;
        const wordsText = card.querySelector('.other-words-list').value;
        const meaningsText = card.querySelector('.other-words-meanings').value;
        const words = parseWordList(wordsText);
        const meanings = parseWordList(meaningsText);

        words.forEach((w, i) => {
          const existing = DATA.vocabulary.find(v => 
            v.language === lang && v.word.toLowerCase() === w.toLowerCase()
          );
          if (existing) {
            existing.waters = (existing.waters || 0) + 1;
            existing.lastWatered = dateStr;
            updateWordStage(existing);
          } else {
            DATA.vocabulary.push({
              id: generateUUID(),
              word: w,
              meaning: meanings[i] || '',
              language: lang,
              dateAdded: dateStr,
              waters: 1,
              lastWatered: dateStr,
              stage: 'sprout',
              parentId: null,
              childIds: [],
              connections: [],
              favorite: false,
              notes: '',
              backlog: formMode === 'backlog'
            });
          }
        });
      });

   saveData(DATA);
  upsertLog(dateStr, entry);
  DATA = recalculateAll();
  updateCoverPage();
  updateTOCPage();
  alert('✅ Entry saved. Totals updated.');
  closeLogForm();
}

function buildModeCode(audio, sub) {
  const codeMap = { 
  Korean: 'K', Portuguese: 'P', Italian: 'I', Arabic: 'A', 
  Japanese: 'J', Spanish: 'S', French: 'F', English: 'E', None: 'N' 
};
  return `${codeMap[audio] || '?'}+${codeMap[sub] || '?'}`;
}

function deleteLog() {
  if (!confirm('Delete this entry permanently?')) return;
  const dateStr = document.getElementById('form-date').value;
  DATA.dailyLogs = DATA.dailyLogs.filter(l => l.date !== dateStr);
  saveData(DATA);
  DATA = recalculateAll();
  updateCoverPage();
  updateTOCPage();
  closeLogForm();
}

// ─── NAVIGATION ──────────────────────────────
function switchFormMode(mode) {
  formMode = mode;
  if (mode === 'today') {
    currentFormDate = new Date().toISOString().slice(0, 10);
  }
  renderLogForm();
}

function onDateChange(newDate) {
  currentFormDate = newDate;
  const today = new Date().toISOString().slice(0, 10);
  formMode = (newDate === today) ? 'today' : 'backlog';
  renderLogForm();
}

function closeLogForm() {
  // Return to the Logs landing page (with the entry list visible)
  if (typeof renderLogsLanding === 'function') {
    showPage('logs-page');
    renderLogsLanding();
  } else {
    showPage('notebook-page');
  }
}
function addOtherWordRow() {
  const container = document.getElementById('other-words-container');
  const index = container.children.length;
  renderOtherWordRow(container, { language: '', words: '', meanings: '' }, index);
}

function renderOtherWordRow(container, entry, index) {
  const div = document.createElement('div');
  div.className = 'session-card';
  div.innerHTML = `
    <div class="session-header">
      <span>LANGUAGE ${index + 1}</span>
      <button type="button" class="remove-btn" onclick="this.closest('.session-card').remove()">X</button>
    </div>
    <div class="session-grid">
      <label>Language:
        <select class="other-words-lang">
          <option value="">— pick —</option>
          ${GARDEN_LANGUAGES.map(slug => 
            `<option value="${slug}" ${entry.language === slug ? 'selected' : ''}>${LANGUAGES[slug].flag} ${LANGUAGES[slug].name}</option>`
          ).join('')}
        </select>
      </label>
    </div>
    <label style="display:block; margin-top: 0.5rem; font-size: 0.7rem; color: var(--text-dim);">Words (comma-separated):
      <textarea class="other-words-list" rows="2" placeholder="olá, obrigado">${entry.words || ''}</textarea>
    </label>
    <label style="display:block; margin-top: 0.5rem; font-size: 0.7rem; color: var(--text-dim);">Meanings (optional):
      <textarea class="other-words-meanings" rows="2" placeholder="hello, thanks">${entry.meanings || ''}</textarea>
    </label>
  `;
  container.appendChild(div);
}
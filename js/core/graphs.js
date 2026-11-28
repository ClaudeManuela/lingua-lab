let activeCharts = {};

function renderGraphsPage() {
  const container = document.getElementById('graphs-page');
  if (!container) return;

  if (typeof activeCharts !== 'undefined') {
    Object.values(activeCharts).forEach(chart => chart.destroy());
    activeCharts = {};
  }

    container.innerHTML = `
    <div class="book-spread">
      <div class="book-page">
        <h2>Insights & Analytics</h2>
        <p style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 1.5rem;">Click a graph to open the detailed view.</p>
        
        <h3 style="font-family: var(--font-pixel); border-bottom: 2px dashed var(--border-main); margin-bottom: 1rem;">Experiment Variables</h3>
        <div class="gallery-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); margin-bottom: 2rem;">
          
          <div class="gallery-card" onclick="openGraphModal('migraine')" style="border-left: 8px solid #ffb3ba; padding-left: 1rem;">
            <div class="gallery-card-word">Migraine Timeline</div>
            <div class="gallery-card-meaning">Headache intensity vs. Sleep</div>
          </div>
                    <div class="gallery-card" onclick="openGraphModal('headache-study')" style="border-left: 8px solid #ffb3ba; padding-left: 1rem;">
            <div class="gallery-card-word">Headache vs Study Time</div>
            <div class="gallery-card-meaning">Does studying longer cause more pain?</div>
          </div>
                    <div class="gallery-card" onclick="openGraphModal('forgetting-curve')" style="border-left: 8px solid #ffb3ba; padding-left: 1rem;">
            <div class="gallery-card-word">The Forgetting Curve</div>
            <div class="gallery-card-meaning">Days taken to master a word</div>
          </div>

          <div class="gallery-card" onclick="openGraphModal('velocity')" style="border-left: 8px solid #ffffba; padding-left: 1rem;">
            <div class="gallery-card-word">Word Velocity</div>
            <div class="gallery-card-meaning">Average days spent in each stage</div>
          </div>

          <div class="gallery-card" onclick="openGraphModal('test-scores')" style="border-left: 8px solid #75c8c8; padding-left: 1rem;">
            <div class="gallery-card-word">Test Score Trends</div>
            <div class="gallery-card-meaning">Your progress on official tests over time</div>
          </div>

          <div class="gallery-card" onclick="openGraphModal('vocab-growth')" style="border-left: 8px solid #75c8c8; padding-left: 1rem;">
            <div class="gallery-card-word">Vocabulary Growth</div>
            <div class="gallery-card-meaning">Cumulative words added to the Garden</div>
          </div>
          
          <div class="gallery-card" onclick="openGraphModal('intruders')" style="border-left: 8px solid #ffdfba; padding-left: 1rem;">
            <div class="gallery-card-word">The Intruders</div>
            <div class="gallery-card-meaning">Which languages compete with Korean?</div>
          </div>

          <div class="gallery-card" onclick="openGraphModal('efficacy')" style="border-left: 8px solid #ffffba; padding-left: 1rem;">
            <div class="gallery-card-word">Method Efficacy</div>
            <div class="gallery-card-meaning">Which study method yields the most words?</div>
          </div>

          <div class="gallery-card" onclick="openGraphModal('media')" style="border-left: 8px solid #bae1ff; padding-left: 1rem;">
            <div class="gallery-card-word">Media Immersion</div>
            <div class="gallery-card-meaning">K-Drama consumption vs. Listening Ability</div>
          </div>

          <div class="gallery-card" onclick="openGraphModal('recall')" style="border-left: 8px solid #c8a8b8; padding-left: 1rem;">
            <div class="gallery-card-word">Flashcards vs Recall</div>
            <div class="gallery-card-meaning">Does volume or stage increase accuracy?</div>
          </div>

          <div class="gallery-card" onclick="openGraphModal('method-recall')" style="border-left: 8px solid #a8d9a8; padding-left: 1rem;">
            <div class="gallery-card-word">Palace vs Flashcards</div>
            <div class="gallery-card-meaning">Which yields higher recall rate?</div>
          </div>
          
          <div class="gallery-card" onclick="openGraphModal('brainmap')" style="border-left: 8px solid #d9a888; padding-left: 1rem;">
            <div class="gallery-card-word">Neurological Timeline</div>
            <div class="gallery-card-meaning">View my brain state day by day</div>
          </div>
        </div>

        <br>
        <h3 style="font-family: var(--font-pixel); border-bottom: 2px dashed var(--border-main); margin-bottom: 1rem;">Control Variables</h3>
        <div class="gallery-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
          
          <div class="gallery-card" onclick="openGraphModal('ctrl-mood')" style="border-left: 8px solid #e6a8d7; padding-left: 1rem;">
            <div class="gallery-card-word">Mood over Time</div>
          </div>
          <div class="gallery-card" onclick="openGraphModal('ctrl-sleep')" style="border-left: 8px solid #b8c8d9; padding-left: 1rem;">
            <div class="gallery-card-word">Sleep over Time</div>
          </div>
          <div class="gallery-card" onclick="openGraphModal('ctrl-stress')" style="border-left: 8px solid #ffb3ba; padding-left: 1rem;">
            <div class="gallery-card-word">Stress over Time</div>
          </div>
          <div class="gallery-card" onclick="openGraphModal('ctrl-energy')" style="border-left: 8px solid #baffc9; padding-left: 1rem;">
            <div class="gallery-card-word">Morning vs Evening Energy</div>
          </div>
          <div class="gallery-card" onclick="openGraphModal('ctrl-maint')" style="border-left: 8px solid #ffffba; padding-left: 1rem;">
            <div class="gallery-card-word">Language Maintenance</div>
            <div class="gallery-card-meaning">Time spent on other languages</div>
          </div>
                    <div class="gallery-card" onclick="openGraphModal('ctrl-sleep-corr')" style="border-left: 8px solid #b8c8d9; padding-left: 1rem;">
            <div class="gallery-card-word">Sleep Correlations</div>
            <div class="gallery-card-meaning">Mood vs Sleep Hours</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getSortedLogs() {
  return [...(DATA.dailyLogs || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
}

function openGraphModal(type) {
  const modal = document.getElementById('graph-modal');
  const title = document.getElementById('graph-modal-title');
  const canvas = document.getElementById('modal-chart-canvas');
  
  // 1. Destroy old chart
  if (window.modalChartInstance) {
    window.modalChartInstance.destroy();
  }

    // Hide the standard canvas, hide the brain map
  canvas.style.display = 'block';
  document.getElementById('brain-map-timeline-container').style.display = 'none';

  modal.classList.remove('hidden');

  if (type === 'migraine') {
    title.textContent = "The Migraine Timeline";
    drawMigraineChart(canvas);
  } else if (type === 'intruders') {
    title.textContent = "The Intruder Phenomenon";
    drawIntruderChart(canvas);
  } else if (type === 'efficacy') {
    title.textContent = "Method Efficacy (New Words per Hour)";
    drawEfficacyChart(canvas);
  } else if (type === 'media') {
    title.textContent = "K-Drama Immersion Progression";
    drawMediaChart(canvas);
  } else if (type === 'stress') {
    title.textContent = "Stress vs. Vocabulary";
    drawStressChart(canvas);
  } else if (type === 'maintenance') {
    title.textContent = "Language Maintenance vs. Korean Focus";
    drawMaintenanceChart(canvas);
  } else if (type === 'recall') {
    title.textContent = "Flashcard Volume vs. Recall Rate";
    drawRecallChart(canvas);
  } else if (type === 'stage-recall') {
    title.textContent = "Recall Rate by Plant Stage";
    drawStageRecallChart(canvas);
      } else if (type === 'forgetting-curve') {
    title.textContent = "The Forgetting Curve (Time to Mastery)";
    drawForgettingCurve(canvas);
  } else if (type === 'velocity') {
    title.textContent = "Word Velocity (Days per Stage)";
    drawVelocityChart(canvas);
    } else if (type === 'brainmap') {
    title.textContent = "Neurological Timeline";
    drawBrainTimeline(); 
    } else if (type === 'ctrl-mood') {
    title.textContent = "Mood over Time";
    drawSingleControlChart(canvas, 'mood', 'Mood (1-10)', 'rgb(255, 206, 86)');
  } else if (type === 'ctrl-sleep') {
    title.textContent = "Sleep over Time";
    drawSingleControlChart(canvas, 'sleepHours', 'Sleep (hours)', 'rgb(153, 102, 255)');
  } else if (type === 'ctrl-stress') {
    title.textContent = "Stress over Time";
    drawSingleControlChart(canvas, 'stress', 'Stress (1-10)', 'rgb(255, 99, 132)');
  } else if (type === 'ctrl-energy') {
    title.textContent = "Morning vs Evening Energy";
    drawEnergyChart(canvas);
  } else if (type === 'ctrl-maint') {
    title.textContent = "Language Maintenance vs. Korean Focus";
    drawMaintenanceChart(canvas);
  } else if (type === 'method-recall') {
    title.textContent = "Memory Palace vs Flashcards Recall";
    drawMethodRecallChart(canvas);
  }  else if (type === 'headache-study') {
    title.textContent = "Headache vs Study Time";
    drawHeadacheStudyChart(canvas);
  } else if (type === 'test-scores') {
    title.textContent = "Test Score Trends";
    drawTestScoreChart(canvas);
  } else if (type === 'vocab-growth') {
    title.textContent = "Vocabulary Growth";
    drawVocabGrowthChart(canvas);
  } else if (type === 'ctrl-sleep-corr') {
    title.textContent = "Sleep Correlations (Mood vs Sleep)";
    drawSleepCorrelationChart(canvas);
  }
}

function drawMigraineChart(canvas) {
  const logs = [...DATA.dailyLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Create arrays for the chart
  const labels = logs.map(l => l.date);
  const headaches = logs.map(l => l.physiological?.headacheAfterKorean || 0);
  const sleep = logs.map(l => l.physiological?.sleepHours || 0);
  const energy = logs.map(l => l.physiological?.eveningEnergy || 0);

  window.modalChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Headache (1-10)',
          data: headaches,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.3,
          yAxisID: 'y',
          fill: true
        },
        {
          label: 'Sleep (hrs)',
          data: sleep,
          borderColor: 'rgb(153, 102, 255)',
          borderDash: [5, 5], // Dashed line for sleep
          tension: 0.3,
          yAxisID: 'y1'
        },
        {
          label: 'Evening Energy (1-10)',
          data: energy,
          borderColor: 'rgb(255, 206, 86)',
          tension: 0.3,
          yAxisID: 'y'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: { 
          type: 'linear', display: true, position: 'left', 
          title: { display: true, text: 'Intensity / Energy' },
          min: 0, max: 10
        },
        y1: { 
          type: 'linear', display: true, position: 'right', 
          title: { display: true, text: 'Sleep (hours)' },
          grid: { drawOnChartArea: false },
          min: 0, max: 16
        }
      }
    }
  });
}
function drawHeadacheStudyChart(canvas) {
  const logs = [...DATA.dailyLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  window.modalChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: logs.map(l => l.date),
      datasets: [
        {
          label: 'Headache (1-10)',
          data: logs.map(l => l.physiological?.headacheAfterKorean || 0),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: 'Study Time (mins)',
          data: logs.map(l => (l.sessions || []).reduce((sum, s) => sum + (s.durationMinutes || 0), 0)),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.3,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Intensity' } },
        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Minutes' } }
      }
    }
  });
}
function drawTestScoreChart(canvas) {
  // Gather tests from DATA.languageTests
  const tests = DATA.languageTests || [];
  const sortedTests = [...tests].sort((a, b) => new Date(a.date) - new Date(b.date));

  window.modalChartInstance = new Chart(canvas, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Test Scores (%)',
          data: sortedTests.map(t => ({ x: t.date, y: t.percentage, name: t.name })),
          backgroundColor: 'rgb(75, 192, 192)',
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: {
          type: 'category',
          labels: sortedTests.map(t => t.date)
        },
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: 'Score (%)' }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw.name}: ${ctx.raw.y}%`
          }
        }
      }
    }
  });
}
function drawVocabGrowthChart(canvas) {
  const words = DATA.vocabulary || [];
  const wordCounts = {};
  
  words.forEach(w => {
    const date = w.dateAdded || 'Unknown';
    wordCounts[date] = (wordCounts[date] || 0) + 1;
  });

  const sortedDates = Object.keys(wordCounts).sort((a, b) => new Date(a) - new Date(b));
  let total = 0;
  const cumulativeData = sortedDates.map(date => {
    total += wordCounts[date];
    return total;
  });

  window.modalChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: sortedDates,
      datasets: [{
        label: 'Total Words',
        data: cumulativeData,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Total Words' } } }
    }
  });
}
function drawIntruderChart(canvas) {
  const logs = DATA.dailyLogs || [];
  
  // Count the intrusions by language
  const counts = {};
  logs.forEach(log => {
    const intruder = log.koreanOutput?.dominantIntruder;
    if (intruder) {
      counts[intruder] = (counts[intruder] || 0) + 1;
    }
  });

  const labels = Object.keys(counts);
  const data = Object.values(counts);

  window.modalChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' }
      }
    }
  });
}
function drawEfficacyChart(canvas) {
  const logs = DATA.dailyLogs || [];
  
  const methodStats = {};

  logs.forEach(log => {
    const newWords = log.koreanOutput?.newWords || 0;
    if (newWords === 0) return;

    // Find the primary Korean activity for that day
    const koreanSessions = (log.sessions || []).filter(s => s.language === 'Korean');
    if (koreanSessions.length === 0) return;

    // Sum up time and group by activity
    koreanSessions.forEach(s => {
      const act = s.activity || 'Other';
      const mins = s.durationMinutes || 1;
      
      if (!methodStats[act]) methodStats[act] = { words: 0, minutes: 0 };
      
      // We distribute the new words proportionally to the time spent on each activity
      const totalMins = koreanSessions.reduce((sum, x) => sum + (x.durationMinutes || 1), 0);
      const shareOfWords = (mins / totalMins) * newWords;
      
      methodStats[act].words += shareOfWords;
      methodStats[act].minutes += mins;
    });
  });

  // Calculate words per hour
  const labels = [];
  const rates = [];

  for (const [method, stats] of Object.entries(methodStats)) {
    if (stats.minutes > 30) { // Only show methods you used for more than 30 mins total
      labels.push(method);
      const hours = stats.minutes / 60;
      rates.push((stats.words / hours).toFixed(1));
    }
  }

  window.modalChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Avg New Words per Hour',
        data: rates,
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgb(153, 102, 255)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Words per Hour' } }
      }
    }
  });
}
function drawMediaChart(canvas) {
  const logs = [...DATA.dailyLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const labels = logs.map(l => l.date);
  let kkMins = [];
  let keMins = [];
  let knMins = [];

  logs.forEach(log => {
    let kk = 0, ke = 0, kn = 0;
    (log.mediaConsumed || []).forEach(m => {
      if (m.modeCode === 'K+K') kk += (m.durationMinutes || 0);
      else if (m.modeCode === 'K+E') ke += (m.durationMinutes || 0);
      else if (m.modeCode === 'K+N') kn += (m.durationMinutes || 0);
    });
    kkMins.push(kk);
    keMins.push(ke);
    knMins.push(kn);
  });

  window.modalChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Korean Audio + Korean Subs (Hardcore)',
          data: kkMins,
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          stack: 'Stack 0'
        },
        {
          label: 'Korean Audio + English Subs (Standard)',
          data: keMins,
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          stack: 'Stack 0'
        },
        {
          label: 'Korean Audio + No Subs (Immersion)',
          data: knMins,
          backgroundColor: 'rgba(255, 206, 86, 0.8)',
          stack: 'Stack 0'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true },
        y: { stacked: true, title: { display: true, text: 'Minutes Watched' } }
      }
    }
  });
}
function drawMethodRecallChart(canvas) {
  let flashcardRecall = [];
  let palaceRecall = [];

  // 1. Get Flashcard Recall from Daily Logs
  DATA.dailyLogs.forEach(log => {
    (log.sessions || []).forEach(s => {
      if (s.activity === 'Flashcard Study' && s.notes) {
        const match = s.notes.match(/(\d+) cards, (\d+) knew/);
        if (match) {
          const cards = parseInt(match[1]);
          const knew = parseInt(match[2]);
          flashcardRecall.push((knew / cards) * 100);
        }
      }
    });
  });

  // 2. Get Palace Recall from Daily Logs
  DATA.dailyLogs.forEach(log => {
    (log.sessions || []).forEach(s => {
      if (s.activity === 'Memory Palace' && s.notes) {
        // Notes look like: "Palace Test (random): Bathroom, 10 items, 100% accuracy"
        const match = s.notes.match(/(\d+)% accuracy/);
        if (match) {
          palaceRecall.push(parseInt(match[1]));
        }
      }
    });
  });

  // 3. Calculate Averages
  const avgFlashcard = flashcardRecall.length 
    ? (flashcardRecall.reduce((a, b) => a + b, 0) / flashcardRecall.length).toFixed(1) 
    : 0;
  const avgPalace = palaceRecall.length 
    ? (palaceRecall.reduce((a, b) => a + b, 0) / palaceRecall.length).toFixed(1) 
    : 0;

  window.modalChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Flashcards', 'Memory Palace'],
      datasets: [{
        label: 'Average Recall Rate (%)',
        data: [avgFlashcard, avgPalace],
        backgroundColor: [
          'rgba(153, 102, 255, 0.6)', // Flashcard Purple
          'rgba(75, 192, 192, 0.6)'   // Palace Teal
        ],
        borderColor: [
          'rgb(153, 102, 255)',
          'rgb(75, 192, 192)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: 'Recall Rate (%)' }
        }
      }
    }
  });
}

//Control Variables
function drawControlChart(canvas) {
  const logs = [...DATA.dailyLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  window.modalChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: logs.map(l => l.date),
      datasets: [
        {
          label: 'Mood (1-10)',
          data: logs.map(l => l.physiological?.mood || 0),
          borderColor: 'rgb(255, 206, 86)',
          tension: 0.3
        },
        {
          label: 'Evening Energy (1-10)',
          data: logs.map(l => l.physiological?.eveningEnergy || 0),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.3
        },
        {
          label: 'Stress (1-10)',
          data: logs.map(l => l.physiological?.stress || 0),
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { min: 0, max: 10 } }
    }
  });
}
function drawSingleControlChart(canvas, dataKey, label, color) {
  const logs = [...DATA.dailyLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  window.modalChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: logs.map(l => l.date),
      datasets: [{
        label: label,
        data: logs.map(l => l.physiological?.[dataKey] || 0),
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.2)'),
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { 
        y: { 
          min: 0, 
          max: dataKey === 'sleepHours' ? 16 : 10 
        } 
      }
    }
  });
}
function drawEnergyChart(canvas) {
  const logs = [...DATA.dailyLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  window.modalChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: logs.map(l => l.date),
      datasets: [
        {
          label: 'Morning Energy',
          data: logs.map(l => l.physiological?.morningEnergy || 0),
          borderColor: 'rgb(255, 206, 86)',
          tension: 0.3
        },
        {
          label: 'Evening Energy',
          data: logs.map(l => l.physiological?.eveningEnergy || 0),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { min: 0, max: 10 } }
    }
  });
}
function drawMaintenanceChart(canvas) {
  const logs = [...DATA.dailyLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const labels = logs.map(l => l.date);
  let koreanMins = [];
  let maintMins = [];

  logs.forEach(log => {
    let k = 0, m = 0;
    (log.sessions || []).forEach(s => {
      if (s.language === 'Korean') k += (s.durationMinutes || 0);
      else if (s.language) m += (s.durationMinutes || 0);
    });
    koreanMins.push(k);
    maintMins.push(m);
  });

  window.modalChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Korean Study (mins)',
          data: koreanMins,
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          stack: 'Stack 0'
        },
        {
          label: 'Maintenance (mins)',
          data: maintMins,
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          stack: 'Stack 0'
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { stacked: true },
        y: { stacked: true, title: { display: true, text: 'Minutes' } }
      }
    }
  });
}

function drawRecallChart(canvas) {
  const dataPoints = [];
  
  // Use StudySessions because they track individual word IDs and stages
  (DATA.studySessions || []).forEach(session => {
    if (!session.wordIds || session.wordIds.length === 0) return;
    
    const totalCards = session.wordIds.length;
    const recallPct = Math.round((session.knew / totalCards) * 100);
    
    // Group the session by the stages of the words reviewed
    const stagesInSession = new Set();
    session.wordIds.forEach(id => {
      const word = DATA.vocabulary.find(w => w.id === id);
      if (word && word.stage) stagesInSession.add(word.stage);
    });

    // If the session had multiple stages, label it "Mixed", otherwise the specific stage
    const stageLabel = stagesInSession.size === 1 ? Array.from(stagesInSession)[0] : 'mixed';

    dataPoints.push({ 
      x: totalCards, 
      y: recallPct, 
      stage: stageLabel 
    });
  });

  // We use a scatter plot, but we color-code the dots by their stage!
  const stageColors = {
    seed: '#8a6a4a',
    sprout: '#a07850',
    seedling: '#3d6b2a',
    sapling: '#5a8d3a',
    trunk: '#7aad52',
    flowering: '#f0a8c0',
    mixed: '#888888'
  };

  // Group data by stage for Chart.js
  const datasets = {};
  dataPoints.forEach(dp => {
    if (!datasets[dp.stage]) {
      datasets[dp.stage] = {
        label: `Stage: ${dp.stage.toUpperCase()}`,
        data: [],
        backgroundColor: stageColors[dp.stage] || '#888',
        pointRadius: 6
      };
    }
    datasets[dp.stage].data.push({ x: dp.x, y: dp.y });
  });

  window.modalChartInstance = new Chart(canvas, {
    type: 'scatter',
    data: {
      datasets: Object.values(datasets)
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Number of Cards in Session' } },
        y: { title: { display: true, text: 'Recall %' }, min: 0, max: 100 }
      },
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function drawStageRecallChart(canvas) {
  // We will calculate the average recall per stage based on the word's current stage.
  const stageStats = {};
  
  // We need to pull from studySessions which track the words reviewed
  (DATA.studySessions || []).forEach(session => {
    if (!session.wordIds) return;
    const totalCards = session.wordIds.length;
    if (totalCards === 0) return;
    
    const recallPct = Math.round((session.knew / totalCards) * 100);

    session.wordIds.forEach(id => {
      const word = DATA.vocabulary.find(w => w.id === id);
      if (word) {
        const stage = word.stage || 'seed';
        if (!stageStats[stage]) stageStats[stage] = { totalRecall: 0, count: 0 };
        stageStats[stage].totalRecall += recallPct;
        stageStats[stage].count += 1;
      }
    });
  });

  const labels = [];
  const averages = [];

  Object.keys(stageStats).forEach(stage => {
    labels.push(stage.toUpperCase());
    averages.push((stageStats[stage].totalRecall / stageStats[stage].count).toFixed(1));
  });

  window.modalChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Avg Recall %',
        data: averages,
        backgroundColor: [
          '#8a6a4a', // seed
          '#a07850', // sprout
          '#3d6b2a', // seedling
          '#5a8d3a', // sapling
          '#7aad52', // trunk
          '#f0a8c0'  // flowering
        ]
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { min: 0, max: 100, title: { display: true, text: 'Avg Recall %' } } }
    }
  });
}

function drawStressChart(canvas) {
  const logs = [...DATA.dailyLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Create data points: X = Stress, Y = New Words
  const dataPoints = [];
  logs.forEach(log => {
    const stress = log.physiological?.stress || 0;
    const newWords = log.koreanOutput?.newWords || 0;
    // Only add points where we actually logged data
    if (log.physiological && log.physiological.stress !== undefined) {
      dataPoints.push({ x: stress, y: newWords });
    }
  });

  window.modalChartInstance = new Chart(canvas, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Stress vs. New Words Learned',
        data: dataPoints,
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { 
          title: { display: true, text: 'Stress Level (1-10)' },
          min: 0, max: 10
        },
        y: { 
          title: { display: true, text: 'New Words Learned' },
          beginAtZero: true
        }
      }
    }
  });
}
function drawSleepCorrelationChart(canvas) {
  const logs = [...DATA.dailyLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  window.modalChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: logs.map(l => l.date),
      datasets: [
        {
          label: 'Mood (1-10)',
          data: logs.map(l => l.physiological?.mood || 0),
          borderColor: 'rgb(255, 206, 86)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: 'Sleep (hrs)',
          data: logs.map(l => l.physiological?.sleepHours || 0),
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.3,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Mood Level' } },
        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Hours' } }
      }
    }
  });
}

//brain map visualization
function drawBrainTimeline() {
  // 1. Hide standard canvas, show the timeline container
  document.getElementById('modal-chart-canvas').style.display = 'none';
  const timelineContainer = document.getElementById('brain-map-timeline-container');
  timelineContainer.style.display = 'flex';

  // 2. Draw the timeline chart
  const logs = [...DATA.dailyLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = logs.map(l => l.date);
  const headaches = logs.map(l => l.physiological?.headacheAfterKorean || 0);

  const timelineCanvas = document.getElementById('brain-timeline-chart');

  // Destroy old timeline if it exists
  if (window.brainTimelineChart) window.brainTimelineChart.destroy();

  window.brainTimelineChart = new Chart(timelineCanvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Headache Intensity',
        data: headaches,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (e, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const selectedLog = logs[index];
          updateBrainMapDisplay(selectedLog);
        }
      }
    }
  });

  // 3. Render the brain map for the most recent day by default
  if (logs.length > 0) {
    updateBrainMapDisplay(logs[logs.length - 1]);
  }
}

function updateBrainMapDisplay(log) {
  const displayContainer = document.getElementById('brain-map-day-display');
  const dateStr = log.date;
  
  // Extract data for that day
  const zone = log.physiological?.headacheLocation || '';
  const intensity = log.physiological?.headacheAfterKorean || 0;
  const mood = log.physiological?.mood || 0;
  const stress = log.physiological?.stress || 0;
  const energy = log.physiological?.eveningEnergy || 0;

  // Render the map using your existing function
  displayContainer.innerHTML = `
    <h3 style="margin-bottom: 1rem; font-family: var(--font-pixel);">${dateStr}</h3>
    <div id="timeline-brain-slot"></div>
    <div style="display: flex; justify-content: center; gap: 2rem; margin-top: 1rem; font-size: 0.9rem;">
      <div><strong>Mood:</strong> ${mood}/10</div>
      <div><strong>Stress:</strong> ${stress}/10</div>
      <div><strong>Energy:</strong> ${energy}/10</div>
    </div>
  `;

  setTimeout(() => {
    if (typeof renderBrainMap === 'function') {
      renderBrainMap('timeline-brain-slot', zone, intensity);
    }
  }, 50);
}

function drawForgettingCurve(canvas) {
  const matureWords = DATA.vocabulary.filter(w => w.stage === 'mature' && w.dateAdded);
  
  // We will take the 5 most recently mature words to show their journey.
  // Showing 50 lines would look like a mess.
  const recentOrchard = matureWords.sort((a, b) => new Date(b.lastWatered) - new Date(a.lastWatered)).slice(0, 5);

  const datasets = [];
  const stageMap = { seed: 1, sprout: 2, seedling: 3, sapling: 4, trunk: 5, flowering: 6, mature: 7 };

  // Colors for the different words
  const colors = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'];

  // Max days to show on X axis (e.g., 60 days)
  const maxDays = 60;
  
  recentOrchard.forEach((word, index) => {
    const addedDate = new Date(word.dateAdded);
    const waterHistory = []; // We would ideally pull from a 'waterHistory' array if we had one
    
    // Since we only have 'dateAdded' and 'lastWatered' (which is today for mature words), 
    // we draw a line from Day 0 (Seed) to Today (Mature).
    // If you track intermediate dates in the future, you would put them here.
    
    const daysSinceAdded = Math.ceil((new Date() - addedDate) / (1000 * 60 * 60 * 24));
    
    // Create data points: X = Days since added, Y = Stage
    // We'll make an assumed curve: it starts at 0 days (Stage 1) and ends at daysSinceAdded (Stage 7)
    // In reality, it probably spent more time in the middle stages, so we curve the middle.
    const dataPoints = [
      { x: 0, y: 1 }, // Day 0: Seed
      { x: daysSinceAdded * 0.2, y: 2 }, // 20% of time: Sprout
      { x: daysSinceAdded * 0.4, y: 3 }, // 40%: Seedling
      { x: daysSinceAdded * 0.6, y: 4 }, // 60%: Sapling
      { x: daysSinceAdded * 0.8, y: 5 }, // 80%: Trunk
      { x: daysSinceAdded * 0.9, y: 6 }, // 90%: Flowering
      { x: daysSinceAdded, y: 7 }        // 100%: Mature
    ];

    // Clip the line so it doesn't go past the maxDays axis
    const clippedPoints = dataPoints.filter(p => p.x <= maxDays);
    if (clippedPoints.length > 0) {
       // Add the final point if it's just off the edge
       if (dataPoints[dataPoints.length - 1].x > maxDays) {
           clippedPoints.push({ x: maxDays, y: 7 });
       }

       datasets.push({
        label: word.word,
        data: clippedPoints,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length],
        tension: 0.4, // This makes it a smooth curve
        fill: false,
        pointRadius: 4
      });
    }
  });

  window.modalChartInstance = new Chart(canvas, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { 
          type: 'linear',
          title: { display: true, text: 'Days Since Added' },
          min: 0,
          max: maxDays
        },
        y: {
          type: 'linear',
          title: { display: true, text: 'Stage' },
          min: 0,
          max: 8,
          ticks: {
            stepSize: 1,
            callback: function(value) {
              const stages = ['', 'Seed', 'Sprout', 'Seedling', 'Sapling', 'Trunk', 'Flowering', 'Mature'];
              return stages[value] || '';
            }
          }
        }
      },
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}
function drawVelocityChart(canvas) {
  // We need to look at studySessions to find when a word moved from one stage to the next
  const stageTransitions = {
    'seed to sprout': [],
    'sprout to seedling': [],
    'seedling to sapling': [],
    'sapling to trunk': [],
    'trunk to flowering': [],
    'flowering to mature': []
  };

  (DATA.studySessions || []).forEach(session => {
    if (!session.wordChanges) return;
    
    session.wordChanges.forEach(change => {
      if (change.oldStage !== change.newStage) {
        // The word grew in this session!
        const word = DATA.vocabulary.find(w => w.id === change.wordId);
        if (word && word.dateAdded) {
          const addedDate = new Date(word.dateAdded);
          const sessionDate = new Date(session.date);
          const daysElapsed = Math.ceil((sessionDate - addedDate) / (1000 * 60 * 60 * 24));
          
          const key = `${change.oldStage} to ${change.newStage}`;
          if (stageTransitions[key]) {
            stageTransitions[key].push(daysElapsed);
          }
        }
      }
    });
  });

  const labels = [];
  const averages = [];

  for (const [transition, daysArray] of Object.entries(stageTransitions)) {
    if (daysArray.length > 0) {
      labels.push(transition);
      const avg = daysArray.reduce((a, b) => a + b, 0) / daysArray.length;
      averages.push(avg.toFixed(1));
    }
  }

  window.modalChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Avg Days to Reach Next Stage',
        data: averages,
        backgroundColor: [
          'rgba(138, 106, 74, 0.7)',  // seed
          'rgba(160, 120, 80, 0.7)',  // sprout
          'rgba(61, 107, 42, 0.7)',   // seedling
          'rgba(90, 141, 58, 0.7)',   // sapling
          'rgba(122, 173, 82, 0.7)',  // trunk
          'rgba(240, 168, 192, 0.7)'  // flowering
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Days' } }
      }
    }
  });
}
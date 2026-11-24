let activeCharts = {};

function renderGraphsPage() {
  const container = document.getElementById('graphs-page');
  if (!container) return;

  Object.values(activeCharts).forEach(chart => chart.destroy());
  activeCharts = {};

  container.innerHTML = `
    <div class="book-spread">
      <div class="book-page">
        <h2>Headache vs Study Time</h2>
        <div style="position: relative; height: 300px; width: 100%; margin-bottom: 1.5rem;">
          <canvas id="chart-headache"></canvas>
        </div>
        
        <h2>Sleep Correlations</h2>
        <div style="position: relative; height: 300px; width: 100%; margin-bottom: 1.5rem;">
          <canvas id="chart-sleep"></canvas>
        </div>
      </div>
      
      <div class="book-page">
        <h2>Test Score Trends</h2>
        <div style="position: relative; height: 300px; width: 100%; margin-bottom: 1.5rem;">
          <canvas id="chart-tests"></canvas>
        </div>

        <h2>Vocabulary Growth</h2>
        <div style="position: relative; height: 300px; width: 100%; margin-bottom: 1.5rem;">
          <canvas id="chart-vocab"></canvas>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    buildHeadacheChart();
    buildSleepChart();
    buildTestChart();
    buildVocabChart();
  }, 100);
}

function getSortedLogs() {
  return [...(DATA.dailyLogs || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
}

function buildHeadacheChart() {
  const logs = getSortedLogs();
  activeCharts.headache = new Chart(document.getElementById('chart-headache'), {
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
        y: { type: 'linear', display: true, position: 'left' },
        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } }
      }
    }
  });
}

function buildSleepChart() {
  const logs = getSortedLogs();
  activeCharts.sleep = new Chart(document.getElementById('chart-sleep'), {
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
      scales: {
        y: { type: 'linear', display: true, position: 'left' },
        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } }
      }
    }
  });
}

function buildTestChart() {
  // Gather all tests from all languages
  const tests = DATA.languageTests || [];
  
  // Sort them chronologically
  const sortedTests = [...tests].sort((a, b) => new Date(a.date) - new Date(b.date));

  activeCharts.tests = new Chart(document.getElementById('chart-tests'), {
    type: 'scatter', // Scatter is best for test scores over time
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

function buildVocabChart() {
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

  activeCharts.vocab = new Chart(document.getElementById('chart-vocab'), {
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
      scales: { y: { beginAtZero: true } }
    }
  });
}
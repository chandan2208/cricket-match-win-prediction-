/**
 * CricPredic — Analytics Charts (Clean Rebuild)
 * 
 * Initializes EMPTY charts. No fake India/Australia data.
 * Charts are populated only when real data arrives via updateAnalyticsCharts().
 */
(function () {
  var lineChart = null;
  var barChart = null;
  var radarChart = null;

  // ── Color helpers ──────────────────────────────────────────────
  function rgba(hex, alpha) {
    if (hex.indexOf("#") === 0) {
      var h = hex.replace("#", "");
      if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
      var n = parseInt(h, 16);
      return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + alpha + ")";
    }
    return hex;
  }

  var palette = {
    primary: "#00e5ff",
    secondary: "#ddb7ff",
    textDim: "#bac9cc",
    grid: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.12)"
  };

  // ── Shared options ─────────────────────────────────────────────
  function baseOpts() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400, easing: "easeOutQuart" },
      plugins: {
        legend: { labels: { color: palette.textDim, usePointStyle: true, boxWidth: 10 } },
        tooltip: {
          backgroundColor: "rgba(17,19,27,0.95)",
          titleColor: "#e2e1ee",
          bodyColor: "#bac9cc",
          borderColor: palette.border,
          borderWidth: 1
        }
      }
    };
  }

  // ── Render empty charts ────────────────────────────────────────
  function renderLineChart() {
    var canvas = document.getElementById("winProbabilityChart");
    if (!canvas) return;
    lineChart = new Chart(canvas.getContext("2d"), {
      type: "line",
      data: {
        labels: [],
        datasets: [
          { label: "Team A", data: [], borderColor: palette.primary, backgroundColor: rgba(palette.primary, 0.15), fill: true, tension: 0.3, pointRadius: 2 },
          { label: "Team B", data: [], borderColor: palette.secondary, backgroundColor: rgba(palette.secondary, 0.1), fill: false, tension: 0.3, pointRadius: 2 }
        ]
      },
      options: Object.assign(baseOpts(), {
        scales: {
          x: { ticks: { color: palette.textDim }, grid: { color: palette.grid } },
          y: { min: 0, max: 100, ticks: { color: palette.textDim, callback: function (v) { return v + "%"; } }, grid: { color: palette.grid } }
        }
      })
    });
  }

  function renderBarChart() {
    var canvas = document.getElementById("playerImpactChart");
    if (!canvas) return;
    barChart = new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: [],
        datasets: [{ label: "Impact Score", data: [], backgroundColor: rgba(palette.primary, 0.7), borderColor: palette.primary, borderWidth: 1, borderRadius: 6, maxBarThickness: 34 }]
      },
      options: Object.assign(baseOpts(), {
        plugins: Object.assign({}, baseOpts().plugins, { legend: { display: false } }),
        scales: {
          x: { ticks: { color: palette.textDim, maxRotation: 0 }, grid: { color: palette.grid } },
          y: { beginAtZero: true, suggestedMax: 10, ticks: { color: palette.textDim }, grid: { color: palette.grid } }
        }
      })
    });
  }

  function renderRadarChart() {
    var canvas = document.getElementById("matchupRadarChart");
    if (!canvas) return;
    radarChart = new Chart(canvas.getContext("2d"), {
      type: "radar",
      data: {
        labels: ["Batting", "Bowling", "Death Overs", "Powerplay", "Fielding"],
        datasets: [
          { label: "Team A", data: [], borderColor: palette.primary, backgroundColor: rgba(palette.primary, 0.15), pointBackgroundColor: palette.primary, pointRadius: 3 },
          { label: "Team B", data: [], borderColor: palette.secondary, backgroundColor: rgba(palette.secondary, 0.1), pointBackgroundColor: palette.secondary, pointRadius: 3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: { labels: { color: palette.textDim, usePointStyle: true } },
          tooltip: baseOpts().plugins.tooltip
        },
        scales: {
          r: {
            angleLines: { color: palette.grid },
            grid: { color: palette.grid },
            pointLabels: { color: palette.textDim, font: { size: 11 } },
            ticks: { color: palette.textDim, backdropColor: "transparent" },
            suggestedMin: 0, suggestedMax: 100
          }
        }
      }
    });
  }

  // ── Public API: update charts with real data ───────────────────
  function updateAnalyticsCharts(data) {
    if (!data) return;

    if (lineChart && data.winProbability) {
      lineChart.data.labels = data.winProbability.labels || [];
      lineChart.data.datasets[0].data = data.winProbability.teamA || [];
      lineChart.data.datasets[0].label = data.winProbability.teamAName || "Team A";
      lineChart.data.datasets[1].data = data.winProbability.teamB || [];
      lineChart.data.datasets[1].label = data.winProbability.teamBName || "Team B";
      lineChart.update();
      var emptyLine = document.getElementById("chart-line-empty");
      if (emptyLine) emptyLine.style.display = "none";
    }

    if (barChart && data.playerImpact) {
      barChart.data.labels = data.playerImpact.labels || [];
      barChart.data.datasets[0].data = data.playerImpact.scores || [];
      barChart.update();
      var emptyBar = document.getElementById("chart-bar-empty");
      if (emptyBar) emptyBar.style.display = "none";
    }

    if (radarChart && data.matchup) {
      radarChart.data.datasets[0].data = data.matchup.teamA || [];
      radarChart.data.datasets[0].label = data.matchup.teamAName || "Team A";
      radarChart.data.datasets[1].data = data.matchup.teamB || [];
      radarChart.data.datasets[1].label = data.matchup.teamBName || "Team B";
      radarChart.update();
      var emptyRadar = document.getElementById("chart-radar-empty");
      if (emptyRadar) emptyRadar.style.display = "none";
    }
  }

  // ── Init ───────────────────────────────────────────────────────
  function init() {
    if (typeof Chart === "undefined") return;
    renderLineChart();
    renderBarChart();
    renderRadarChart();
    window.updateAnalyticsCharts = updateAnalyticsCharts;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

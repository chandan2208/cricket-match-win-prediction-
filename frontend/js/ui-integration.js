/**
 * CricPredic — UI Integration (Clean Rebuild)
 * 
 * Connects the frontend to the real backend API.
 * Zero fake data. If data is unavailable, shows clean empty states.
 */

import {
  predictMatch,
  getAnalytics,
  getPredictionHistory,
  getTeams,
} from "./api.js";

// ── Page Detection ─────────────────────────────────────────────────────────
const pagePath = window.location.pathname.replace(/\\/g, "/");
const pageFile = pagePath.split("/").pop() || "index.html";
const pageKey = pageFile.replace(".html", "") || "index";

// ── State ──────────────────────────────────────────────────────────────────
let selectedPitch = null;
let selectedWeather = null;
let selectedTossDecision = null;

// ── Helpers ────────────────────────────────────────────────────────────────
const log = (msg, data) => console.log(`[ui:${pageKey}] ${msg}`, data || "");

const toArray = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const setText = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

const animateCountUp = (el, final, suffix = "%", duration = 800) => {
  if (!el) return;
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = `${(final * eased).toFixed(1)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const setButtonLoading = (btn, loading) => {
  if (!btn) return;
  if (!btn.dataset.origText) btn.dataset.origText = btn.textContent;
  if (loading) {
    btn.disabled = true;
    btn.textContent = "Processing...";
    btn.classList.add("opacity-70");
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.origText;
    btn.classList.remove("opacity-70");
  }
};

// ── Dashboard ──────────────────────────────────────────────────────────────

const renderDashboardHero = (prediction) => {
  const container = document.getElementById("dashboard-hero-container");
  if (!container) return;

  if (!prediction) {
    container.innerHTML = `
      <div class="flex flex-col items-center gap-4 text-center">
        <span class="material-symbols-outlined text-[64px] text-on-surface-variant/20">sports_cricket</span>
        <h3 class="font-headline-md text-on-surface">No predictions yet</h3>
        <p class="font-body-md text-on-surface-variant max-w-sm">Run a match simulation to see your first AI prediction here.</p>
        <a href="predictions.html" class="mt-2 px-6 py-2 bg-primary-container text-on-primary-container rounded-lg font-label-sm uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer">Start Prediction</a>
      </div>`;
    return;
  }

  const teamAName = prediction.input?.teamA?.name || "Team A";
  const teamBName = prediction.input?.teamB?.name || "Team B";
  const teamAWin = Math.round((prediction.result?.teamAWinProbability || 0) * 100);
  const teamBWin = Math.round((prediction.result?.teamBWinProbability || 0) * 100);
  const winner = prediction.result?.predictedWinner?.name || "Unknown";
  const date = prediction.createdAt ? new Date(prediction.createdAt).toLocaleDateString() : "—";

  container.innerHTML = `
    <div class="w-full flex flex-col gap-6">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2 bg-primary-container/10 border border-primary-container/30 text-primary-container px-3 py-1 rounded-lg">
          <span class="material-symbols-outlined text-sm">history</span>
          <span class="font-label-sm uppercase tracking-wider">Latest Prediction</span>
        </div>
        <div class="font-data-mono text-on-surface-variant">${date}</div>
      </div>
      <div class="flex justify-between items-center">
        <div class="flex flex-col items-center gap-2 w-1/3">
          <div class="w-14 h-14 rounded-full bg-surface-container-high border-2 border-primary-container flex items-center justify-center text-lg font-bold text-on-surface">${teamAName.substring(0, 3).toUpperCase()}</div>
          <div class="font-body-md text-on-surface text-center">${teamAName}</div>
        </div>
        <div class="font-headline-md text-on-surface-variant italic">VS</div>
        <div class="flex flex-col items-center gap-2 w-1/3">
          <div class="w-14 h-14 rounded-full bg-surface-container-high border-2 border-secondary-container flex items-center justify-center text-lg font-bold text-on-surface">${teamBName.substring(0, 3).toUpperCase()}</div>
          <div class="font-body-md text-on-surface text-center">${teamBName}</div>
        </div>
      </div>
      <div class="space-y-3">
        <div class="flex justify-between font-label-sm">
          <span class="text-primary-container">${teamAName}: ${teamAWin}%</span>
          <span class="text-secondary">${teamBName}: ${teamBWin}%</span>
        </div>
        <div class="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden flex">
          <div class="h-full bg-primary-container" style="width:${teamAWin}%"></div>
          <div class="h-full bg-secondary-container" style="width:${teamBWin}%"></div>
        </div>
        <div class="text-center font-body-md text-primary-container">
          Projected Winner: <span class="font-bold">${winner}</span>
        </div>
      </div>
    </div>`;
};

const renderDashboardStats = (analytics) => {
  const data = analytics?.data || analytics || {};
  const preds = data.predictions || {};
  setText("stat-total-predictions", preds.total != null ? String(preds.total) : "—");
  setText("stat-accuracy", preds.overallAccuracy != null ? `${Math.round(preds.overallAccuracy)}%` : "—");
  setText("stat-resolved", preds.resolved != null ? String(preds.resolved) : "—");
};

// ── Predictions Page ───────────────────────────────────────────────────────

const initPredictionForm = async () => {
  const teamASelect = document.getElementById("teamASelect");
  const teamBSelect = document.getElementById("teamBSelect");
  const tossWinnerSelect = document.getElementById("tossWinnerSelect");
  const predictBtn = document.getElementById("predictBtn");
  if (!teamASelect || !teamBSelect || !tossWinnerSelect) return;

  try {
    const teamsData = await getTeams({ limit: 100 });
    const teams = toArray(teamsData);
    if (teams.length === 0) {
      teamASelect.innerHTML = '<option value="">No teams available</option>';
      teamBSelect.innerHTML = '<option value="">No teams available</option>';
      return;
    }

    let html = '<option value="">Select Team</option>';
    teams.forEach(t => {
      html += `<option value="${t._id || t.id}">${t.name || t.shortName}</option>`;
    });
    teamASelect.innerHTML = html;
    teamBSelect.innerHTML = html;

    const checkValid = () => {
      const valid = teamASelect.value && teamBSelect.value && tossWinnerSelect.value
                    && selectedPitch && selectedWeather && selectedTossDecision;
      if (predictBtn) {
        predictBtn.disabled = !valid;
        predictBtn.classList.toggle("opacity-50", !valid);
        predictBtn.classList.toggle("cursor-not-allowed", !valid);
      }
    };

    const updateTossOptions = () => {
      let tossHtml = '<option value="">Select Toss Winner</option>';
      if (teamASelect.value) {
        tossHtml += `<option value="${teamASelect.value}">${teamASelect.options[teamASelect.selectedIndex].text}</option>`;
      }
      if (teamBSelect.value) {
        tossHtml += `<option value="${teamBSelect.value}">${teamBSelect.options[teamBSelect.selectedIndex].text}</option>`;
      }
      tossWinnerSelect.innerHTML = tossHtml;
      checkValid();
    };

    const enforceDifferent = (src, tgt) => {
      Array.from(tgt.options).forEach(opt => {
        if (opt.value) opt.disabled = (opt.value === src.value);
      });
    };

    teamASelect.addEventListener("change", () => { enforceDifferent(teamASelect, teamBSelect); updateTossOptions(); });
    teamBSelect.addEventListener("change", () => { enforceDifferent(teamBSelect, teamASelect); updateTossOptions(); });
    tossWinnerSelect.addEventListener("change", checkValid);

    // Option buttons (pitch, weather, toss decision)
    document.querySelectorAll(".option-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const group = btn.dataset.group;
        const val = btn.dataset.value;
        document.querySelectorAll(`.option-btn[data-group="${group}"]`).forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        if (group === "pitch_condition") selectedPitch = val;
        if (group === "weather") selectedWeather = val;
        if (group === "toss_decision") selectedTossDecision = val;
        checkValid();
      });
    });

    checkValid();
  } catch (err) {
    log("failed to load teams", err.message);
    teamASelect.innerHTML = '<option value="">Failed to load teams</option>';
    teamBSelect.innerHTML = '<option value="">Failed to load teams</option>';
  }
};

const attachPredictionFlow = () => {
  const btn = document.getElementById("predictBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const teamA = document.getElementById("teamASelect")?.value;
    const teamB = document.getElementById("teamBSelect")?.value;
    const tossWinner = document.getElementById("tossWinnerSelect")?.value;

    if (!teamA || !teamB || !tossWinner || !selectedPitch || !selectedWeather || !selectedTossDecision) return;

    try {
      setButtonLoading(btn, true);

      const response = await predictMatch({
        teamA, teamB,
        pitch_condition: selectedPitch,
        weather: selectedWeather,
        toss_winner: tossWinner,
        toss_decision: selectedTossDecision,
        match_type: "T20"
      });

      const prediction = response?.data;
      if (!prediction) throw new Error("No prediction data returned");

      // Show result, hide placeholder
      const placeholder = document.getElementById("predictionPlaceholder");
      const result = document.getElementById("predictionResult");
      if (placeholder) placeholder.classList.add("hidden");
      if (result) {
        result.classList.remove("hidden");

        // POST response shape: { teamA: { name, winProbability (%) }, teamB: {...}, predictedWinner (string), confidence, keyFactors }
        const teamAProb = Math.round(prediction.teamA?.winProbability || 0);
        const teamBProb = Math.round(prediction.teamB?.winProbability || 0);
        const winProb = Math.max(teamAProb, teamBProb);
        const winner = prediction.predictedWinner || "Unknown";
        const teamAName = prediction.teamA?.name || "Team A";
        const teamBName = prediction.teamB?.name || "Team B";
        const confidence = prediction.confidence || "medium";

        const winProbText = document.getElementById("winProbText");
        animateCountUp(winProbText, winProb);

        setText("advantageTeamName", `Advantage: ${winner}`);
        setText("analysisNarrative",
          `The AI model predicts a ${winProb}% probability of victory for ${winner}. ` +
          `${teamAName} at ${teamAProb}%, ${teamBName} at ${teamBProb}%. ` +
          `Confidence: ${confidence}. Surface: ${selectedPitch}, Weather: ${selectedWeather}.`
        );

        const keyFactors = prediction.keyFactors || [];
        const factorsList = document.getElementById("keyFactorsList");
        if (factorsList) {
          if (keyFactors.length > 0) {
            factorsList.innerHTML = keyFactors.map(f => `
              <div class="flex justify-between items-center bg-white/5 p-3 rounded">
                <span class="text-on-surface-variant font-body-md">${f.factor}</span>
                <span class="text-primary-container font-data-mono">${Math.round((f.weight || 0) * 100)}%</span>
              </div>`).join("");
          } else {
            factorsList.innerHTML = '<p class="text-on-surface-variant font-body-md italic">No key factors returned by model.</p>';
          }
        }

        result.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (err) {
      log("prediction failed", err.message);
      alert(`Prediction failed: ${err.message}`);
    } finally {
      setButtonLoading(btn, false);
    }
  });
};

// ── History Page ────────────────────────────────────────────────────────────

const renderHistoryRows = (predictions) => {
  const container = document.getElementById("history-rows-container");
  if (!container) return;

  if (!predictions || predictions.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-12 text-center">
        <span class="material-symbols-outlined text-[48px] text-on-surface-variant/20 mb-3">history_toggle_off</span>
        <p class="font-body-lg text-on-surface-variant">No prediction history found.</p>
        <p class="font-body-md text-on-surface-variant/60 mt-1">Make predictions to see them here.</p>
      </div>`;
    return;
  }

  container.innerHTML = predictions.map(pred => {
    const teamA = pred.input?.teamA?.name || "Team A";
    const teamB = pred.input?.teamB?.name || "Team B";
    const winner = pred.result?.predictedWinner?.name || "—";
    const actual = pred.accuracy?.actualWinner?.name ? `${pred.accuracy.actualWinner.name} Won` : "Pending";
    const isCorrect = pred.accuracy?.wasCorrect;
    const prob = Math.round(Math.max(pred.result?.teamAWinProbability || 0, pred.result?.teamBWinProbability || 0) * 100);
    const date = pred.createdAt ? new Date(pred.createdAt).toLocaleDateString() : "—";
    const time = pred.createdAt ? new Date(pred.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

    let statusCls = "bg-surface-container text-on-surface-variant";
    let statusText = "Pending";
    if (isCorrect === true) { statusCls = "bg-primary/10 text-primary"; statusText = "Correct"; }
    if (isCorrect === false) { statusCls = "bg-error-container/20 text-error"; statusText = "Wrong"; }

    return `
      <div class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-surface-container-high/30 transition-colors items-center">
        <div class="col-span-2 text-sm text-on-surface-variant">
          <div class="text-on-surface">${date}</div>
          <div class="text-xs opacity-60">${time}</div>
        </div>
        <div class="col-span-3 flex flex-col gap-0.5">
          <div class="text-on-surface text-sm truncate">${teamA}</div>
          <div class="text-on-surface-variant text-sm truncate">${teamB}</div>
        </div>
        <div class="col-span-2">
          <span class="inline-flex px-2 py-1 rounded bg-surface-container border border-outline-variant/30 text-on-surface text-xs">${winner}</span>
        </div>
        <div class="col-span-2 text-sm text-on-surface">${actual}</div>
        <div class="col-span-3 flex flex-col items-end gap-1">
          <div class="flex items-center gap-2">
            <span class="font-data-mono text-sm text-on-surface">${prob}%</span>
            <div class="w-20 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div class="h-full bg-primary-container rounded-full" style="width:${prob}%"></div>
            </div>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusCls}">${statusText}</span>
        </div>
      </div>`;
  }).join("");
};

const renderHistoryStats = (analytics) => {
  const data = analytics?.data || analytics || {};
  const preds = data.predictions || {};
  setText("history-stat-total", preds.total != null ? String(preds.total) : "—");
  setText("history-stat-accuracy", preds.overallAccuracy != null ? `${Math.round(preds.overallAccuracy)}%` : "—");
  setText("history-stat-resolved", preds.resolved != null ? String(preds.resolved) : "—");
};

// ── Analytics Page ─────────────────────────────────────────────────────────

const renderAnalyticsPage = (analytics) => {
  const data = analytics?.data || analytics || {};

  // Hide empty states if we have chart data
  if (data.charts) {
    const hideEmpty = (id) => { const el = document.getElementById(id); if (el) el.style.display = "none"; };

    if (data.charts.winProbability) hideEmpty("chart-line-empty");
    if (data.charts.playerImpact) hideEmpty("chart-bar-empty");
    if (data.charts.matchup) hideEmpty("chart-radar-empty");

    if (window.updateAnalyticsCharts) {
      window.updateAnalyticsCharts(data.charts);
    }
  }
};

// ── Bootstrap ──────────────────────────────────────────────────────────────

const bootstrap = async () => {
  log("bootstrap", { pageKey });

  try {
    if (pageKey === "index") {
      // Dashboard: latest prediction + stats
      const [historyRes, analyticsRes] = await Promise.allSettled([
        getPredictionHistory({ limit: 1 }),
        getAnalytics("system")
      ]);

      const history = historyRes.status === "fulfilled" ? toArray(historyRes.value) : [];
      renderDashboardHero(history.length > 0 ? history[0] : null);

      if (analyticsRes.status === "fulfilled") renderDashboardStats(analyticsRes.value);
    }

    if (pageKey === "predictions") {
      await initPredictionForm();
      attachPredictionFlow();
    }

    if (pageKey === "history") {
      const [historyRes, analyticsRes] = await Promise.allSettled([
        getPredictionHistory({ limit: 30 }),
        getAnalytics("system")
      ]);

      const history = historyRes.status === "fulfilled" ? toArray(historyRes.value) : [];
      renderHistoryRows(history);

      if (analyticsRes.status === "fulfilled") renderHistoryStats(analyticsRes.value);
    }

    if (pageKey === "analytics") {
      try {
        const analytics = await getAnalytics("system");
        renderAnalyticsPage(analytics);
      } catch (e) {
        log("analytics load failed — showing empty states", e.message);
      }
    }
  } catch (error) {
    log("bootstrap error", error.message);
  }
};

bootstrap();

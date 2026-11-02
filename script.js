(function () {
  "use strict";

  const STORAGE_KEYS = {
    sessions: "studyTimer.sessions",
    goal: "studyTimer.dailyGoal",
  };

  const RING_RADIUS = 108;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  const modeButtons = document.querySelectorAll(".mode-btn");
  const timeText = document.getElementById("timeText");
  const progressRing = document.getElementById("progressRing");
  const subjectInput = document.getElementById("subjectInput");
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resetBtn = document.getElementById("resetBtn");
  const customMinutesInput = document.getElementById("customMinutes");
  const applyCustomBtn = document.getElementById("applyCustom");
  const chimeSound = document.getElementById("chimeSound");

  const todayDateEl = document.getElementById("todayDate");
  const todayMinutesEl = document.getElementById("todayMinutes");
  const todaySessionsEl = document.getElementById("todaySessions");
  const streakCountEl = document.getElementById("streakCount");
  const dailyGoalInput = document.getElementById("dailyGoal");
  const goalFillEl = document.getElementById("goalFill");
  const goalTextEl = document.getElementById("goalText");
  const weekChartEl = document.getElementById("weekChart");
  const sessionLogEl = document.getElementById("sessionLog");
  const clearHistoryBtn = document.getElementById("clearHistory");

  progressRing.style.strokeDasharray = String(RING_CIRCUMFERENCE);

  let currentMode = "focus";
  let totalSeconds = 25 * 60;
  let remainingSeconds = totalSeconds;
  let timerInterval = null;
  let isRunning = false;

  function todayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function loadSessions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.sessions);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveSessions(sessions) {
    try {
      localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
    } catch (e) {
      /* storage unavailable, ignore */
    }
  }

  function loadGoal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.goal);
      return raw ? Number(raw) : 60;
    } catch (e) {
      return 60;
    }
  }

  function saveGoal(minutes) {
    try {
      localStorage.setItem(STORAGE_KEYS.goal, String(minutes));
    } catch (e) {
      /* ignore */
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function updateRing() {
    const fraction = totalSeconds === 0 ? 0 : remainingSeconds / totalSeconds;
    const offset = RING_CIRCUMFERENCE * (1 - fraction);
    progressRing.style.strokeDashoffset = String(offset);
  }

  function render() {
    timeText.textContent = formatTime(remainingSeconds);
    updateRing();
  }

  function setMode(mode, minutes) {
    currentMode = mode;
    modeButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });
    stopTimer(false);
    totalSeconds = minutes * 60;
    remainingSeconds = totalSeconds;
    render();
  }

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setMode(btn.dataset.mode, Number(btn.dataset.minutes));
    });
  });

  applyCustomBtn.addEventListener("click", () => {
    const minutes = Math.max(1, Math.min(180, Number(customMinutesInput.value) || 25));
    customMinutesInput.value = minutes;
    modeButtons.forEach((btn) => {
      if (btn.dataset.mode === "focus") {
        btn.dataset.minutes = String(minutes);
        btn.textContent = `Focus (${minutes}m)`;
      }
    });
    setMode("focus", minutes);
  });

  function tick() {
    remainingSeconds -= 1;
    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      render();
      finishTimer();
      return;
    }
    render();
  }

  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    subjectInput.disabled = currentMode !== "focus" ? subjectInput.disabled : false;
    timerInterval = setInterval(tick, 1000);
  }

  function pauseTimer() {
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    clearInterval(timerInterval);
  }

  function stopTimer(resetDisplay = true) {
    isRunning = false;
    clearInterval(timerInterval);
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    if (resetDisplay) {
      remainingSeconds = totalSeconds;
      render();
    }
  }

  function finishTimer() {
    stopTimer(false);
    playChime();
    if (currentMode === "focus") {
      const minutesStudied = Math.round(totalSeconds / 60);
      logSession(minutesStudied, subjectInput.value.trim());
      subjectInput.value = "";
      refreshProgress();
    }
    remainingSeconds = totalSeconds;
    render();
  }

  function playChime() {
    try {
      chimeSound.currentTime = 0;
      chimeSound.play().catch(() => {});
    } catch (e) {
      /* ignore playback errors */
    }
  }

  startBtn.addEventListener("click", startTimer);
  pauseBtn.addEventListener("click", pauseTimer);
  resetBtn.addEventListener("click", () => stopTimer(true));

  function logSession(minutes, subject) {
    if (minutes <= 0) return;
    const sessions = loadSessions();
    sessions.push({
      date: todayKey(),
      subject: subject || "Focus session",
      minutes,
      timestamp: Date.now(),
    });
    saveSessions(sessions);
  }

  function computeStreak(sessions) {
    const studiedDates = new Set(sessions.map((s) => s.date));
    let streak = 0;
    const cursor = new Date();
    if (!studiedDates.has(todayKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (studiedDates.has(todayKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function renderWeekChart(sessions) {
    weekChartEl.innerHTML = "";
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    const totalsByDay = days.map((d) => {
      const key = todayKey(d);
      const total = sessions
        .filter((s) => s.date === key)
        .reduce((sum, s) => sum + s.minutes, 0);
      return { date: d, key, total };
    });
    const maxVal = Math.max(60, ...totalsByDay.map((d) => d.total));
    const todayStr = todayKey();

    totalsByDay.forEach(({ date, key, total }) => {
      const col = document.createElement("div");
      col.className = "day-col";

      const bar = document.createElement("div");
      bar.className = "day-bar" + (key === todayStr ? " today" : "");
      const heightPct = total > 0 ? Math.max(4, (total / maxVal) * 100) : 2;
      bar.style.height = `${heightPct}%`;
      bar.title = `${total} min`;

      const label = document.createElement("span");
      label.className = "day-label";
      label.textContent = date.toLocaleDateString(undefined, { weekday: "short" });

      col.appendChild(bar);
      col.appendChild(label);
      weekChartEl.appendChild(col);
    });
  }

  function renderSessionLog(sessions) {
    const recent = [...sessions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 25);
    sessionLogEl.innerHTML = "";
    if (recent.length === 0) {
      const li = document.createElement("li");
      li.className = "empty-log";
      li.textContent = "No sessions recorded yet. Finish a focus timer to log one.";
      sessionLogEl.appendChild(li);
      return;
    }
    recent.forEach((s) => {
      const li = document.createElement("li");
      const subjectSpan = document.createElement("span");
      subjectSpan.className = "session-subject";
      subjectSpan.textContent = s.subject;
      const metaSpan = document.createElement("span");
      metaSpan.className = "session-meta";
      const dt = new Date(s.timestamp);
      metaSpan.textContent = `${s.minutes} min · ${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      li.appendChild(subjectSpan);
      li.appendChild(metaSpan);
      sessionLogEl.appendChild(li);
    });
  }

  function refreshProgress() {
    const sessions = loadSessions();
    const todayStr = todayKey();
    const todaysSessions = sessions.filter((s) => s.date === todayStr);
    const todayMinutes = todaysSessions.reduce((sum, s) => sum + s.minutes, 0);

    todayMinutesEl.textContent = String(todayMinutes);
    todaySessionsEl.textContent = String(todaysSessions.length);
    streakCountEl.textContent = String(computeStreak(sessions));

    const goal = loadGoal();
    dailyGoalInput.value = goal;
    const pct = goal > 0 ? Math.min(100, (todayMinutes / goal) * 100) : 0;
    goalFillEl.style.width = `${pct}%`;
    goalTextEl.textContent = `${todayMinutes} / ${goal} min`;

    renderWeekChart(sessions);
    renderSessionLog(sessions);
  }

  dailyGoalInput.addEventListener("change", () => {
    const val = Math.max(5, Number(dailyGoalInput.value) || 60);
    dailyGoalInput.value = val;
    saveGoal(val);
    refreshProgress();
  });

  clearHistoryBtn.addEventListener("click", () => {
    if (confirm("Clear all study history? This cannot be undone.")) {
      saveSessions([]);
      refreshProgress();
    }
  });

  function initDateBadge() {
    const now = new Date();
    todayDateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }

  function init() {
    initDateBadge();
    render();
    refreshProgress();
  }

  init();
})();

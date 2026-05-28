/* ==========================================================================
   FLOWTIME POMODORO TIMER - CORE APPLICATION LOGIC (ES6 JS)
   ========================================================================== */

/**
 * Custom Web Audio Synthesis Engine
 * Generates beautiful, responsive notification sounds without loading external media files.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.currentVolume = 0.5;
  }

  /**
   * Initialize AudioContext lazily on user gesture (avoids browser policy blocks)
   */
  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Web Audio API is not supported in this browser:", e);
    }
  }

  /**
   * Dynamic Volume update
   */
  setVolume(volume) {
    this.currentVolume = parseFloat(volume);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    }
  }

  /**
   * Synthesize a short focus clock mechanical tick
   */
  playTick() {
    this.init();
    if (!this.ctx) return;
    
    // Resume context if suspended (common browser lock)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(700, this.ctx.currentTime);

    // Very brief, quiet envelope
    gainNode.gain.setValueAtTime(0.06 * this.currentVolume, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.012);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.015);
  }

  /**
   * Synthesize a rising double-tone UI start sound
   */
  playStart() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    
    // First chime (C5)
    this.triggerTone(523.25, now, 0.12, 0.1);
    // Second chime (G5)
    this.triggerTone(783.99, now + 0.08, 0.18, 0.1);
  }

  /**
   * Synthesize a falling double-tone UI pause sound
   */
  playPause() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    
    // First chime (G5)
    this.triggerTone(783.99, now, 0.12, 0.1);
    // Second chime (C5)
    this.triggerTone(523.25, now + 0.08, 0.18, 0.1);
  }

  /**
   * Synthesize a cheerful double chime for task completion
   */
  playTaskComplete() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const now = this.ctx.currentTime;
    // Harmonious chord (E5 then C6)
    this.triggerTone(659.25, now, 0.15, 0.12);
    this.triggerTone(1046.50, now + 0.1, 0.35, 0.15);
  }

  /**
   * Trigger a simple clean chime note
   */
  triggerTone(freq, startTime, duration, volumeFactor = 0.2) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gainNode.gain.setValueAtTime(volumeFactor, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  /**
   * Main Alarm sound dispatcher
   */
  playAlarm(type) {
    this.init();
    if (!this.ctx || type === 'none') return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    if (type === 'chime') {
      this.playBrassChime();
    } else if (type === 'digital') {
      this.playDigitalBuzzer();
    }
  }

  /**
   * Premium Meditative Chime: Layers overtones C5, G5, C6, E6
   * Synthesizes a beautiful singing bowl brass ring with exponential decay.
   */
  playBrassChime() {
    const now = this.ctx.currentTime;
    const harmonics = [
      { f: 523.25, a: 0.25 }, // C5 (Fundamental)
      { f: 783.99, a: 0.15 }, // G5 (Overtones)
      { f: 1046.50, a: 0.10 }, // C6
      { f: 1318.51, a: 0.05 }  // E6
    ];

    harmonics.forEach(h => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(h.f, now);
      
      // Decays slowly over 3.2 seconds
      gainNode.gain.setValueAtTime(h.a, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
      
      osc.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      osc.start(now);
      osc.stop(now + 3.3);
    });

    // Secondary ring 1.2s later for depth
    setTimeout(() => {
      if (!this.ctx) return;
      const delayedNow = this.ctx.currentTime;
      harmonics.forEach(h => {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(h.f * 1.5, delayedNow); // fifth higher transition
        gainNode.gain.setValueAtTime(h.a * 0.4, delayedNow);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, delayedNow + 2.0);
        osc.connect(gainNode);
        gainNode.connect(this.masterGain);
        osc.start(delayedNow);
        osc.stop(delayedNow + 2.1);
      });
    }, 1200);
  }

  /**
   * Retro Digital alarm: Repeating 880Hz square beeps
   */
  playDigitalBuzzer() {
    let now = this.ctx.currentTime;
    
    // Play 4 separate beep packets
    for (let i = 0; i < 4; i++) {
      const offset = i * 0.4;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now + offset);

      gainNode.gain.setValueAtTime(0.15, now + offset);
      gainNode.gain.setValueAtTime(0.15, now + offset + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.2);

      osc.connect(gainNode);
      gainNode.connect(this.masterGain);

      osc.start(now + offset);
      osc.stop(now + offset + 0.25);
    }
  }
}

// Instantiate Sound Engine
const audio = new SoundEngine();

// ==========================================================================
// STATE MANAGEMENT & DOM SELECTION
// ==========================================================================

const STATE = {
  timer: 'idle', // 'idle' | 'running' | 'paused'
  phase: 'focus', // 'focus' | 'shortBreak' | 'longBreak'
  timeLeft: 25 * 60,
  totalDuration: 25 * 60,
  intervalId: null,
  activeTaskId: null,
  taskPomEstimate: 1,
  currentFilter: 'all',
  
  settings: {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    alarmSound: 'chime',
    enableTicking: true,
    volume: 0.5
  },
  
  stats: {
    totalSessions: 0,
    totalMinutes: 0
  },
  
  tasks: []
};

// --- DOM Nodes Selection ---
const nodes = {
  body: document.body,
  phaseTabs: document.querySelectorAll('.phase-tab'),
  currentPhaseLabel: document.getElementById('current-phase-label'),
  timeRemainingText: document.getElementById('time-remaining-text'),
  activeTaskDisplay: document.getElementById('active-task-display'),
  
  // Controls
  resetTimerBtn: document.getElementById('reset-timer-btn'),
  playPauseBtn: document.getElementById('play-pause-btn'),
  playIcon: document.querySelector('.play-icon'),
  pauseIcon: document.querySelector('.pause-icon'),
  skipPhaseBtn: document.getElementById('skip-phase-btn'),
  sessionDotContainer: document.getElementById('session-dot-container'),
  timeDecBtn: document.getElementById('time-dec-btn'),
  timeIncBtn: document.getElementById('time-inc-btn'),
  
  // SVG Timer Ring
  progressCircle: document.querySelector('.progress-ring__circle'),
  
  // Task Dashboard
  taskStats: document.getElementById('task-completion-stats'),
  activeTaskHero: document.getElementById('active-task-hero'),
  heroCompleteBtn: document.getElementById('hero-complete-btn'),
  heroTaskTitle: document.getElementById('hero-task-title'),
  heroPomProgress: document.getElementById('hero-pom-progress'),
  
  // New Task Form
  newTaskForm: document.getElementById('new-task-form'),
  taskInputField: document.getElementById('task-input-field'),
  pomDecBtn: document.getElementById('pom-dec-btn'),
  pomIncBtn: document.getElementById('pom-inc-btn'),
  pomEstimateVal: document.getElementById('pom-estimate-val'),
  
  // Filters & List
  taskFilters: document.querySelectorAll('.task-filters .filter-tab'),
  taskItemsList: document.getElementById('task-items-list'),
  
  // Settings Modal Dialog
  settingsDialog: document.getElementById('settings-dialog'),
  openSettingsBtn: document.getElementById('open-settings-btn'),
  closeSettingsBtn: document.getElementById('close-settings-btn'),
  settingsForm: document.getElementById('settings-form'),
  
  // Settings Form Inputs
  focusInput: document.getElementById('focus-duration-input'),
  shortInput: document.getElementById('short-duration-input'),
  longInput: document.getElementById('long-duration-input'),
  longIntervalInput: document.getElementById('long-interval-input'),
  soundSelect: document.getElementById('sound-preset-select'),
  tickCheckbox: document.getElementById('tick-toggle-checkbox'),
  volumeSlider: document.getElementById('volume-control-slider'),
  volumeVal: document.getElementById('volume-val-display'),
  
  // Stats
  totalSessionsStats: document.getElementById('total-focus-sessions-count'),
  totalMinutesStats: document.getElementById('total-focus-minutes-count'),
  resetStatsBtn: document.getElementById('reset-stats-btn')
};

// ==========================================================================
// APPLICATION INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  loadDataFromStorage();
  syncVolumeUI(STATE.settings.volume);
  initCircleRing();
  setupTimerForPhase(STATE.phase);
  renderTaskList();
  renderTrackerDots();
  renderStatsPanel();
  setupEventListeners();
  
  // Set focus theme initially
  updateThemeClass();
});

/**
 * Load settings, stats, and tasks from localStorage
 */
function loadDataFromStorage() {
  try {
    const localSettings = localStorage.getItem('zenpom_settings');
    if (localSettings) {
      STATE.settings = { ...STATE.settings, ...JSON.parse(localSettings) };
    }
    
    const localStats = localStorage.getItem('zenpom_stats');
    if (localStats) {
      STATE.stats = { ...STATE.stats, ...JSON.parse(localStats) };
    }
    
    const localTasks = localStorage.getItem('zenpom_tasks');
    if (localTasks) {
      STATE.tasks = JSON.parse(localTasks);
    }
    
    const localActiveTaskId = localStorage.getItem('zenpom_active_task_id');
    if (localActiveTaskId) {
      STATE.activeTaskId = localActiveTaskId;
    }

    // Pass volume to audio engine
    audio.setVolume(STATE.settings.volume);
  } catch (err) {
    console.error("Error reading localStorage:", err);
  }
}

/**
 * Persist states to storage
 */
function saveDataToStorage() {
  try {
    localStorage.setItem('zenpom_settings', JSON.stringify(STATE.settings));
    localStorage.setItem('zenpom_stats', JSON.stringify(STATE.stats));
    localStorage.setItem('zenpom_tasks', JSON.stringify(STATE.tasks));
    if (STATE.activeTaskId) {
      localStorage.setItem('zenpom_active_task_id', STATE.activeTaskId);
    } else {
      localStorage.removeItem('zenpom_active_task_id');
    }
  } catch (err) {
    console.error("Error saving to localStorage:", err);
  }
}

// ==========================================================================
// CIRCULAR PROGRESS MANAGEMENT
// ==========================================================================

let circleCircumference = 892.2; // default radius 142

/**
 * Reads radius dynamically from SVG rendering so it handles responsive sizing natively
 */
function initCircleRing() {
  if (nodes.progressCircle) {
    const r = nodes.progressCircle.r.baseVal.value;
    circleCircumference = 2 * Math.PI * r;
    nodes.progressCircle.style.strokeDasharray = circleCircumference;
    updateProgressRing();
  }
}

/**
 * Triggers SVG stroke-dashoffset transition smoothly
 */
function updateProgressRing() {
  if (!nodes.progressCircle) return;
  const ratio = STATE.timeLeft / STATE.totalDuration;
  const offset = circleCircumference - (ratio * circleCircumference);
  nodes.progressCircle.style.strokeDashoffset = offset;
}

// Resize event to re-evaluate radius on viewport scaling
window.addEventListener('resize', () => {
  initCircleRing();
});

// ==========================================================================
// TIMER ENGINE & LOGIC
// ==========================================================================

/**
 * Switches the active countdown lengths, labels, and formats
 */
function setupTimerForPhase(phaseName) {
  STATE.phase = phaseName;
  
  let mins = 25;
  if (phaseName === 'focus') mins = STATE.settings.focusDuration;
  else if (phaseName === 'shortBreak') mins = STATE.settings.shortBreakDuration;
  else if (phaseName === 'longBreak') mins = STATE.settings.longBreakDuration;
  
  STATE.timeLeft = mins * 60;
  STATE.totalDuration = mins * 60;
  
  updateTimerDisplay();
  updateProgressRing();
  updateThemeClass();
  renderTrackerDots();
  
  // Highlight matching selector tab
  nodes.phaseTabs.forEach(tab => {
    if (tab.dataset.phase === phaseName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Switch overlay labels
  if (phaseName === 'focus') {
    nodes.currentPhaseLabel.textContent = "Focus Session";
  } else if (phaseName === 'shortBreak') {
    nodes.currentPhaseLabel.textContent = "Short Break";
  } else {
    nodes.currentPhaseLabel.textContent = "Long Break";
  }

  updateDocumentTitle();
}

/**
 * Redraw text and clocks
 */
function updateTimerDisplay() {
  const mins = Math.floor(STATE.timeLeft / 60);
  const secs = STATE.timeLeft % 60;
  const text = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  nodes.timeRemainingText.textContent = text;
}

/**
 * Propagate updates to browser title tab
 */
function updateDocumentTitle() {
  const mins = Math.floor(STATE.timeLeft / 60);
  const secs = STATE.timeLeft % 60;
  const text = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  
  let phaseText = 'Focus';
  if (STATE.phase === 'shortBreak') {
    phaseText = 'Break';
  } else if (STATE.phase === 'longBreak') {
    phaseText = 'Long Break';
  }

  document.title = `${text} | ${phaseText}`;
}

/**
 * Handle HTML body theme swaps
 */
function updateThemeClass() {
  nodes.body.classList.remove('theme-focus', 'theme-shortBreak', 'theme-longBreak');
  if (STATE.phase === 'focus') nodes.body.classList.add('theme-focus');
  else if (STATE.phase === 'shortBreak') nodes.body.classList.add('theme-shortBreak');
  else if (STATE.phase === 'longBreak') nodes.body.classList.add('theme-longBreak');
}

/**
 * Play/Pause trigger controls
 */
function toggleTimer() {
  if (STATE.timer === 'running') {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  audio.init();
  if (STATE.timer !== 'running') {
    STATE.timer = 'running';
    nodes.body.classList.add('timer-running');
    
    // Play sound synth
    audio.playStart();
    
    // Toggle SVGs controls
    nodes.playIcon.classList.add('hidden');
    nodes.pauseIcon.classList.remove('hidden');
    
    STATE.intervalId = setInterval(tick, 1000);
  }
}

function pauseTimer() {
  if (STATE.timer === 'running') {
    STATE.timer = 'paused';
    nodes.body.classList.remove('timer-running');
    
    audio.playPause();
    
    nodes.playIcon.classList.remove('hidden');
    nodes.pauseIcon.classList.add('hidden');
    
    clearInterval(STATE.intervalId);
  }
}

function resetTimer() {
  pauseTimer();
  STATE.timer = 'idle';
  setupTimerForPhase(STATE.phase);
}

function skipPhase() {
  pauseTimer();
  STATE.timer = 'idle';
  triggerPhaseTransition();
}

/**
 * Heartbeat of the clock countdown
 */
function tick() {
  if (STATE.timeLeft > 0) {
    STATE.timeLeft--;
    updateTimerDisplay();
    updateProgressRing();
    updateDocumentTitle();
    
    // Mechanical ticking
    if (STATE.settings.enableTicking && STATE.phase === 'focus') {
      audio.playTick();
    }
  } else {
    // Session completed!
    handleTimerComplete();
  }
}

/**
 * Main completion trigger
 */
function handleTimerComplete() {
  clearInterval(STATE.intervalId);
  STATE.timer = 'idle';
  nodes.body.classList.remove('timer-running');
  
  nodes.playIcon.classList.remove('hidden');
  nodes.pauseIcon.classList.add('hidden');
  
  // 1. Process statistics
  if (STATE.phase === 'focus') {
    STATE.stats.totalSessions++;
    STATE.stats.totalMinutes += STATE.settings.focusDuration;
    
    // Increment active task tomato progress
    if (STATE.activeTaskId) {
      const activeTask = STATE.tasks.find(t => t.id === STATE.activeTaskId);
      if (activeTask) {
        activeTask.pomCompleted++;
        if (activeTask.pomCompleted >= activeTask.pomTarget && !activeTask.completed) {
          // auto complete task if reached target
          // activeTask.completed = true; (optional, let's keep it open so user checks off)
        }
      }
    }
    
    saveDataToStorage();
    renderTaskList();
    renderStatsPanel();
    syncActiveTaskHero();
  }

  // 2. Play synthesized alarm bowl/buzzer
  audio.playAlarm(STATE.settings.alarmSound);
  
  // Visual Flash Alert
  triggerFlashEffect();

  // 3. Move to next logical phase automatically
  setTimeout(() => {
    triggerPhaseTransition();
  }, 1000);
}

/**
 * Fluid background flash animation on completion
 */
function triggerFlashEffect() {
  const flash = document.createElement('div');
  flash.style.position = 'fixed';
  flash.style.top = '0';
  flash.style.left = '0';
  flash.style.width = '100vw';
  flash.style.height = '100vh';
  flash.style.background = 'rgba(255, 255, 255, 0.4)';
  flash.style.transition = 'opacity 0.8s ease';
  flash.style.zIndex = '9999';
  flash.style.pointerEvents = 'none';
  
  document.body.appendChild(flash);
  setTimeout(() => {
    flash.style.opacity = '0';
    setTimeout(() => flash.remove(), 800);
  }, 100);
}

/**
 * Automates routing between focus -> rest intervals
 */
function triggerPhaseTransition() {
  if (STATE.phase === 'focus') {
    // If completed target intervals, push a long rest
    if (STATE.stats.totalSessions > 0 && STATE.stats.totalSessions % STATE.settings.longBreakInterval === 0) {
      setupTimerForPhase('longBreak');
    } else {
      setupTimerForPhase('shortBreak');
    }
  } else {
    // Rest finished, redirect focus
    setupTimerForPhase('focus');
  }
}

/**
 * Renders Pomodoro indicators
 */
function renderTrackerDots() {
  nodes.sessionDotContainer.innerHTML = '';
  const maxDots = STATE.settings.longBreakInterval;
  // How many focuses have we completed inside the current rotation?
  const completedInRotation = STATE.stats.totalSessions % maxDots;
  
  for (let i = 1; i <= maxDots; i++) {
    const dot = document.createElement('div');
    dot.className = 'tracker-dot';
    
    if (i <= completedInRotation) {
      dot.classList.add('completed');
    } else if (i === completedInRotation + 1 && STATE.phase === 'focus' && STATE.timer !== 'idle') {
      dot.classList.add('active');
    }
    
    nodes.sessionDotContainer.appendChild(dot);
  }
}

// ==========================================================================
// FOCUS TASKS CONTROLLERS
// ==========================================================================

/**
 * Draw scrollable tasks and estimate counters
 */
function renderTaskList() {
  nodes.taskItemsList.innerHTML = '';
  
  // Apply active filters
  let filtered = STATE.tasks;
  if (STATE.currentFilter === 'pending') {
    filtered = STATE.tasks.filter(t => !t.completed);
  } else if (STATE.currentFilter === 'done') {
    filtered = STATE.tasks.filter(t => t.completed);
  }
  
  // Render completed count statistic
  const completedCount = STATE.tasks.filter(t => t.completed).length;
  nodes.taskStats.textContent = `${completedCount} of ${STATE.tasks.length} completed`;
  
  // Empty states
  if (filtered.length === 0) {
    const placeholder = document.createElement('li');
    placeholder.className = 'empty-list-placeholder';
    placeholder.textContent = STATE.tasks.length === 0 
      ? "Your catalog is empty. Plan some targets below!" 
      : "No tasks found matching this filter.";
    nodes.taskItemsList.appendChild(placeholder);
    syncActiveTaskHero();
    return;
  }
  
  // Render items
  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''} ${task.id === STATE.activeTaskId ? 'active-focus' : ''}`;
    li.dataset.id = task.id;
    
    li.innerHTML = `
      <button class="task-checkbox" aria-label="Toggle Complete">
        ${task.completed ? '✓' : ''}
      </button>
      <span class="task-title">${escapeHTML(task.title)}</span>
      <span class="task-pom-count">${task.pomCompleted}/${task.pomTarget} cycles</span>
      <button class="delete-task-btn" title="Delete Task" aria-label="Delete Task">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    `;
    
    nodes.taskItemsList.appendChild(li);
  });
  
  syncActiveTaskHero();
}

/**
 * Keep top "Active Focus" banner synchronized
 */
function syncActiveTaskHero() {
  const activeTask = STATE.tasks.find(t => t.id === STATE.activeTaskId);
  
  if (activeTask && !activeTask.completed) {
    nodes.activeTaskHero.classList.add('focus-active');
    nodes.heroTaskTitle.textContent = activeTask.title;
    nodes.heroPomProgress.textContent = `${activeTask.pomCompleted}/${activeTask.pomTarget} cycles`;
    nodes.activeTaskDisplay.textContent = `Working on: ${activeTask.title}`;
    nodes.heroCompleteBtn.style.display = 'flex';
  } else {
    // Reset active task pointers if finished or deleted
    nodes.activeTaskHero.classList.remove('focus-active');
    nodes.heroTaskTitle.textContent = "Select a task below to start focusing";
    nodes.heroPomProgress.textContent = "";
    nodes.activeTaskDisplay.textContent = "No task active";
    nodes.heroCompleteBtn.style.display = 'none';
    if (STATE.activeTaskId) {
      STATE.activeTaskId = null;
      saveDataToStorage();
    }
  }
}

/**
 * Handle new checklist additions
 */
function handleAddTask(e) {
  e.preventDefault();
  
  const title = nodes.taskInputField.value.trim();
  if (!title) return;
  
  const newTask = {
    id: Date.now().toString(),
    title: title,
    pomTarget: STATE.taskPomEstimate,
    pomCompleted: 0,
    completed: false
  };
  
  STATE.tasks.push(newTask);
  
  // Auto set active if none is active
  if (!STATE.activeTaskId) {
    STATE.activeTaskId = newTask.id;
  }
  
  // Save & Reset Inputs
  saveDataToStorage();
  renderTaskList();
  
  nodes.taskInputField.value = '';
  STATE.taskPomEstimate = 1;
  nodes.pomEstimateVal.textContent = '1';
}

/**
 * Increments target POM estimations
 */
function adjustPomEstimate(delta) {
  const newVal = STATE.taskPomEstimate + delta;
  if (newVal >= 1 && newVal <= 12) {
    STATE.taskPomEstimate = newVal;
    nodes.pomEstimateVal.textContent = newVal.toString();
  }
}

/**
 * Checklist rows click event router
 */
function handleTaskListClick(e) {
  const itemRow = e.target.closest('.task-item');
  if (!itemRow) return;
  
  const taskId = itemRow.dataset.id;
  const task = STATE.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  const isCheckbox = e.target.closest('.task-checkbox');
  const isDelete = e.target.closest('.delete-task-btn');
  
  if (isCheckbox) {
    // Toggle Completion
    toggleTaskCompletion(task, itemRow);
  } else if (isDelete) {
    // Delete Task
    deleteTask(taskId, itemRow);
  } else {
    // Click on row to set as focus target (if not completed)
    if (!task.completed) {
      STATE.activeTaskId = task.id;
      saveDataToStorage();
      renderTaskList();
    }
  }
}

/**
 * checked completes transitions
 */
function toggleTaskCompletion(task, itemRow) {
  task.completed = !task.completed;
  
  if (task.completed) {
    audio.playTaskComplete();
    
    // Animate check out smoothly
    itemRow.classList.add('completed');
    
    // If it was the active task, remove active reference
    if (task.id === STATE.activeTaskId) {
      STATE.activeTaskId = null;
    }
  } else {
    // Re-opened task, make it active
    STATE.activeTaskId = task.id;
  }
  
  saveDataToStorage();
  
  // CSS fade out delay if filter requires hiding
  if (STATE.currentFilter !== 'all') {
    itemRow.classList.add('task-item-leaving');
    setTimeout(() => {
      renderTaskList();
    }, 280);
  } else {
    renderTaskList();
  }
}

/**
 * Delete checklist item
 */
function deleteTask(taskId, itemRow) {
  STATE.tasks = STATE.tasks.filter(t => t.id !== taskId);
  
  if (taskId === STATE.activeTaskId) {
    STATE.activeTaskId = null;
  }
  
  saveDataToStorage();
  
  itemRow.classList.add('task-item-leaving');
  setTimeout(() => {
    renderTaskList();
  }, 280);
}

/**
 * Quick complete active target button
 */
function completeHeroTask() {
  if (!STATE.activeTaskId) return;
  const task = STATE.tasks.find(t => t.id === STATE.activeTaskId);
  if (task) {
    // Synthesize completion chime
    audio.playTaskComplete();
    
    task.completed = true;
    STATE.activeTaskId = null;
    saveDataToStorage();
    renderTaskList();
  }
}

// ==========================================================================
// CONFIGURATION MODAL (SETTINGS)
// ==========================================================================

/**
 * Renders statistical values in Settings modal dashboard
 */
function renderStatsPanel() {
  nodes.totalSessionsStats.textContent = STATE.stats.totalSessions;
  nodes.totalMinutesStats.textContent = STATE.stats.totalMinutes;
}

/**
 * Opens settings and feeds current values into DOM forms
 */
function openSettings() {
  audio.init();
  
  nodes.focusInput.value = STATE.settings.focusDuration;
  nodes.shortInput.value = STATE.settings.shortBreakDuration;
  nodes.longInput.value = STATE.settings.longBreakDuration;
  nodes.longIntervalInput.value = STATE.settings.longBreakInterval;
  nodes.soundSelect.value = STATE.settings.alarmSound;
  nodes.tickCheckbox.checked = STATE.settings.enableTicking;
  nodes.volumeSlider.value = STATE.settings.volume;
  
  syncVolumeUI(STATE.settings.volume);
  renderStatsPanel();
  
  // Native accessible modal activation
  nodes.settingsDialog.showModal();
}

/**
 * Live Volume indicator updates + soft chime feedback
 */
function handleVolumeSlide(e) {
  const vol = parseFloat(e.target.value);
  syncVolumeUI(vol);
  audio.setVolume(vol);
}

function handleVolumeChange(e) {
  // Play soft tone on release to preview volume level
  audio.triggerTone(440, audio.ctx.currentTime, 0.15, 0.08);
}

function syncVolumeUI(vol) {
  nodes.volumeVal.textContent = `${Math.round(vol * 100)}%`;
}

/**
 * Form save logic
 */
function saveSettings(e) {
  // Pre-emptive block so native dialog closing executes on custom logic
  e.preventDefault();
  
  STATE.settings.focusDuration = parseInt(nodes.focusInput.value);
  STATE.settings.shortBreakDuration = parseInt(nodes.shortInput.value);
  STATE.settings.longBreakDuration = parseInt(nodes.longInput.value);
  STATE.settings.longBreakInterval = parseInt(nodes.longIntervalInput.value);
  STATE.settings.alarmSound = nodes.soundSelect.value;
  STATE.settings.enableTicking = nodes.tickCheckbox.checked;
  STATE.settings.volume = parseFloat(nodes.volumeSlider.value);
  
  saveDataToStorage();
  audio.setVolume(STATE.settings.volume);
  
  // Re-render trackers and re-initialize timer countdown lengths
  resetTimer();
  
  // Dismiss dialog modal
  nodes.settingsDialog.close();
}

/**
 * Erase database wipes
 */
function resetAllData() {
  const confirmed = confirm("Are you sure you want to delete all settings, completed tasks, and statistics? This cannot be undone.");
  if (!confirmed) return;
  
  clearInterval(STATE.intervalId);
  localStorage.clear();
  window.location.reload();
}

/**
 * Adjust active timer value dynamically
 */
function adjustActiveTimer(seconds) {
  audio.init();
  
  const newTime = STATE.timeLeft + seconds;
  if (newTime <= 0) {
    STATE.timeLeft = 0;
  } else {
    STATE.timeLeft = newTime;
    
    // Maintain proportional progress circle
    if (seconds > 0) {
      STATE.totalDuration += seconds;
    } else {
      if (STATE.totalDuration < STATE.timeLeft) {
        STATE.totalDuration = STATE.timeLeft;
      }
    }
  }
  
  // Play soft focus haptic confirmation tick
  audio.playTick();
  
  updateTimerDisplay();
  updateProgressRing();
  updateDocumentTitle();
}

// ==========================================================================
// SYSTEM EVENT LISTENERS SETUP
// ==========================================================================

function setupEventListeners() {
  // Phase Tab switch click triggers
  nodes.phaseTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const phase = tab.dataset.phase;
      if (STATE.phase !== phase) {
        pauseTimer();
        STATE.timer = 'idle';
        setupTimerForPhase(phase);
      }
    });
  });

  // Main Timer Trigger buttons
  nodes.playPauseBtn.addEventListener('click', toggleTimer);
  nodes.resetTimerBtn.addEventListener('click', resetTimer);
  nodes.skipPhaseBtn.addEventListener('click', skipPhase);
  nodes.timeDecBtn.addEventListener('click', () => adjustActiveTimer(-60));
  nodes.timeIncBtn.addEventListener('click', () => adjustActiveTimer(60));

  // Focus Task inputs and plus/minus clicks
  nodes.newTaskForm.addEventListener('submit', handleAddTask);
  nodes.pomDecBtn.addEventListener('click', () => adjustPomEstimate(-1));
  nodes.pomIncBtn.addEventListener('click', () => adjustPomEstimate(1));
  nodes.heroCompleteBtn.addEventListener('click', completeHeroTask);
  
  // List delegate clicking router
  nodes.taskItemsList.addEventListener('click', handleTaskListClick);

  // Task list filters toggling
  nodes.taskFilters.forEach(tab => {
    tab.addEventListener('click', () => {
      nodes.taskFilters.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      STATE.currentFilter = tab.dataset.filter;
      renderTaskList();
    });
  });

  // Dialog Modals bindings
  nodes.openSettingsBtn.addEventListener('click', openSettings);
  nodes.closeSettingsBtn.addEventListener('click', () => nodes.settingsDialog.close());
  nodes.settingsForm.addEventListener('submit', saveSettings);
  
  // Volume controls bindings
  nodes.volumeSlider.addEventListener('input', handleVolumeSlide);
  nodes.volumeSlider.addEventListener('change', handleVolumeChange);
  
  // Statistics wiping trigger
  nodes.resetStatsBtn.addEventListener('click', resetAllData);
  
  // Click outside Dialog to dismiss natively
  nodes.settingsDialog.addEventListener('click', (e) => {
    const dialogDimensions = nodes.settingsDialog.getBoundingClientRect();
    if (
      e.clientX < dialogDimensions.left ||
      e.clientX > dialogDimensions.right ||
      e.clientY < dialogDimensions.top ||
      e.clientY > dialogDimensions.bottom
    ) {
      nodes.settingsDialog.close();
    }
  });
}

// ==========================================================================
// ESCAPE UTILITIES (ACCESSIBILITY & SECURITY)
// ==========================================================================

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

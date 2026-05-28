# FocusFlow Countdown Timer

FocusFlow is a high-fidelity, beautifully polished Pomodoro-style countdown timer built entirely with native vanilla web technologies. It is designed to combine a sleek user interface with highly performant, zero-dependency background mechanics.

This project was built as Day 5 of the 30 Days Challenge.

## Key Features

1. **Dynamic Main-Screen Adjustments**
   - Directly adjust the remaining session time from the main clock display using inline minus and plus controls.
   - Instantly subtract or add 1 minute to the active session. The countdown machine automatically adapts the SVG tracking path, tab headers, and clocks.

2. **Zero-Asset Meditative Audio Synthesis**
   - All sound effects (focus ticking, start/pause indicators, complete alarms) are synthesized dynamically in real-time using the native browser Web Audio API.
   - Eliminates broken media file paths, CORS latency issues, or loading delays. Includes a volume slider and sound profile options (Brass Chime singing bowl vs. Digital buzzer).

3. **Fluid Glassmorphic Themes**
   - The user interface smoothly morphs its background mesh gradients and neon glows depending on the active cycle state (Focus, Short Break, or Long Break) using performant GPU-accelerated CSS variables.

4. **Micro Task Manager**
   - Plan your session directly from the integrated focus list.
   - Add tasks with cycle targets, toggle tasks as your active focus, and check them off to hear a satisfying double-pitch success chime and watch items slide out smoothly.

5. **Local Persistence & Tab Synchronization**
   - Automatically saves custom configurations, statistical totals, and task histories to localStorage.
   - Synchronizes time countdowns directly to the browser's document title tab.

## Technology Stack

- **Structure**: Semantic HTML5 markup, SVG graphics.
- **Styling**: Vanilla CSS3, backdrop filter glassmorphism, dynamic variables, floating blur keyframes.
- **Logic**: ES6 JavaScript, DOM event delegation.
- **Audio**: Native Web Audio API Synthesizer (Oscillators, Gain nodes, Exponential ramps).

## File Structure

```
DAY5 -- COUNTDOWN TIMER/
├── index.html   # Main markup, SVG circular ring, task manager, configuration dialog
├── style.css    # Color themes, responsive grids, scrollbars, and entrance animations
├── app.js       # Audio synthesizer engine, Finite State Machine, checklist CRUD
└── README.md    # Documentation
```

## How to Run the Application

You can execute and preview the application locally on your computer in two ways:

### Option A: Using a Local HTTP Server (Recommended)
Launch a lightweight local server from your terminal inside the application folder:

```bash
python3 -m http.server 8080
```

Then open your web browser and navigate to:
`http://localhost:8080`

### Option B: Direct File Execution
Navigate to the project folder on your computer and open the `index.html` file directly in any modern web browser (such as Safari, Chrome, Edge, or Firefox).

## Configuration Options

Clicking the gear icon in the top right opens the configuration modal dialog:
- **Focus Interval**: Custom minutes for focusing.
- **Short/Long Break**: Custom lengths for resting.
- **Long Break After**: Number of cycles before a longer break.
- **Alarm Preset**: Select your synthesized alert type.
- **Ticking**: Enable or disable soft mechanical background ticks.
- **Volume**: Adjust synthesizer loudness.
- **Dashboard**: Track cumulative sessions and focus minutes completed.

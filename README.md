# React + Vite + Tailwind CSS Boilerplate (with Chrome Debugging)

Modern starter template built with:
- ⚡ **Vite 6** - Instant Hot Module Replacement (HMR) and fast build
- ⚛️ **React 19** - Modern React with JSX
- 🎨 **Tailwind CSS v4** - Fast CSS framework via `@tailwindcss/vite`
- 🐞 **One-Click Chrome Debugger** - Integrated with VS Code / Antigravity IDE and standalone terminal script

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server (Normal)
```bash
npm run dev
```
App will be running at `http://localhost:5173`.

---

## 🐞 Launching with Chrome Debugging

You have two ways to start the app with Chrome debugging attached:

### Option A: VS Code / IDE Run & Debug (Recommended for Breakpoints in Editor)
1. Open this project in VS Code / Antigravity IDE.
2. Press <kbd>F5</kbd> (or go to the **Run and Debug** view `Ctrl+Shift+D` and click **Launch Chrome against localhost**).
3. VS Code will automatically:
   - Start the Vite development server in the background (configured in [`.vscode/tasks.json`](file:///.vscode/tasks.json)).
   - Launch Google Chrome pointing to `http://localhost:5173` with remote debugging.
   - Attach breakpoints directly in your `.jsx` source files (e.g., [`src/App.jsx`](file:///src/App.jsx)).

### Option B: Terminal Script / CLI
Run:
```bash
npm run debug
```
or double-click [`debug.bat`](file:///debug.bat) or run [`debug.ps1`](file:///debug.ps1).

This script:
- Boots the Vite dev server.
- Automatically locates Google Chrome.
- Launches Chrome configured with `--remote-debugging-port=9222` and auto-opens Chrome DevTools.
- You can also attach your IDE debugger to this running instance via the **"Attach to Chrome (port 9222)"** configuration in [`.vscode/launch.json`](file:///.vscode/launch.json).

---

## 📂 Project Structure

```
report/
├── .vscode/
│   ├── launch.json       # Chrome launch and attach debug configurations
│   └── tasks.json        # Background dev server task for preLaunchTask
├── public/
│   ├── vite.svg          # Favicon
│   └── legacy-report.html# Backup of previous static daily report HTML
├── scripts/
│   └── debug.js          # Node script to start Vite & launch Chrome debug
├── src/
│   ├── App.jsx           # Main interactive dashboard component
│   ├── index.css         # Tailwind CSS v4 entry
│   └── main.jsx          # React DOM entry point
├── debug.bat             # Windows batch launcher
├── debug.ps1             # PowerShell launcher
├── index.html            # Vite HTML root entry
├── package.json          # Project dependencies and scripts
└── vite.config.js        # Vite + Tailwind + React plugins configuration
```


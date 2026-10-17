import { useState } from 'react'
import DailyReport from './DailyReport.jsx'

export default function App() {
  const [showDebugModal, setShowDebugModal] = useState(false)
  const [breakpointHits, setBreakpointHits] = useState(0)

  const handleTriggerDebugger = () => {
    console.log('⚡ Triggering debugger breakpoint...')
    // When Chrome DevTools or VS Code Debugger is attached, this pauses execution:
    // eslint-disable-next-line no-debugger
    debugger
    setBreakpointHits((prev) => prev + 1)
  }

  const debugToolbar = (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Dev Server
      </span>

      <button
        type="button"
        onClick={handleTriggerDebugger}
        className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded shadow-sm transition active:scale-95 cursor-pointer"
        title="Triggers 'debugger;' in code to pause execution in Chrome or VS Code"
      >
        ⚡ Breakpoint {breakpointHits > 0 && `(${breakpointHits})`}
      </button>

      <button
        type="button"
        onClick={() => setShowDebugModal(true)}
        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded transition cursor-pointer"
        title="View Chrome debug setup and instructions"
      >
        Debug Info
      </button>
    </div>
  )

  return (
    <div className="h-screen w-screen overflow-hidden">
      <DailyReport debugSlot={debugToolbar} />

      {/* Debug Info Modal */}
      {showDebugModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>🐞</span> Chrome Debugging Status
              </h3>
              <button
                onClick={() => setShowDebugModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 rounded text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                <strong>Status:</strong> Vite HMR + Tailwind v4 active on port <code>5173</code>.
              </div>

              <div>
                <p className="font-semibold text-slate-800 mb-1">How to Debug with Chrome:</p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  <li>
                    <strong>VS Code / IDE:</strong> Press <kbd className="bg-slate-100 px-1 border rounded">F5</kbd> to launch Chrome with breakpoints connected.
                  </li>
                  <li>
                    <strong>Terminal:</strong> Run <code className="bg-slate-100 px-1 rounded text-indigo-600">npm run debug</code> to start dev server &amp; launch Chrome with remote debugging on port <code>9222</code>.
                  </li>
                  <li>
                    Click the <strong>⚡ Breakpoint</strong> button in the date bar to pause execution inside Chrome DevTools or VS Code.
                  </li>
                </ol>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowDebugModal(false)}
                className="px-3 py-1 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

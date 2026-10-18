import { useState, useEffect } from 'react'
import html2canvas from 'html2canvas'
import {
  Settings,
  ChevronUp,
  ChevronDown,
  Camera,
  Save,
  Clock,
  RefreshCw,
  Database,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from './Icons.jsx'

export default function TopSettingsBar({
  dateRange,
  onDateRangeChange,
  onRefreshData,
  onManualSave,
  isSaving,
  isRefreshing,
  pocketBaseConnected,
  lastSavedTime,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState('Pending (23:00)')
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type })
    setTimeout(() => setToastMessage(null), 4000)
  }

  // 1. Export to 1920x1080 Image
  const handleExportImage = async () => {
    const reportElement = document.getElementById('report-dashboard-capture')
    if (!reportElement) {
      showToast('Report element not found for export.', 'error')
      return
    }

    try {
      setIsExporting(true)

      // Format date for filename: report - [Day Name], [DD-MM-YYYY]
      const now = new Date()
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
      const dayName = days[now.getDay()]
      const dd = String(now.getDate()).padStart(2, '0')
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const yyyy = now.getFullYear()
      const filename = `report - ${dayName}, ${dd}-${mm}-${yyyy}.png`

      // Capture with 1920x1080 canvas
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#eef5f9',
        windowWidth: 1920,
        windowHeight: 1080,
      })

      const link = document.createElement('a')
      link.download = filename
      link.href = canvas.toDataURL('image/png')
      link.click()

      showToast(`Exported ${filename} successfully!`, 'success')
    } catch (err) {
      console.error('Export image error:', err)
      showToast(`Export failed: ${err.message}`, 'error')
    } finally {
      setIsExporting(false)
    }
  }

  // 2. Auto-Save Scheduler at 23:00
  useEffect(() => {
    let hasTriggeredToday = false

    const checkAutoSave = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const todayKey = `autosaved_${now.toISOString().slice(0, 10)}`

      if (localStorage.getItem(todayKey)) {
        setAutoSaveStatus('Completed today')
        return
      }

      // Check if 23:00 or later
      if (hours >= 23 && !hasTriggeredToday) {
        hasTriggeredToday = true
        console.log('[Auto-Save] Triggering 23:00 auto-save to PocketBase...')
        setAutoSaveStatus('Saving...')

        if (onManualSave) {
          onManualSave(true)
            .then(() => {
              localStorage.setItem(todayKey, 'true')
              setAutoSaveStatus('Completed at 23:00')
              showToast('Auto-save at 23:00 completed successfully!', 'success')
            })
            .catch((err) => {
              setAutoSaveStatus('Auto-save error')
              console.error('[Auto-Save] Failed:', err)
            })
        }
      } else {
        setAutoSaveStatus(`Scheduled for 23:00 (${23 - hours}h remaining)`)
      }
    }

    const interval = setInterval(checkAutoSave, 60000) // check every minute
    checkAutoSave()

    return () => clearInterval(interval)
  }, [onManualSave])

  return (
    <div className="w-full bg-slate-900 text-slate-100 border-b border-slate-700 shadow-md text-xs select-none">
      {/* Collapsed Bar / Trigger */}
      <div className="flex items-center justify-between px-3 py-1.5 max-w-[1850px] mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 font-semibold text-slate-200 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Operational Controls &amp; Settings</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </button>

          {/* Quick status badges */}
          <div className="hidden sm:flex items-center gap-2 text-[11px]">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                pocketBaseConnected
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700'
                  : 'bg-amber-950/60 text-amber-400 border-amber-700'
              }`}
            >
              <Database className="w-3 h-3" />
              {pocketBaseConnected ? 'PocketBase Connected' : 'Local Fallback'}
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              <Clock className="w-3 h-3 text-cyan-400" />
              {autoSaveStatus}
            </span>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {toastMessage && (
            <div
              className={`text-[11px] px-2.5 py-0.5 rounded border flex items-center gap-1 ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-900/80 text-emerald-200 border-emerald-600'
                  : 'bg-rose-900/80 text-rose-200 border-rose-600'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              <span>{toastMessage.text}</span>
            </div>
          )}

          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition cursor-pointer disabled:opacity-50"
            title="Refresh PHD DCS and LIMS data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleExportImage}
            disabled={isExporting}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition cursor-pointer disabled:opacity-50"
            title="Export full 1920x1080 image for daily reporting"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Capturing...' : 'Export 1080p Image'}</span>
          </button>

          <button
            onClick={() => onManualSave(false)}
            disabled={isSaving}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer disabled:opacity-50"
            title="Archive current report snapshot to PocketBase"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save & Archive'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Settings Drawer */}
      {isOpen && (
        <div className="border-t border-slate-800 bg-slate-950/90 p-3 max-w-[1850px] mx-auto animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. PHD Date Range Picker */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
              <label className="block text-slate-300 font-semibold mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                PHD Query Date Range
              </label>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Start Time</span>
                  <input
                    type="datetime-local"
                    value={dateRange.start}
                    onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">End Time</span>
                  <input
                    type="datetime-local"
                    value={dateRange.end}
                    onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Quick Shift Presets */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10)
                    onDateRangeChange({
                      start: `${today}T07:00`,
                      end: `${today}T15:00`,
                    })
                  }}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 transition"
                >
                  Shift Pagi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10)
                    onDateRangeChange({
                      start: `${today}T15:00`,
                      end: `${today}T23:00`,
                    })
                  }}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 transition"
                >
                  Shift Sore
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10)
                    onDateRangeChange({
                      start: `${today}T00:00`,
                      end: `${today}T07:00`,
                    })
                  }}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 transition"
                >
                  Shift Malam
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10)
                    onDateRangeChange({
                      start: `${today}T00:00`,
                      end: `${today}T23:59`,
                    })
                  }}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 transition"
                >
                  24H Today
                </button>
              </div>
            </div>

            {/* 2. PocketBase Backend Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
              <span className="text-slate-300 font-semibold mb-2 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                PocketBase Sync
              </span>
              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                Connected to <code className="text-emerald-300">base.loc-2.com</code>. Edits in FEU/MDU and Issue
                sections auto-sync to <code className="text-amber-300">daily_report</code>.
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-1.5">
                <span>Last Saved:</span>
                <span className="font-mono text-slate-200">
                  {lastSavedTime ? new Date(lastSavedTime).toLocaleTimeString() : 'Not saved yet'}
                </span>
              </div>
            </div>

            {/* 3. Export & Archive Guidelines */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-400">
              <span className="text-slate-300 font-semibold mb-2 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                Export &amp; Archive Info
              </span>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong>1080p Export:</strong> Renders a high-res screenshot without the control bar.
                </li>
                <li>
                  <strong>Auto-Save:</strong> Automatically snapshots full data at 23:00 to PocketBase archive.
                </li>
                <li>
                  <strong>Mode Switch:</strong> Double-click Unit 023/024 in table to change mode (LMO/MMO/DAO).
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

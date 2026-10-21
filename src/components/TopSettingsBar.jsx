import { useState } from 'react'
import html2canvas from 'html2canvas-pro'
import { calculateTargetTD } from '../utils/calculations.js'
import {
  Settings,
  ChevronUp,
  ChevronDown,
  Camera,
  Save,
  RefreshCw,
  Database,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from './Icons.jsx'

export default function TopSettingsBar({
  dateRange,
  onDateRangeChange,
  phdPreset = 'now',
  onPhdPresetChange,
  onRefreshData,
  onManualSave,
  isSaving,
  isRefreshing,
  pocketBaseConnected,
  lastSavedTime,
  onToggleVisibility,
  feuMduData = {},
  onFeuMduChange,
  unitModes = { unit023: 'MMO', unit024: 'LMO' },
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type })
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Active operational modes
  const feuMode = unitModes?.unit023 || 'MMO'
  const mduMode = unitModes?.unit024 || 'LMO'

  // Designs
  const hvuDesign = Number(feuMduData?.hvu_design ?? 3883)
  const pduDesign = Number(feuMduData?.pdu_design ?? 784)
  const activeFeuDesign =
    feuMode === 'LMO'
      ? Number(feuMduData?.feu_lmo_design ?? 2180)
      : feuMode === 'DAO'
        ? Number(feuMduData?.feu_dao_design ?? 1786)
        : Number(feuMduData?.feu_mmo_design ?? 2270)

  const activeMduDesign =
    mduMode === 'MMO'
      ? Number(feuMduData?.mdu_mmo_design ?? 777)
      : mduMode === 'DAO'
        ? Number(feuMduData?.mdu_dao_design ?? 501)
        : Number(feuMduData?.mdu_lmo_design ?? 841)

  // Target values preview
  const hvuTargetRph = calculateTargetTD(feuMduData?.hvu_rph, hvuDesign)
  const hvuTargetSts = calculateTargetTD(feuMduData?.hvu_sts, hvuDesign)
  const pduTargetRph = calculateTargetTD(feuMduData?.pdu_rph, pduDesign)
  const pduTargetSts = calculateTargetTD(feuMduData?.pdu_sts, pduDesign)

  const activeFeuSts =
    feuMode === 'LMO'
      ? feuMduData?.feu_lmo_sts
      : feuMode === 'DAO'
        ? feuMduData?.feu_dao_sts
        : feuMduData?.feu_mmo_sts
  const feuTargetRph = calculateTargetTD(feuMduData?.feu_rph, activeFeuDesign)
  const feuTargetSts = calculateTargetTD(activeFeuSts, activeFeuDesign)

  const activeMduSts =
    mduMode === 'MMO'
      ? feuMduData?.mdu_mmo_sts
      : mduMode === 'DAO'
        ? feuMduData?.mdu_dao_sts
        : feuMduData?.mdu_lmo_sts
  const mduTargetRph = calculateTargetTD(feuMduData?.mdu_rph, activeMduDesign)
  const mduTargetSts = calculateTargetTD(activeMduSts, activeMduDesign)

  // Change handlers linking to feuMduData state
  const handleHvuRph = (val) => {
    const target = calculateTargetTD(val, hvuDesign)
    onFeuMduChange?.({
      ...feuMduData,
      hvu_rph: val,
      hvu_target_rph: target !== '-' ? target : val,
    })
  }

  const handleHvuSts = (val) => {
    const target = calculateTargetTD(val, hvuDesign)
    onFeuMduChange?.({
      ...feuMduData,
      hvu_sts: val,
      hvu_target_sts: target !== '-' ? target : val,
    })
  }

  const handlePduRph = (val) => {
    const target = calculateTargetTD(val, pduDesign)
    onFeuMduChange?.({
      ...feuMduData,
      pdu_rph: val,
      pdu_target_rph: target !== '-' ? target : val,
    })
  }

  const handlePduSts = (val) => {
    const target = calculateTargetTD(val, pduDesign)
    onFeuMduChange?.({
      ...feuMduData,
      pdu_sts: val,
      pdu_target_sts: target !== '-' ? target : val,
    })
  }

  const handleFeuRph = (val) => {
    onFeuMduChange?.({
      ...feuMduData,
      feu_rph: val,
    })
  }

  const handleFeuSts = (grade, val) => {
    const fieldName = `feu_${grade.toLowerCase()}_sts`
    onFeuMduChange?.({
      ...feuMduData,
      [fieldName]: val,
    })
  }

  const handleMduRph = (val) => {
    onFeuMduChange?.({
      ...feuMduData,
      mdu_rph: val,
    })
  }

  const handleMduSts = (grade, val) => {
    const fieldName = `mdu_${grade.toLowerCase()}_sts`
    onFeuMduChange?.({
      ...feuMduData,
      [fieldName]: val,
    })
  }

  const handleSaveClick = async () => {
    try {
      await onManualSave?.()
      showToast('Data report berhasil disimpan ke database!', 'success')
    } catch (err) {
      showToast(`Gagal menyimpan: ${err.message}`, 'error')
    }
  }

  // Export 1920x1080 Image
  const handleExportImage = async () => {
    const reportElement = document.getElementById('report-dashboard-capture')
    if (!reportElement) {
      showToast('Element laporan tidak ditemukan untuk export.', 'error')
      return
    }

    try {
      setIsExporting(true)

      const now = new Date()
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
      const dayName = days[now.getDay()]
      const dd = String(now.getDate()).padStart(2, '0')
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const yyyy = now.getFullYear()
      const filename = `report - ${dayName}, ${dd}-${mm}-${yyyy}.png`

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#eef5f9',
        windowWidth: 1920,
        windowHeight: 1080,
        onclone: (clonedDoc) => {
          const captureEl = clonedDoc.getElementById('report-dashboard-capture')
          if (captureEl) {
            captureEl.classList.add('export-mode')
          }

          // Replace input elements with clean divs for pixel-perfect screenshot rendering
          const inputs = clonedDoc.querySelectorAll('input')
          inputs.forEach((input) => {
            const div = clonedDoc.createElement('div')
            div.textContent = input.value || input.placeholder || ''
            div.className = input.className
            if (input.style.cssText) {
              div.style.cssText = input.style.cssText
            }
            const isLeft = input.classList.contains('text-left')
            div.style.display = 'flex'
            div.style.alignItems = 'center'
            div.style.justifyContent = isLeft ? 'flex-start' : 'center'
            div.style.textAlign = isLeft ? 'left' : 'center'
            div.style.width = '100%'
            div.style.height = '100%'
            div.style.margin = '0'
            div.style.padding = '0'
            div.style.border = 'none'
            div.style.background = 'transparent'
            div.style.boxSizing = 'border-box'

            if (input.parentNode) {
              input.parentNode.replaceChild(div, input)
            }
          })

          // Replace textareas with clean divs
          const textareas = clonedDoc.querySelectorAll('textarea')
          textareas.forEach((textarea) => {
            const div = clonedDoc.createElement('div')
            div.textContent = textarea.value || ''
            div.className = textarea.className
            if (textarea.style.cssText) {
              div.style.cssText = textarea.style.cssText
            }
            div.style.whiteSpace = 'pre-wrap'
            div.style.wordBreak = 'break-word'
            div.style.border = 'none'
            div.style.background = 'transparent'
            div.style.boxSizing = 'border-box'

            if (textarea.parentNode) {
              textarea.parentNode.replaceChild(div, textarea)
            }
          })
        },
      })

      const link = document.createElement('a')
      link.download = filename
      link.href = canvas.toDataURL('image/png')
      link.click()

      showToast(`Berhasil mengekspor gambar ${filename}!`, 'success')
    } catch (err) {
      console.error('Export image error:', err)
      showToast(`Gagal export: ${err.message}`, 'error')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="w-full bg-slate-900 text-slate-100 border-b border-slate-700 shadow-md text-xs select-none">
      {/* Collapsed Bar / Trigger */}
      <div className="flex items-center justify-between px-3 py-1.5 max-w-[1850px] mx-auto">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 font-semibold text-slate-200 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700/80 transition cursor-pointer text-xs"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Settings</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {/* PHD Range Preset Dropdown (always visible in top bar) */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs transition">
            <Calendar className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="text-[11px] text-slate-400 font-medium hidden md:inline">PHD Query:</span>
            <select
              value={phdPreset || 'now'}
              onChange={(e) => onPhdPresetChange && onPhdPresetChange(e.target.value)}
              className="bg-transparent text-xs text-indigo-200 font-semibold focus:outline-hidden cursor-pointer"
              title="Pilih rentang waktu query PHD DCS"
            >
              <option value="now" className="bg-slate-900 text-white">Now</option>
              <option value="last_10m" className="bg-slate-900 text-white">Last 10 min</option>
              <option value="last_1h" className="bg-slate-900 text-white">Last 1 hour</option>
              <option value="last_3h" className="bg-slate-900 text-white">Last 3 hour</option>
              <option value="last_8h" className="bg-slate-900 text-white">Last 8 hour</option>
              <option value="last_24h" className="bg-slate-900 text-white">Last 24 hour</option>
              <option value="this_day" className="bg-slate-900 text-white">This Day (00:00 - now)</option>
              <option value="custom" className="bg-slate-900 text-white">Custom Range...</option>
            </select>
          </div>

          {/* Quick database connection badge */}
          <span
            className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] ${
              pocketBaseConnected
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700'
                : 'bg-amber-950/60 text-amber-400 border-amber-700'
            }`}
          >
            <Database className="w-3 h-3" />
            {pocketBaseConnected ? 'Database Connected' : 'Offline / Local'}
          </span>
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
            title="Refresh data dari PHD DCS, LIMS, dan database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer disabled:opacity-50 shadow-xs"
            title="Simpan perubahan laporan ke database PocketBase"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>

          <button
            onClick={handleExportImage}
            disabled={isExporting}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold transition cursor-pointer disabled:opacity-50 shadow-xs"
            title="Download tangkapan layar laporan dalam format gambar 1080p"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>

          {onToggleVisibility && (
            <button
              onClick={onToggleVisibility}
              className="flex items-center gap-1 px-2 py-1 rounded bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 hover:border-slate-500 transition cursor-pointer text-xs ml-1"
              title="Sembunyikan Menu Bar (Hide Top Bar)"
            >
              <ChevronUp className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden xl:inline text-[11px] font-medium">Hide Bar</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Settings Drawer */}
      {isOpen && (
        <div className="border-t border-slate-800 bg-slate-950/95 p-3.5 max-w-[1850px] mx-auto animate-in fade-in duration-150">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5">
            {/* 1. Left Column: PHD Query & Database Info (4 cols) */}
            <div className="xl:col-span-4 flex flex-col gap-3">
              {/* PHD Range Picker */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    PHD Query Range
                  </label>
                  <select
                    value={phdPreset || 'now'}
                    onChange={(e) => onPhdPresetChange && onPhdPresetChange(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-indigo-300 font-semibold focus:outline-hidden cursor-pointer"
                  >
                    <option value="now" className="bg-slate-900 text-white">Now</option>
                    <option value="last_10m" className="bg-slate-900 text-white">Last 10 min</option>
                    <option value="last_1h" className="bg-slate-900 text-white">Last 1 hour</option>
                    <option value="last_3h" className="bg-slate-900 text-white">Last 3 hour</option>
                    <option value="last_8h" className="bg-slate-900 text-white">Last 8 hour</option>
                    <option value="last_24h" className="bg-slate-900 text-white">Last 24 hour</option>
                    <option value="this_day" className="bg-slate-900 text-white">This Day (00:00 - now)</option>
                    <option value="custom" className="bg-slate-900 text-white">Custom Range...</option>
                  </select>
                </div>

                {/* Exact Dates Supplied for API */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Start Time</span>
                    <input
                      type="datetime-local"
                      value={dateRange.start}
                      onChange={(e) => {
                        if (onPhdPresetChange) onPhdPresetChange('custom')
                        onDateRangeChange({ ...dateRange, start: e.target.value })
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">End Time</span>
                    <input
                      type="datetime-local"
                      value={dateRange.end}
                      onChange={(e) => {
                        if (onPhdPresetChange) onPhdPresetChange('custom')
                        onDateRangeChange({ ...dateRange, end: e.target.value })
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { id: 'now', label: 'Now' },
                    { id: 'last_10m', label: 'Last 10m' },
                    { id: 'last_1h', label: '1h' },
                    { id: 'last_3h', label: '3h' },
                    { id: 'last_8h', label: '8h' },
                    { id: 'last_24h', label: '24h' },
                    { id: 'this_day', label: 'This Day' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onPhdPresetChange && onPhdPresetChange(p.id)}
                      className={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                        phdPreset === p.id
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Database Status Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    Database Sync
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    base.loc-2.com
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Last Saved:</span>
                  <span className="font-mono text-slate-200">
                    {lastSavedTime ? new Date(lastSavedTime).toLocaleTimeString('id-ID') : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Right Column: RPH & STS Target Settings for 021, 022, 023, 024 (8 cols) */}
            <div className="xl:col-span-8 bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                    <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">
                      Target RPH &amp; STS Configuration
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-300 bg-indigo-950/70 border border-indigo-800/80 px-2 py-0.5 rounded font-mono">
                    Auto-Sync
                  </span>
                </div>

                {/* 4 Units Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* UNIT 021 HVU II */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[11.5px] text-cyan-300">UNIT 021 HVU II</span>
                        <span className="text-[10px] text-slate-400 font-mono">Des: {hvuDesign}</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between items-center text-[10.5px] mb-0.5">
                            <span className="text-slate-400 font-medium">% RPH:</span>
                            <span className="font-mono text-cyan-400 font-semibold text-[10px]">
                              {hvuTargetRph !== '-' ? `${hvuTargetRph} T/D` : '-'}
                            </span>
                          </div>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={feuMduData?.hvu_rph ?? '-'}
                              onDoubleClick={(e) => e.target.select()}
                              onChange={(e) => handleHvuRph(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-400 rounded px-2 py-1 text-slate-100 font-mono font-bold text-center text-xs focus:outline-hidden"
                              placeholder="-"
                            />
                            <span className="absolute right-2 text-slate-400 text-[10px] font-bold">%</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[10.5px] mb-0.5">
                            <span className="text-slate-400 font-medium">% STS:</span>
                            <span className="font-mono text-cyan-400 font-semibold text-[10px]">
                              {hvuTargetSts !== '-' ? `${hvuTargetSts} T/D` : '-'}
                            </span>
                          </div>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={feuMduData?.hvu_sts ?? '-'}
                              onDoubleClick={(e) => e.target.select()}
                              onChange={(e) => handleHvuSts(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-400 rounded px-2 py-1 text-slate-100 font-mono font-bold text-center text-xs focus:outline-hidden"
                              placeholder="-"
                            />
                            <span className="absolute right-2 text-slate-400 text-[10px] font-bold">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* UNIT 022 PDU II */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[11.5px] text-cyan-300">UNIT 022 PDU II</span>
                        <span className="text-[10px] text-slate-400 font-mono">Des: {pduDesign}</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between items-center text-[10.5px] mb-0.5">
                            <span className="text-slate-400 font-medium">% RPH:</span>
                            <span className="font-mono text-cyan-400 font-semibold text-[10px]">
                              {pduTargetRph !== '-' ? `${pduTargetRph} T/D` : '-'}
                            </span>
                          </div>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={feuMduData?.pdu_rph ?? '-'}
                              onDoubleClick={(e) => e.target.select()}
                              onChange={(e) => handlePduRph(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-400 rounded px-2 py-1 text-slate-100 font-mono font-bold text-center text-xs focus:outline-hidden"
                              placeholder="-"
                            />
                            <span className="absolute right-2 text-slate-400 text-[10px] font-bold">%</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[10.5px] mb-0.5">
                            <span className="text-slate-400 font-medium">% STS:</span>
                            <span className="font-mono text-cyan-400 font-semibold text-[10px]">
                              {pduTargetSts !== '-' ? `${pduTargetSts} T/D` : '-'}
                            </span>
                          </div>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={feuMduData?.pdu_sts ?? '-'}
                              onDoubleClick={(e) => e.target.select()}
                              onChange={(e) => handlePduSts(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-400 rounded px-2 py-1 text-slate-100 font-mono font-bold text-center text-xs focus:outline-hidden"
                              placeholder="-"
                            />
                            <span className="absolute right-2 text-slate-400 text-[10px] font-bold">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* UNIT 023 FEU II */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[11.5px] text-amber-300">UNIT 023 FEU II</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">Des: {activeFeuDesign}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-300 border border-amber-800 font-bold">
                            {feuMode}
                          </span>
                        </div>
                      </div>

                      {/* RPH (%) */}
                      <div className="mb-2">
                        <div className="flex justify-between items-center text-[10.5px] mb-0.5">
                          <span className="text-slate-400 font-medium">% RPH:</span>
                          <span className="font-mono text-amber-300 font-semibold text-[10px]">
                            {feuTargetRph !== '-' ? `${feuTargetRph} T/D` : '-'}
                          </span>
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={feuMduData?.feu_rph ?? '-'}
                            onDoubleClick={(e) => e.target.select()}
                            onChange={(e) => handleFeuRph(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 focus:border-amber-400 rounded px-2 py-1 text-slate-100 font-mono font-bold text-center text-xs focus:outline-hidden"
                            placeholder="-"
                          />
                          <span className="absolute right-2 text-slate-400 text-[10px] font-bold">%</span>
                        </div>
                      </div>

                      {/* STS (%) by Grades */}
                      <div>
                        <div className="flex justify-between items-center text-[10.5px] mb-0.5">
                          <span className="text-slate-400 font-medium">% STS:</span>
                          <span className="font-mono text-amber-300 font-semibold text-[10px]">
                            {feuTargetSts !== '-' ? `${feuTargetSts} T/D` : '-'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { grade: 'LMO', val: feuMduData?.feu_lmo_sts ?? '-' },
                            { grade: 'MMO', val: feuMduData?.feu_mmo_sts ?? '-' },
                            { grade: 'DAO', val: feuMduData?.feu_dao_sts ?? '-' },
                          ].map((item) => (
                            <div
                              key={item.grade}
                              className={`rounded p-1 bg-slate-900 border ${
                                item.grade === feuMode
                                  ? 'border-amber-500/80 bg-amber-950/30'
                                  : 'border-slate-800'
                              }`}
                            >
                              <span className="block text-[9.5px] text-center text-slate-400 font-semibold mb-0.5">
                                {item.grade}
                              </span>
                              <input
                                type="text"
                                value={item.val}
                                onDoubleClick={(e) => e.target.select()}
                                onChange={(e) => handleFeuSts(item.grade, e.target.value)}
                                className="w-full bg-slate-800 border-none rounded text-center font-mono font-bold text-[11px] text-slate-100 p-0.5 focus:outline-hidden"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* UNIT 024 MDU II */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[11.5px] text-emerald-300">UNIT 024 MDU II</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">Des: {activeMduDesign}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800 font-bold">
                            {mduMode}
                          </span>
                        </div>
                      </div>

                      {/* RPH (%) */}
                      <div className="mb-2">
                        <div className="flex justify-between items-center text-[10.5px] mb-0.5">
                          <span className="text-slate-400 font-medium">% RPH:</span>
                          <span className="font-mono text-emerald-300 font-semibold text-[10px]">
                            {mduTargetRph !== '-' ? `${mduTargetRph} T/D` : '-'}
                          </span>
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={feuMduData?.mdu_rph ?? '-'}
                            onDoubleClick={(e) => e.target.select()}
                            onChange={(e) => handleMduRph(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-400 rounded px-2 py-1 text-slate-100 font-mono font-bold text-center text-xs focus:outline-hidden"
                            placeholder="-"
                          />
                          <span className="absolute right-2 text-slate-400 text-[10px] font-bold">%</span>
                        </div>
                      </div>

                      {/* STS (%) by Grades */}
                      <div>
                        <div className="flex justify-between items-center text-[10.5px] mb-0.5">
                          <span className="text-slate-400 font-medium">% STS:</span>
                          <span className="font-mono text-emerald-300 font-semibold text-[10px]">
                            {mduTargetSts !== '-' ? `${mduTargetSts} T/D` : '-'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { grade: 'LMO', val: feuMduData?.mdu_lmo_sts ?? '-' },
                            { grade: 'MMO', val: feuMduData?.mdu_mmo_sts ?? '-' },
                            { grade: 'DAO', val: feuMduData?.mdu_dao_sts ?? '-' },
                          ].map((item) => (
                            <div
                              key={item.grade}
                              className={`rounded p-1 bg-slate-900 border ${
                                item.grade === mduMode
                                  ? 'border-emerald-500/80 bg-emerald-950/30'
                                  : 'border-slate-800'
                              }`}
                            >
                              <span className="block text-[9.5px] text-center text-slate-400 font-semibold mb-0.5">
                                {item.grade}
                              </span>
                              <input
                                type="text"
                                value={item.val}
                                onDoubleClick={(e) => e.target.select()}
                                onChange={(e) => handleMduSts(item.grade, e.target.value)}
                                className="w-full bg-slate-800 border-none rounded text-center font-mono font-bold text-[11px] text-slate-100 p-0.5 focus:outline-hidden"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/80 mt-2 flex items-center justify-end">
                <span className="text-slate-400 font-mono">Formula Target: ( % / 100 ) × Design T/D</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

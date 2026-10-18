import { useState, useEffect } from 'react'
import { X, Check } from './Icons.jsx'

export default function UnitStatusModal({
  isOpen,
  onClose,
  unitName,
  currentStatus,
  onSelectStatus,
}) {
  const [customInput, setCustomInput] = useState('')

  useEffect(() => {
    if (isOpen) {
      setCustomInput('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const presetStatuses = [
    {
      id: 'Normal Operasi',
      label: 'NORMAL OPERASI',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    },
    {
      id: 'Shutdown',
      label: 'SHUTDOWN',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-300',
    },
    {
      id: 'Sirkulasi',
      label: 'SIRKULASI',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-300',
    },
  ]

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    if (customInput.trim()) {
      onSelectStatus(customInput.trim())
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 text-xs text-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Pilih Status Operasi</h3>
            <p className="text-[11px] text-slate-500">{unitName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-slate-600 mb-3">
          Pilih status operasional unit atau masukkan status custom secara manual:
        </p>

        {/* Preset Status Options */}
        <div className="space-y-2 mb-4">
          {presetStatuses.map((st) => {
            const isSelected =
              String(currentStatus || '').toLowerCase() === st.id.toLowerCase()
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  onSelectStatus(st.id)
                  onClose()
                }}
                className={`w-full text-left p-3 rounded-lg border transition flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">{st.label}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${st.badgeClass}`}>
                    {st.id}
                  </span>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Manual Custom Input */}
        <div className="pt-3 border-t border-slate-200 mb-4">
          <label className="font-bold text-slate-700 block mb-1.5 text-[11px]">
            Input Status Manual:
          </label>
          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Contoh: Startup, Turun Rate, Perbaikan..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:border-indigo-500 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={!customInput.trim()}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs"
            >
              Simpan
            </button>
          </form>
        </div>

        <div className="text-right">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

import { X, Check } from './Icons.jsx'

export default function UnitModeModal({
  isOpen,
  onClose,
  unitName, // 'Unit 023 FEU II' or 'Unit 024 MDU II'
  currentMode, // 'LMO', 'MMO', 'DAO'
  onSelectMode,
}) {
  if (!isOpen) return null

  const modes = [
    {
      id: 'LMO',
      label: 'LMO (Light Machine Oil)',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-300',
    },
    {
      id: 'MMO',
      label: 'MMO (Medium Machine Oil)',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    },
    {
      id: 'DAO',
      label: 'DAO (De-Asphalted Oil)',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-300',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 text-xs text-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Switch Operation Mode</h3>
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
          Select the active feed grade mode. Target STS &amp; RPH and DCS tags will automatically switch based on this mode:
        </p>

        <div className="space-y-2 mb-4">
          {modes.map((m) => {
            const isSelected = currentMode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onSelectMode(m.id)
                  onClose()
                }}
                className={`w-full text-left p-3 rounded-lg border transition flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">{m.label}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${m.badgeClass}`}>
                    {m.id}
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

        <div className="text-right">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Plus, Trash2, X, Save } from './Icons.jsx'

export default function IssueEditModal({
  isOpen,
  onClose,
  title,
  type, // 'operational' (array of strings) or 'maintenance' (array of { equipment, issue, mitigation })
  initialData,
  onSave,
}) {
  const [data, setData] = useState([])

  // Re-sync and normalize data whenever modal is opened or type/initialData changes
  useEffect(() => {
    if (!isOpen) return

    if (type === 'operational') {
      const normalized = Array.isArray(initialData)
        ? initialData.map((item) => {
            if (typeof item === 'string') return item
            if (typeof item === 'object' && item !== null) {
              return item.equipment
                ? `${item.equipment} : ${item.issue || ''}${item.mitigation ? ' (' + item.mitigation + ')' : ''}`
                : item.issue || JSON.stringify(item)
            }
            return String(item ?? '')
          })
        : []
      setData(normalized)
    } else {
      const normalized = Array.isArray(initialData)
        ? initialData.map((item) => {
            if (typeof item === 'object' && item !== null) {
              return {
                equipment: item.equipment || '',
                issue: item.issue || '',
                mitigation: item.mitigation || '',
              }
            }
            return { equipment: '', issue: String(item ?? ''), mitigation: '' }
          })
        : []
      setData(normalized)
    }
  }, [isOpen, type, initialData])

  if (!isOpen) return null

  const handleAdd = () => {
    if (type === 'operational') {
      setData([...data, ''])
    } else {
      setData([...data, { equipment: '', issue: '', mitigation: '' }])
    }
  }

  const handleRemove = (index) => {
    setData(data.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (type === 'operational') {
      const normalized = data.map((item) => {
        if (typeof item === 'string') return item
        if (typeof item === 'object' && item !== null) {
          return item.equipment
            ? `${item.equipment} : ${item.issue || ''}${item.mitigation ? ' (' + item.mitigation + ')' : ''}`
            : item.issue || JSON.stringify(item)
        }
        return String(item ?? '')
      })
      onSave(normalized)
    } else {
      const normalized = data.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return {
            equipment: item.equipment || '',
            issue: item.issue || '',
            mitigation: item.mitigation || '',
          }
        }
        return { equipment: '', issue: String(item ?? ''), mitigation: '' }
      })
      onSave(normalized)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-5 text-xs text-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <span>✏️</span> Edit {title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto space-y-2 mb-4 pr-1">
          {type === 'operational' ? (
            data.length === 0 ? (
              <div className="text-slate-400 italic text-center py-4">No operational issues recorded. Click &quot;Add Issue&quot; below.</div>
            ) : (
              data.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 text-slate-400 font-mono text-center">{idx + 1}.</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...data]
                      updated[idx] = e.target.value
                      setData(updated)
                    }}
                    placeholder="Enter issue description..."
                    className="flex-1 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                  <button
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )
          ) : (
            data.length === 0 ? (
              <div className="text-slate-400 italic text-center py-4">No maintenance issues recorded. Click &quot;Add Equipment Issue&quot; below.</div>
            ) : (
              <div className="space-y-3">
                {data.map((row, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Item #{idx + 1}</span>
                      <button
                        onClick={() => handleRemove(idx)}
                        className="text-rose-500 hover:text-rose-700 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Equipment</span>
                        <input
                          type="text"
                          value={row.equipment || ''}
                          onChange={(e) => {
                            const updated = [...data]
                            updated[idx].equipment = e.target.value
                            setData(updated)
                          }}
                          placeholder="e.g. 024P-107A"
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Issue</span>
                        <input
                          type="text"
                          value={row.issue || ''}
                          onChange={(e) => {
                            const updated = [...data]
                            updated[idx].issue = e.target.value
                            setData(updated)
                          }}
                          placeholder="e.g. Motor vibrasi"
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Mitigasi / RTL</span>
                        <input
                          type="text"
                          value={row.mitigation || ''}
                          onChange={(e) => {
                            const updated = [...data]
                            updated[idx].mitigation = e.target.value
                            setData(updated)
                          }}
                          placeholder="e.g. Perbaikan motor di WS..."
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer transition shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

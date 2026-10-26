import { useState } from 'react'
import {
  X,
  Database,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  FileText,
} from './Icons.jsx'

export default function SavedPocketBaseModal({
  isOpen,
  onClose,
  dataResult, // { success, date, source, id, created, updated, record }
  isLoading,
  onLoadToDashboard,
}) {
  const [activeTab, setActiveTab] = useState('summary') // 'summary' | 'issues' | 'json'
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const record = dataResult?.record || {}
  const feuMdu = record.feu_mdu_data || {}
  const operationalIssues = Array.isArray(record.issue_operational)
    ? record.issue_operational
    : []
  const maintenanceIssues = Array.isArray(record.issue_maintenance)
    ? record.issue_maintenance
    : []
  const unitModes = record.unit_modes || { unit023: 'MMO', unit024: 'LMO' }
  const unitStatuses =
    unitModes.statuses ||
    record.unit_statuses ||
    feuMdu.unit_statuses || {
      unit021: 'Normal Operasi',
      unit022: 'Normal Operasi',
      unit023: 'Normal Operasi',
      unit024: 'Normal Operasi',
      hos: 'Normal Operasi',
    }

  const handleCopyJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(record, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.warn('Copy failed', err)
    }
  }

  const handleLoad = () => {
    if (onLoadToDashboard && dataResult?.success) {
      onLoadToDashboard(dataResult)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col text-slate-100 text-xs overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100">
                  Data Tersimpan di PocketBase
                </h3>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-300">
                  {dataResult?.date || '-'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Pemeriksaan arsip laporan database PocketBase (base.loc-2.com)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-medium">
                Mengambil data dari PocketBase...
              </span>
            </div>
          ) : !dataResult?.success ? (
            <div className="py-10 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-950/50 border border-amber-800/80 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-200 text-sm mb-1">
                Data Tidak Ditemukan
              </h4>
              <p className="text-slate-400 text-xs max-w-md mx-auto mb-4">
                {dataResult?.message ||
                  `Tidak ada rekaman laporan yang tersimpan di PocketBase untuk tanggal ${dataResult?.date}.`}
              </p>
              <div className="text-[11px] text-slate-500 bg-slate-950 p-2.5 rounded border border-slate-800 inline-block font-mono">
                Tips: Gunakan tombol Save di top bar untuk menyimpan laporan hari
                ini ke PocketBase.
              </div>
            </div>
          ) : (
            <>
              {/* Metadata Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="font-semibold">Record Ditemukan</span>
                  </span>
                  <span className="text-slate-400">
                    Sumber:{' '}
                    <span className="font-mono text-slate-200">
                      {dataResult.source}
                    </span>
                  </span>
                  {dataResult.id && (
                    <span className="text-slate-400">
                      ID:{' '}
                      <span className="font-mono text-slate-200">
                        {dataResult.id}
                      </span>
                    </span>
                  )}
                </div>
                <div className="text-slate-400 font-mono text-[10px]">
                  Updated:{' '}
                  <span className="text-slate-200">
                    {dataResult.updated
                      ? new Date(dataResult.updated).toLocaleString('id-ID')
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-800 gap-1">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-3 py-1.5 font-semibold text-xs transition cursor-pointer border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'summary'
                      ? 'border-cyan-400 text-cyan-300 bg-slate-800/40'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ringkasan Data</span>
                </button>
                <button
                  onClick={() => setActiveTab('issues')}
                  className={`px-3 py-1.5 font-semibold text-xs transition cursor-pointer border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'issues'
                      ? 'border-cyan-400 text-cyan-300 bg-slate-800/40'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>
                    Issues (
                    {operationalIssues.length + maintenanceIssues.length})
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1.5 font-semibold text-xs transition cursor-pointer border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'json'
                      ? 'border-cyan-400 text-cyan-300 bg-slate-800/40'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Raw JSON</span>
                </button>
              </div>

              {/* Tab 1: Ringkasan */}
              {activeTab === 'summary' && (
                <div className="space-y-3">
                  {/* Mode & Status Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-slate-950/70 border border-slate-800 p-2 rounded">
                      <span className="text-[10px] text-slate-400 block mb-0.5">
                        Mode Unit 023 FEU II
                      </span>
                      <span className="font-bold text-amber-300 text-xs">
                        {unitModes?.unit023 || 'MMO'}
                      </span>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800 p-2 rounded">
                      <span className="text-[10px] text-slate-400 block mb-0.5">
                        Mode Unit 024 MDU II
                      </span>
                      <span className="font-bold text-emerald-300 text-xs">
                        {unitModes?.unit024 || 'LMO'}
                      </span>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800 p-2 rounded">
                      <span className="text-[10px] text-slate-400 block mb-0.5">
                        Pompa HOS
                      </span>
                      <span className="font-bold text-slate-200 text-xs">
                        {feuMdu?.pompa_hos || '-'}
                      </span>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800 p-2 rounded">
                      <span className="text-[10px] text-slate-400 block mb-0.5">
                        Visual Perairan
                      </span>
                      <span
                        className={`font-bold text-xs ${
                          String(feuMdu?.visual_perairan || '')
                            .toUpperCase()
                            .includes('CLEAR')
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {feuMdu?.visual_perairan || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Kapasitas Feed Table */}
                  <div className="border border-slate-800 rounded-lg overflow-hidden">
                    <div className="bg-slate-950 px-3 py-1.5 font-bold text-[11px] text-cyan-300 border-b border-slate-800">
                      Kapasitas Feed Tersimpan
                    </div>
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                          <th className="p-1.5 pl-3">Unit</th>
                          <th className="p-1.5 text-center">Status</th>
                          <th className="p-1.5 text-center">Aktual (T/D)</th>
                          <th className="p-1.5 text-center">Design</th>
                          <th className="p-1.5 text-center">% RPH</th>
                          <th className="p-1.5 text-center">% STS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        <tr>
                          <td className="p-1.5 pl-3 font-sans font-semibold text-slate-200">
                            UNIT 021 HVU II
                          </td>
                          <td className="p-1.5 text-center text-slate-300">
                            {unitStatuses?.unit021 || '-'}
                          </td>
                          <td className="p-1.5 text-center font-bold text-cyan-300">
                            {feuMdu?.hvu_actual ?? '-'}
                          </td>
                          <td className="p-1.5 text-center text-slate-400">
                            {feuMdu?.hvu_design ?? 3883}
                          </td>
                          <td className="p-1.5 text-center text-slate-300">
                            {feuMdu?.hvu_rph ?? '-'}%
                          </td>
                          <td className="p-1.5 text-center text-slate-300">
                            {feuMdu?.hvu_sts ?? '-'}%
                          </td>
                        </tr>
                        <tr>
                          <td className="p-1.5 pl-3 font-sans font-semibold text-slate-200">
                            UNIT 022 PDU II
                          </td>
                          <td className="p-1.5 text-center text-slate-300">
                            {unitStatuses?.unit022 || '-'}
                          </td>
                          <td className="p-1.5 text-center font-bold text-cyan-300">
                            {feuMdu?.pdu_actual ?? '-'}
                          </td>
                          <td className="p-1.5 text-center text-slate-400">
                            {feuMdu?.pdu_design ?? 784}
                          </td>
                          <td className="p-1.5 text-center text-slate-300">
                            {feuMdu?.pdu_rph ?? '-'}%
                          </td>
                          <td className="p-1.5 text-center text-slate-300">
                            {feuMdu?.pdu_sts ?? '-'}%
                          </td>
                        </tr>
                        <tr>
                          <td className="p-1.5 pl-3 font-sans font-semibold text-slate-200">
                            UNIT 023 FEU II
                          </td>
                          <td className="p-1.5 text-center text-slate-300">
                            {unitStatuses?.unit023 || '-'}
                          </td>
                          <td className="p-1.5 text-center font-bold text-cyan-300">
                            {feuMdu?.feu_actual ?? '-'}
                          </td>
                          <td className="p-1.5 text-center text-slate-400">
                            {unitModes?.unit023 === 'LMO'
                              ? feuMdu?.feu_lmo_design ?? 2180
                              : unitModes?.unit023 === 'DAO'
                                ? feuMdu?.feu_dao_design ?? 1786
                                : feuMdu?.feu_mmo_design ?? 2270}
                          </td>
                          <td className="p-1.5 text-center text-slate-300">
                            {feuMdu?.feu_rph ?? '-'}%
                          </td>
                          <td className="p-1.5 text-center text-slate-300">
                            {unitModes?.unit023 === 'LMO'
                              ? feuMdu?.feu_lmo_sts ?? '-'
                              : unitModes?.unit023 === 'DAO'
                                ? feuMdu?.feu_dao_sts ?? '-'
                                : feuMdu?.feu_mmo_sts ?? '-'}
                            %
                          </td>
                        </tr>
                        <tr>
                          <td className="p-1.5 pl-3 font-sans font-semibold text-slate-200">
                            UNIT 024 MDU II
                          </td>
                          <td className="p-1.5 text-center text-slate-300">
                            {unitStatuses?.unit024 || '-'}
                          </td>
                          <td className="p-1.5 text-center font-bold text-cyan-300">
                            {feuMdu?.mdu_actual ?? '-'}
                          </td>
                          <td className="p-1.5 text-center text-slate-400">
                            {unitModes?.unit024 === 'MMO'
                              ? feuMdu?.mdu_mmo_design ?? 777
                              : unitModes?.unit024 === 'DAO'
                                ? feuMdu?.mdu_dao_design ?? 501
                                : feuMdu?.mdu_lmo_design ?? 841}
                          </td>
                          <td className="p-1.5 text-center text-slate-300">
                            {feuMdu?.mdu_rph ?? '-'}%
                          </td>
                          <td className="p-1.5 text-center text-slate-300">
                            {unitModes?.unit024 === 'MMO'
                              ? feuMdu?.mdu_mmo_sts ?? '-'
                              : unitModes?.unit024 === 'DAO'
                                ? feuMdu?.mdu_dao_sts ?? '-'
                                : feuMdu?.mdu_lmo_sts ?? '-'}
                            %
                          </td>
                        </tr>
                        <tr>
                          <td className="p-1.5 pl-3 font-sans font-semibold text-slate-200">
                            HOS II
                          </td>
                          <td className="p-1.5 text-center text-slate-300">
                            {unitStatuses?.hos || '-'}
                          </td>
                          <td className="p-1.5 text-center font-bold text-cyan-300">
                            {feuMdu?.hos_actual ?? '-'}
                          </td>
                          <td className="p-1.5 text-center text-slate-400">-</td>
                          <td className="p-1.5 text-center text-slate-400">-</td>
                          <td className="p-1.5 text-center text-slate-400">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Produksi Actuals & Stocks Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-slate-800 rounded-lg p-2.5 bg-slate-950/60">
                      <span className="font-bold text-[11px] text-amber-300 block mb-1.5">
                        Produksi Actuals (T/D)
                      </span>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10.5px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">SPO:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {feuMdu?.spo_actual ?? '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">LMO Dist:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {feuMdu?.lmo_dist_actual ?? '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">MMO Dist:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {feuMdu?.mmo_dist_actual ?? '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Short Res:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {feuMdu?.short_residue_actual ?? '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">DAO:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {feuMdu?.dao_actual ?? '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Asphalt:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {feuMdu?.asphalt_actual ?? '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Raffinate:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {feuMdu?.raff_actual ?? '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Extract:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {feuMdu?.extract_actual ?? '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">DOR:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {feuMdu?.dor_actual ?? '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Slack Wax:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {feuMdu?.slack_wax_actual ?? '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-800 rounded-lg p-2.5 bg-slate-950/60 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-[11px] text-emerald-300 block mb-1.5">
                          Tank Stocks &amp; Operasional
                        </span>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10.5px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Stock HVI 95:</span>
                            <span className="font-mono font-bold text-slate-200">
                              {feuMdu?.stock_hvi_95 ?? '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Flow LOC II:</span>
                            <span className="font-mono font-bold text-slate-200">
                              {feuMdu?.flow_hvi_95_loc2 ?? '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Stock 160S:</span>
                            <span className="font-mono font-bold text-slate-200">
                              {feuMdu?.stock_hvi_160s ?? '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Flow LOC II:</span>
                            <span className="font-mono font-bold text-slate-200">
                              {feuMdu?.flow_hvi_160s_loc2 ?? '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Stock 650:</span>
                            <span className="font-mono font-bold text-slate-200">
                              {feuMdu?.stock_hvi_650 ?? '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Flow LOC II:</span>
                            <span className="font-mono font-bold text-slate-200">
                              {feuMdu?.flow_hvi_650_loc2 ?? '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Level CPI:</span>
                            <span className="font-mono font-bold text-slate-200">
                              {feuMdu?.level_cpi ?? '-'}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">023C104:</span>
                            <span className="font-mono font-bold text-slate-200">
                              {feuMdu?.level_023c104 ?? '-'}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {feuMdu?.note && (
                        <div className="mt-2 pt-2 border-t border-slate-800 text-[10.5px]">
                          <span className="text-slate-400 font-semibold block mb-0.5">
                            Catatan:
                          </span>
                          <p className="text-slate-300 italic line-clamp-2">
                            {feuMdu.note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Issues */}
              {activeTab === 'issues' && (
                <div className="space-y-3">
                  <div>
                    <h5 className="font-bold text-xs text-amber-300 mb-1.5 flex items-center gap-1.5">
                      <span>Issue Operasional</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 border border-amber-800 font-mono">
                        {operationalIssues.length}
                      </span>
                    </h5>
                    {operationalIssues.length > 0 ? (
                      <ol className="list-decimal pl-5 space-y-1 bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200">
                        {operationalIssues.map((issue, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {typeof issue === 'string'
                              ? issue
                              : issue.equipment
                                ? `${issue.equipment}: ${issue.issue}`
                                : JSON.stringify(issue)}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div className="bg-slate-950 p-3 rounded border border-slate-800 text-slate-500 italic text-center">
                        Tidak ada issue operasional tersimpan.
                      </div>
                    )}
                  </div>

                  <div>
                    <h5 className="font-bold text-xs text-cyan-300 mb-1.5 flex items-center gap-1.5">
                      <span>Issue Maintenance</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 font-mono">
                        {maintenanceIssues.length}
                      </span>
                    </h5>
                    {maintenanceIssues.length > 0 ? (
                      <div className="border border-slate-800 rounded overflow-hidden">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                              <th className="p-1.5 pl-2.5 w-[25%]">Equipment</th>
                              <th className="p-1.5 w-[45%]">Issue</th>
                              <th className="p-1.5 w-[30%]">Mitigasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 font-sans">
                            {maintenanceIssues.map((m, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/30">
                                <td className="p-1.5 pl-2.5 font-bold text-cyan-300">
                                  {m.equipment || '-'}
                                </td>
                                <td className="p-1.5 text-slate-200">
                                  {m.issue || '-'}
                                </td>
                                <td className="p-1.5 text-slate-400">
                                  {m.mitigation || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-slate-950 p-3 rounded border border-slate-800 text-slate-500 italic text-center">
                        Tidak ada issue maintenance tersimpan.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Raw JSON */}
              {activeTab === 'json' && (
                <div className="relative">
                  <div className="absolute top-2 right-2 z-10">
                    <button
                      onClick={handleCopyJson}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] cursor-pointer transition shadow-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">
                            Tersalin!
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Salin JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[10.5px] font-mono text-cyan-200 overflow-x-auto max-h-[45vh] leading-relaxed">
                    {JSON.stringify(record, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-800 bg-slate-950/80">
          <div className="text-[10px] text-slate-400">
            {dataResult?.success && (
              <span>
                💡 Klik &quot;Load ke Dashboard&quot; untuk menampilkan seluruh
                tabel dan grafik tanggal ini.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition cursor-pointer text-xs"
            >
              Tutup
            </button>
            {dataResult?.success && onLoadToDashboard && (
              <button
                onClick={handleLoad}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition cursor-pointer text-xs shadow-xs"
                title="Tampilkan laporan tanggal ini pada dashboard utama"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Load ke Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

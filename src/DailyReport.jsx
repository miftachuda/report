import { useState } from 'react'
import './dailyReport.css'
import danantaraLogo from './assets/danantara.png'
import pertaminaLogo from './assets/pertamina.png'
import IssueEditModal from './components/IssueEditModal.jsx'
import UnitModeModal from './components/UnitModeModal.jsx'
import {
  calculateActualTD,
  calculateTargetTD,
  calculateAchievedPercent,
  calculateProductGroupTons,
  evaluateSampleLimit,
} from './utils/calculations.js'

export default function DailyReport({
  dateDisplay,
  feuMduData,
  onFeuMduChange,
  issueOperational,
  onIssueOperationalChange,
  issueMaintenance,
  onIssueMaintenanceChange,
  unitModes,
  onUnitModeChange,
  phdData = {},
  tanks = [],
  sampleLimits = [],
  limsData = {},
}) {
  // Modal state for double-click editing
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    type: null, // 'operational' | 'maintenance' | 'unit_mode'
    unitKey: null,
  })

  // Calculations for Kapasitas Feed
  // Unit 021 HVU II
  const hvuFlow = phdData['021FI_004.pv'] ?? null
  const hvuSg = phdData['021FY_004X.C1'] ?? null
  const hvuActual = calculateActualTD(hvuFlow, hvuSg) ?? 2583
  const hvuDesign = 3883
  const hvuTargetRph = 2524
  const hvuTargetSts = 2524
  const hvuPercentPrh = calculateAchievedPercent(hvuActual, hvuTargetRph) ?? '102.4'
  const hvuPercentSts = calculateAchievedPercent(hvuActual, hvuTargetSts) ?? '102.4'

  // Unit 022 PDU II
  const pduFlow = phdData['022FI_001.pv'] ?? null
  const pduSg = phdData['022FY_001X.C1'] ?? null
  const pduActual = calculateActualTD(pduFlow, pduSg) ?? 635
  const pduDesign = 784
  const pduTargetRph = 627
  const pduTargetSts = 549
  const pduPercentPrh = calculateAchievedPercent(pduActual, pduTargetRph) ?? '101.3'
  const pduPercentSts = calculateAchievedPercent(pduActual, pduTargetSts) ?? '115.8'

  // Unit 023 FEU II (Active Mode: LMO / MMO / DAO)
  const feuMode = unitModes?.unit023 || 'MMO'
  let feuDesign = 2270
  let feuStsPercent = feuMduData?.feu_mmo_sts ?? 65
  let feuTagFlow = '023FI_004.pv'
  let feuTagSg = '023FY_004CX.C1'

  if (feuMode === 'LMO') {
    feuDesign = Number(feuMduData?.feu_lmo_design || 2180)
    feuStsPercent = Number(feuMduData?.feu_lmo_sts || 70)
    feuTagSg = '023FY_004BX.C1'
  } else if (feuMode === 'DAO') {
    feuDesign = Number(feuMduData?.feu_dao_design || 1786)
    feuStsPercent = Number(feuMduData?.feu_dao_sts || 70)
    feuTagSg = '023FY_004DX.C1'
  } else {
    feuDesign = Number(feuMduData?.feu_mmo_design || 2270)
    feuStsPercent = Number(feuMduData?.feu_mmo_sts || 65)
    feuTagSg = '023FY_004CX.C1'
  }

  const feuRphPercent = Number(feuMduData?.feu_rph || 65)
  const feuTargetRph = calculateTargetTD(feuRphPercent, feuDesign) ?? 1476
  const feuTargetSts = calculateTargetTD(feuStsPercent, feuDesign) ?? 1476
  const feuFlow = phdData[feuTagFlow] ?? null
  const feuSg = phdData[feuTagSg] ?? null
  const feuActual = calculateActualTD(feuFlow, feuSg) ?? 1750
  const feuPercentPrh = calculateAchievedPercent(feuActual, feuTargetRph) ?? '118.6'
  const feuPercentSts = calculateAchievedPercent(feuActual, feuTargetSts) ?? '118.6'

  // Unit 024 MDU II (Active Mode: LMO / MMO / DAO)
  const mduMode = unitModes?.unit024 || 'LMO'
  let mduDesign = 841
  let mduStsPercent = feuMduData?.mdu_lmo_sts ?? 65

  if (mduMode === 'MMO') {
    mduDesign = Number(feuMduData?.mdu_mmo_design || 777)
    mduStsPercent = Number(feuMduData?.mdu_mmo_sts || 65)
  } else if (mduMode === 'DAO') {
    mduDesign = Number(feuMduData?.mdu_dao_design || 501)
    mduStsPercent = Number(feuMduData?.mdu_dao_sts || 0)
  } else {
    mduDesign = Number(feuMduData?.mdu_lmo_design || 841)
    mduStsPercent = Number(feuMduData?.mdu_lmo_sts || 65)
  }

  const mduRphPercent = Number(feuMduData?.mdu_rph || 65)
  const mduTargetRph = calculateTargetTD(mduRphPercent, mduDesign) ?? 547
  const mduTargetSts = calculateTargetTD(mduStsPercent, mduDesign) ?? 547
  const mduFlow = phdData['024FI_001.pv'] ?? null
  const mduActual = mduFlow ? Math.round(Number(mduFlow) * 0.85 * 24) : 561
  const mduPercentPrh = calculateAchievedPercent(mduActual, mduTargetRph) ?? '102.6'
  const mduPercentSts = calculateAchievedPercent(mduActual, mduTargetSts) ?? '102.6'

  // Unit 025 HOS II & Levels
  const hosFlow = phdData['025FI_004.pv'] ?? null
  const hosSg = phdData['025FY_004X.PV'] ?? null
  const hosActual = calculateActualTD(hosFlow, hosSg) ?? 23808
  const level023C104 = phdData['023LI_005.PV'] !== undefined && phdData['023LI_005.PV'] !== null
    ? Number(phdData['023LI_005.PV']).toFixed(1)
    : '1.4'
  const levelCpi = phdData['002LI_051.PV'] !== undefined && phdData['002LI_051.PV'] !== null
    ? Number(phdData['002LI_051.PV']).toFixed(1)
    : '22.0'

  // Tank Farm Product Stocks (Tons calculated from tank dimensions and tag levels)
  const tanksHvi95 = ['41T-101', '41T-102', '41T-104']
  const tanksHvi160S = ['41T-103', '41T-107', '41T-108']
  const tanksHvi650 = ['41T-105', '41T-106', '41T-109', '41T-110']

  const calculatedStockHvi95 = calculateProductGroupTons(tanksHvi95, tanks, phdData) || 2951
  const calculatedStockHvi160S = calculateProductGroupTons(tanksHvi160S, tanks, phdData) || 1048
  const calculatedStockHvi650 = calculateProductGroupTons(tanksHvi650, tanks, phdData) || 3481

  // Helper to render LIMS parameter cell with limit comparison
  const renderLimsParam = (sampleCode, paramName, fallbackVal, unit = '') => {
    const sample = limsData?.samples?.[sampleCode]
    let rawVal = sample?.[paramName]?.value ?? fallbackVal

    // Find limit record in sampleLimits from PocketBase
    const limitRecord = sampleLimits.find(
      (lim) => lim.sample_code === sampleCode && lim.param_name === paramName
    )

    const evaluated = evaluateSampleLimit(rawVal, limitRecord)

    return (
      <span className="inline-flex items-center gap-0.5">
        <span
          className={
            evaluated.isOutOfRange
              ? 'lims-val-alert'
              : 'lims-val-normal'
          }
          title={evaluated.isOutOfRange ? 'Out of specification limit' : 'Within limit'}
        >
          {evaluated.formattedValue}
        </span>
        {unit && <span className="font-bold text-[8.5px] ml-0.5">{unit}</span>}
        {evaluated.limitLabel && (
          <span className="lims-limit-range" title="Specification Limits">
            {evaluated.limitLabel}
          </span>
        )}
      </span>
    )
  }

  return (
    <div id="report-dashboard-capture" className="daily-report-body">
      <div className="dashboard-container">
        {/* TOP HEADER */}
        <div className="top-banner">
          <div className="logo-left">
            <img src={danantaraLogo} alt="Danantara Indonesia" className="logo-img" />
          </div>
          <div className="banner-title">DAILY REPORT LOC II</div>
          <div className="logo-right">
            <img src={pertaminaLogo} alt="Pertamina Patra Niaga" className="logo-img" />
          </div>
        </div>

        {/* DATE BAR */}
        <div className="date-bar">
          <div className="flex items-center gap-2">
            <span className="font-bold">Tanggal:</span>
            <span>{dateDisplay || 'Sabtu, 17 Oktober 2026'}</span>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span>Shift: <strong className="text-slate-700">{limsData?.shift || 'Malam'}</strong></span>
            <span className="hidden md:inline">Double-click on sections or unit modes to edit</span>
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="main-grid">
          {/* LEFT COLUMN */}
          <div className="left-col">
            {/* KAPASITAS FEED */}
            <div className="card card-feed">
              <div className="card-title">KAPASITAS FEED</div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '16%' }}>UNIT</th>
                    <th style={{ width: '16%' }}>Status</th>
                    <th style={{ width: '12%' }}>Design (T/D)</th>
                    <th style={{ width: '12%' }}>Aktual (T/D)</th>
                    <th style={{ width: '14%' }}>Target RPH (T/D)</th>
                    <th style={{ width: '12%' }}>Target STS</th>
                    <th style={{ width: '9%' }}>% PRH</th>
                    <th style={{ width: '9%' }}>% STS</th>
                  </tr>
                </thead>
                <tbody>
                  {/* UNIT 021 */}
                  <tr>
                    <td className="text-center font-bold">UNIT 021 HVU II</td>
                    <td className="text-center text-green">Normal Operasi</td>
                    <td className="text-center">{hvuDesign}</td>
                    <td className="text-center font-semibold text-slate-900">{hvuActual}</td>
                    <td className="text-center">{hvuTargetRph}</td>
                    <td className="text-center">{hvuTargetSts}</td>
                    <td>
                      <div className="status-cell">
                        <span className="dot dot-green"></span>
                        <span>{hvuPercentPrh}</span>
                      </div>
                    </td>
                    <td>
                      <div className="status-cell">
                        <span className="dot dot-green"></span>
                        <span>{hvuPercentSts}</span>
                      </div>
                    </td>
                  </tr>

                  {/* UNIT 022 */}
                  <tr>
                    <td className="text-center font-bold">UNIT 022 PDU II</td>
                    <td className="text-center text-green">Normal Operasi</td>
                    <td className="text-center">{pduDesign}</td>
                    <td className="text-center font-semibold text-slate-900">{pduActual}</td>
                    <td className="text-center">{pduTargetRph}</td>
                    <td className="text-center">{pduTargetSts}</td>
                    <td>
                      <div className="status-cell">
                        <span className="dot dot-green"></span>
                        <span>{pduPercentPrh}</span>
                      </div>
                    </td>
                    <td>
                      <div className="status-cell">
                        <span className="dot dot-green"></span>
                        <span>{pduPercentSts}</span>
                      </div>
                    </td>
                  </tr>

                  {/* UNIT 023 (Switchable Mode on double-click) */}
                  <tr>
                    <td
                      className="text-center font-bold"
                      onDoubleClick={() =>
                        setModalState({
                          isOpen: true,
                          title: 'Unit 023 FEU II Mode',
                          type: 'unit_mode',
                          unitKey: 'unit023',
                        })
                      }
                      title="Double-click to toggle mode (LMO / MMO / DAO)"
                    >
                      UNIT 023 FEU II
                    </td>
                    <td rowSpan={2} className="text-center text-green">
                      Normal Operasi
                    </td>
                    <td rowSpan={2} className="text-center">
                      {feuDesign}
                    </td>
                    <td rowSpan={2} className="text-center font-semibold text-slate-900">
                      {feuActual}
                    </td>
                    <td rowSpan={2} className="text-center">
                      {feuTargetRph}
                    </td>
                    <td rowSpan={2} className="text-center">
                      {feuTargetSts}
                    </td>
                    <td rowSpan={2}>
                      <div className="status-cell">
                        <span className="dot dot-green"></span>
                        <span>{feuPercentPrh}</span>
                      </div>
                    </td>
                    <td rowSpan={2}>
                      <div className="status-cell">
                        <span className="dot dot-green"></span>
                        <span>{feuPercentSts}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td
                      className="text-center font-bold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 unit-mode-badge"
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          title: 'Unit 023 FEU II Mode',
                          type: 'unit_mode',
                          unitKey: 'unit023',
                        })
                      }
                      onDoubleClick={() =>
                        setModalState({
                          isOpen: true,
                          title: 'Unit 023 FEU II Mode',
                          type: 'unit_mode',
                          unitKey: 'unit023',
                        })
                      }
                      title="Klik untuk ubah mode (LMO / MMO / DAO)"
                    >
                      {feuMode}
                    </td>
                  </tr>

                  {/* UNIT 024 (Switchable Mode on double-click) */}
                  <tr>
                    <td
                      className="text-center font-bold"
                      onDoubleClick={() =>
                        setModalState({
                          isOpen: true,
                          title: 'Unit 024 MDU II Mode',
                          type: 'unit_mode',
                          unitKey: 'unit024',
                        })
                      }
                      title="Double-click to switch mode (LMO / MMO / DAO)"
                    >
                      UNIT 024 MDU II
                    </td>
                    <td rowSpan={2} className="text-center text-green">
                      Normal Operasi
                    </td>
                    <td rowSpan={2} className="text-center">
                      {mduDesign}
                    </td>
                    <td rowSpan={2} className="text-center font-semibold text-slate-900">
                      {mduActual}
                    </td>
                    <td rowSpan={2} className="text-center">
                      {mduTargetRph}
                    </td>
                    <td rowSpan={2} className="text-center">
                      {mduTargetSts}
                    </td>
                    <td rowSpan={2}>
                      <div className="status-cell">
                        <span className="dot dot-green"></span>
                        <span>{mduPercentPrh}</span>
                      </div>
                    </td>
                    <td rowSpan={2}>
                      <div className="status-cell">
                        <span className="dot dot-green"></span>
                        <span>{mduPercentSts}</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td
                      className="text-center font-bold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 unit-mode-badge"
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          title: 'Unit 024 MDU II Mode',
                          type: 'unit_mode',
                          unitKey: 'unit024',
                        })
                      }
                      onDoubleClick={() =>
                        setModalState({
                          isOpen: true,
                          title: 'Unit 024 MDU II Mode',
                          type: 'unit_mode',
                          unitKey: 'unit024',
                        })
                      }
                      title="Klik untuk ubah mode (LMO / MMO / DAO)"
                    >
                      {mduMode}
                    </td>
                  </tr>

                  {/* HOS II SUB-TABLE */}
                  <tr>
                    <th>UNIT</th>
                    <th>Status</th>
                    <th>Pompa HOS</th>
                    <th>Aktual (T/D)</th>
                    <th>Burner FG/FO</th>
                    <th colSpan={3}>Level 023C104</th>
                  </tr>
                  <tr>
                    <td className="text-center">HOS II</td>
                    <td className="text-center text-green">Normal Operasi</td>
                    <td className="text-center">025P101AT</td>
                    <td className="text-center font-semibold">{hosActual}</td>
                    <td className="text-center">12 Gas / 4 Oil</td>
                    <td colSpan={3} className="text-center font-semibold">
                      {level023C104}
                    </td>
                  </tr>

                  {/* TANK FARM & CPI SUB-TABLE */}
                  <tr>
                    <th>UNIT</th>
                    <th>Produksi (MTon)</th>
                    <th>Flow HVI 95</th>
                    <th>Flow HVI 160S</th>
                    <th>Flow HVI 650</th>
                    <th>Level CPI (%)</th>
                    <th colSpan={2}>VISUAL PERAIRAN</th>
                  </tr>
                  <tr>
                    <td rowSpan={2} className="text-center font-bold">
                      Tank Farm
                    </td>
                    <td className="text-center font-bold">LOC II</td>
                    <td className="text-center">465</td>
                    <td className="text-center">0</td>
                    <td className="text-center">0</td>
                    <td className="text-center font-semibold">{levelCpi}</td>
                    <td colSpan={2} className="text-center">
                      CLEAR
                    </td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">LOC III</td>
                    <td className="text-center">0</td>
                    <td className="text-center">0</td>
                    <td className="text-center">256</td>
                    <th colSpan={3}>STATUS POMPA CPI</th>
                  </tr>
                  <tr>
                    <th colSpan={2}>Stock Product (MTon)</th>
                    <th>HVI 95</th>
                    <th>HVI 160S</th>
                    <th>HVI 650</th>
                    <th>002P101A</th>
                    <th colSpan={2}>002P101B</th>
                  </tr>
                  <tr>
                    <td colSpan={2} className="text-center font-bold">
                      Tank Farm
                    </td>
                    <td className="text-center font-bold text-slate-900">{calculatedStockHvi95}</td>
                    <td className="text-center font-bold text-slate-900">{calculatedStockHvi160S}</td>
                    <td className="text-center font-bold text-slate-900">{calculatedStockHvi650}</td>
                    <td className="text-center">Perbaikan</td>
                    <td colSpan={2} className="text-center text-green">
                      AUTO
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION B: ISSUE OPERASIONAL (Double-click to edit) */}
            <div
              className="card card-operasional interactive-card"
              onDoubleClick={() =>
                setModalState({
                  isOpen: true,
                  title: 'Issue Operasional',
                  type: 'operational',
                })
              }
              title="Double-click to edit operational issues"
            >
              <div className="card-title flex items-center justify-between px-3">
                <span className="flex-1 text-center">ISSUE OPERASIONAL</span>
                <span className="text-[9px] font-normal opacity-70">Double-click to edit</span>
              </div>
              <div className="operational-box">
                {issueOperational && issueOperational.length > 0 ? (
                  <ol className="list-decimal pl-5 space-y-1">
                    {issueOperational.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ol>
                ) : (
                  <div className="text-slate-400 italic text-center py-2">
                    Tidak ada issue operasional. (Double-click untuk menambahkan)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="right-col">
            {/* SECTION D: PRODUKSI (LIMS Integration) */}
            <div className="card card-produksi">
              <div className="card-title flex items-center justify-between px-3">
                <span className="flex-1 text-center">PRODUKSI</span>
                <span className="text-[9px] font-normal opacity-70">LIMS Shift {limsData?.shift || 'Malam'}</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '16%' }}>UNIT</th>
                    <th style={{ width: '18%' }}>Produk</th>
                    <th style={{ width: '12%' }}>AKTUAL</th>
                    <th style={{ width: '54%' }}>ANALISA SAMPLE</th>
                  </tr>
                </thead>
                <tbody>
                  {/* UNIT 021 HVU II */}
                  <tr>
                    <td rowSpan={4} className="text-center font-bold">
                      UNIT 021 HVU II
                    </td>
                    <td>
                      SPO DIST
                      <br />
                      <span className="font-bold">LOC I</span>
                    </td>
                    <td className="text-center">250 T/D</td>
                    <td>
                      <div className="sample-grid">
                        <span className="font-bold">Visco</span>
                        {renderLimsParam('02103', 'Visco 60°C', '12.50', 'cSt')}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      LMO DIST
                      <br />
                      <span className="font-bold">041T-116</span>
                    </td>
                    <td className="text-center">273 T/D</td>
                    <td>
                      <div className="sample-grid">
                        <span className="font-bold">Visco</span>
                        {renderLimsParam('02104', 'Visco 60°C', '31.21', 'cSt')}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      MMO DIST
                      <br />
                      <span className="font-bold">041T-117</span>
                    </td>
                    <td className="text-center">460 T/D</td>
                    <td>
                      <div className="sample-grid">
                        <span className="font-bold">Visco</span>
                        {renderLimsParam('02105', 'Visco 60°C', '95.75', 'cSt')}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      SHORT RESIDUE
                      <br />
                      <span className="font-bold">041T-121/310</span>
                    </td>
                    <td className="text-center">1081 T/D</td>
                    <td>
                      <div className="sample-grid">
                        <span className="font-bold">Visco</span>
                        {renderLimsParam('02107', 'Visco 100°C', '1166.00', 'cSt')}
                      </div>
                    </td>
                  </tr>

                  {/* UNIT 022 PDU II */}
                  <tr>
                    <td rowSpan={2} className="text-center font-bold">
                      UNIT 022 PDU II
                    </td>
                    <td>
                      DAO
                      <br />
                      <span className="font-bold">041T-115</span>
                    </td>
                    <td className="text-center">151 T/D</td>
                    <td>
                      <div className="sample-grid">
                        <span className="font-bold">Visco</span>
                        <span className="font-bold">FP</span>
                        <span className="font-bold">COL</span>
                        <span></span>
                        <span></span>
                        <span></span>
                        {renderLimsParam('02203', 'Visco 100°C', '43.81')}
                        {renderLimsParam('02203', 'FP PMCC', '288')}
                        {renderLimsParam('02203', 'Color', 'L7.5')}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      ASPHALT
                      <br />
                      <span className="font-bold">42T-10</span>
                    </td>
                    <td className="text-center">484 T/D</td>
                    <td></td>
                  </tr>

                  {/* UNIT 023 FEU II */}
                  <tr>
                    <td rowSpan={2} className="text-center font-bold">
                      UNIT 023 FEU II
                    </td>
                    <td>
                      RAFFINATE
                      <br />
                      <span className="font-bold">41T-315</span>
                    </td>
                    <td className="text-center">1106 T/D</td>
                    <td>
                      <div className="sample-grid">
                        <span className="font-bold">Visco</span>
                        <span className="font-bold">FP</span>
                        <span className="font-bold">RI</span>
                        <span></span>
                        <span></span>
                        <span></span>
                        {renderLimsParam('02302', 'Visco 100°C', '14.960')}
                        {renderLimsParam('02302', 'FP PMCC', '262')}
                        {renderLimsParam('02302', 'RI 70°C', '1.4861')}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      EXTRACT
                      <br />
                      <span className="font-bold">IFO</span>
                    </td>
                    <td className="text-center">644 T/D</td>
                    <td></td>
                  </tr>

                  {/* UNIT 024 MDU II */}
                  <tr>
                    <td rowSpan={2} className="text-center font-bold">
                      UNIT 024 MDU II
                    </td>
                    <td>
                      DOR
                      <br />
                      <span className="font-bold">41T-102</span>
                    </td>
                    <td className="text-center">465 T/D</td>
                    <td>
                      <div className="sample-grid">
                        <span className="font-bold">Visco</span>
                        <span className="font-bold">FP</span>
                        <span className="font-bold">COL</span>
                        <span className="font-bold">VI</span>
                        <span className="font-bold">PP</span>
                        <span className="font-bold">App</span>
                        {renderLimsParam('02405', 'Visco 100°C', '7.007')}
                        {renderLimsParam('02405', 'FP PMCC', '214')}
                        {renderLimsParam('02405', 'Color', 'L1.0')}
                        {renderLimsParam('02405', 'VI', '99')}
                        {renderLimsParam('02405', 'PP', '-9')}
                        {renderLimsParam('02405', 'App', 'C&B')}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      SLACK WAX
                      <br />
                      <span className="font-bold">RFCC</span>
                    </td>
                    <td className="text-center">96 T/D</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION A: FEU / MDU / NOTE SUMMARY TABLE (Directly Editable with Auto-Save) */}
            <div className="card card-summary">
              <table>
                <thead>
                  <tr>
                    <th style={{ background: 'linear-gradient(180deg, #0093e0 0%, #0076be 100%)', color: '#fff' }}></th>
                    <th colSpan={3} style={{ background: 'linear-gradient(180deg, #0093e0 0%, #0076be 100%)', color: '#fff' }}>
                      FEU
                    </th>
                    <th colSpan={3} style={{ background: 'linear-gradient(180deg, #0093e0 0%, #0076be 100%)', color: '#fff' }}>
                      MDU
                    </th>
                    <th style={{ background: 'linear-gradient(180deg, #0093e0 0%, #0076be 100%)', color: '#fff' }}>
                      NOTE
                    </th>
                  </tr>
                  <tr>
                    <th>Grade</th>
                    <th>Design (T/D)</th>
                    <th>STS (%)</th>
                    <th>RPH (%)</th>
                    <th>Design (T/D)</th>
                    <th>STS (%)</th>
                    <th>RPH (%)</th>
                    <th className="text-[9px] text-slate-500 font-normal">Editable</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-center font-bold">LMO</td>
                    <td className="text-center font-bold">{feuMduData?.feu_lmo_design || 2180}</td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_lmo_sts ?? 70}
                        onChange={(e) => onFeuMduChange({ ...feuMduData, feu_lmo_sts: e.target.value })}
                        className="editable-input text-center font-bold"
                        title="Click to edit FEU LMO STS %"
                      />
                    </td>
                    <td rowSpan={3} className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_rph ?? 65}
                        onChange={(e) => onFeuMduChange({ ...feuMduData, feu_rph: e.target.value })}
                        className="editable-input text-center font-bold"
                        title="Click to edit FEU Target RPH %"
                      />
                    </td>
                    <td className="text-center font-bold">{feuMduData?.mdu_lmo_design || 841}</td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_lmo_sts ?? 65}
                        onChange={(e) => onFeuMduChange({ ...feuMduData, mdu_lmo_sts: e.target.value })}
                        className="editable-input text-center font-bold"
                        title="Click to edit MDU LMO STS %"
                      />
                    </td>
                    <td rowSpan={3} className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_rph ?? 65}
                        onChange={(e) => onFeuMduChange({ ...feuMduData, mdu_rph: e.target.value })}
                        className="editable-input text-center font-bold"
                        title="Click to edit MDU Target RPH %"
                      />
                    </td>
                    <td rowSpan={3} className="p-1">
                      <textarea
                        value={feuMduData?.note ?? ''}
                        onChange={(e) => onFeuMduChange({ ...feuMduData, note: e.target.value })}
                        placeholder="Click to type operational note..."
                        className="editable-input w-full h-full min-h-[50px] resize-none text-[10px]"
                        title="Click to edit FEU/MDU operational note"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">MMO</td>
                    <td className="text-center font-bold">{feuMduData?.feu_mmo_design || 2270}</td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_mmo_sts ?? 65}
                        onChange={(e) => onFeuMduChange({ ...feuMduData, feu_mmo_sts: e.target.value })}
                        className="editable-input text-center font-bold"
                        title="Click to edit FEU MMO STS %"
                      />
                    </td>
                    <td className="text-center font-bold">{feuMduData?.mdu_mmo_design || 777}</td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_mmo_sts ?? 65}
                        onChange={(e) => onFeuMduChange({ ...feuMduData, mdu_mmo_sts: e.target.value })}
                        className="editable-input text-center font-bold"
                        title="Click to edit MDU MMO STS %"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">DAO</td>
                    <td className="text-center font-bold">{feuMduData?.feu_dao_design || 1786}</td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_dao_sts ?? 70}
                        onChange={(e) => onFeuMduChange({ ...feuMduData, feu_dao_sts: e.target.value })}
                        className="editable-input text-center font-bold"
                        title="Click to edit FEU DAO STS %"
                      />
                    </td>
                    <td className="text-center font-bold">{feuMduData?.mdu_dao_design || 501}</td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_dao_sts ?? 0}
                        onChange={(e) => onFeuMduChange({ ...feuMduData, mdu_dao_sts: e.target.value })}
                        className="editable-input text-center font-bold"
                        title="Click to edit MDU DAO STS %"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION B: ISSUE MAINTENANCE (Double-click to edit) */}
            <div
              className="card card-maintenance interactive-card"
              onDoubleClick={() =>
                setModalState({
                  isOpen: true,
                  title: 'Issue Maintenance',
                  type: 'maintenance',
                })
              }
              title="Double-click to edit maintenance issues"
            >
              <div className="card-title flex items-center justify-between px-3">
                <span className="flex-1 text-center">ISSUE MAINTENANCE</span>
                <span className="text-[9px] font-normal opacity-70">Double-click to edit</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Equipment</th>
                    <th style={{ width: '28%' }}>Issue</th>
                    <th style={{ width: '50%' }}>Mitigasi / RTL</th>
                  </tr>
                </thead>
                <tbody>
                  {issueMaintenance && issueMaintenance.length > 0 ? (
                    issueMaintenance.map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-center font-bold">{item.equipment || '-'}</td>
                        <td>{item.issue || '-'}</td>
                        <td>{item.mitigation || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="text-center text-slate-400 italic py-2">
                        Tidak ada issue maintenance. (Double-click untuk menambahkan)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Double-click Edit Modal for Operational & Maintenance Issues */}
      <IssueEditModal
        isOpen={modalState.isOpen && (modalState.type === 'operational' || modalState.type === 'maintenance')}
        onClose={() => setModalState({ isOpen: false, title: '', type: null, unitKey: null })}
        title={modalState.title}
        type={modalState.type}
        initialData={modalState.type === 'operational' ? issueOperational : issueMaintenance}
        onSave={(updatedData) => {
          if (modalState.type === 'operational') {
            onIssueOperationalChange(updatedData)
          } else {
            onIssueMaintenanceChange(updatedData)
          }
        }}
      />

      {/* Double-click Mode Switch Modal for Unit 023 & Unit 024 */}
      <UnitModeModal
        isOpen={modalState.isOpen && modalState.type === 'unit_mode'}
        onClose={() => setModalState({ isOpen: false, title: '', type: null, unitKey: null })}
        unitName={modalState.title}
        currentMode={unitModes?.[modalState.unitKey] || 'MMO'}
        onSelectMode={(newMode) => {
          onUnitModeChange(modalState.unitKey, newMode)
        }}
      />
    </div>
  )
}

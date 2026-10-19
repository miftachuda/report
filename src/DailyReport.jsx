import { useState } from "react";
import "./dailyReport.css";
import danantaraLogo from "./assets/danantara.png";
import pertaminaLogo from "./assets/pertamina.png";
import IssueEditModal from "./components/IssueEditModal.jsx";
import UnitModeModal from "./components/UnitModeModal.jsx";
import UnitStatusModal from "./components/UnitStatusModal.jsx";
import {
  calculateActualTD,
  calculateTargetTD,
  calculateAchievedPercent,
  calculateProductGroupTons,
  evaluateSampleLimit,
} from "./utils/calculations.js";

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
  unitStatuses = {},
  onUnitStatusChange,
  phdData = {},
  tanks = [],
  sampleLimits = [],
  limsData = {},
}) {
  // Modal state for double-click editing
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    type: null, // 'operational' | 'maintenance' | 'unit_mode'
    unitKey: null,
  });

  // Helper for case-insensitive PHD tag lookup
  const getPhdTag = (tagName) => {
    if (!phdData || !tagName) return null;
    if (phdData[tagName] !== undefined && phdData[tagName] !== null) {
      return Number(phdData[tagName]);
    }
    const lower = tagName.toLowerCase();
    const match = Object.keys(phdData).find((k) => k.toLowerCase() === lower);
    return match && phdData[match] !== undefined && phdData[match] !== null
      ? Number(phdData[match])
      : null;
  };

  // Calculations for Kapasitas Feed
  // Unit 021 HVU II
  const hvuFlow = getPhdTag("021FI_004.pv");
  const hvuSg = getPhdTag("021FY_004X.C1");
  const hvuActual = calculateActualTD(hvuFlow, hvuSg) ?? 2583;
  const hvuDesign = 3883;
  const hvuTargetRph = 2524;
  const hvuTargetSts = 2524;
  const hvuPercentDesign =
    calculateAchievedPercent(hvuActual, hvuDesign) ?? "66.5";
  const hvuPercentRph =
    calculateAchievedPercent(hvuActual, hvuTargetRph) ?? "102.4";
  const hvuPercentSts =
    calculateAchievedPercent(hvuActual, hvuTargetSts) ?? "102.4";

  // Unit 022 PDU II
  const pduFlow = getPhdTag("022FI_001.pv");
  const pduSg = getPhdTag("022FY_001X.C1");
  const pduActual = calculateActualTD(pduFlow, pduSg) ?? 635;
  const pduDesign = 784;
  const pduTargetRph = 627;
  const pduTargetSts = 549;
  const pduPercentDesign =
    calculateAchievedPercent(pduActual, pduDesign) ?? "81.1";
  const pduPercentRph =
    calculateAchievedPercent(pduActual, pduTargetRph) ?? "101.3";
  const pduPercentSts =
    calculateAchievedPercent(pduActual, pduTargetSts) ?? "115.8";

  // Unit 023 FEU II (Active Mode: LMO / MMO / DAO)
  const feuMode = unitModes?.unit023 || "MMO";
  let feuDesign = 2270;
  let feuStsPercent = feuMduData?.feu_mmo_sts ?? 65;
  let feuTagFlow = "023FIC_004.pv";
  let feuTagSg = "023FY_004CX.C1";

  if (feuMode === "LMO") {
    feuDesign = Number(feuMduData?.feu_lmo_design || 2180);
    feuStsPercent = Number(feuMduData?.feu_lmo_sts || 70);
    feuTagSg = "023FY_004BX.C1";
  } else if (feuMode === "DAO") {
    feuDesign = Number(feuMduData?.feu_dao_design || 1786);
    feuStsPercent = Number(feuMduData?.feu_dao_sts || 70);
    feuTagSg = "023FY_004DX.C1";
  } else {
    feuDesign = Number(feuMduData?.feu_mmo_design || 2270);
    feuStsPercent = Number(feuMduData?.feu_mmo_sts || 65);
    feuTagSg = "023FY_004CX.C1";
  }

  const feuRphPercent = Number(feuMduData?.feu_rph || 65);
  const feuTargetRph = calculateTargetTD(feuRphPercent, feuDesign) ?? 1476;
  const feuTargetSts = calculateTargetTD(feuStsPercent, feuDesign) ?? 1476;
  const feuFlow = getPhdTag(feuTagFlow) ?? getPhdTag("023FI_004.pv");
  const feuSg = getPhdTag(feuTagSg);
  const feuActual = calculateActualTD(feuFlow, feuSg) ?? 1750;
  const feuPercentDesign =
    calculateAchievedPercent(feuActual, feuDesign) ?? "77.1";
  const feuPercentRph =
    calculateAchievedPercent(feuActual, feuTargetRph) ?? "118.6";
  const feuPercentSts =
    calculateAchievedPercent(feuActual, feuTargetSts) ?? "118.6";

  // Unit 024 MDU II (Active Mode: LMO / MMO / DAO)
  const mduMode = unitModes?.unit024 || "LMO";
  let mduDesign = 841;
  let mduStsPercent = feuMduData?.mdu_lmo_sts ?? 65;
  let mduTagSg = "024FY_001BX.C1";

  if (mduMode === "MMO") {
    mduDesign = Number(feuMduData?.mdu_mmo_design || 777);
    mduStsPercent = Number(feuMduData?.mdu_mmo_sts || 65);
    mduTagSg = "024FY_001CX.C1";
  } else if (mduMode === "DAO") {
    mduDesign = Number(feuMduData?.mdu_dao_design || 501);
    mduStsPercent = Number(feuMduData?.mdu_dao_sts || 0);
    mduTagSg = "024FY_001DX.C1";
  } else {
    mduDesign = Number(feuMduData?.mdu_lmo_design || 841);
    mduStsPercent = Number(feuMduData?.mdu_lmo_sts || 65);
    mduTagSg = "024FY_001BX.C1";
  }

  const mduRphPercent = Number(feuMduData?.mdu_rph || 65);
  const mduTargetRph = calculateTargetTD(mduRphPercent, mduDesign) ?? 547;
  const mduTargetSts = calculateTargetTD(mduStsPercent, mduDesign) ?? 547;
  const mduFlow = getPhdTag("024FIC_001.pv") ?? getPhdTag("024FI_001.pv");
  const mduSg = getPhdTag(mduTagSg) ?? 0.85;
  const mduActual =
    calculateActualTD(mduFlow, mduSg) ??
    (mduFlow ? Math.round(Number(mduFlow) * 0.85 * 24) : 561);
  const mduPercentDesign =
    calculateAchievedPercent(mduActual, mduDesign) ?? "66.7";
  const mduPercentRph =
    calculateAchievedPercent(mduActual, mduTargetRph) ?? "102.6";
  const mduPercentSts =
    calculateAchievedPercent(mduActual, mduTargetSts) ?? "102.6";

  // Render % RPH and % STS cell with circle dot on left (green >= 100, yellow < 100) and black text
  const renderPercentCell = (val, rowSpan = 1) => {
    if (val === null || val === undefined || val === "") {
      return <td rowSpan={rowSpan} className="text-center">-</td>;
    }
    const num = Number(val);
    const isGreen = !isNaN(num) && num >= 100;
    const dotClass = isGreen
      ? "percent-dot percent-dot-green"
      : "percent-dot percent-dot-yellow";

    return (
      <td rowSpan={rowSpan} className="text-center">
        <span className="inline-flex items-center justify-center">
          <span className={dotClass}></span>
          <span className="percent-cell-val">{val}</span>
        </span>
      </td>
    );
  };

  // Helper to color operation status (Normal Operasi: green, Shutdown: red, Sirkulasi: yellow, etc.)
  const getStatusClass = (statusStr) => {
    const s = String(statusStr || "").toUpperCase();
    if (s.includes("NORMAL")) return "text-center text-green";
    if (s.includes("SHUTDOWN") || s.includes("SHUDOWN"))
      return "text-center text-red";
    if (s.includes("SIRKULASI")) return "text-center text-yellow";
    return "text-center font-bold text-slate-800";
  };

  // Unit 025 HOS II & Levels
  const hosFlow = getPhdTag("025FIC_004.pv") ?? getPhdTag("025FI_004.pv");
  const hosSg = getPhdTag("021FY_058X.C1");
  const hosActual = calculateActualTD(hosFlow, hosSg) ?? 23808;
  const rawLevel023 = getPhdTag("023LI_005.PV");
  const level023C104 = rawLevel023 !== null ? rawLevel023.toFixed(1) : "1.4";
  const rawLevelCpi = getPhdTag("002LI_051.PV");
  const levelCpi = rawLevelCpi !== null ? rawLevelCpi.toFixed(1) : "22.0";

  // Tank Farm Product Stocks (Tons calculated from tank dimensions and tag levels)
  const tanksHvi95 = ["41T-101", "41T-102", "41T-104"];
  const tanksHvi160S = ["41T-103", "41T-107", "41T-108"];
  const tanksHvi650 = ["41T-105", "41T-106", "41T-109", "41T-110"];

  const calculatedStockHvi95 =
    calculateProductGroupTons(tanksHvi95, tanks, phdData) || 2951;
  const calculatedStockHvi160S =
    calculateProductGroupTons(tanksHvi160S, tanks, phdData) || 1048;
  const calculatedStockHvi650 =
    calculateProductGroupTons(tanksHvi650, tanks, phdData) || 3481;

  // Unit 023 Produksi sample code based on active mode (LMO: 02302, MMO: 02302M, DAO: 02302D)
  let sampleCode023 = "02302";
  if (feuMode === "MMO") {
    sampleCode023 = "02302M";
  } else if (feuMode === "DAO") {
    sampleCode023 = "02302D";
  } else {
    sampleCode023 = "02302";
  }

  // Unit 024 Produksi sample code based on active mode (LMO: 02405, MMO: 02405M, DAO: 02405D)
  let sampleCode024 = "02405";
  if (mduMode === "MMO") {
    sampleCode024 = "02405M";
  } else if (mduMode === "DAO") {
    sampleCode024 = "02405D";
  } else {
    sampleCode024 = "02405";
  }


  // Section Produksi Actual (T/D) Calculations:
  // Unit 021 HVU II
  const spoFlow = getPhdTag("021FIC_058.PV");
  const spoSg = getPhdTag("021FY_058X.C1");
  const spoActual = calculateActualTD(spoFlow, spoSg) ?? 250;

  const lmoDistFlow = getPhdTag("021FIC_057.PV");
  const lmoDistSg = getPhdTag("021FY_057X.C1");
  const lmoDistActual = calculateActualTD(lmoDistFlow, lmoDistSg) ?? 273;

  const mmoDistFlow = getPhdTag("021FI_008.PV");
  const mmoDistSg = getPhdTag("021FY_008X.c1");
  const mmoDistActual = calculateActualTD(mmoDistFlow, mmoDistSg) ?? 460;

  const shortResidueFlow = getPhdTag("021FI_002.PV");
  const shortResidueSg = getPhdTag("021FY_002X.C1");
  const shortResidueActual =
    calculateActualTD(shortResidueFlow, shortResidueSg) ?? 1081;

  // Unit 022 PDU II
  const daoFlow = getPhdTag("022FI_007.PV");
  const daoSg = getPhdTag("022FY_007X.C1");
  const daoActual = calculateActualTD(daoFlow, daoSg) ?? 151;

  const asphaltFlow = getPhdTag("022FI_013.PV");
  const asphaltSg = getPhdTag("022FY_013X.C1");
  const asphaltActual = calculateActualTD(asphaltFlow, asphaltSg) ?? 484;

  // Unit 023 FEU II
  const raffFlow1 = getPhdTag("023FI_031.PV");
  const raffFlow2 = getPhdTag("023FI_703.PV");
  let raffSgTag = "023FY_031CX.C1";
  if (feuMode === "LMO") raffSgTag = "023FY_031BX.C1";
  else if (feuMode === "DAO") raffSgTag = "023FY_031DX.C1";
  const raffSg = getPhdTag(raffSgTag);
  const totalRaffFlow =
    raffFlow1 !== null || raffFlow2 !== null
      ? Number(raffFlow1 || 0) + Number(raffFlow2 || 0)
      : null;
  const raffActual = calculateActualTD(totalRaffFlow, raffSg) ?? 1106;

  const extractFlow = getPhdTag("023FI_028.pv") ?? getPhdTag("023FI_028.PV");
  let extractSgTag = "023FY_028CX.C1";
  if (feuMode === "LMO") extractSgTag = "023FY_028BX.C1";
  else if (feuMode === "DAO") extractSgTag = "023FY_028DX.C1";
  const extractSg = getPhdTag(extractSgTag);
  const extractActual = calculateActualTD(extractFlow, extractSg) ?? 644;

  // Unit 024 MDU II
  const dorFlow = getPhdTag("024FI_023.PV");
  let dorSgTag = "024FY_023BX.C1";
  if (mduMode === "MMO") dorSgTag = "024FY_023CX.C1";
  else if (mduMode === "DAO") dorSgTag = "024FY_023DX.C1";
  const dorSg = getPhdTag(dorSgTag);
  const dorActual = calculateActualTD(dorFlow, dorSg) ?? 465;

  // Tank Farm LOC II Flow Product based on active Unit 024 MDU II Mode:
  // LMO -> HVI 95, MMO -> HVI 160S, DAO -> HVI 650. Non-active modes display 0.
  const defaultFlowHvi95Loc2 = mduMode === "LMO" ? dorActual : 0;
  const defaultFlowHvi160sLoc2 = mduMode === "MMO" ? dorActual : 0;
  const defaultFlowHvi650Loc2 = mduMode === "DAO" ? dorActual : 0;

  const flowHvi95Loc2 =
    feuMduData?.flow_hvi_95_loc2 !== undefined &&
    feuMduData?.flow_hvi_95_loc2 !== null &&
    feuMduData?.flow_hvi_95_loc2 !== ""
      ? feuMduData.flow_hvi_95_loc2
      : defaultFlowHvi95Loc2;

  const flowHvi160sLoc2 =
    feuMduData?.flow_hvi_160s_loc2 !== undefined &&
    feuMduData?.flow_hvi_160s_loc2 !== null &&
    feuMduData?.flow_hvi_160s_loc2 !== ""
      ? feuMduData.flow_hvi_160s_loc2
      : defaultFlowHvi160sLoc2;

  const flowHvi650Loc2 =
    feuMduData?.flow_hvi_650_loc2 !== undefined &&
    feuMduData?.flow_hvi_650_loc2 !== null &&
    feuMduData?.flow_hvi_650_loc2 !== ""
      ? feuMduData.flow_hvi_650_loc2
      : defaultFlowHvi650Loc2;

  // Tank Farm LOC III Flow Product (editable, defaults 0, 0, 256)
  const flowHvi95Loc3 =
    feuMduData?.flow_hvi_95_loc3 !== undefined &&
    feuMduData?.flow_hvi_95_loc3 !== null &&
    feuMduData?.flow_hvi_95_loc3 !== ""
      ? feuMduData.flow_hvi_95_loc3
      : 0;

  const flowHvi160sLoc3 =
    feuMduData?.flow_hvi_160s_loc3 !== undefined &&
    feuMduData?.flow_hvi_160s_loc3 !== null &&
    feuMduData?.flow_hvi_160s_loc3 !== ""
      ? feuMduData.flow_hvi_160s_loc3
      : 0;

  const flowHvi650Loc3 =
    feuMduData?.flow_hvi_650_loc3 !== undefined &&
    feuMduData?.flow_hvi_650_loc3 !== null &&
    feuMduData?.flow_hvi_650_loc3 !== ""
      ? feuMduData.flow_hvi_650_loc3
      : 256;

  const slackWaxFlow = getPhdTag("024FI_031.PV");
  let slackWaxSgTag = "024FY_031X.c1";
  const slackWaxSg = getPhdTag(slackWaxSgTag);
  const slackWaxActual = calculateActualTD(slackWaxFlow, slackWaxSg) ?? 96;

  // Helper to render LIMS parameter cell with limit comparison
  const renderLimsParam = (sampleCode, paramName, fallbackVal, unit = "") => {
    const baseCode = sampleCode.replace(/[MD]$/, "");
    const sample =
      limsData?.samples?.[sampleCode] || limsData?.samples?.[baseCode];
    let rawVal = sample?.[paramName]?.value ?? fallbackVal;

    // Find limit record in sampleLimits from PocketBase matching the mode sample code
    const limitRecord =
      sampleLimits.find(
        (lim) => lim.sample_code === sampleCode && lim.param_name === paramName,
      ) ||
      sampleLimits.find(
        (lim) => lim.sample_code === baseCode && lim.param_name === paramName,
      );

    const evaluated = evaluateSampleLimit(rawVal, limitRecord);

    return (
      <span className="inline-flex items-center justify-start gap-0.5 text-left">
        <span
          className={
            evaluated.isOutOfRange ? "lims-val-alert" : "lims-val-normal"
          }
          title={
            evaluated.isOutOfRange
              ? "Out of specification limit"
              : "Within limit"
          }
        >
          {evaluated.formattedValue}
        </span>
        {unit && <span className="font-bold text-[9.5px] ml-0.5">{unit}</span>}
        {evaluated.limitLabel && (
          <span className="lims-limit-range" title="Specification Limits">
            {evaluated.limitLabel}
          </span>
        )}
      </span>
    );
  };

  // Helper to determine if all LIMS parameters for a given sample are within limit (On Spec)
  const isSampleOnSpec = (sampleCode, paramList) => {
    const baseCode = sampleCode.replace(/[MD]$/, "");
    const sample =
      limsData?.samples?.[sampleCode] || limsData?.samples?.[baseCode];

    for (const item of paramList) {
      const rawVal = sample?.[item.paramName]?.value ?? item.fallbackVal;
      const limitRecord =
        sampleLimits.find(
          (lim) =>
            lim.sample_code === sampleCode && lim.param_name === item.paramName,
        ) ||
        sampleLimits.find(
          (lim) =>
            lim.sample_code === baseCode && lim.param_name === item.paramName,
        );
      const evaluated = evaluateSampleLimit(rawVal, limitRecord);
      if (evaluated.isOutOfRange) {
        return false;
      }
    }
    return true;
  };

  // Helper to render On Spec / Off Spec circle dot and badge text on top of sample analysis
  const renderSpecStatus = (isOnSpec) => {
    return (
      <div className="spec-status-badge">
        <span
          className={`spec-status-dot ${
            isOnSpec ? "dot-onspec" : "dot-offspec"
          }`}
        ></span>
        <span
          className={`spec-status-text ${
            isOnSpec ? "text-onspec" : "text-offspec"
          }`}
        >
          {isOnSpec ? "(ON SPEC)" : "(OFF SPEC)"}
        </span>
      </div>
    );
  };

  return (
    <div id="report-dashboard-capture" className="daily-report-body">
      <div className="dashboard-container">
        {/* TOP HEADER */}
        <div className="top-banner">
          <div className="logo-left">
            <img
              src={danantaraLogo}
              alt="Danantara Indonesia"
              className="logo-img"
            />
          </div>
          <div className="banner-title">DAILY REPORT LOC II</div>
          <div className="logo-right">
            <img
              src={pertaminaLogo}
              alt="Pertamina Patra Niaga"
              className="logo-img"
            />
          </div>
        </div>

        {/* DATE BAR */}
        <div className="date-bar">
          <div className="flex items-center gap-2">
            <span className="font-bold">Tanggal:</span>
            <span>{dateDisplay || "Sabtu, 17 Oktober 2026"}</span>
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
                    <th style={{ width: "16%" }}>UNIT</th>
                    <th style={{ width: "10%" }}>Status</th>
                    <th style={{ width: "11%" }}>Design (T/D)</th>
                    <th style={{ width: "11%" }}>Aktual (T/D)</th>
                    <th style={{ width: "13%" }}>Target RPH (T/D)</th>
                    <th style={{ width: "11%" }}>Target STS</th>
                    <th style={{ width: "9%" }}>% Design</th>
                    <th style={{ width: "9%" }}>% RPH</th>
                    <th style={{ width: "10%" }}>% STS</th>
                  </tr>
                </thead>
                <tbody>
                  {/* UNIT 021 */}
                  <tr>
                    <td className="text-center font-bold">UNIT 021 HVU II</td>
                    <td
                      className={`${getStatusClass(unitStatuses?.unit021)} cursor-pointer hover:bg-slate-100 transition-colors select-none`}
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          title: "UNIT 021 HVU II",
                          type: "unit_status",
                          unitKey: "unit021",
                        })
                      }
                      onDoubleClick={() =>
                        setModalState({
                          isOpen: true,
                          title: "UNIT 021 HVU II",
                          type: "unit_status",
                          unitKey: "unit021",
                        })
                      }
                      title="Klik untuk ubah status unit"
                    >
                      {unitStatuses?.unit021 || "Normal Operasi"}
                    </td>
                    <td className="text-center">{hvuDesign}</td>
                    <td className="text-center font-semibold text-slate-900">
                      {hvuActual}
                    </td>
                    <td className="text-center">{hvuTargetRph}</td>
                    <td className="text-center">{hvuTargetSts}</td>
                    <td className="text-center font-semibold text-slate-800">
                      {hvuPercentDesign}
                    </td>
                    {renderPercentCell(hvuPercentRph)}
                    {renderPercentCell(hvuPercentSts)}
                  </tr>

                  {/* UNIT 022 */}
                  <tr>
                    <td className="text-center font-bold">UNIT 022 PDU II</td>
                    <td
                      className={`${getStatusClass(unitStatuses?.unit022)} cursor-pointer hover:bg-slate-100 transition-colors select-none`}
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          title: "UNIT 022 PDU II",
                          type: "unit_status",
                          unitKey: "unit022",
                        })
                      }
                      onDoubleClick={() =>
                        setModalState({
                          isOpen: true,
                          title: "UNIT 022 PDU II",
                          type: "unit_status",
                          unitKey: "unit022",
                        })
                      }
                      title="Klik untuk ubah status unit"
                    >
                      {unitStatuses?.unit022 || "Normal Operasi"}
                    </td>
                    <td className="text-center">{pduDesign}</td>
                    <td className="text-center font-semibold text-slate-900">
                      {pduActual}
                    </td>
                    <td className="text-center">{pduTargetRph}</td>
                    <td className="text-center">{pduTargetSts}</td>
                    <td className="text-center font-semibold text-slate-800">
                      {pduPercentDesign}
                    </td>
                    {renderPercentCell(pduPercentRph)}
                    {renderPercentCell(pduPercentSts)}
                  </tr>

                  {/* UNIT 023 (Switchable Mode on double-click) */}
                  <tr>
                    <td
                      className="text-center font-bold"
                      onDoubleClick={() =>
                        setModalState({
                          isOpen: true,
                          title: "Unit 023 FEU II Mode",
                          type: "unit_mode",
                          unitKey: "unit023",
                        })
                      }
                    >
                      UNIT 023 FEU II
                    </td>
                    <td
                      rowSpan={2}
                      className={`${getStatusClass(unitStatuses?.unit023)} cursor-pointer hover:bg-slate-100 transition-colors select-none`}
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          title: "UNIT 023 FEU II",
                          type: "unit_status",
                          unitKey: "unit023",
                        })
                      }
                      onDoubleClick={() =>
                        setModalState({
                          isOpen: true,
                          title: "UNIT 023 FEU II",
                          type: "unit_status",
                          unitKey: "unit023",
                        })
                      }
                      title="Klik untuk ubah status unit"
                    >
                      {unitStatuses?.unit023 || "Normal Operasi"}
                    </td>
                    <td rowSpan={2} className="text-center">
                      {feuDesign}
                    </td>
                    <td
                      rowSpan={2}
                      className="text-center font-semibold text-slate-900"
                    >
                      {feuActual}
                    </td>
                    <td rowSpan={2} className="text-center">
                      {feuTargetRph}
                    </td>
                    <td rowSpan={2} className="text-center">
                      {feuTargetSts}
                    </td>
                    <td
                      rowSpan={2}
                      className="text-center font-semibold text-slate-800"
                    >
                      {feuPercentDesign}
                    </td>
                    {renderPercentCell(feuPercentRph, 2)}
                    {renderPercentCell(feuPercentSts, 2)}
                  </tr>
                  <tr>
                    <td
                      className="text-center font-bold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 unit-mode-badge"
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          title: "Unit 023 FEU II Mode",
                          type: "unit_mode",
                          unitKey: "unit023",
                        })
                      }
                      onDoubleClick={() =>
                        setModalState({
                          isOpen: true,
                          title: "Unit 023 FEU II Mode",
                          type: "unit_mode",
                          unitKey: "unit023",
                        })
                      }
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
                          title: "Unit 024 MDU II Mode",
                          type: "unit_mode",
                          unitKey: "unit024",
                        })
                      }
                    >
                      UNIT 024 MDU II
                    </td>
                    <td
                      rowSpan={2}
                      className={`${getStatusClass(unitStatuses?.unit024)} cursor-pointer hover:bg-slate-100 transition-colors select-none`}
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          title: "UNIT 024 MDU II",
                          type: "unit_status",
                          unitKey: "unit024",
                        })
                      }
                      onDoubleClick={() =>
                        setModalState({
                          isOpen: true,
                          title: "UNIT 024 MDU II",
                          type: "unit_status",
                          unitKey: "unit024",
                        })
                      }
                      title="Klik untuk ubah status unit"
                    >
                      {unitStatuses?.unit024 || "Normal Operasi"}
                    </td>
                    <td rowSpan={2} className="text-center">
                      {mduDesign}
                    </td>
                    <td
                      rowSpan={2}
                      className="text-center font-semibold text-slate-900"
                    >
                      {mduActual}
                    </td>
                    <td rowSpan={2} className="text-center">
                      {mduTargetRph}
                    </td>
                    <td rowSpan={2} className="text-center">
                      {mduTargetSts}
                    </td>
                    <td
                      rowSpan={2}
                      className="text-center font-semibold text-slate-800"
                    >
                      {mduPercentDesign}
                    </td>
                    {renderPercentCell(mduPercentRph, 2)}
                    {renderPercentCell(mduPercentSts, 2)}
                  </tr>
                  <tr>
                    <td
                      className="text-center font-bold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 unit-mode-badge"
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          title: "Unit 024 MDU II Mode",
                          type: "unit_mode",
                          unitKey: "unit024",
                        })
                      }
                      onDoubleClick={() =>
                        setModalState({
                          isOpen: true,
                          title: "Unit 024 MDU II Mode",
                          type: "unit_mode",
                          unitKey: "unit024",
                        })
                      }
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
                    <th colSpan={4}>Level 023C104</th>
                  </tr>
                  <tr>
                    <td className="text-center">HOS II</td>
                    <td
                      className={`${getStatusClass(unitStatuses?.hos)} cursor-pointer hover:bg-slate-100 transition-colors select-none`}
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          title: "HOS II",
                          type: "unit_status",
                          unitKey: "hos",
                        })
                      }
                      onDoubleClick={() =>
                        setModalState({
                          isOpen: true,
                          title: "HOS II",
                          type: "unit_status",
                          unitKey: "hos",
                        })
                      }
                      title="Klik untuk ubah status unit"
                    >
                      {unitStatuses?.hos || "Normal Operasi"}
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        list="pompa-hos-list"
                        value={feuMduData?.pompa_hos ?? "025P101AT"}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            pompa_hos: e.target.value,
                          })
                        }
                        className="editable-input text-center font-medium"
                        title="Klik untuk mengubah Pompa HOS"
                      />
                    </td>
                    <td className="text-center font-semibold">{hosActual}</td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        list="burner-fg-fo-list"
                        value={feuMduData?.burner_fg_fo ?? "12 Gas / 4 Oil"}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            burner_fg_fo: e.target.value,
                          })
                        }
                        className="editable-input text-center font-medium"
                        title="Klik untuk mengubah Burner FG/FO"
                      />
                    </td>
                    <td colSpan={4} className="text-center font-semibold">
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
                    <th colSpan={2}>Level CPI (%)</th>
                    <th colSpan={2}>VISUAL PERAIRAN</th>
                  </tr>
                  <tr>
                    <td rowSpan={2} className="text-center font-bold">
                      Tank Farm
                    </td>
                    <td className="text-center font-bold">LOC II</td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={flowHvi95Loc2}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            flow_hvi_95_loc2: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900"
                        title="Klik untuk mengubah Flow HVI 95 LOC II"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={flowHvi160sLoc2}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            flow_hvi_160s_loc2: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900"
                        title="Klik untuk mengubah Flow HVI 160S LOC II"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={flowHvi650Loc2}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            flow_hvi_650_loc2: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900"
                        title="Klik untuk mengubah Flow HVI 650 LOC II"
                      />
                    </td>
                    <td colSpan={2} className="text-center font-semibold">
                      {levelCpi}
                    </td>
                    <td colSpan={2} className="text-center p-0">
                      <input
                        type="text"
                        list="visual-perairan-list"
                        value={feuMduData?.visual_perairan ?? "CLEAR"}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            visual_perairan: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold uppercase"
                        title="Klik untuk mengubah Visual Perairan"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">LOC III</td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={flowHvi95Loc3}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            flow_hvi_95_loc3: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900"
                        title="Klik untuk mengubah Flow HVI 95 LOC III"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={flowHvi160sLoc3}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            flow_hvi_160s_loc3: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900"
                        title="Klik untuk mengubah Flow HVI 160S LOC III"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={flowHvi650Loc3}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            flow_hvi_650_loc3: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900"
                        title="Klik untuk mengubah Flow HVI 650 LOC III"
                      />
                    </td>
                    <th colSpan={4}>STATUS POMPA CPI</th>
                  </tr>
                  <tr>
                    <th colSpan={2}>Stock Product (MTon)</th>
                    <th>HVI 95</th>
                    <th>HVI 160S</th>
                    <th>HVI 650</th>
                    <th colSpan={2}>002P101A</th>
                    <th colSpan={2}>002P101B</th>
                  </tr>
                  <tr>
                    <td colSpan={2} className="text-center font-bold">
                      Tank Farm
                    </td>
                    <td className="text-center font-bold text-slate-900">
                      {calculatedStockHvi95}
                    </td>
                    <td className="text-center font-bold text-slate-900">
                      {calculatedStockHvi160S}
                    </td>
                    <td className="text-center font-bold text-slate-900">
                      {calculatedStockHvi650}
                    </td>
                    <td colSpan={2} className="text-center p-0">
                      <input
                        type="text"
                        list="pompa-cpi-status-list"
                        value={feuMduData?.status_pompa_cpi_a ?? "Perbaikan"}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            status_pompa_cpi_a: e.target.value,
                          })
                        }
                        className={`editable-input text-center font-bold ${
                          String(feuMduData?.status_pompa_cpi_a ?? "Perbaikan")
                            .toUpperCase()
                            .includes("AUTO") ||
                          String(feuMduData?.status_pompa_cpi_a ?? "Perbaikan")
                            .toUpperCase()
                            .includes("NORMAL") ||
                          String(feuMduData?.status_pompa_cpi_a ?? "Perbaikan")
                            .toUpperCase()
                            .includes("OPERASI")
                            ? "text-green"
                            : String(
                                  feuMduData?.status_pompa_cpi_a ?? "Perbaikan",
                                )
                                  .toUpperCase()
                                  .includes("PERBAIKAN") ||
                                String(
                                  feuMduData?.status_pompa_cpi_a ?? "Perbaikan",
                                )
                                  .toUpperCase()
                                  .includes("RUSAK")
                              ? "text-red"
                              : ""
                        }`}
                        title="Klik untuk mengubah Status Pompa 002P101A"
                      />
                    </td>
                    <td colSpan={2} className="text-center p-0">
                      <input
                        type="text"
                        list="pompa-cpi-status-list"
                        value={feuMduData?.status_pompa_cpi_b ?? "AUTO"}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            status_pompa_cpi_b: e.target.value,
                          })
                        }
                        className={`editable-input text-center font-bold ${
                          String(feuMduData?.status_pompa_cpi_b ?? "AUTO")
                            .toUpperCase()
                            .includes("AUTO") ||
                          String(feuMduData?.status_pompa_cpi_b ?? "AUTO")
                            .toUpperCase()
                            .includes("NORMAL") ||
                          String(feuMduData?.status_pompa_cpi_b ?? "AUTO")
                            .toUpperCase()
                            .includes("OPERASI")
                            ? "text-green"
                            : String(feuMduData?.status_pompa_cpi_b ?? "AUTO")
                                  .toUpperCase()
                                  .includes("PERBAIKAN") ||
                                String(feuMduData?.status_pompa_cpi_b ?? "AUTO")
                                  .toUpperCase()
                                  .includes("RUSAK")
                              ? "text-red"
                              : ""
                        }`}
                        title="Klik untuk mengubah Status Pompa 002P101B"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Datalists for input suggestions */}
              <datalist id="pompa-hos-list">
                <option value="025P101AT" />
                <option value="025P101BT" />
              </datalist>

              <datalist id="visual-perairan-list">
                <option value="CLEAR" />
                <option value="KERUH" />
                <option value="TERDAPAT MINYAK" />
              </datalist>

              <datalist id="pompa-cpi-status-list">
                <option value="AUTO" />
                <option value="MANUAL" />
                <option value="Perbaikan" />
                <option value="Standby" />
                <option value="Stop" />
              </datalist>

              <datalist id="burner-fg-fo-list">
                <option value="12 Gas / 4 Oil" />
                <option value="16 Gas / 0 Oil" />
                <option value="14 Gas / 2 Oil" />
                <option value="10 Gas / 6 Oil" />
                <option value="8 Gas / 8 Oil" />
                <option value="0 Gas / 16 Oil" />
              </datalist>
            </div>

            {/* SECTION B: ISSUE OPERASIONAL (Double-click to edit) */}
            <div
              className="card card-operasional interactive-card"
              onDoubleClick={() =>
                setModalState({
                  isOpen: true,
                  title: "Issue Operasional",
                  type: "operational",
                })
              }
            >
              <div className="card-title">ISSUE OPERASIONAL</div>
              <div className="operational-box">
                {issueOperational && issueOperational.length > 0 ? (
                  <ol className="list-decimal pl-5 space-y-1">
                    {issueOperational.map((issue, idx) => {
                      let text = "";
                      if (typeof issue === "string") {
                        text = issue;
                      } else if (typeof issue === "object" && issue !== null) {
                        if (issue.equipment || issue.issue) {
                          text = `${issue.equipment ? issue.equipment + " : " : ""}${issue.issue || ""}${issue.mitigation ? " (" + issue.mitigation + ")" : ""}`;
                        } else {
                          text =
                            issue.text ||
                            issue.title ||
                            issue.name ||
                            JSON.stringify(issue);
                        }
                      } else {
                        text = String(issue ?? "");
                      }
                      return <li key={idx}>{text}</li>;
                    })}
                  </ol>
                ) : (
                  <div className="text-slate-400 italic text-center py-2">
                    Tidak ada issue operasional.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="right-col">
            {/* SECTION D: PRODUKSI (LIMS Integration) */}
            <div className="card card-produksi">
              <div className="card-title">PRODUKSI</div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "16%" }}>UNIT</th>
                    <th style={{ width: "18%" }}>Produk</th>
                    <th style={{ width: "12%" }}>AKTUAL</th>
                    <th style={{ width: "54%" }}>ANALISA SAMPLE</th>
                  </tr>
                </thead>
                <tbody>
                  {/* UNIT 021 HVU II */}
                  <tr>
                    <td rowSpan={4} className="text-center font-bold">
                      UNIT 021 HVU II
                    </td>
                    <td>
                      <div>SPO DIST</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_spo_dist ?? "LOC I"}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            dest_spo_dist: e.target.value,
                          })
                        }
                        className="editable-input text-left font-bold text-slate-900 p-0"
                        title="Klik untuk mengubah tujuan/tangki SPO DIST"
                      />
                    </td>
                    <td className="text-center font-semibold text-slate-900">
                      {spoActual} T/D
                    </td>
                    <td>
                      {renderSpecStatus(
                        isSampleOnSpec("02103", [
                          { paramName: "Visco 60°C", fallbackVal: "12.50" },
                        ]),
                      )}
                      <div className="sample-grid sample-grid-single">
                        <span className="font-bold">Visco</span>
                        {renderLimsParam("02103", "Visco 60°C", "12.50", "cSt")}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>LMO DIST</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_lmo_dist ?? "041T-116"}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            dest_lmo_dist: e.target.value,
                          })
                        }
                        className="editable-input text-left font-bold text-slate-900 p-0"
                        title="Klik untuk mengubah tujuan/tangki LMO DIST"
                      />
                    </td>
                    <td className="text-center font-semibold text-slate-900">
                      {lmoDistActual} T/D
                    </td>
                    <td>
                      {renderSpecStatus(
                        isSampleOnSpec("02104", [
                          { paramName: "Visco 60°C", fallbackVal: "31.21" },
                        ]),
                      )}
                      <div className="sample-grid sample-grid-single">
                        <span className="font-bold">Visco</span>
                        {renderLimsParam("02104", "Visco 60°C", "31.21", "cSt")}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>MMO DIST</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_mmo_dist ?? "041T-117"}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            dest_mmo_dist: e.target.value,
                          })
                        }
                        className="editable-input text-left font-bold text-slate-900 p-0"
                        title="Klik untuk mengubah tujuan/tangki MMO DIST"
                      />
                    </td>
                    <td className="text-center font-semibold text-slate-900">
                      {mmoDistActual} T/D
                    </td>
                    <td>
                      {renderSpecStatus(
                        isSampleOnSpec("02105", [
                          { paramName: "Visco 60°C", fallbackVal: "95.75" },
                        ]),
                      )}
                      <div className="sample-grid sample-grid-single">
                        <span className="font-bold">Visco</span>
                        {renderLimsParam("02105", "Visco 60°C", "95.75", "cSt")}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>SHORT RESIDUE</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_short_residue ?? "041T-121/310"}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            dest_short_residue: e.target.value,
                          })
                        }
                        className="editable-input text-left font-bold text-slate-900 p-0"
                        title="Klik untuk mengubah tujuan/tangki SHORT RESIDUE"
                      />
                    </td>
                    <td className="text-center font-semibold text-slate-900">
                      {shortResidueActual} T/D
                    </td>
                    <td>
                      {renderSpecStatus(
                        isSampleOnSpec("02107", [
                          { paramName: "Visco 100°C", fallbackVal: "1166.00" },
                        ]),
                      )}
                      <div className="sample-grid sample-grid-single">
                        <span className="font-bold">Visco</span>
                        {renderLimsParam(
                          "02107",
                          "Visco 100°C",
                          "1166.00",
                          "cSt",
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* UNIT 022 PDU II */}
                  <tr>
                    <td rowSpan={2} className="text-center font-bold">
                      UNIT 022 PDU II
                    </td>
                    <td>
                      <div>DAO</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_dao ?? "041T-115"}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            dest_dao: e.target.value,
                          })
                        }
                        className="editable-input text-left font-bold text-slate-900 p-0"
                        title="Klik untuk mengubah tujuan/tangki DAO"
                      />
                    </td>
                    <td className="text-center font-semibold text-slate-900">
                      {daoActual} T/D
                    </td>
                    <td>
                      {renderSpecStatus(
                        isSampleOnSpec("02203", [
                          { paramName: "Visco 100°C", fallbackVal: "43.81" },
                          { paramName: "FP PMCC", fallbackVal: "288" },
                          { paramName: "Color", fallbackVal: "L7.5" },
                        ]),
                      )}
                      <div className="sample-grid sample-grid-3">
                        <span className="font-bold">Visco</span>
                        <span className="font-bold">FP</span>
                        <span className="font-bold">COL</span>
                        {renderLimsParam("02203", "Visco 100°C", "43.81")}
                        {renderLimsParam("02203", "FP PMCC", "288")}
                        {renderLimsParam("02203", "Color", "L7.5")}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>ASPHALT</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_asphalt ?? "42T-10"}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            dest_asphalt: e.target.value,
                          })
                        }
                        className="editable-input text-left font-bold text-slate-900 p-0"
                        title="Klik untuk mengubah tujuan/tangki ASPHALT"
                      />
                    </td>
                    <td className="text-center font-semibold text-slate-900">
                      {asphaltActual} T/D
                    </td>
                    <td></td>
                  </tr>

                  {/* UNIT 023 FEU II */}
                  <tr>
                    <td rowSpan={2} className="text-center font-bold">
                      UNIT 023 FEU II
                    </td>
                    <td>
                      <div>RAFFINATE</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_raffinate ?? "41T-315"}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            dest_raffinate: e.target.value,
                          })
                        }
                        className="editable-input text-left font-bold text-slate-900 p-0"
                        title="Klik untuk mengubah tujuan/tangki RAFFINATE"
                      />
                    </td>
                    <td className="text-center font-semibold text-slate-900">
                      {raffActual} T/D
                    </td>
                    <td>
                      {renderSpecStatus(
                        isSampleOnSpec(sampleCode023, [
                          { paramName: "Visco 100°C", fallbackVal: "14.960" },
                          { paramName: "FP PMCC", fallbackVal: "262" },
                          { paramName: "RI 70°C", fallbackVal: "1.4861" },
                        ]),
                      )}
                      <div className="sample-grid sample-grid-3">
                        <span className="font-bold">Visco</span>
                        <span className="font-bold">FP</span>
                        <span className="font-bold">RI</span>
                        {renderLimsParam(
                          sampleCode023,
                          "Visco 100°C",
                          "14.960",
                        )}
                        {renderLimsParam(sampleCode023, "FP PMCC", "262")}
                        {renderLimsParam(sampleCode023, "RI 70°C", "1.4861")}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>EXTRACT</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_extract ?? "IFO"}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            dest_extract: e.target.value,
                          })
                        }
                        className="editable-input text-left font-bold text-slate-900 p-0"
                        title="Klik untuk mengubah tujuan/tangki EXTRACT"
                      />
                    </td>
                    <td className="text-center font-semibold text-slate-900">
                      {extractActual} T/D
                    </td>
                    <td></td>
                  </tr>

                  {/* UNIT 024 MDU II */}
                  <tr>
                    <td rowSpan={2} className="text-center font-bold">
                      UNIT 024 MDU II
                    </td>
                    <td>
                      <div>DOR</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_dor ?? "41T-102"}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            dest_dor: e.target.value,
                          })
                        }
                        className="editable-input text-left font-bold text-slate-900 p-0"
                        title="Klik untuk mengubah tujuan/tangki DOR"
                      />
                    </td>
                    <td className="text-center font-semibold text-slate-900">
                      {dorActual} T/D
                    </td>
                    <td>
                      {renderSpecStatus(
                        isSampleOnSpec(sampleCode024, [
                          { paramName: "Visco 100°C", fallbackVal: "7.007" },
                          { paramName: "FP PMCC", fallbackVal: "214" },
                          { paramName: "Color", fallbackVal: "L1.0" },
                          { paramName: "VI", fallbackVal: "99" },
                          { paramName: "PP", fallbackVal: "-9" },
                          { paramName: "App", fallbackVal: "C&B" },
                        ]),
                      )}
                      <div className="sample-grid sample-grid-6">
                        <span className="font-bold">Visco</span>
                        <span className="font-bold">FP</span>
                        <span className="font-bold">COL</span>
                        <span className="font-bold">VI</span>
                        <span className="font-bold">PP</span>
                        <span className="font-bold">App</span>
                        {renderLimsParam(sampleCode024, "Visco 100°C", "7.007")}
                        {renderLimsParam(sampleCode024, "FP PMCC", "214")}
                        {renderLimsParam(sampleCode024, "Color", "L1.0")}
                        {renderLimsParam(sampleCode024, "VI", "99")}
                        {renderLimsParam(sampleCode024, "PP", "-9")}
                        {renderLimsParam(sampleCode024, "App", "C&B")}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>SLACK WAX</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_slack_wax ?? "RFCC"}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            dest_slack_wax: e.target.value,
                          })
                        }
                        className="editable-input text-left font-bold text-slate-900 p-0"
                        title="Klik untuk mengubah tujuan/tangki SLACK WAX"
                      />
                    </td>
                    <td className="text-center font-semibold text-slate-900">
                      {slackWaxActual} T/D
                    </td>
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
                    <th
                      style={{
                        background:
                          "linear-gradient(180deg, #0093e0 0%, #0076be 100%)",
                        color: "#fff",
                      }}
                    ></th>
                    <th
                      colSpan={3}
                      style={{
                        background:
                          "linear-gradient(180deg, #0093e0 0%, #0076be 100%)",
                        color: "#fff",
                      }}
                    >
                      FEU
                    </th>
                    <th
                      colSpan={3}
                      style={{
                        background:
                          "linear-gradient(180deg, #0093e0 0%, #0076be 100%)",
                        color: "#fff",
                      }}
                    >
                      MDU
                    </th>
                    <th
                      style={{
                        background:
                          "linear-gradient(180deg, #0093e0 0%, #0076be 100%)",
                        color: "#fff",
                      }}
                    >
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
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-center font-bold">LMO</td>
                    <td className="text-center font-bold">
                      {feuMduData?.feu_lmo_design || 2180}
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_lmo_sts ?? 70}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_lmo_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold"
                      />
                    </td>
                    <td rowSpan={3} className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_rph ?? 65}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_rph: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold"
                      />
                    </td>
                    <td className="text-center font-bold">
                      {feuMduData?.mdu_lmo_design || 841}
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_lmo_sts ?? 65}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_lmo_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold"
                      />
                    </td>
                    <td rowSpan={3} className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_rph ?? 65}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_rph: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold"
                      />
                    </td>
                    <td rowSpan={3} className="p-1">
                      <textarea
                        value={feuMduData?.note ?? ""}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            note: e.target.value,
                          })
                        }
                        className="editable-input w-full h-full min-h-[50px] resize-none text-[10px]"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">MMO</td>
                    <td className="text-center font-bold">
                      {feuMduData?.feu_mmo_design || 2270}
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_mmo_sts ?? 65}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_mmo_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold"
                      />
                    </td>
                    <td className="text-center font-bold">
                      {feuMduData?.mdu_mmo_design || 777}
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_mmo_sts ?? 65}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_mmo_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">DAO</td>
                    <td className="text-center font-bold">
                      {feuMduData?.feu_dao_design || 1786}
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_dao_sts ?? 70}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_dao_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold"
                      />
                    </td>
                    <td className="text-center font-bold">
                      {feuMduData?.mdu_dao_design || 501}
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_dao_sts ?? 0}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_dao_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold"
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
                  title: "Issue Maintenance",
                  type: "maintenance",
                })
              }
            >
              <div className="card-title">ISSUE MAINTENANCE</div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "22%" }}>Equipment</th>
                    <th style={{ width: "28%" }}>Issue</th>
                    <th style={{ width: "50%" }}>Mitigasi / RTL</th>
                  </tr>
                </thead>
                <tbody>
                  {issueMaintenance && issueMaintenance.length > 0 ? (
                    issueMaintenance.map((item, idx) => {
                      const equip =
                        typeof item === "object" && item !== null
                          ? item.equipment
                          : "";
                      const iss =
                        typeof item === "object" && item !== null
                          ? item.issue
                          : typeof item === "string"
                            ? item
                            : "";
                      const mit =
                        typeof item === "object" && item !== null
                          ? item.mitigation
                          : "";
                      return (
                        <tr key={idx}>
                          <td className="text-center font-bold">
                            {equip || "-"}
                          </td>
                          <td>{iss || "-"}</td>
                          <td>{mit || "-"}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center text-slate-400 italic py-2"
                      >
                        Tidak ada issue maintenance.
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
        key={`issue-modal-${modalState.type || "closed"}-${modalState.isOpen ? "open" : "closed"}`}
        isOpen={
          modalState.isOpen &&
          (modalState.type === "operational" ||
            modalState.type === "maintenance")
        }
        onClose={() =>
          setModalState({ isOpen: false, title: "", type: null, unitKey: null })
        }
        title={modalState.title}
        type={modalState.type}
        initialData={
          modalState.type === "operational"
            ? issueOperational
            : issueMaintenance
        }
        onSave={(updatedData) => {
          if (modalState.type === "operational") {
            onIssueOperationalChange(updatedData);
          } else {
            onIssueMaintenanceChange(updatedData);
          }
        }}
      />

      {/* Double-click Mode Switch Modal for Unit 023 & Unit 024 */}
      <UnitModeModal
        isOpen={modalState.isOpen && modalState.type === "unit_mode"}
        onClose={() =>
          setModalState({ isOpen: false, title: "", type: null, unitKey: null })
        }
        unitName={modalState.title}
        currentMode={unitModes?.[modalState.unitKey] || "MMO"}
        onSelectMode={(newMode) => {
          onUnitModeChange(modalState.unitKey, newMode);
        }}
      />

      {/* Interactive Status Selection Modal for Units */}
      <UnitStatusModal
        isOpen={modalState.isOpen && modalState.type === "unit_status"}
        onClose={() =>
          setModalState({ isOpen: false, title: "", type: null, unitKey: null })
        }
        unitName={modalState.title}
        currentStatus={unitStatuses?.[modalState.unitKey] || "Normal Operasi"}
        onSelectStatus={(newStatus) => {
          if (onUnitStatusChange && modalState.unitKey) {
            onUnitStatusChange(modalState.unitKey, newStatus);
          }
        }}
      />
    </div>
  );
}

import { useState } from "react";
import "./dailyReport.css";
import danantaraLogo from "./assets/danantara.png";
import pertaminaLogo from "./assets/pertamina.png";
import locLogo from "./assets/loc.png";
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
  onLimsParamChange,
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

  // Helper to check if a PHD tag has a valid numeric reading
  const hasPhdTag = (tagName) => {
    const val = getPhdTag(tagName);
    return val !== null && val !== undefined && !isNaN(val);
  };

  // Flag to check if we are viewing a saved historical report from PocketBase
  const isViewingSaved = Boolean(feuMduData?._isViewingSaved);

  // Calculations for Kapasitas Feed
  // Unit 021 HVU II
  const hvuFlow = getPhdTag("021FI_004.pv");
  const hvuSg = getPhdTag("021FY_004X.C1");
  const hasPhdHvu = hasPhdTag("021FI_004.pv");
  const calculatedHvuActual = calculateActualTD(hvuFlow, hvuSg) ?? 0;
  const isHvuOverridden = Boolean(feuMduData?._userOverrides?.hvu_actual);
  const hvuActual = isHvuOverridden
    ? feuMduData.hvu_actual
    : isViewingSaved
      ? (feuMduData?.hvu_actual ?? calculatedHvuActual)
      : calculatedHvuActual;
  const hvuDesign =
    feuMduData?.hvu_design !== undefined
      ? feuMduData.hvu_design
      : 3883;
  const hvuRphPercent = feuMduData?.hvu_rph ?? "-";
  const calculatedHvuTargetRph = calculateTargetTD(hvuRphPercent, Number(hvuDesign));
  const hvuTargetRph =
    feuMduData?.hvu_target_rph !== undefined && feuMduData?.hvu_target_rph !== "-"
      ? feuMduData.hvu_target_rph
      : (calculatedHvuTargetRph ?? "-");

  const hvuStsPercent = feuMduData?.hvu_sts ?? "-";
  const calculatedHvuTargetSts = calculateTargetTD(hvuStsPercent, Number(hvuDesign));
  const hvuTargetSts =
    feuMduData?.hvu_target_sts !== undefined && feuMduData?.hvu_target_sts !== "-"
      ? feuMduData.hvu_target_sts
      : (calculatedHvuTargetSts ?? "-");
  const calculatedHvuPercentDesign =
    calculateAchievedPercent(hvuActual, hvuDesign) ?? "0";
  const hvuPercentDesign = feuMduData?._userOverrides?.hvu_percent_design
    ? feuMduData.hvu_percent_design
    : isViewingSaved && feuMduData?.hvu_percent_design !== undefined
      ? feuMduData.hvu_percent_design
      : calculatedHvuPercentDesign;
  const calculatedHvuPercentRph =
    calculateAchievedPercent(hvuActual, hvuTargetRph) ?? "-";
  const hvuPercentRph = feuMduData?._userOverrides?.hvu_percent_rph
    ? feuMduData.hvu_percent_rph
    : isViewingSaved && feuMduData?.hvu_percent_rph !== undefined
      ? feuMduData.hvu_percent_rph
      : calculatedHvuPercentRph;
  const calculatedHvuPercentSts =
    calculateAchievedPercent(hvuActual, hvuTargetSts) ?? "-";
  const hvuPercentSts = feuMduData?._userOverrides?.hvu_percent_sts
    ? feuMduData.hvu_percent_sts
    : isViewingSaved && feuMduData?.hvu_percent_sts !== undefined
      ? feuMduData.hvu_percent_sts
      : calculatedHvuPercentSts;

  // Unit 022 PDU II
  const pduFlow = getPhdTag("022FI_001.pv");
  const pduSg = getPhdTag("022FY_001X.C1");
  const hasPhdPdu = hasPhdTag("022FI_001.pv");
  const calculatedPduActual = calculateActualTD(pduFlow, pduSg) ?? 0;
  const isPduOverridden = Boolean(feuMduData?._userOverrides?.pdu_actual);
  const pduActual = isPduOverridden
    ? feuMduData.pdu_actual
    : isViewingSaved
      ? (feuMduData?.pdu_actual ?? calculatedPduActual)
      : calculatedPduActual;
  const pduDesign =
    feuMduData?.pdu_design !== undefined
      ? feuMduData.pdu_design
      : 784;
  const pduRphPercent = feuMduData?.pdu_rph ?? "-";
  const calculatedPduTargetRph = calculateTargetTD(pduRphPercent, Number(pduDesign));
  const pduTargetRph =
    feuMduData?.pdu_target_rph !== undefined && feuMduData?.pdu_target_rph !== "-"
      ? feuMduData.pdu_target_rph
      : (calculatedPduTargetRph ?? "-");

  const pduStsPercent = feuMduData?.pdu_sts ?? "-";
  const calculatedPduTargetSts = calculateTargetTD(pduStsPercent, Number(pduDesign));
  const pduTargetSts =
    feuMduData?.pdu_target_sts !== undefined && feuMduData?.pdu_target_sts !== "-"
      ? feuMduData.pdu_target_sts
      : (calculatedPduTargetSts ?? "-");
  const calculatedPduPercentDesign =
    calculateAchievedPercent(pduActual, pduDesign) ?? "0";
  const pduPercentDesign = feuMduData?._userOverrides?.pdu_percent_design
    ? feuMduData.pdu_percent_design
    : isViewingSaved && feuMduData?.pdu_percent_design !== undefined
      ? feuMduData.pdu_percent_design
      : calculatedPduPercentDesign;
  const calculatedPduPercentRph =
    calculateAchievedPercent(pduActual, pduTargetRph) ?? "-";
  const pduPercentRph = feuMduData?._userOverrides?.pdu_percent_rph
    ? feuMduData.pdu_percent_rph
    : isViewingSaved && feuMduData?.pdu_percent_rph !== undefined
      ? feuMduData.pdu_percent_rph
      : calculatedPduPercentRph;
  const calculatedPduPercentSts =
    calculateAchievedPercent(pduActual, pduTargetSts) ?? "-";
  const pduPercentSts = feuMduData?._userOverrides?.pdu_percent_sts
    ? feuMduData.pdu_percent_sts
    : isViewingSaved && feuMduData?.pdu_percent_sts !== undefined
      ? feuMduData.pdu_percent_sts
      : calculatedPduPercentSts;

  // Unit 023 FEU II (Active Mode: LMO / MMO / DAO)
  const feuMode = unitModes?.unit023 || "MMO";
  let defaultFeuDesign = 2270;
  let feuStsPercent = feuMduData?.feu_mmo_sts ?? "-";
  let feuTagFlow = "023FIC_004.pv";
  let feuTagSg = "023FY_004CX.C1";

  if (feuMode === "LMO") {
    defaultFeuDesign = Number(feuMduData?.feu_lmo_design ?? 2180);
    feuStsPercent = feuMduData?.feu_lmo_sts ?? "-";
    feuTagSg = "023FY_004BX.C1";
  } else if (feuMode === "DAO") {
    defaultFeuDesign = Number(feuMduData?.feu_dao_design ?? 1786);
    feuStsPercent = feuMduData?.feu_dao_sts ?? "-";
    feuTagSg = "023FY_004DX.C1";
  } else {
    defaultFeuDesign = Number(feuMduData?.feu_mmo_design ?? 2270);
    feuStsPercent = feuMduData?.feu_mmo_sts ?? "-";
    feuTagSg = "023FY_004CX.C1";
  }

  // Design T/D strictly dynamically adjusts according to active feed mode
  const feuDesign = defaultFeuDesign;
  const feuRphPercent = feuMduData?.feu_rph ?? "-";
  // Target RPH & STS strictly dynamically adjust according to active feed mode
  const calculatedFeuTargetRph =
    calculateTargetTD(feuRphPercent, Number(feuDesign));
  const feuTargetRph = calculatedFeuTargetRph ?? "-";
  const calculatedFeuTargetSts =
    calculateTargetTD(feuStsPercent, Number(feuDesign));
  const feuTargetSts = calculatedFeuTargetSts ?? "-";
  const feuFlow = getPhdTag(feuTagFlow) ?? getPhdTag("023FI_004.pv");
  const feuSg = getPhdTag(feuTagSg);
  const hasPhdFeu = hasPhdTag(feuTagFlow) || hasPhdTag("023FI_004.pv");
  const calculatedFeuActual = calculateActualTD(feuFlow, feuSg) ?? 0;
  const isFeuOverridden = Boolean(feuMduData?._userOverrides?.feu_actual);
  const feuActual = isFeuOverridden
    ? feuMduData.feu_actual
    : isViewingSaved
      ? (feuMduData?.feu_actual ?? calculatedFeuActual)
      : calculatedFeuActual;
  const calculatedFeuPercentDesign =
    calculateAchievedPercent(feuActual, feuDesign) ?? "0";
  const feuPercentDesign = feuMduData?._userOverrides?.feu_percent_design
    ? feuMduData.feu_percent_design
    : isViewingSaved && feuMduData?.feu_percent_design !== undefined
      ? feuMduData.feu_percent_design
      : calculatedFeuPercentDesign;
  const calculatedFeuPercentRph =
    calculateAchievedPercent(feuActual, feuTargetRph) ?? "-";
  const feuPercentRph = feuMduData?._userOverrides?.feu_percent_rph
    ? feuMduData.feu_percent_rph
    : isViewingSaved && feuMduData?.feu_percent_rph !== undefined
      ? feuMduData.feu_percent_rph
      : calculatedFeuPercentRph;
  const calculatedFeuPercentSts =
    calculateAchievedPercent(feuActual, feuTargetSts) ?? "-";
  const feuPercentSts = feuMduData?._userOverrides?.feu_percent_sts
    ? feuMduData.feu_percent_sts
    : isViewingSaved && feuMduData?.feu_percent_sts !== undefined
      ? feuMduData.feu_percent_sts
      : calculatedFeuPercentSts;

  // Unit 024 MDU II (Active Mode: LMO / MMO / DAO)
  const mduMode = unitModes?.unit024 || "LMO";
  let defaultMduDesign = 841;
  let mduStsPercent = feuMduData?.mdu_lmo_sts ?? "-";
  let mduTagSg = "024FY_001BX.C1";

  if (mduMode === "MMO") {
    defaultMduDesign = Number(feuMduData?.mdu_mmo_design ?? 777);
    mduStsPercent = feuMduData?.mdu_mmo_sts ?? "-";
    mduTagSg = "024FY_001CX.C1";
  } else if (mduMode === "DAO") {
    defaultMduDesign = Number(feuMduData?.mdu_dao_design ?? 501);
    mduStsPercent = feuMduData?.mdu_dao_sts ?? "-";
    mduTagSg = "024FY_001DX.C1";
  } else {
    defaultMduDesign = Number(feuMduData?.mdu_lmo_design ?? 841);
    mduStsPercent = feuMduData?.mdu_lmo_sts ?? "-";
    mduTagSg = "024FY_001BX.C1";
  }

  // Design T/D strictly dynamically adjusts according to active feed mode
  const mduDesign = defaultMduDesign;
  const mduRphPercent = feuMduData?.mdu_rph ?? "-";
  // Target RPH & STS strictly dynamically adjust according to active feed mode
  const calculatedMduTargetRph =
    calculateTargetTD(mduRphPercent, Number(mduDesign));
  const mduTargetRph = calculatedMduTargetRph ?? "-";
  const calculatedMduTargetSts =
    calculateTargetTD(mduStsPercent, Number(mduDesign));
  const mduTargetSts = calculatedMduTargetSts ?? "-";
  const mduFlow = getPhdTag("024FIC_001.pv") ?? getPhdTag("024FI_001.pv");
  const mduSg = getPhdTag(mduTagSg) ?? 0.85;
  const hasPhdMdu = hasPhdTag("024FIC_001.pv") || hasPhdTag("024FI_001.pv");
  const calculatedMduActual =
    calculateActualTD(mduFlow, mduSg) ??
    (mduFlow ? Math.round(Number(mduFlow) * 0.85 * 24) : 0);
  const isMduOverridden = Boolean(feuMduData?._userOverrides?.mdu_actual);
  const mduActual = isMduOverridden
    ? feuMduData.mdu_actual
    : isViewingSaved
      ? (feuMduData?.mdu_actual ?? calculatedMduActual)
      : calculatedMduActual;
  const calculatedMduPercentDesign =
    calculateAchievedPercent(mduActual, mduDesign) ?? "0";
  const mduPercentDesign = feuMduData?._userOverrides?.mdu_percent_design
    ? feuMduData.mdu_percent_design
    : isViewingSaved && feuMduData?.mdu_percent_design !== undefined
      ? feuMduData.mdu_percent_design
      : calculatedMduPercentDesign;
  const calculatedMduPercentRph =
    calculateAchievedPercent(mduActual, mduTargetRph) ?? "-";
  const mduPercentRph = feuMduData?._userOverrides?.mdu_percent_rph
    ? feuMduData.mdu_percent_rph
    : isViewingSaved && feuMduData?.mdu_percent_rph !== undefined
      ? feuMduData.mdu_percent_rph
      : calculatedMduPercentRph;
  const calculatedMduPercentSts =
    calculateAchievedPercent(mduActual, mduTargetSts) ?? "-";
  const mduPercentSts = feuMduData?._userOverrides?.mdu_percent_sts
    ? feuMduData.mdu_percent_sts
    : isViewingSaved && feuMduData?.mdu_percent_sts !== undefined
      ? feuMduData.mdu_percent_sts
      : calculatedMduPercentSts;

  // Render % RPH and % STS cell with circle dot on left (green >= 100, red < 100) and editable input
  // Render % RPH and % STS cell with circle dot on left (green >= 100, yellow < 100) and editable input
  const renderPercentCell = (val, rowSpan = 1, onValueChange) => {
    const isHyphen = val === "-" || val === null || val === undefined || val === "";
    const num = Number(val);
    const hasVal = !isHyphen && !isNaN(num);
    const isGreen = hasVal && num >= 100;
    const dotClass = hasVal
      ? isGreen
        ? "percent-dot percent-dot-green"
        : "percent-dot percent-dot-yellow"
      : "";

    return (
      <td rowSpan={rowSpan} className="text-center p-0">
        <div className="flex items-center justify-center w-full h-full px-0.5">
          {hasVal && (
            <span
              className={dotClass}
              title={isGreen ? ">= 100% (Green / On Target)" : "< 100% (Yellow / Under Target)"}
            ></span>
          )}
          {onValueChange ? (
            <input
              type="text"
              value={val ?? "-"}
              onDoubleClick={(e) => e.target.select()}
              onChange={(e) => onValueChange(e.target.value)}
              className="editable-input text-center font-bold text-slate-800 p-0 flex-1 min-w-0"
            />
          ) : (
            <span className="font-bold text-slate-800">{isHyphen ? "-" : val}</span>
          )}
          {!isHyphen && (
            <span className="percent-sign font-bold text-slate-800 shrink-0 ml-0.5">%</span>
          )}
        </div>
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
  const hosSg = getPhdTag("021FY_058X.C1") ?? getPhdTag("025FY_004X.PV") ?? 0.88;
  const hasPhdHos = hasPhdTag("025FIC_004.pv") || hasPhdTag("025FI_004.pv");
  const calculatedHosActual = calculateActualTD(hosFlow, hosSg) ?? 0;
  const pbFallbackHos = feuMduData?._pbFallbacks?.hos_actual;
  const isHosOverridden = Boolean(feuMduData?._userOverrides?.hos_actual);
  const hosActual = isHosOverridden
    ? feuMduData.hos_actual
    : isViewingSaved
      ? (feuMduData?.hos_actual ?? calculatedHosActual)
      : calculatedHosActual;

  const rawLevel023 = getPhdTag("023LI_005.PV");
  const hasPhdLevel023 = hasPhdTag("023LI_005.PV");
  const calculatedLevel023C104 =
    rawLevel023 !== null ? rawLevel023.toFixed(1) : "0";
  const isLevel023Overridden = Boolean(feuMduData?._userOverrides?.level_023c104);
  const level023C104 = isLevel023Overridden
    ? feuMduData.level_023c104
    : isViewingSaved
      ? (feuMduData?.level_023c104 ?? calculatedLevel023C104)
      : calculatedLevel023C104;

  const rawLevelCpi = getPhdTag("002LI_051.PV");
  const hasPhdLevelCpi = hasPhdTag("002LI_051.PV");
  const calculatedLevelCpi =
    rawLevelCpi !== null ? rawLevelCpi.toFixed(1) : "0";
  const isLevelCpiOverridden = Boolean(feuMduData?._userOverrides?.level_cpi);
  const levelCpi = isLevelCpiOverridden
    ? feuMduData.level_cpi
    : isViewingSaved
      ? (feuMduData?.level_cpi ?? calculatedLevelCpi)
      : calculatedLevelCpi;

  // Tank Farm Product Stocks (Tons calculated from tank dimensions and tag levels)
  const tanksHvi95 = ["41T-101", "41T-102", "41T-104"];
  const tanksHvi160S = ["41T-103", "41T-107", "41T-108"];
  const tanksHvi650 = ["41T-105", "41T-106", "41T-109", "41T-110"];

  const hasPhdTankLevels = tanks.some((t) => hasPhdTag(t.tag_level));
  const defaultStockHvi95 =
    calculateProductGroupTons(tanksHvi95, tanks, phdData) || 0;
  const defaultStockHvi160S =
    calculateProductGroupTons(tanksHvi160S, tanks, phdData) || 0;
  const defaultStockHvi650 =
    calculateProductGroupTons(tanksHvi650, tanks, phdData) || 0;

  const isStock95Overridden = Boolean(feuMduData?._userOverrides?.stock_hvi_95);
  const calculatedStockHvi95 = isStock95Overridden
    ? feuMduData.stock_hvi_95
    : isViewingSaved
      ? (feuMduData?.stock_hvi_95 ?? defaultStockHvi95)
      : defaultStockHvi95;

  const isStock160sOverridden = Boolean(feuMduData?._userOverrides?.stock_hvi_160s);
  const calculatedStockHvi160S = isStock160sOverridden
    ? feuMduData.stock_hvi_160s
    : isViewingSaved
      ? (feuMduData?.stock_hvi_160s ?? defaultStockHvi160S)
      : defaultStockHvi160S;

  const isStock650Overridden = Boolean(feuMduData?._userOverrides?.stock_hvi_650);
  const calculatedStockHvi650 = isStock650Overridden
    ? feuMduData.stock_hvi_650
    : isViewingSaved
      ? (feuMduData?.stock_hvi_650 ?? defaultStockHvi650)
      : defaultStockHvi650;

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
  const calculatedSpoActual = calculateActualTD(spoFlow, spoSg) ?? 0;
  const isSpoOverridden = Boolean(feuMduData?._userOverrides?.spo_actual);
  const spoActual = isSpoOverridden
    ? feuMduData.spo_actual
    : isViewingSaved
      ? (feuMduData?.spo_actual ?? calculatedSpoActual)
      : calculatedSpoActual;

  const lmoDistFlow = getPhdTag("021FIC_057.PV");
  const lmoDistSg = getPhdTag("021FY_057X.C1");
  const calculatedLmoDistActual = calculateActualTD(lmoDistFlow, lmoDistSg) ?? 0;
  const isLmoDistOverridden = Boolean(feuMduData?._userOverrides?.lmo_dist_actual);
  const lmoDistActual = isLmoDistOverridden
    ? feuMduData.lmo_dist_actual
    : isViewingSaved
      ? (feuMduData?.lmo_dist_actual ?? calculatedLmoDistActual)
      : calculatedLmoDistActual;

  const mmoDistFlow = getPhdTag("021FI_008.PV");
  const mmoDistSg = getPhdTag("021FY_008X.c1");
  const calculatedMmoDistActual = calculateActualTD(mmoDistFlow, mmoDistSg) ?? 0;
  const isMmoDistOverridden = Boolean(feuMduData?._userOverrides?.mmo_dist_actual);
  const mmoDistActual = isMmoDistOverridden
    ? feuMduData.mmo_dist_actual
    : isViewingSaved
      ? (feuMduData?.mmo_dist_actual ?? calculatedMmoDistActual)
      : calculatedMmoDistActual;

  const shortResidueFlow = getPhdTag("021FI_002.PV");
  const shortResidueSg = getPhdTag("021FY_002X.C1");
  const calculatedShortResidueActual =
    calculateActualTD(shortResidueFlow, shortResidueSg) ?? 0;
  const isShortResidueOverridden = Boolean(feuMduData?._userOverrides?.short_residue_actual);
  const shortResidueActual = isShortResidueOverridden
    ? feuMduData.short_residue_actual
    : isViewingSaved
      ? (feuMduData?.short_residue_actual ?? calculatedShortResidueActual)
      : calculatedShortResidueActual;

  // Unit 022 PDU II
  const daoFlow = getPhdTag("022FI_007.PV");
  const daoSg = getPhdTag("022FY_007X.C1");
  const calculatedDaoActual = calculateActualTD(daoFlow, daoSg) ?? 0;
  const isDaoOverridden = Boolean(feuMduData?._userOverrides?.dao_actual);
  const daoActual = isDaoOverridden
    ? feuMduData.dao_actual
    : isViewingSaved
      ? (feuMduData?.dao_actual ?? calculatedDaoActual)
      : calculatedDaoActual;

  const asphaltFlow = getPhdTag("022FI_013.PV");
  const asphaltSg = getPhdTag("022FY_013X.C1");
  const calculatedAsphaltActual = calculateActualTD(asphaltFlow, asphaltSg) ?? 0;
  const isAsphaltOverridden = Boolean(feuMduData?._userOverrides?.asphalt_actual);
  const asphaltActual = isAsphaltOverridden
    ? feuMduData.asphalt_actual
    : isViewingSaved
      ? (feuMduData?.asphalt_actual ?? calculatedAsphaltActual)
      : calculatedAsphaltActual;

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
  const calculatedRaffActual = calculateActualTD(totalRaffFlow, raffSg) ?? 0;
  const isRaffOverridden = Boolean(feuMduData?._userOverrides?.raff_actual);
  const raffActual = isRaffOverridden
    ? feuMduData.raff_actual
    : isViewingSaved
      ? (feuMduData?.raff_actual ?? calculatedRaffActual)
      : calculatedRaffActual;

  const extractFlow = getPhdTag("023FI_028.pv") ?? getPhdTag("023FI_028.PV");
  let extractSgTag = "023FY_028CX.C1";
  if (feuMode === "LMO") extractSgTag = "023FY_028BX.C1";
  else if (feuMode === "DAO") extractSgTag = "023FY_028DX.C1";
  const extractSg = getPhdTag(extractSgTag);
  const calculatedExtractActual = calculateActualTD(extractFlow, extractSg) ?? 0;
  const isExtractOverridden = Boolean(feuMduData?._userOverrides?.extract_actual);
  const extractActual = isExtractOverridden
    ? feuMduData.extract_actual
    : isViewingSaved
      ? (feuMduData?.extract_actual ?? calculatedExtractActual)
      : calculatedExtractActual;

  // Unit 024 MDU II
  const dorFlow = getPhdTag("024FI_023.PV");
  let dorSgTag = "024FY_023BX.C1";
  if (mduMode === "MMO") dorSgTag = "024FY_023CX.C1";
  else if (mduMode === "DAO") dorSgTag = "024FY_023DX.C1";
  const dorSg = getPhdTag(dorSgTag) ?? 0.88;
  const calculatedDorActual = calculateActualTD(dorFlow, dorSg) ?? 0;
  const isDorOverridden = Boolean(feuMduData?._userOverrides?.dor_actual);
  const dorActual = isDorOverridden
    ? feuMduData.dor_actual
    : isViewingSaved
      ? (feuMduData?.dor_actual ?? calculatedDorActual)
      : calculatedDorActual;

  // Tank Farm LOC II Flow Product based on active Unit 024 MDU II Mode:
  // LMO -> HVI 95, MMO -> HVI 160S, DAO -> HVI 650. Non-active modes display 0.
  const defaultFlowHvi95Loc2 = mduMode === "LMO" ? dorActual : 0;
  const defaultFlowHvi160sLoc2 = mduMode === "MMO" ? dorActual : 0;
  const defaultFlowHvi650Loc2 = mduMode === "DAO" ? dorActual : 0;

  const isFlow95Overridden = Boolean(feuMduData?._userOverrides?.flow_hvi_95_loc2);
  const flowHvi95Loc2 = isFlow95Overridden
    ? feuMduData.flow_hvi_95_loc2
    : isViewingSaved
      ? (feuMduData?.flow_hvi_95_loc2 ?? defaultFlowHvi95Loc2)
      : defaultFlowHvi95Loc2;

  const isFlow160sOverridden = Boolean(feuMduData?._userOverrides?.flow_hvi_160s_loc2);
  const flowHvi160sLoc2 = isFlow160sOverridden
    ? feuMduData.flow_hvi_160s_loc2
    : isViewingSaved
      ? (feuMduData?.flow_hvi_160s_loc2 ?? defaultFlowHvi160sLoc2)
      : defaultFlowHvi160sLoc2;

  const isFlow650Overridden = Boolean(feuMduData?._userOverrides?.flow_hvi_650_loc2);
  const flowHvi650Loc2 = isFlow650Overridden
    ? feuMduData.flow_hvi_650_loc2
    : isViewingSaved
      ? (feuMduData?.flow_hvi_650_loc2 ?? defaultFlowHvi650Loc2)
      : defaultFlowHvi650Loc2;

  // Tank Farm LOC III Flow Product (editable, defaults 0, 0, 256)
  const flowHvi95Loc3 =
    feuMduData?.flow_hvi_95_loc3 !== undefined
      ? feuMduData.flow_hvi_95_loc3
      : 0;

  const flowHvi160sLoc3 =
    feuMduData?.flow_hvi_160s_loc3 !== undefined
      ? feuMduData.flow_hvi_160s_loc3
      : 0;

  const flowHvi650Loc3 =
    feuMduData?.flow_hvi_650_loc3 !== undefined
      ? feuMduData.flow_hvi_650_loc3
      : 0;

  // Requirement: Slack wax T/D is Aktual T/D Unit 024 - Aktual DOR T/D
  const calculatedSlackWaxActual = Math.max(
    0,
    Math.round(((Number(mduActual) || 0) - (Number(dorActual) || 0)) * 10) / 10,
  );
  const isSlackWaxOverridden = Boolean(feuMduData?._userOverrides?.slack_wax_actual);
  const slackWaxActual = isSlackWaxOverridden
    ? feuMduData.slack_wax_actual
    : isViewingSaved
      ? (feuMduData?.slack_wax_actual ?? calculatedSlackWaxActual)
      : calculatedSlackWaxActual;

  // Helper to render LIMS parameter cell with limit comparison & inline editability
  const renderLimsParam = (
    sampleCode,
    paramName,
    fallbackVal = "0",
    unit = "",
  ) => {
    const baseCode = sampleCode.replace(/[MD]$/, "");
    const sample =
      limsData?.samples?.[sampleCode] || limsData?.samples?.[baseCode];
    let rawVal =
      sample?.[paramName]?.value !== undefined
        ? sample[paramName].value
        : (paramName === "App" && sample?.["Appearance"]?.value !== undefined)
          ? sample["Appearance"].value
          : fallbackVal;

    if (typeof rawVal === "string" && /clear\s*(&|and)?\s*bright/i.test(rawVal.trim())) {
      rawVal = "C&B";
    }

    // Find limit record in sampleLimits from PocketBase matching the mode sample code
    const limitRecord =
      sampleLimits.find(
        (lim) =>
          lim.sample_code === sampleCode &&
          (lim.param_name === paramName || (paramName === "App" && lim.param_name === "Appearance")),
      ) ||
      sampleLimits.find(
        (lim) =>
          lim.sample_code === baseCode &&
          (lim.param_name === paramName || (paramName === "App" && lim.param_name === "Appearance")),
      );

    const evaluated = evaluateSampleLimit(rawVal, limitRecord);

    const valColorClass = evaluated.isOutOfRange
      ? "text-red"
      : evaluated.formattedValue !== ""
        ? "text-green"
        : "text-slate-800";

    const isApp = paramName === "App" || paramName === "Appearance";
    const valStr = evaluated.formattedValue || "";
    const charWidth = isApp
      ? Math.max(5.5, valStr.length + 2.5)
      : Math.max(2, valStr.length + 0.5);
    const minWidth = isApp ? "38px" : "16px";

    return (
      <span className="lims-param-cell inline-flex items-baseline justify-start gap-0.5 text-left">
        <input
          type="text"
          value={evaluated.formattedValue}
          onDoubleClick={(e) => e.target.select()}
          onChange={(e) => {
            onLimsParamChange?.(sampleCode, paramName, e.target.value);
          }}
          className={`lims-param-input ${valColorClass} font-bold`}
          style={{
            width: `${charWidth}ch`,
            minWidth: minWidth,
          }}
          title={
            evaluated.isOutOfRange
              ? "Out of specification limit (Red / OFF SPEC)"
              : "Within specification limit (Green / ON SPEC)"
          }
        />
        {unit && <span className="font-bold ml-0.5">{unit}</span>}
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
      let rawVal =
        sample?.[item.paramName]?.value !== undefined
          ? sample[item.paramName].value
          : (item.paramName === "App" && sample?.["Appearance"]?.value !== undefined)
            ? sample["Appearance"].value
            : item.fallbackVal;
      if (typeof rawVal === "string" && /clear\s*(&|and)?\s*bright/i.test(rawVal.trim())) {
        rawVal = "C&B";
      }
      const limitRecord =
        sampleLimits.find(
          (lim) =>
            lim.sample_code === sampleCode &&
            (lim.param_name === item.paramName || (item.paramName === "App" && lim.param_name === "Appearance")),
        ) ||
        sampleLimits.find(
          (lim) =>
            lim.sample_code === baseCode &&
            (lim.param_name === item.paramName || (item.paramName === "App" && lim.param_name === "Appearance")),
        );
      const evaluated = evaluateSampleLimit(rawVal, limitRecord);
      if (evaluated.isOutOfRange) {
        return false;
      }
    }
    return true;
  };

  // Helper to render On Spec / Off Spec circle dot beside sample analysis
  const renderSpecStatus = (isOnSpec) => {
    return (
      <span
        className={`spec-status-dot ${
          isOnSpec ? "dot-onspec" : "dot-offspec"
        }`}
        title={isOnSpec ? "ON SPEC" : "OFF SPEC"}
      ></span>
    );
  };

  // Helper to render parameter label (keeps black text color as requested)
  const renderParamLabel = (sampleCode, paramName, labelText) => {
    return <span className="font-bold text-slate-800">{labelText}</span>;
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
              crossOrigin="anonymous"
            />
          </div>
          <div className="banner-title">DAILY REPORT LOC II</div>
          <div className="logo-right">
            <img
              src={locLogo}
              alt="LOC II"
              className="logo-loc"
              crossOrigin="anonymous"
            />
            <img
              src={pertaminaLogo}
              alt="Pertamina Patra Niaga"
              className="logo-img"
              crossOrigin="anonymous"
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
                <colgroup>
                  <col style={{ width: "15.5%" }} />
                  <col style={{ width: "11.5%" }} />
                  <col style={{ width: "9.5%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "11.5%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "9.5%" }} />
                  <col style={{ width: "11.25%" }} />
                  <col style={{ width: "11.25%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>UNIT</th>
                    <th>Status</th>
                    <th>Design (T/D)</th>
                    <th>Aktual (T/D)</th>
                    <th>Target RPH</th>
                    <th>Target STS</th>
                    <th>% Design</th>
                    <th>% RPH</th>
                    <th>% STS</th>
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
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={hvuDesign}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            hvu_design: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={hvuActual}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            hvu_actual: e.target.value,
                            _userOverrides: {
                              ...(feuMduData?._userOverrides || {}),
                              hvu_actual: true,
                            },
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={hvuTargetRph}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            hvu_target_rph: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={hvuTargetSts}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            hvu_target_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={hvuPercentDesign}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            hvu_percent_design: e.target.value,
                            _userOverrides: {
                              ...(feuMduData?._userOverrides || {}),
                              hvu_percent_design: true,
                            },
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    {renderPercentCell(hvuPercentRph, 1, (val) =>
                      onFeuMduChange({
                        ...feuMduData,
                        hvu_percent_rph: val,
                        _userOverrides: {
                          ...(feuMduData?._userOverrides || {}),
                          hvu_percent_rph: true,
                        },
                      }),
                    )}
                    {renderPercentCell(hvuPercentSts, 1, (val) =>
                      onFeuMduChange({
                        ...feuMduData,
                        hvu_percent_sts: val,
                        _userOverrides: {
                          ...(feuMduData?._userOverrides || {}),
                          hvu_percent_sts: true,
                        },
                      }),
                    )}
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
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={pduDesign}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            pdu_design: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={pduActual}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            pdu_actual: e.target.value,
                            _userOverrides: {
                              ...(feuMduData?._userOverrides || {}),
                              pdu_actual: true,
                            },
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={pduTargetRph}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            pdu_target_rph: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={pduTargetSts}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            pdu_target_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={pduPercentDesign}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            pdu_percent_design: e.target.value,
                            _userOverrides: {
                              ...(feuMduData?._userOverrides || {}),
                              pdu_percent_design: true,
                            },
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    {renderPercentCell(pduPercentRph, 1, (val) =>
                      onFeuMduChange({
                        ...feuMduData,
                        pdu_percent_rph: val,
                        _userOverrides: {
                          ...(feuMduData?._userOverrides || {}),
                          pdu_percent_rph: true,
                        },
                      }),
                    )}
                    {renderPercentCell(pduPercentSts, 1, (val) =>
                      onFeuMduChange({
                        ...feuMduData,
                        pdu_percent_sts: val,
                        _userOverrides: {
                          ...(feuMduData?._userOverrides || {}),
                          pdu_percent_sts: true,
                        },
                      }),
                    )}
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
                    <td rowSpan={2} className="text-center p-0">
                      <input
                        type="text"
                        value={feuDesign}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) => {
                          const activeDesignKey = `feu_${feuMode.toLowerCase()}_design`;
                          onFeuMduChange({
                            ...feuMduData,
                            [activeDesignKey]: e.target.value,
                          });
                        }}
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td
                      rowSpan={2}
                      className="text-center font-bold text-slate-800 p-0"
                    >
                      <input
                        type="text"
                        value={feuActual}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_actual: e.target.value,
                            _userOverrides: {
                              ...(feuMduData?._userOverrides || {}),
                              feu_actual: true,
                            },
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td rowSpan={2} className="text-center p-0">
                      <input
                        type="text"
                        value={feuTargetRph}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || val === "-") {
                            onFeuMduChange({
                              ...feuMduData,
                              feu_rph: val,
                            });
                          } else {
                            const num = Number(val);
                            const d = Number(feuDesign);
                            const pct =
                              !isNaN(num) && d > 0
                                ? String(Math.round((num / d) * 100))
                                : val;
                            onFeuMduChange({
                              ...feuMduData,
                              feu_rph: pct,
                            });
                          }
                        }}
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td rowSpan={2} className="text-center p-0">
                      <input
                        type="text"
                        value={feuTargetSts}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          const activeStsKey = `feu_${feuMode.toLowerCase()}_sts`;
                          if (val === "" || val === "-") {
                            onFeuMduChange({
                              ...feuMduData,
                              [activeStsKey]: val,
                            });
                          } else {
                            const num = Number(val);
                            const d = Number(feuDesign);
                            const pct =
                              !isNaN(num) && d > 0
                                ? String(Math.round((num / d) * 100))
                                : val;
                            onFeuMduChange({
                              ...feuMduData,
                              [activeStsKey]: pct,
                            });
                          }
                        }}
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td
                      rowSpan={2}
                      className="text-center font-bold text-slate-800 p-0"
                    >
                      <input
                        type="text"
                        value={feuPercentDesign}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_percent_design: e.target.value,
                            _userOverrides: {
                              ...(feuMduData?._userOverrides || {}),
                              feu_percent_design: true,
                            },
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    {renderPercentCell(feuPercentRph, 2, (val) =>
                      onFeuMduChange({
                        ...feuMduData,
                        feu_percent_rph: val,
                        _userOverrides: {
                          ...(feuMduData?._userOverrides || {}),
                          feu_percent_rph: true,
                        },
                      }),
                    )}
                    {renderPercentCell(feuPercentSts, 2, (val) =>
                      onFeuMduChange({
                        ...feuMduData,
                        feu_percent_sts: val,
                        _userOverrides: {
                          ...(feuMduData?._userOverrides || {}),
                          feu_percent_sts: true,
                        },
                      }),
                    )}
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
                    <td rowSpan={2} className="text-center p-0">
                      <input
                        type="text"
                        value={mduDesign}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) => {
                          const activeDesignKey = `mdu_${mduMode.toLowerCase()}_design`;
                          onFeuMduChange({
                            ...feuMduData,
                            [activeDesignKey]: e.target.value,
                          });
                        }}
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td
                      rowSpan={2}
                      className="text-center font-bold text-slate-800 p-0"
                    >
                      <input
                        type="text"
                        value={mduActual}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_actual: e.target.value,
                            _userOverrides: {
                              ...(feuMduData?._userOverrides || {}),
                              mdu_actual: true,
                            },
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td rowSpan={2} className="text-center p-0">
                      <input
                        type="text"
                        value={mduTargetRph}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || val === "-") {
                            onFeuMduChange({
                              ...feuMduData,
                              mdu_rph: val,
                            });
                          } else {
                            const num = Number(val);
                            const d = Number(mduDesign);
                            const pct =
                              !isNaN(num) && d > 0
                                ? String(Math.round((num / d) * 100))
                                : val;
                            onFeuMduChange({
                              ...feuMduData,
                              mdu_rph: pct,
                            });
                          }
                        }}
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td rowSpan={2} className="text-center p-0">
                      <input
                        type="text"
                        value={mduTargetSts}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          const activeStsKey = `mdu_${mduMode.toLowerCase()}_sts`;
                          if (val === "" || val === "-") {
                            onFeuMduChange({
                              ...feuMduData,
                              [activeStsKey]: val,
                            });
                          } else {
                            const num = Number(val);
                            const d = Number(mduDesign);
                            const pct =
                              !isNaN(num) && d > 0
                                ? String(Math.round((num / d) * 100))
                                : val;
                            onFeuMduChange({
                              ...feuMduData,
                              [activeStsKey]: pct,
                            });
                          }
                        }}
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td
                      rowSpan={2}
                      className="text-center font-bold text-slate-800 p-0"
                    >
                      <input
                        type="text"
                        value={mduPercentDesign}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_percent_design: e.target.value,
                            _userOverrides: {
                              ...(feuMduData?._userOverrides || {}),
                              mdu_percent_design: true,
                            },
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    {renderPercentCell(mduPercentRph, 2, (val) =>
                      onFeuMduChange({
                        ...feuMduData,
                        mdu_percent_rph: val,
                        _userOverrides: {
                          ...(feuMduData?._userOverrides || {}),
                          mdu_percent_rph: true,
                        },
                      }),
                    )}
                    {renderPercentCell(mduPercentSts, 2, (val) =>
                      onFeuMduChange({
                        ...feuMduData,
                        mdu_percent_sts: val,
                        _userOverrides: {
                          ...(feuMduData?._userOverrides || {}),
                          mdu_percent_sts: true,
                        },
                      }),
                    )}
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
                        value={feuMduData?.pompa_hos ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            pompa_hos: e.target.value,
                          })
                        }
                        className="editable-input text-center font-medium p-0"
                        title="Klik untuk mengubah Pompa HOS"
                      />
                    </td>
                    <td className="text-center font-bold text-slate-800 p-0">
                      <input
                        type="text"
                        value={hosActual}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            hos_actual: e.target.value,
                            _userOverrides: {
                              ...(feuMduData?._userOverrides || {}),
                              hos_actual: true,
                            },
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        list="burner-fg-fo-list"
                        value={feuMduData?.burner_fg_fo ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            burner_fg_fo: e.target.value,
                          })
                        }
                        className="editable-input text-center font-medium p-0"
                        title="Klik untuk mengubah Burner FG/FO"
                      />
                    </td>
                    <td colSpan={4} className="text-center font-semibold p-0">
                      <input
                        type="text"
                        value={level023C104}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            level_023c104: e.target.value,
                            _userOverrides: {
                              ...(feuMduData?._userOverrides || {}),
                              level_023c104: true,
                            },
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900 p-0"
                      />
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
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            flow_hvi_95_loc2: e.target.value,
                            _userOverrides: {
                              ...(feuMduData?._userOverrides || {}),
                              flow_hvi_95_loc2: true,
                            },
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900 p-0"
                        title="Klik untuk mengubah Flow HVI 95 LOC II"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={flowHvi160sLoc2}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            flow_hvi_160s_loc2: e.target.value,
                            _userOverrides: {
                              ...(feuMduData?._userOverrides || {}),
                              flow_hvi_160s_loc2: true,
                            },
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900 p-0"
                        title="Klik untuk mengubah Flow HVI 160S LOC II"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={flowHvi650Loc2}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            flow_hvi_650_loc2: e.target.value,
                            _userOverrides: {
                              ...(feuMduData?._userOverrides || {}),
                              flow_hvi_650_loc2: true,
                            },
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900 p-0"
                        title="Klik untuk mengubah Flow HVI 650 LOC II"
                      />
                    </td>
                    <td colSpan={2} className="text-center font-semibold p-0">
                      <input
                        type="text"
                        value={levelCpi}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            level_cpi: e.target.value,
                            _userOverrides: {
                              ...(feuMduData?._userOverrides || {}),
                              level_cpi: true,
                            },
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900 p-0"
                      />
                    </td>
                    <td colSpan={2} className="text-center p-0">
                      <input
                        type="text"
                        list="visual-perairan-list"
                        value={feuMduData?.visual_perairan ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            visual_perairan: e.target.value,
                          })
                        }
                        className={`editable-input text-center font-bold uppercase p-0 ${
                          String(feuMduData?.visual_perairan ?? "-")
                            .toUpperCase()
                            .includes("CLEAR")
                            ? "text-green"
                            : String(feuMduData?.visual_perairan ?? "-").trim() === "-"
                              ? "text-slate-800"
                              : "text-red"
                        }`}
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
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            flow_hvi_95_loc3: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900 p-0"
                        title="Klik untuk mengubah Flow HVI 95 LOC III"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={flowHvi160sLoc3}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            flow_hvi_160s_loc3: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900 p-0"
                        title="Klik untuk mengubah Flow HVI 160S LOC III"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        value={flowHvi650Loc3}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            flow_hvi_650_loc3: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900 p-0"
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
                    <td className="text-center font-bold text-slate-900 p-0">
                      <input
                        type="text"
                        value={calculatedStockHvi95}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            stock_hvi_95: e.target.value,
                            _userOverrides: {
                              ...(feuMduData?._userOverrides || {}),
                              stock_hvi_95: true,
                            },
                          })
                        }
                        className="editable-input text-center font-bold text-slate-900 p-0"
                      />
                    </td>
                    <td className="text-center font-bold text-slate-900 p-0">
                      <input
                        type="text"
                        value={calculatedStockHvi160S}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            stock_hvi_160s: e.target.value,
                            _userOverrides: {
                              ...(feuMduData?._userOverrides || {}),
                              stock_hvi_160s: true,
                            },
                          })
                        }
                        className="editable-input text-center font-bold text-slate-900 p-0"
                      />
                    </td>
                    <td className="text-center font-bold text-slate-900 p-0">
                      <input
                        type="text"
                        value={calculatedStockHvi650}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            stock_hvi_650: e.target.value,
                            _userOverrides: {
                              ...(feuMduData?._userOverrides || {}),
                              stock_hvi_650: true,
                            },
                          })
                        }
                        className="editable-input text-center font-bold text-slate-900 p-0"
                      />
                    </td>
                    <td colSpan={2} className="text-center p-0">
                      <input
                        type="text"
                        list="pompa-cpi-status-list"
                        value={feuMduData?.status_pompa_cpi_a ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            status_pompa_cpi_a: e.target.value,
                          })
                        }
                        className={`editable-input text-center font-bold ${
                          String(feuMduData?.status_pompa_cpi_a ?? "-")
                            .toUpperCase()
                            .includes("AUTO") ||
                          String(feuMduData?.status_pompa_cpi_a ?? "-")
                            .toUpperCase()
                            .includes("NORMAL") ||
                          String(feuMduData?.status_pompa_cpi_a ?? "-")
                            .toUpperCase()
                            .includes("OPERASI")
                            ? "text-green"
                            : String(
                                  feuMduData?.status_pompa_cpi_a ?? "-",
                                )
                                  .toUpperCase()
                                  .includes("PERBAIKAN") ||
                                String(
                                  feuMduData?.status_pompa_cpi_a ?? "-",
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
                        value={feuMduData?.status_pompa_cpi_b ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            status_pompa_cpi_b: e.target.value,
                          })
                        }
                        className={`editable-input text-center font-bold ${
                          String(feuMduData?.status_pompa_cpi_b ?? "-")
                            .toUpperCase()
                            .includes("AUTO") ||
                          String(feuMduData?.status_pompa_cpi_b ?? "-")
                            .toUpperCase()
                            .includes("NORMAL") ||
                          String(feuMduData?.status_pompa_cpi_b ?? "-")
                            .toUpperCase()
                            .includes("OPERASI")
                            ? "text-green"
                            : String(feuMduData?.status_pompa_cpi_b ?? "-")
                                  .toUpperCase()
                                  .includes("PERBAIKAN") ||
                                String(feuMduData?.status_pompa_cpi_b ?? "-")
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
                <colgroup>
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "52%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>UNIT</th>
                    <th>Produk</th>
                    <th>AKTUAL</th>
                    <th>ANALISA SAMPLE</th>
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
                        value={feuMduData?.dest_spo_dist ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
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
                    <td className="text-center font-bold text-slate-800 p-0">
                      <div className="flex items-center justify-center w-full h-full px-1">
                        <input
                          type="text"
                          value={spoActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              spo_actual: e.target.value,
                              _userOverrides: {
                                ...(feuMduData?._userOverrides || {}),
                                spo_actual: true,
                              },
                            })
                          }
                          className="editable-input text-center font-bold text-slate-800 p-0 flex-1 min-w-0"
                        />
                        <span className="text-[10px] ml-1 font-bold text-slate-600 shrink-0">T/D</span>
                      </div>
                    </td>
                    <td>
                      <div className="sample-cell-wrapper">
                        {renderSpecStatus(
                          isSampleOnSpec("02103", [
                            { paramName: "Visco 60°C", fallbackVal: "0" },
                          ]),
                        )}
                        <div className="sample-grid sample-grid-single">
                          {renderParamLabel("02103", "Visco 60°C", "Visco")}
                          {renderLimsParam("02103", "Visco 60°C", "0", "cSt")}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>LMO DIST</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_lmo_dist ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
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
                    <td className="text-center font-bold text-slate-800 p-0">
                      <div className="flex items-center justify-center w-full h-full px-1">
                        <input
                          type="text"
                          value={lmoDistActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              lmo_dist_actual: e.target.value,
                              _userOverrides: {
                                ...(feuMduData?._userOverrides || {}),
                                lmo_dist_actual: true,
                              },
                            })
                          }
                          className="editable-input text-center font-bold text-slate-800 p-0 flex-1 min-w-0"
                        />
                        <span className="text-[10px] ml-1 font-bold text-slate-600 shrink-0">T/D</span>
                      </div>
                    </td>
                    <td>
                      <div className="sample-cell-wrapper">
                        {renderSpecStatus(
                          isSampleOnSpec("02104", [
                            { paramName: "Visco 60°C", fallbackVal: "0" },
                          ]),
                        )}
                        <div className="sample-grid sample-grid-single">
                          {renderParamLabel("02104", "Visco 60°C", "Visco")}
                          {renderLimsParam("02104", "Visco 60°C", "0", "cSt")}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>MMO DIST</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_mmo_dist ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
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
                    <td className="text-center font-bold text-slate-800 p-0">
                      <div className="flex items-center justify-center w-full h-full px-1">
                        <input
                          type="text"
                          value={mmoDistActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              mmo_dist_actual: e.target.value,
                              _userOverrides: {
                                ...(feuMduData?._userOverrides || {}),
                                mmo_dist_actual: true,
                              },
                            })
                          }
                          className="editable-input text-center font-bold text-slate-800 p-0 flex-1 min-w-0"
                        />
                        <span className="text-[10px] ml-1 font-bold text-slate-600 shrink-0">T/D</span>
                      </div>
                    </td>
                    <td>
                      <div className="sample-cell-wrapper">
                        {renderSpecStatus(
                          isSampleOnSpec("02105", [
                            { paramName: "Visco 60°C", fallbackVal: "0" },
                          ]),
                        )}
                        <div className="sample-grid sample-grid-single">
                          {renderParamLabel("02105", "Visco 60°C", "Visco")}
                          {renderLimsParam("02105", "Visco 60°C", "0", "cSt")}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>SHORT RESIDUE</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_short_residue ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
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
                    <td className="text-center font-bold text-slate-800 p-0">
                      <div className="flex items-center justify-center w-full h-full px-1">
                        <input
                          type="text"
                          value={shortResidueActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              short_residue_actual: e.target.value,
                              _userOverrides: {
                                ...(feuMduData?._userOverrides || {}),
                                short_residue_actual: true,
                              },
                            })
                          }
                          className="editable-input text-center font-bold text-slate-800 p-0 flex-1 min-w-0"
                        />
                        <span className="text-[10px] ml-1 font-bold text-slate-600 shrink-0">T/D</span>
                      </div>
                    </td>
                    <td>
                      <div className="sample-cell-wrapper">
                        {renderSpecStatus(
                          isSampleOnSpec("02107", [
                            { paramName: "Visco 100°C", fallbackVal: "0" },
                          ]),
                        )}
                        <div className="sample-grid sample-grid-single">
                          {renderParamLabel("02107", "Visco 100°C", "Visco")}
                          {renderLimsParam("02107", "Visco 100°C", "0", "cSt")}
                        </div>
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
                        value={feuMduData?.dest_dao ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
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
                    <td className="text-center font-bold text-slate-800 p-0">
                      <div className="flex items-center justify-center w-full h-full px-1">
                        <input
                          type="text"
                          value={daoActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              dao_actual: e.target.value,
                              _userOverrides: {
                                ...(feuMduData?._userOverrides || {}),
                                dao_actual: true,
                              },
                            })
                          }
                          className="editable-input text-center font-bold text-slate-800 p-0 flex-1 min-w-0"
                        />
                        <span className="text-[10px] ml-1 font-bold text-slate-600 shrink-0">T/D</span>
                      </div>
                    </td>
                    <td>
                      <div className="sample-cell-wrapper">
                        {renderSpecStatus(
                          isSampleOnSpec("02203", [
                            { paramName: "Visco 100°C", fallbackVal: "0" },
                            { paramName: "FP PMCC", fallbackVal: "0" },
                            { paramName: "Color", fallbackVal: "0" },
                          ]),
                        )}
                        <div className="sample-grid sample-grid-3">
                          {renderParamLabel("02203", "Visco 100°C", "Visco")}
                          {renderParamLabel("02203", "FP PMCC", "FP")}
                          {renderParamLabel("02203", "Color", "COL")}
                          {renderLimsParam("02203", "Visco 100°C", "0")}
                          {renderLimsParam("02203", "FP PMCC", "0")}
                          {renderLimsParam("02203", "Color", "0")}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>ASPHALT</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_asphalt ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
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
                    <td className="text-center font-bold text-slate-800 p-0">
                      <div className="flex items-center justify-center w-full h-full px-1">
                        <input
                          type="text"
                          value={asphaltActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              asphalt_actual: e.target.value,
                              _userOverrides: {
                                ...(feuMduData?._userOverrides || {}),
                                asphalt_actual: true,
                              },
                            })
                          }
                          className="editable-input text-center font-bold text-slate-800 p-0 flex-1 min-w-0"
                        />
                        <span className="text-[10px] ml-1 font-bold text-slate-600 shrink-0">T/D</span>
                      </div>
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
                        value={feuMduData?.dest_raffinate ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
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
                    <td className="text-center font-bold text-slate-800 p-0">
                      <div className="flex items-center justify-center w-full h-full px-1">
                        <input
                          type="text"
                          value={raffActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              raff_actual: e.target.value,
                              _userOverrides: {
                                ...(feuMduData?._userOverrides || {}),
                                raff_actual: true,
                              },
                            })
                          }
                          className="editable-input text-center font-bold text-slate-800 p-0 flex-1 min-w-0"
                        />
                        <span className="text-[10px] ml-1 font-bold text-slate-600 shrink-0">T/D</span>
                      </div>
                    </td>
                    <td>
                      <div className="sample-cell-wrapper">
                        {renderSpecStatus(
                          isSampleOnSpec(sampleCode023, [
                            { paramName: "Visco 100°C", fallbackVal: "0" },
                            { paramName: "FP PMCC", fallbackVal: "0" },
                            { paramName: "RI 70°C", fallbackVal: "0" },
                          ]),
                        )}
                        <div className="sample-grid sample-grid-3">
                          {renderParamLabel(sampleCode023, "Visco 100°C", "Visco")}
                          {renderParamLabel(sampleCode023, "FP PMCC", "FP")}
                          {renderParamLabel(sampleCode023, "RI 70°C", "RI")}
                          {renderLimsParam(sampleCode023, "Visco 100°C", "0")}
                          {renderLimsParam(sampleCode023, "FP PMCC", "0")}
                          {renderLimsParam(sampleCode023, "RI 70°C", "0")}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>EXTRACT</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_extract ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
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
                    <td className="text-center font-bold text-slate-800 p-0">
                      <div className="flex items-center justify-center w-full h-full px-1">
                        <input
                          type="text"
                          value={extractActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              extract_actual: e.target.value,
                              _userOverrides: {
                                ...(feuMduData?._userOverrides || {}),
                                extract_actual: true,
                              },
                            })
                          }
                          className="editable-input text-center font-bold text-slate-800 p-0 flex-1 min-w-0"
                        />
                        <span className="text-[10px] ml-1 font-bold text-slate-600 shrink-0">T/D</span>
                      </div>
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
                        value={feuMduData?.dest_dor ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
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
                    <td className="text-center font-bold text-slate-800 p-0">
                      <div className="flex items-center justify-center w-full h-full px-1">
                        <input
                          type="text"
                          value={dorActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              dor_actual: e.target.value,
                              _userOverrides: {
                                ...(feuMduData?._userOverrides || {}),
                                dor_actual: true,
                              },
                            })
                          }
                          className="editable-input text-center font-bold text-slate-800 p-0 flex-1 min-w-0"
                        />
                        <span className="text-[10px] ml-1 font-bold text-slate-600 shrink-0">T/D</span>
                      </div>
                    </td>
                    <td>
                      <div className="sample-cell-wrapper">
                        {renderSpecStatus(
                          isSampleOnSpec(sampleCode024, [
                            { paramName: "Visco 100°C", fallbackVal: "0" },
                            { paramName: "FP PMCC", fallbackVal: "0" },
                            { paramName: "Color", fallbackVal: "0" },
                            { paramName: "VI", fallbackVal: "0" },
                            { paramName: "PP", fallbackVal: "0" },
                            { paramName: "App", fallbackVal: "C&B" },
                          ]),
                        )}
                        <div className="sample-grid sample-grid-6">
                          {renderParamLabel(sampleCode024, "Visco 100°C", "Visco")}
                          {renderParamLabel(sampleCode024, "FP PMCC", "FP")}
                          {renderParamLabel(sampleCode024, "Color", "COL")}
                          {renderParamLabel(sampleCode024, "VI", "VI")}
                          {renderParamLabel(sampleCode024, "PP", "PP")}
                          {renderParamLabel(sampleCode024, "App", "App")}
                          {renderLimsParam(sampleCode024, "Visco 100°C", "0")}
                          {renderLimsParam(sampleCode024, "FP PMCC", "0")}
                          {renderLimsParam(sampleCode024, "Color", "0")}
                          {renderLimsParam(sampleCode024, "VI", "0")}
                          {renderLimsParam(sampleCode024, "PP", "0")}
                          {renderLimsParam(sampleCode024, "App", "C&B")}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>SLACK WAX</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_slack_wax ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
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
                    <td className="text-center font-bold text-slate-800 p-0">
                      <div className="flex items-center justify-center w-full h-full px-1">
                        <input
                          type="text"
                          value={slackWaxActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              slack_wax_actual: e.target.value,
                              _userOverrides: {
                                ...(feuMduData?._userOverrides || {}),
                                slack_wax_actual: true,
                              },
                            })
                          }
                          className="editable-input text-center font-bold text-slate-800 p-0 flex-1 min-w-0"
                          title="Aktual Slack Wax (Unit 024 Aktual - DOR Aktual)"
                        />
                        <span className="text-[10px] ml-1 font-bold text-slate-600 shrink-0">T/D</span>
                      </div>
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION A: FEU / MDU / NOTE SUMMARY TABLE (Directly Editable with Auto-Save) */}
            <div className="card card-summary">
              <table>
                <colgroup>
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "13.5%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "13.5%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "24%" }} />
                </colgroup>
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
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_lmo_design ?? 2180}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_lmo_design: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_lmo_sts ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_lmo_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td rowSpan={3} className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_rph ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_rph: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_lmo_design ?? 841}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_lmo_design: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_lmo_sts ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_lmo_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td rowSpan={3} className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_rph ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_rph: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td rowSpan={3} className="p-1">
                      <textarea
                        value={feuMduData?.note ?? ""}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            note: e.target.value,
                          })
                        }
                        className="editable-input w-full h-full min-h-0 resize-none text-[10.5px] font-medium leading-normal p-1 overflow-y-auto block"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">MMO</td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_mmo_design ?? 2270}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_mmo_design: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_mmo_sts ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_mmo_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_mmo_design ?? 777}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_mmo_design: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_mmo_sts ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_mmo_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="text-center font-bold">DAO</td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_dao_design ?? 1786}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_dao_design: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_dao_sts ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_dao_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_dao_design ?? 501}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_dao_design: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
                      />
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_dao_sts ?? "-"}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_dao_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold text-slate-800 p-0"
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
                <colgroup>
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "50%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Equipment</th>
                    <th>Issue</th>
                    <th>Mitigasi / RTL</th>
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

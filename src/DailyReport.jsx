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

  // Calculations for Kapasitas Feed
  // Unit 021 HVU II
  const hvuFlow = getPhdTag("021FI_004.pv");
  const hvuSg = getPhdTag("021FY_004X.C1");
  const calculatedHvuActual = calculateActualTD(hvuFlow, hvuSg) ?? 0;
  const hvuActual =
    feuMduData?.hvu_actual !== undefined && feuMduData?.hvu_actual !== ""
      ? feuMduData.hvu_actual
      : calculatedHvuActual;
  const hvuDesign =
    feuMduData?.hvu_design !== undefined && feuMduData?.hvu_design !== ""
      ? feuMduData.hvu_design
      : 3883;
  const hvuTargetRph =
    feuMduData?.hvu_target_rph !== undefined && feuMduData?.hvu_target_rph !== ""
      ? feuMduData.hvu_target_rph
      : 2524;
  const hvuTargetSts =
    feuMduData?.hvu_target_sts !== undefined && feuMduData?.hvu_target_sts !== ""
      ? feuMduData.hvu_target_sts
      : 2524;
  const calculatedHvuPercentDesign =
    calculateAchievedPercent(hvuActual, hvuDesign) ?? "0";
  const hvuPercentDesign =
    feuMduData?.hvu_percent_design !== undefined &&
    feuMduData?.hvu_percent_design !== ""
      ? feuMduData.hvu_percent_design
      : calculatedHvuPercentDesign;
  const calculatedHvuPercentRph =
    calculateAchievedPercent(hvuActual, hvuTargetRph) ?? "0";
  const hvuPercentRph =
    feuMduData?.hvu_percent_rph !== undefined &&
    feuMduData?.hvu_percent_rph !== ""
      ? feuMduData.hvu_percent_rph
      : calculatedHvuPercentRph;
  const calculatedHvuPercentSts =
    calculateAchievedPercent(hvuActual, hvuTargetSts) ?? "0";
  const hvuPercentSts =
    feuMduData?.hvu_percent_sts !== undefined &&
    feuMduData?.hvu_percent_sts !== ""
      ? feuMduData.hvu_percent_sts
      : calculatedHvuPercentSts;

  // Unit 022 PDU II
  const pduFlow = getPhdTag("022FI_001.pv");
  const pduSg = getPhdTag("022FY_001X.C1");
  const calculatedPduActual = calculateActualTD(pduFlow, pduSg) ?? 0;
  const pduActual =
    feuMduData?.pdu_actual !== undefined && feuMduData?.pdu_actual !== ""
      ? feuMduData.pdu_actual
      : calculatedPduActual;
  const pduDesign =
    feuMduData?.pdu_design !== undefined && feuMduData?.pdu_design !== ""
      ? feuMduData.pdu_design
      : 784;
  const pduTargetRph =
    feuMduData?.pdu_target_rph !== undefined && feuMduData?.pdu_target_rph !== ""
      ? feuMduData.pdu_target_rph
      : 627;
  const pduTargetSts =
    feuMduData?.pdu_target_sts !== undefined && feuMduData?.pdu_target_sts !== ""
      ? feuMduData.pdu_target_sts
      : 549;
  const calculatedPduPercentDesign =
    calculateAchievedPercent(pduActual, pduDesign) ?? "0";
  const pduPercentDesign =
    feuMduData?.pdu_percent_design !== undefined &&
    feuMduData?.pdu_percent_design !== ""
      ? feuMduData.pdu_percent_design
      : calculatedPduPercentDesign;
  const calculatedPduPercentRph =
    calculateAchievedPercent(pduActual, pduTargetRph) ?? "0";
  const pduPercentRph =
    feuMduData?.pdu_percent_rph !== undefined &&
    feuMduData?.pdu_percent_rph !== ""
      ? feuMduData.pdu_percent_rph
      : calculatedPduPercentRph;
  const calculatedPduPercentSts =
    calculateAchievedPercent(pduActual, pduTargetSts) ?? "0";
  const pduPercentSts =
    feuMduData?.pdu_percent_sts !== undefined &&
    feuMduData?.pdu_percent_sts !== ""
      ? feuMduData.pdu_percent_sts
      : calculatedPduPercentSts;

  // Unit 023 FEU II (Active Mode: LMO / MMO / DAO)
  const feuMode = unitModes?.unit023 || "MMO";
  let defaultFeuDesign = 2270;
  let feuStsPercent = feuMduData?.feu_mmo_sts ?? 65;
  let feuTagFlow = "023FIC_004.pv";
  let feuTagSg = "023FY_004CX.C1";

  if (feuMode === "LMO") {
    defaultFeuDesign = Number(feuMduData?.feu_lmo_design ?? 2180);
    feuStsPercent = Number(feuMduData?.feu_lmo_sts ?? 70);
    feuTagSg = "023FY_004BX.C1";
  } else if (feuMode === "DAO") {
    defaultFeuDesign = Number(feuMduData?.feu_dao_design ?? 1786);
    feuStsPercent = Number(feuMduData?.feu_dao_sts ?? 70);
    feuTagSg = "023FY_004DX.C1";
  } else {
    defaultFeuDesign = Number(feuMduData?.feu_mmo_design ?? 2270);
    feuStsPercent = Number(feuMduData?.feu_mmo_sts ?? 65);
    feuTagSg = "023FY_004CX.C1";
  }

  const feuDesign =
    feuMduData?.feu_design_override !== undefined &&
    feuMduData?.feu_design_override !== ""
      ? feuMduData.feu_design_override
      : defaultFeuDesign;
  const feuRphPercent = Number(feuMduData?.feu_rph ?? 65);
  const calculatedFeuTargetRph =
    calculateTargetTD(feuRphPercent, Number(feuDesign)) ?? 0;
  const feuTargetRph =
    feuMduData?.feu_target_rph !== undefined && feuMduData?.feu_target_rph !== ""
      ? feuMduData.feu_target_rph
      : calculatedFeuTargetRph;
  const calculatedFeuTargetSts =
    calculateTargetTD(feuStsPercent, Number(feuDesign)) ?? 0;
  const feuTargetSts =
    feuMduData?.feu_target_sts !== undefined && feuMduData?.feu_target_sts !== ""
      ? feuMduData.feu_target_sts
      : calculatedFeuTargetSts;
  const feuFlow = getPhdTag(feuTagFlow) ?? getPhdTag("023FI_004.pv");
  const feuSg = getPhdTag(feuTagSg);
  const calculatedFeuActual = calculateActualTD(feuFlow, feuSg) ?? 0;
  const feuActual =
    feuMduData?.feu_actual !== undefined && feuMduData?.feu_actual !== ""
      ? feuMduData.feu_actual
      : calculatedFeuActual;
  const calculatedFeuPercentDesign =
    calculateAchievedPercent(feuActual, feuDesign) ?? "0";
  const feuPercentDesign =
    feuMduData?.feu_percent_design !== undefined &&
    feuMduData?.feu_percent_design !== ""
      ? feuMduData.feu_percent_design
      : calculatedFeuPercentDesign;
  const calculatedFeuPercentRph =
    calculateAchievedPercent(feuActual, feuTargetRph) ?? "0";
  const feuPercentRph =
    feuMduData?.feu_percent_rph !== undefined &&
    feuMduData?.feu_percent_rph !== ""
      ? feuMduData.feu_percent_rph
      : calculatedFeuPercentRph;
  const calculatedFeuPercentSts =
    calculateAchievedPercent(feuActual, feuTargetSts) ?? "0";
  const feuPercentSts =
    feuMduData?.feu_percent_sts !== undefined &&
    feuMduData?.feu_percent_sts !== ""
      ? feuMduData.feu_percent_sts
      : calculatedFeuPercentSts;

  // Unit 024 MDU II (Active Mode: LMO / MMO / DAO)
  const mduMode = unitModes?.unit024 || "LMO";
  let defaultMduDesign = 841;
  let mduStsPercent = feuMduData?.mdu_lmo_sts ?? 65;
  let mduTagSg = "024FY_001BX.C1";

  if (mduMode === "MMO") {
    defaultMduDesign = Number(feuMduData?.mdu_mmo_design ?? 777);
    mduStsPercent = Number(feuMduData?.mdu_mmo_sts ?? 65);
    mduTagSg = "024FY_001CX.C1";
  } else if (mduMode === "DAO") {
    defaultMduDesign = Number(feuMduData?.mdu_dao_design ?? 501);
    mduStsPercent = Number(feuMduData?.mdu_dao_sts ?? 0);
    mduTagSg = "024FY_001DX.C1";
  } else {
    defaultMduDesign = Number(feuMduData?.mdu_lmo_design ?? 841);
    mduStsPercent = Number(feuMduData?.mdu_lmo_sts ?? 65);
    mduTagSg = "024FY_001BX.C1";
  }

  const mduDesign =
    feuMduData?.mdu_design_override !== undefined &&
    feuMduData?.mdu_design_override !== ""
      ? feuMduData.mdu_design_override
      : defaultMduDesign;
  const mduRphPercent = Number(feuMduData?.mdu_rph ?? 65);
  const calculatedMduTargetRph =
    calculateTargetTD(mduRphPercent, Number(mduDesign)) ?? 0;
  const mduTargetRph =
    feuMduData?.mdu_target_rph !== undefined && feuMduData?.mdu_target_rph !== ""
      ? feuMduData.mdu_target_rph
      : calculatedMduTargetRph;
  const calculatedMduTargetSts =
    calculateTargetTD(mduStsPercent, Number(mduDesign)) ?? 0;
  const mduTargetSts =
    feuMduData?.mdu_target_sts !== undefined && feuMduData?.mdu_target_sts !== ""
      ? feuMduData.mdu_target_sts
      : calculatedMduTargetSts;
  const mduFlow = getPhdTag("024FIC_001.pv") ?? getPhdTag("024FI_001.pv");
  const mduSg = getPhdTag(mduTagSg) ?? 0.85;
  const calculatedMduActual =
    calculateActualTD(mduFlow, mduSg) ??
    (mduFlow ? Math.round(Number(mduFlow) * 0.85 * 24) : 0);
  const mduActual =
    feuMduData?.mdu_actual !== undefined && feuMduData?.mdu_actual !== ""
      ? feuMduData.mdu_actual
      : calculatedMduActual;
  const calculatedMduPercentDesign =
    calculateAchievedPercent(mduActual, mduDesign) ?? "0";
  const mduPercentDesign =
    feuMduData?.mdu_percent_design !== undefined &&
    feuMduData?.mdu_percent_design !== ""
      ? feuMduData.mdu_percent_design
      : calculatedMduPercentDesign;
  const calculatedMduPercentRph =
    calculateAchievedPercent(mduActual, mduTargetRph) ?? "0";
  const mduPercentRph =
    feuMduData?.mdu_percent_rph !== undefined &&
    feuMduData?.mdu_percent_rph !== ""
      ? feuMduData.mdu_percent_rph
      : calculatedMduPercentRph;
  const calculatedMduPercentSts =
    calculateAchievedPercent(mduActual, mduTargetSts) ?? "0";
  const mduPercentSts =
    feuMduData?.mdu_percent_sts !== undefined &&
    feuMduData?.mdu_percent_sts !== ""
      ? feuMduData.mdu_percent_sts
      : calculatedMduPercentSts;

  // Render % RPH and % STS cell with circle dot on left (green >= 100, red < 100) and editable input
  const renderPercentCell = (val, rowSpan = 1, onValueChange) => {
    const num = Number(val);
    const hasVal = val !== null && val !== undefined && val !== "";
    const isGreen = hasVal && !isNaN(num) && num >= 100;
    const dotClass = hasVal
      ? isGreen
        ? "percent-dot percent-dot-green"
        : "percent-dot percent-dot-red"
      : "percent-dot";

    return (
      <td rowSpan={rowSpan} className="text-center p-0">
        <span className="percent-cell-val font-bold inline-flex items-center justify-center">
          {hasVal && <span className={dotClass}></span>}
          {onValueChange ? (
            <input
              type="text"
              value={val ?? ""}
              onDoubleClick={(e) => e.target.select()}
              onChange={(e) => onValueChange(e.target.value)}
              className="editable-input text-center font-bold text-slate-900 p-0"
              style={{ width: "3.8ch" }}
            />
          ) : (
            <span>{hasVal ? val : "-"}</span>
          )}
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
  const calculatedHosActual = calculateActualTD(hosFlow, hosSg) ?? 0;
  const hosActual =
    feuMduData?.hos_actual !== undefined && feuMduData?.hos_actual !== ""
      ? feuMduData.hos_actual
      : calculatedHosActual;

  const rawLevel023 = getPhdTag("023LI_005.PV");
  const calculatedLevel023C104 =
    rawLevel023 !== null ? rawLevel023.toFixed(1) : "0";
  const level023C104 =
    feuMduData?.level_023c104 !== undefined && feuMduData?.level_023c104 !== ""
      ? feuMduData.level_023c104
      : calculatedLevel023C104;

  const rawLevelCpi = getPhdTag("002LI_051.PV");
  const calculatedLevelCpi =
    rawLevelCpi !== null ? rawLevelCpi.toFixed(1) : "0";
  const levelCpi =
    feuMduData?.level_cpi !== undefined && feuMduData?.level_cpi !== ""
      ? feuMduData.level_cpi
      : calculatedLevelCpi;

  // Tank Farm Product Stocks (Tons calculated from tank dimensions and tag levels)
  const tanksHvi95 = ["41T-101", "41T-102", "41T-104"];
  const tanksHvi160S = ["41T-103", "41T-107", "41T-108"];
  const tanksHvi650 = ["41T-105", "41T-106", "41T-109", "41T-110"];

  const defaultStockHvi95 =
    calculateProductGroupTons(tanksHvi95, tanks, phdData) || 0;
  const defaultStockHvi160S =
    calculateProductGroupTons(tanksHvi160S, tanks, phdData) || 0;
  const defaultStockHvi650 =
    calculateProductGroupTons(tanksHvi650, tanks, phdData) || 0;

  const calculatedStockHvi95 =
    feuMduData?.stock_hvi_95 !== undefined && feuMduData?.stock_hvi_95 !== ""
      ? feuMduData.stock_hvi_95
      : defaultStockHvi95;
  const calculatedStockHvi160S =
    feuMduData?.stock_hvi_160s !== undefined && feuMduData?.stock_hvi_160s !== ""
      ? feuMduData.stock_hvi_160s
      : defaultStockHvi160S;
  const calculatedStockHvi650 =
    feuMduData?.stock_hvi_650 !== undefined && feuMduData?.stock_hvi_650 !== ""
      ? feuMduData.stock_hvi_650
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
  const spoActual =
    feuMduData?.spo_actual !== undefined && feuMduData?.spo_actual !== ""
      ? feuMduData.spo_actual
      : calculatedSpoActual;

  const lmoDistFlow = getPhdTag("021FIC_057.PV");
  const lmoDistSg = getPhdTag("021FY_057X.C1");
  const calculatedLmoDistActual = calculateActualTD(lmoDistFlow, lmoDistSg) ?? 0;
  const lmoDistActual =
    feuMduData?.lmo_dist_actual !== undefined &&
    feuMduData?.lmo_dist_actual !== ""
      ? feuMduData.lmo_dist_actual
      : calculatedLmoDistActual;

  const mmoDistFlow = getPhdTag("021FI_008.PV");
  const mmoDistSg = getPhdTag("021FY_008X.c1");
  const calculatedMmoDistActual = calculateActualTD(mmoDistFlow, mmoDistSg) ?? 0;
  const mmoDistActual =
    feuMduData?.mmo_dist_actual !== undefined &&
    feuMduData?.mmo_dist_actual !== ""
      ? feuMduData.mmo_dist_actual
      : calculatedMmoDistActual;

  const shortResidueFlow = getPhdTag("021FI_002.PV");
  const shortResidueSg = getPhdTag("021FY_002X.C1");
  const calculatedShortResidueActual =
    calculateActualTD(shortResidueFlow, shortResidueSg) ?? 0;
  const shortResidueActual =
    feuMduData?.short_residue_actual !== undefined &&
    feuMduData?.short_residue_actual !== ""
      ? feuMduData.short_residue_actual
      : calculatedShortResidueActual;

  // Unit 022 PDU II
  const daoFlow = getPhdTag("022FI_007.PV");
  const daoSg = getPhdTag("022FY_007X.C1");
  const calculatedDaoActual = calculateActualTD(daoFlow, daoSg) ?? 0;
  const daoActual =
    feuMduData?.dao_actual !== undefined && feuMduData?.dao_actual !== ""
      ? feuMduData.dao_actual
      : calculatedDaoActual;

  const asphaltFlow = getPhdTag("022FI_013.PV");
  const asphaltSg = getPhdTag("022FY_013X.C1");
  const calculatedAsphaltActual = calculateActualTD(asphaltFlow, asphaltSg) ?? 0;
  const asphaltActual =
    feuMduData?.asphalt_actual !== undefined &&
    feuMduData?.asphalt_actual !== ""
      ? feuMduData.asphalt_actual
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
  const raffActual =
    feuMduData?.raff_actual !== undefined && feuMduData?.raff_actual !== ""
      ? feuMduData.raff_actual
      : calculatedRaffActual;

  const extractFlow = getPhdTag("023FI_028.pv") ?? getPhdTag("023FI_028.PV");
  let extractSgTag = "023FY_028CX.C1";
  if (feuMode === "LMO") extractSgTag = "023FY_028BX.C1";
  else if (feuMode === "DAO") extractSgTag = "023FY_028DX.C1";
  const extractSg = getPhdTag(extractSgTag);
  const calculatedExtractActual = calculateActualTD(extractFlow, extractSg) ?? 0;
  const extractActual =
    feuMduData?.extract_actual !== undefined &&
    feuMduData?.extract_actual !== ""
      ? feuMduData.extract_actual
      : calculatedExtractActual;

  // Unit 024 MDU II
  const dorFlow = getPhdTag("024FI_023.PV");
  let dorSgTag = "024FY_023BX.C1";
  if (mduMode === "MMO") dorSgTag = "024FY_023CX.C1";
  else if (mduMode === "DAO") dorSgTag = "024FY_023DX.C1";
  const dorSg = getPhdTag(dorSgTag);
  const calculatedDorActual = calculateActualTD(dorFlow, dorSg) ?? 0;
  const dorActual =
    feuMduData?.dor_actual !== undefined && feuMduData?.dor_actual !== ""
      ? feuMduData.dor_actual
      : calculatedDorActual;

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
      : 0;

  // Requirement: Slack wax T/D is Aktual T/D Unit 024 - Aktual DOR T/D
  const calculatedSlackWaxActual = Math.max(
    0,
    Math.round(((Number(mduActual) || 0) - (Number(dorActual) || 0)) * 10) / 10,
  );
  const slackWaxActual =
    feuMduData?.slack_wax_actual !== undefined &&
    feuMduData?.slack_wax_actual !== ""
      ? feuMduData.slack_wax_actual
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
        : fallbackVal;

    // Find limit record in sampleLimits from PocketBase matching the mode sample code
    const limitRecord =
      sampleLimits.find(
        (lim) => lim.sample_code === sampleCode && lim.param_name === paramName,
      ) ||
      sampleLimits.find(
        (lim) => lim.sample_code === baseCode && lim.param_name === paramName,
      );

    const evaluated = evaluateSampleLimit(rawVal, limitRecord);

    const valColorClass = evaluated.isOutOfRange
      ? "text-red"
      : evaluated.formattedValue !== ""
        ? "text-green"
        : "text-slate-800";

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
            width: `${Math.max(2, (evaluated.formattedValue || "").length + 0.5)}ch`,
            minWidth: "16px",
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
      const rawVal =
        sample?.[item.paramName]?.value !== undefined
          ? sample[item.paramName].value
          : item.fallbackVal;
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
            <img src={locLogo} alt="LOC II" className="logo-loc" />
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
                        className="editable-input text-center font-semibold text-slate-800 p-0"
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
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900 p-0"
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
                        className="editable-input text-center font-semibold text-slate-800 p-0"
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
                        className="editable-input text-center font-semibold text-slate-800 p-0"
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
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-800 p-0"
                      />
                    </td>
                    {renderPercentCell(hvuPercentRph, 1, (val) =>
                      onFeuMduChange({ ...feuMduData, hvu_percent_rph: val }),
                    )}
                    {renderPercentCell(hvuPercentSts, 1, (val) =>
                      onFeuMduChange({ ...feuMduData, hvu_percent_sts: val }),
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
                        className="editable-input text-center font-semibold text-slate-800 p-0"
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
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900 p-0"
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
                        className="editable-input text-center font-semibold text-slate-800 p-0"
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
                        className="editable-input text-center font-semibold text-slate-800 p-0"
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
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-800 p-0"
                      />
                    </td>
                    {renderPercentCell(pduPercentRph, 1, (val) =>
                      onFeuMduChange({ ...feuMduData, pdu_percent_rph: val }),
                    )}
                    {renderPercentCell(pduPercentSts, 1, (val) =>
                      onFeuMduChange({ ...feuMduData, pdu_percent_sts: val }),
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
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_design_override: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-800 p-0"
                      />
                    </td>
                    <td
                      rowSpan={2}
                      className="text-center font-semibold text-slate-900 p-0"
                    >
                      <input
                        type="text"
                        value={feuActual}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_actual: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900 p-0"
                      />
                    </td>
                    <td rowSpan={2} className="text-center p-0">
                      <input
                        type="text"
                        value={feuTargetRph}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_target_rph: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-800 p-0"
                      />
                    </td>
                    <td rowSpan={2} className="text-center p-0">
                      <input
                        type="text"
                        value={feuTargetSts}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_target_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-800 p-0"
                      />
                    </td>
                    <td
                      rowSpan={2}
                      className="text-center font-semibold text-slate-800 p-0"
                    >
                      <input
                        type="text"
                        value={feuPercentDesign}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_percent_design: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-800 p-0"
                      />
                    </td>
                    {renderPercentCell(feuPercentRph, 2, (val) =>
                      onFeuMduChange({ ...feuMduData, feu_percent_rph: val }),
                    )}
                    {renderPercentCell(feuPercentSts, 2, (val) =>
                      onFeuMduChange({ ...feuMduData, feu_percent_sts: val }),
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
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_design_override: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-800 p-0"
                      />
                    </td>
                    <td
                      rowSpan={2}
                      className="text-center font-semibold text-slate-900 p-0"
                    >
                      <input
                        type="text"
                        value={mduActual}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_actual: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900 p-0"
                      />
                    </td>
                    <td rowSpan={2} className="text-center p-0">
                      <input
                        type="text"
                        value={mduTargetRph}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_target_rph: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-800 p-0"
                      />
                    </td>
                    <td rowSpan={2} className="text-center p-0">
                      <input
                        type="text"
                        value={mduTargetSts}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_target_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-800 p-0"
                      />
                    </td>
                    <td
                      rowSpan={2}
                      className="text-center font-semibold text-slate-800 p-0"
                    >
                      <input
                        type="text"
                        value={mduPercentDesign}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_percent_design: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-800 p-0"
                      />
                    </td>
                    {renderPercentCell(mduPercentRph, 2, (val) =>
                      onFeuMduChange({ ...feuMduData, mdu_percent_rph: val }),
                    )}
                    {renderPercentCell(mduPercentSts, 2, (val) =>
                      onFeuMduChange({ ...feuMduData, mdu_percent_sts: val }),
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
                        value={feuMduData?.pompa_hos ?? "025P101AT"}
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
                    <td className="text-center font-semibold p-0">
                      <input
                        type="text"
                        value={hosActual}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            hos_actual: e.target.value,
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900 p-0"
                      />
                    </td>
                    <td className="text-center p-0">
                      <input
                        type="text"
                        list="burner-fg-fo-list"
                        value={feuMduData?.burner_fg_fo ?? "12 Gas / 4 Oil"}
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
                          })
                        }
                        className="editable-input text-center font-semibold text-slate-900 p-0"
                      />
                    </td>
                    <td colSpan={2} className="text-center p-0">
                      <input
                        type="text"
                        list="visual-perairan-list"
                        value={feuMduData?.visual_perairan ?? "CLEAR"}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            visual_perairan: e.target.value,
                          })
                        }
                        className={`editable-input text-center font-bold uppercase p-0 ${
                          String(feuMduData?.visual_perairan ?? "CLEAR")
                            .toUpperCase()
                            .includes("CLEAR")
                            ? "text-green"
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
                          })
                        }
                        className="editable-input text-center font-bold text-slate-900 p-0"
                      />
                    </td>
                    <td colSpan={2} className="text-center p-0">
                      <input
                        type="text"
                        list="pompa-cpi-status-list"
                        value={feuMduData?.status_pompa_cpi_a ?? "Perbaikan"}
                        onDoubleClick={(e) => e.target.select()}
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
                        onDoubleClick={(e) => e.target.select()}
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
                <colgroup>
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "54%" }} />
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
                        value={feuMduData?.dest_spo_dist ?? "LOC I"}
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
                    <td className="text-center font-semibold text-slate-900 p-0">
                      <div className="inline-flex items-center justify-center">
                        <input
                          type="text"
                          value={spoActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              spo_actual: e.target.value,
                            })
                          }
                          className="editable-input text-center font-semibold text-slate-900 p-0"
                          style={{
                            width: `${Math.max(2, String(spoActual ?? "").length + 0.5)}ch`,
                            minWidth: "24px",
                          }}
                        />
                        <span className="text-[10px] ml-0.5 font-bold">T/D</span>
                      </div>
                    </td>
                    <td>
                      {renderSpecStatus(
                        isSampleOnSpec("02103", [
                          { paramName: "Visco 60°C", fallbackVal: "0" },
                        ]),
                      )}
                      <div className="sample-grid sample-grid-single">
                        <span className="font-bold">Visco</span>
                        {renderLimsParam("02103", "Visco 60°C", "0", "cSt")}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>LMO DIST</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_lmo_dist ?? "041T-116"}
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
                    <td className="text-center font-semibold text-slate-900 p-0">
                      <div className="inline-flex items-center justify-center">
                        <input
                          type="text"
                          value={lmoDistActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              lmo_dist_actual: e.target.value,
                            })
                          }
                          className="editable-input text-center font-semibold text-slate-900 p-0"
                          style={{
                            width: `${Math.max(2, String(lmoDistActual ?? "").length + 0.5)}ch`,
                            minWidth: "24px",
                          }}
                        />
                        <span className="text-[10px] ml-0.5 font-bold">T/D</span>
                      </div>
                    </td>
                    <td>
                      {renderSpecStatus(
                        isSampleOnSpec("02104", [
                          { paramName: "Visco 60°C", fallbackVal: "0" },
                        ]),
                      )}
                      <div className="sample-grid sample-grid-single">
                        <span className="font-bold">Visco</span>
                        {renderLimsParam("02104", "Visco 60°C", "0", "cSt")}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>MMO DIST</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_mmo_dist ?? "041T-117"}
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
                    <td className="text-center font-semibold text-slate-900 p-0">
                      <div className="inline-flex items-center justify-center">
                        <input
                          type="text"
                          value={mmoDistActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              mmo_dist_actual: e.target.value,
                            })
                          }
                          className="editable-input text-center font-semibold text-slate-900 p-0"
                          style={{
                            width: `${Math.max(2, String(mmoDistActual ?? "").length + 0.5)}ch`,
                            minWidth: "24px",
                          }}
                        />
                        <span className="text-[10px] ml-0.5 font-bold">T/D</span>
                      </div>
                    </td>
                    <td>
                      {renderSpecStatus(
                        isSampleOnSpec("02105", [
                          { paramName: "Visco 60°C", fallbackVal: "0" },
                        ]),
                      )}
                      <div className="sample-grid sample-grid-single">
                        <span className="font-bold">Visco</span>
                        {renderLimsParam("02105", "Visco 60°C", "0", "cSt")}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>SHORT RESIDUE</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_short_residue ?? "041T-121/310"}
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
                    <td className="text-center font-semibold text-slate-900 p-0">
                      <div className="inline-flex items-center justify-center">
                        <input
                          type="text"
                          value={shortResidueActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              short_residue_actual: e.target.value,
                            })
                          }
                          className="editable-input text-center font-semibold text-slate-900 p-0"
                          style={{
                            width: `${Math.max(2, String(shortResidueActual ?? "").length + 0.5)}ch`,
                            minWidth: "24px",
                          }}
                        />
                        <span className="text-[10px] ml-0.5 font-bold">T/D</span>
                      </div>
                    </td>
                    <td>
                      {renderSpecStatus(
                        isSampleOnSpec("02107", [
                          { paramName: "Visco 100°C", fallbackVal: "0" },
                        ]),
                      )}
                      <div className="sample-grid sample-grid-single">
                        <span className="font-bold">Visco</span>
                        {renderLimsParam("02107", "Visco 100°C", "0", "cSt")}
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
                    <td className="text-center font-semibold text-slate-900 p-0">
                      <div className="inline-flex items-center justify-center">
                        <input
                          type="text"
                          value={daoActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              dao_actual: e.target.value,
                            })
                          }
                          className="editable-input text-center font-semibold text-slate-900 p-0"
                          style={{
                            width: `${Math.max(2, String(daoActual ?? "").length + 0.5)}ch`,
                            minWidth: "24px",
                          }}
                        />
                        <span className="text-[10px] ml-0.5 font-bold">T/D</span>
                      </div>
                    </td>
                    <td>
                      {renderSpecStatus(
                        isSampleOnSpec("02203", [
                          { paramName: "Visco 100°C", fallbackVal: "0" },
                          { paramName: "FP PMCC", fallbackVal: "0" },
                          { paramName: "Color", fallbackVal: "0" },
                        ]),
                      )}
                      <div className="sample-grid sample-grid-3">
                        <span className="font-bold">Visco</span>
                        <span className="font-bold">FP</span>
                        <span className="font-bold">COL</span>
                        {renderLimsParam("02203", "Visco 100°C", "0")}
                        {renderLimsParam("02203", "FP PMCC", "0")}
                        {renderLimsParam("02203", "Color", "0")}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>ASPHALT</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_asphalt ?? "42T-10"}
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
                    <td className="text-center font-semibold text-slate-900 p-0">
                      <div className="inline-flex items-center justify-center">
                        <input
                          type="text"
                          value={asphaltActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              asphalt_actual: e.target.value,
                            })
                          }
                          className="editable-input text-center font-semibold text-slate-900 p-0"
                          style={{
                            width: `${Math.max(2, String(asphaltActual ?? "").length + 0.5)}ch`,
                            minWidth: "24px",
                          }}
                        />
                        <span className="text-[10px] ml-0.5 font-bold">T/D</span>
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
                        value={feuMduData?.dest_raffinate ?? "41T-315"}
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
                    <td className="text-center font-semibold text-slate-900 p-0">
                      <div className="inline-flex items-center justify-center">
                        <input
                          type="text"
                          value={raffActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              raff_actual: e.target.value,
                            })
                          }
                          className="editable-input text-center font-semibold text-slate-900 p-0"
                          style={{
                            width: `${Math.max(2, String(raffActual ?? "").length + 0.5)}ch`,
                            minWidth: "24px",
                          }}
                        />
                        <span className="text-[10px] ml-0.5 font-bold">T/D</span>
                      </div>
                    </td>
                    <td>
                      {renderSpecStatus(
                        isSampleOnSpec(sampleCode023, [
                          { paramName: "Visco 100°C", fallbackVal: "0" },
                          { paramName: "FP PMCC", fallbackVal: "0" },
                          { paramName: "RI 70°C", fallbackVal: "0" },
                        ]),
                      )}
                      <div className="sample-grid sample-grid-3">
                        <span className="font-bold">Visco</span>
                        <span className="font-bold">FP</span>
                        <span className="font-bold">RI</span>
                        {renderLimsParam(sampleCode023, "Visco 100°C", "0")}
                        {renderLimsParam(sampleCode023, "FP PMCC", "0")}
                        {renderLimsParam(sampleCode023, "RI 70°C", "0")}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>EXTRACT</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_extract ?? "IFO"}
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
                    <td className="text-center font-semibold text-slate-900 p-0">
                      <div className="inline-flex items-center justify-center">
                        <input
                          type="text"
                          value={extractActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              extract_actual: e.target.value,
                            })
                          }
                          className="editable-input text-center font-semibold text-slate-900 p-0"
                          style={{
                            width: `${Math.max(2, String(extractActual ?? "").length + 0.5)}ch`,
                            minWidth: "24px",
                          }}
                        />
                        <span className="text-[10px] ml-0.5 font-bold">T/D</span>
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
                        value={feuMduData?.dest_dor ?? "41T-102"}
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
                    <td className="text-center font-semibold text-slate-900 p-0">
                      <div className="inline-flex items-center justify-center">
                        <input
                          type="text"
                          value={dorActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              dor_actual: e.target.value,
                            })
                          }
                          className="editable-input text-center font-semibold text-slate-900 p-0"
                          style={{
                            width: `${Math.max(2, String(dorActual ?? "").length + 0.5)}ch`,
                            minWidth: "24px",
                          }}
                        />
                        <span className="text-[10px] ml-0.5 font-bold">T/D</span>
                      </div>
                    </td>
                    <td>
                      {renderSpecStatus(
                        isSampleOnSpec(sampleCode024, [
                          { paramName: "Visco 100°C", fallbackVal: "0" },
                          { paramName: "FP PMCC", fallbackVal: "0" },
                          { paramName: "Color", fallbackVal: "0" },
                          { paramName: "VI", fallbackVal: "0" },
                          { paramName: "PP", fallbackVal: "0" },
                          { paramName: "App", fallbackVal: "0" },
                        ]),
                      )}
                      <div className="sample-grid sample-grid-6">
                        <span className="font-bold">Visco</span>
                        <span className="font-bold">FP</span>
                        <span className="font-bold">COL</span>
                        <span className="font-bold">VI</span>
                        <span className="font-bold">PP</span>
                        <span className="font-bold">App</span>
                        {renderLimsParam(sampleCode024, "Visco 100°C", "0")}
                        {renderLimsParam(sampleCode024, "FP PMCC", "0")}
                        {renderLimsParam(sampleCode024, "Color", "0")}
                        {renderLimsParam(sampleCode024, "VI", "0")}
                        {renderLimsParam(sampleCode024, "PP", "0")}
                        {renderLimsParam(sampleCode024, "App", "0")}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>SLACK WAX</div>
                      <input
                        type="text"
                        value={feuMduData?.dest_slack_wax ?? "RFCC"}
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
                    <td className="text-center font-semibold text-slate-900 p-0">
                      <div className="inline-flex items-center justify-center">
                        <input
                          type="text"
                          value={slackWaxActual}
                          onDoubleClick={(e) => e.target.select()}
                          onChange={(e) =>
                            onFeuMduChange({
                              ...feuMduData,
                              slack_wax_actual: e.target.value,
                            })
                          }
                          className="editable-input text-center font-semibold text-slate-900 p-0"
                          style={{
                            width: `${Math.max(2, String(slackWaxActual ?? "").length + 0.5)}ch`,
                            minWidth: "24px",
                          }}
                          title="Aktual Slack Wax (Unit 024 Aktual - DOR Aktual)"
                        />
                        <span className="text-[10px] ml-0.5 font-bold">T/D</span>
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
                        className="editable-input text-center font-bold p-0"
                      />
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_lmo_sts ?? 70}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_lmo_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold p-0"
                      />
                    </td>
                    <td rowSpan={3} className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_rph ?? 65}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_rph: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold p-0"
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
                        className="editable-input text-center font-bold p-0"
                      />
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_lmo_sts ?? 65}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_lmo_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold p-0"
                      />
                    </td>
                    <td rowSpan={3} className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_rph ?? 65}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_rph: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold p-0"
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
                        className="editable-input text-center font-bold p-0"
                      />
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_mmo_sts ?? 65}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_mmo_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold p-0"
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
                        className="editable-input text-center font-bold p-0"
                      />
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_mmo_sts ?? 65}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_mmo_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold p-0"
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
                        className="editable-input text-center font-bold p-0"
                      />
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.feu_dao_sts ?? 70}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            feu_dao_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold p-0"
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
                        className="editable-input text-center font-bold p-0"
                      />
                    </td>
                    <td className="text-center font-bold p-0">
                      <input
                        type="text"
                        value={feuMduData?.mdu_dao_sts ?? 0}
                        onDoubleClick={(e) => e.target.select()}
                        onChange={(e) =>
                          onFeuMduChange({
                            ...feuMduData,
                            mdu_dao_sts: e.target.value,
                          })
                        }
                        className="editable-input text-center font-bold p-0"
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

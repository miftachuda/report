import { useState, useEffect, useCallback, useRef } from "react";
import TopSettingsBar from "./components/TopSettingsBar.jsx";
import DailyReport from "./DailyReport.jsx";
import { ChevronDown } from "./components/Icons.jsx";
import {
  getDailyReport,
  getLatestDailyReport,
  saveDailyReport,
  getTanks,
  getSampleLimits,
  getLatestArchiveReport,
  checkPocketBaseHealth,
} from "./services/pocketbase.js";
import { fetchPhdData } from "./services/phdApi.js";
import { fetchLimsData } from "./services/limsApi.js";
import { calculateDateRangeForPreset } from "./utils/calculations.js";

/**
 * Helper to build the list of active PHD tags based on current modes and tanks
 */
function getActivePhdTags(currentModes, currentTanks = []) {
  const mode023 = currentModes?.unit023 || "MMO";
  const mode024 = currentModes?.unit024 || "LMO";

  const activeTags = [
    "021FI_004.pv",
    "021FY_004X.C1",
    "021FY_004X.c1",
    "022FI_001.pv",
    "022FY_001X.C1",
    "022FY_001X.c1",
    "023FIC_004.pv",
    "023FI_004.pv",
    "024FIC_001.pv",
    "024FI_001.pv",
    "025FIC_004.pv",
    "025FI_004.pv",
    "025FY_004X.PV",
    "025FY_004X.pv",
    "002LI_051.PV",
    "002LI_051.pv",
    "023LI_005.PV",
    "023LI_005.pv",
    // Produksi Unit 021 HVU II
    "021FIC_058.PV",
    "021FIC_058.pv",
    "021FY_058X.C1",
    "021FY_058X.c1",
    "021FIC_057.PV",
    "021FIC_057.pv",
    "021FY_057X.C1",
    "021FY_057X.c1",
    "021FI_008.PV",
    "021FI_008.pv",
    "021FY_008X.C1",
    "021FY_008X.c1",
    "021FI_002.PV",
    "021FI_002.pv",
    "021FY_002X.C1",
    "021FY_002X.c1",
    // Produksi Unit 022 PDU II
    "022FI_007.PV",
    "022FI_007.pv",
    "022FY_007X.C1",
    "022FY_007X.c1",
    "022FI_013.PV",
    "022FI_013.pv",
    "022FY_013X.C1",
    "022FY_013X.c1",
    // Produksi Unit 023 FEU II
    "023FI_031.PV",
    "023FI_031.pv",
    "023FI_703.PV",
    "023FI_703.pv",
    "023FY_031BX.C1",
    "023FY_031CX.C1",
    "023FY_031DX.C1",
    "023FI_028.pv",
    "023FI_028.PV",
    "023FY_028BX.C1",
    "023FY_028CX.C1",
    "023FY_028DX.C1",
    // Produksi Unit 024 MDU II
    "024FI_023.PV",
    "024FI_023.pv",
    "024FY_023BX.C1",
    "024FY_023CX.C1",
    "024FY_023DX.C1",
    "024FI_031.PV",
    "024FI_031.pv",
    "024FY_031X.c1",
    "024FY_031X.C1",
  ];

  if (mode023 === "LMO") activeTags.push("023FY_004BX.C1");
  else if (mode023 === "DAO") activeTags.push("023FY_004DX.C1");
  else activeTags.push("023FY_004CX.C1");

  if (mode024 === "MMO") activeTags.push("024FY_001CX.C1");
  else if (mode024 === "DAO") activeTags.push("024FY_001DX.C1");
  else activeTags.push("024FY_001BX.C1");

  const targetTanks = [
    "41T101",
    "41T102",
    "41T104",
    "41T103",
    "41T107",
    "41T108",
    "41T105",
    "41T106",
    "41T109",
    "41T110",
  ];

  targetTanks.forEach((name) => {
    const found = currentTanks.find((t) => t.tank_name === name);
    if (found?.tag_level) {
      activeTags.push(found.tag_level);
    } else {
      activeTags.push(`${name}_P_LEVEL.PV`);
    }
  });

  return activeTags;
}

// Initial FEU MDU Table values on first load (before refresh) & baseline reset
// Operational statuses, dest tanks, sts, and rph strictly default to "-"
const defaultFeuMdu = {
  hvu_rph: "-",
  hvu_sts: "-",
  hvu_target_rph: "-",
  hvu_target_sts: "-",
  pdu_rph: "-",
  pdu_sts: "-",
  pdu_target_rph: "-",
  pdu_target_sts: "-",
  feu_lmo_design: 2180,
  feu_lmo_sts: "-",
  feu_rph: "-",
  feu_mmo_design: 2270,
  feu_mmo_sts: "-",
  feu_dao_design: 1786,
  feu_dao_sts: "-",
  mdu_lmo_design: 841,
  mdu_lmo_sts: "-",
  mdu_rph: "-",
  mdu_mmo_design: 777,
  mdu_mmo_sts: "-",
  mdu_dao_design: 501,
  mdu_dao_sts: "-",
  note: "",
  pompa_hos: "-",
  visual_perairan: "-",
  status_pompa_cpi_a: "-",
  status_pompa_cpi_b: "-",
  burner_fg_fo: "-",
  flow_hvi_95_loc3: 0,
  flow_hvi_160s_loc3: 0,
  flow_hvi_650_loc3: 0,
  dest_spo_dist: "-",
  dest_lmo_dist: "-",
  dest_mmo_dist: "-",
  dest_short_residue: "-",
  dest_dao: "-",
  dest_asphalt: "-",
  dest_raffinate: "-",
  dest_extract: "-",
  dest_dor: "-",
  dest_slack_wax: "-",
};

export default function App() {
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Active report date (defaults to today, can view historical reports from PocketBase)
  const [activeReportDate, setActiveReportDate] = useState(getTodayDateStr);

  // PHD query preset ('now' | 'last_10m' | 'last_1h' | 'last_3h' | 'last_8h' | 'last_24h' | 'this_day' | 'custom')
  const [phdPreset, setPhdPreset] = useState("now");

  // Date Range for PHD queries
  const [dateRange, setDateRange] = useState(() => {
    return (
      calculateDateRangeForPreset("now") || {
        start: new Date(Date.now() - 5 * 60 * 1000).toISOString().slice(0, 16),
        end: new Date().toISOString().slice(0, 16),
      }
    );
  });

  // State for FEU MDU Table & Operational Statuses (Section A & Kapasitas Feed)
  const [feuMduData, setFeuMduData] = useState(defaultFeuMdu);

  // State for Issue Operational (Section B) - initialized empty, populated from server
  const [issueOperational, setIssueOperational] = useState([]);

  // State for Issue Maintenance (Section B) - initialized empty, populated from server
  const [issueMaintenance, setIssueMaintenance] = useState([]);

  // State for Switchable Modes: Unit 023 & Unit 024 (Section C)
  const [unitModes, setUnitModes] = useState({
    unit023: "MMO",
    unit024: "LMO",
  });

  // State for Unit Operational Statuses: Unit 021, 022, 023, 024, HOS II
  const [unitStatuses, setUnitStatuses] = useState({
    unit021: "Normal Operasi",
    unit022: "Normal Operasi",
    unit023: "Normal Operasi",
    unit024: "Normal Operasi",
    hos: "Normal Operasi",
  });

  // PocketBase collections state
  const [tanks, setTanks] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_tanks");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [sampleLimits, setSampleLimits] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_sample_limits");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Numerical API data initially empty (0) until user clicks Refresh
  const [phdData, setPhdData] = useState({});
  const [limsData, setLimsData] = useState({ samples: {}, shift: "Malam" });

  // Status & loading indicators
  const [pocketBaseConnected, setPocketBaseConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Reference to hold current state for asynchronous callbacks & auto-save
  const stateRef = useRef({
    feuMduData,
    unitStatuses,
    unitModes,
    issueOperational,
    issueMaintenance,
  });

  useEffect(() => {
    stateRef.current = {
      feuMduData,
      unitStatuses,
      unitModes,
      issueOperational,
      issueMaintenance,
    };
  }, [feuMduData, unitStatuses, unitModes, issueOperational, issueMaintenance]);

  // Safe normalizers for issues
  const normalizeOperationalIssues = useCallback((issues) => {
    if (!Array.isArray(issues)) return [];
    return issues.map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item !== null) {
        return item.equipment
          ? `${item.equipment} : ${item.issue || ""}${item.mitigation ? " (" + item.mitigation + ")" : ""}`
          : item.issue || JSON.stringify(item);
      }
      return String(item ?? "");
    });
  }, []);

  const normalizeMaintenanceIssues = useCallback((issues) => {
    if (!Array.isArray(issues)) return [];
    return issues.map((item) => {
      if (typeof item === "object" && item !== null) {
        return {
          equipment: item.equipment || "",
          issue: item.issue || "",
          mitigation: item.mitigation || "",
        };
      }
      return { equipment: "", issue: String(item ?? ""), mitigation: "" };
    });
  }, []);

  // Query PHD Tags based on active modes & tank tags
  const loadPhdTags = useCallback(
    async (currentRange, currentModes, currentTanks) => {
      const activeTags = getActivePhdTags(currentModes, currentTanks);

      setIsRefreshing(true);
      try {
        const results = await fetchPhdData(
          activeTags,
          currentRange.start,
          currentRange.end,
        );
        if (results && Object.keys(results).length > 0) {
          setPhdData((prev) => ({ ...prev, ...results }));
        }
      } catch (err) {
        console.error("Error fetching PHD tags:", err);
      } finally {
        setIsRefreshing(false);
      }
    },
    [],
  );

  // Auto-refresh when switching preset
  const handlePhdPresetChange = useCallback(
    (newPreset) => {
      setPhdPreset(newPreset);
      if (newPreset !== "custom") {
        const calculated = calculateDateRangeForPreset(newPreset);
        if (calculated) {
          setDateRange(calculated);
          // Clear user overrides when changing preset so fresh PHD calculations are displayed
          setFeuMduData((prev) => ({
            ...prev,
            _userOverrides: {},
          }));
          loadPhdTags(calculated, unitModes, tanks);
        }
      }
    },
    [unitModes, tanks, loadPhdTags],
  );

  // Auto-refresh when manually switching date range
  const handleDateRangeChange = useCallback(
    (newRange) => {
      setDateRange(newRange);
      setFeuMduData((prev) => ({
        ...prev,
        _userOverrides: {},
      }));
      loadPhdTags(newRange, unitModes, tanks);
    },
    [unitModes, tanks, loadPhdTags],
  );

  // Initial mount: only check PocketBase health, do not query data until Refresh button is pressed
  useEffect(() => {
    checkPocketBaseHealth().then(setPocketBaseConnected);
  }, []);

  // Section A: FEU MDU change handler (local state update, persists on Manual Save)
  const handleFeuMduChange = (newData) => {
    setFeuMduData(newData);
  };

  // Section B: Issue Operational change handler - updates state and auto-saves to database
  const handleIssueOperationalChange = async (newData) => {
    const normalized = normalizeOperationalIssues(newData);
    setIssueOperational(normalized);
    const today = getTodayDateStr();
    setActiveReportDate(today);
    try {
      const { _userOverrides: _uo, _pbFallbacks: _pf, ...cleanFeuMduToSave } =
        stateRef.current.feuMduData || {};
      await saveDailyReport(today, {
        feu_mdu_data: {
          ...cleanFeuMduToSave,
          unit_statuses: stateRef.current.unitStatuses,
        },
        issue_operational: normalized,
        issue_maintenance: stateRef.current.issueMaintenance,
        unit_modes: {
          ...stateRef.current.unitModes,
          statuses: stateRef.current.unitStatuses,
        },
      });
      setLastSavedTime(new Date().toISOString());
      setPocketBaseConnected(true);
    } catch (err) {
      console.error("Auto-save issue operational error:", err);
    }
  };

  // Section B: Issue Maintenance change handler - updates state and auto-saves to database
  const handleIssueMaintenanceChange = async (newData) => {
    const normalized = normalizeMaintenanceIssues(newData);
    setIssueMaintenance(normalized);
    const today = getTodayDateStr();
    setActiveReportDate(today);
    try {
      const { _userOverrides: _uo, _pbFallbacks: _pf, ...cleanFeuMduToSave } =
        stateRef.current.feuMduData || {};
      await saveDailyReport(today, {
        feu_mdu_data: {
          ...cleanFeuMduToSave,
          unit_statuses: stateRef.current.unitStatuses,
        },
        issue_operational: stateRef.current.issueOperational,
        issue_maintenance: normalized,
        unit_modes: {
          ...stateRef.current.unitModes,
          statuses: stateRef.current.unitStatuses,
        },
      });
      setLastSavedTime(new Date().toISOString());
      setPocketBaseConnected(true);
    } catch (err) {
      console.error("Auto-save issue maintenance error:", err);
    }
  };

  // Section C: Switchable Unit Mode change handler (previews PHD tags for selected mode)
  const handleUnitModeChange = (unitKey, newMode) => {
    const updated = { ...unitModes, [unitKey]: newMode };
    setUnitModes(updated);
    setFeuMduData((prev) => ({
      ...prev,
      _userOverrides: {},
    }));
    loadPhdTags(dateRange, updated, tanks);
  };

  // Synchronized full refresh:
  // 1. Immediately reset all values to 0 / empty / "-"
  // 2. Fetch fresh API data (PHD and LIMS) and Database records in parallel
  // 3. Reset all user edits and restore operational modes/statuses directly from server
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    // Step 1: Immediately reset displayed values to 0 / empty / "-"
    // Operational statuses, issues, and destination tanks immediately show empty / "-" before data arrives
    setPhdData({});
    setLimsData({ samples: {}, shift: "Malam" });
    setFeuMduData(defaultFeuMdu);
    setIssueOperational([]);
    setIssueMaintenance([]);

    let currentRange = dateRange;
    if (phdPreset !== "custom") {
      const refreshed = calculateDateRangeForPreset(phdPreset);
      if (refreshed) {
        currentRange = refreshed;
        setDateRange(refreshed);
      }
    }

    const today = getTodayDateStr();
    setActiveReportDate(today);

    try {
      // Fetch PB daily report, latest daily report, latest archive, tanks, limits, health and LIMS in parallel
      const [
        pbReportRes,
        latestPbReportRes,
        latestArchiveRes,
        pbTanksRes,
        pbLimitsRes,
        healthRes,
        limsApiRes,
      ] = await Promise.allSettled([
        getDailyReport(today),
        getLatestDailyReport(),
        getLatestArchiveReport(),
        getTanks(),
        getSampleLimits(),
        checkPocketBaseHealth(),
        fetchLimsData(),
      ]);

      if (healthRes.status === "fulfilled") {
        setPocketBaseConnected(Boolean(healthRes.value));
      }

      const reportData =
        pbReportRes.status === "fulfilled" ? pbReportRes.value : null;
      const latestReportData =
        latestPbReportRes.status === "fulfilled"
          ? latestPbReportRes.value
          : null;
      const archiveData =
        latestArchiveRes.status === "fulfilled"
          ? latestArchiveRes.value
          : null;
      const archivePayload = archiveData?.payload_data || archiveData;

      const source = reportData || latestReportData || archivePayload || null;

      // Extract saved FEU MDU data from either daily_report, latestDailyReport, or archivePayload
      let savedFeuMdu = {};
      if (reportData?.feu_mdu_data) {
        savedFeuMdu =
          typeof reportData.feu_mdu_data === "string"
            ? JSON.parse(reportData.feu_mdu_data)
            : reportData.feu_mdu_data;
      } else if (latestReportData?.feu_mdu_data) {
        savedFeuMdu =
          typeof latestReportData.feu_mdu_data === "string"
            ? JSON.parse(latestReportData.feu_mdu_data)
            : latestReportData.feu_mdu_data;
      } else if (archivePayload?.feu_mdu_data) {
        savedFeuMdu =
          typeof archivePayload.feu_mdu_data === "string"
            ? JSON.parse(archivePayload.feu_mdu_data)
            : archivePayload.feu_mdu_data;
      }
      savedFeuMdu =
        savedFeuMdu && typeof savedFeuMdu === "object" ? savedFeuMdu : {};

      // Direct operational values if present on record
      const topLevelOps = {};
      if (
        source?.pompa_hos !== undefined &&
        source?.pompa_hos !== null &&
        source?.pompa_hos !== ""
      ) {
        topLevelOps.pompa_hos = source.pompa_hos;
      }
      if (
        source?.burner_fg_fo !== undefined &&
        source?.burner_fg_fo !== null &&
        source?.burner_fg_fo !== ""
      ) {
        topLevelOps.burner_fg_fo = source.burner_fg_fo;
      }
      if (
        source?.status_pompa_cpi_a !== undefined &&
        source?.status_pompa_cpi_a !== null &&
        source?.status_pompa_cpi_a !== ""
      ) {
        topLevelOps.status_pompa_cpi_a = source.status_pompa_cpi_a;
      }
      if (
        source?.status_pompa_cpi_b !== undefined &&
        source?.status_pompa_cpi_b !== null &&
        source?.status_pompa_cpi_b !== ""
      ) {
        topLevelOps.status_pompa_cpi_b = source.status_pompa_cpi_b;
      }
      if (
        source?.visual_perairan !== undefined &&
        source?.visual_perairan !== null &&
        source?.visual_perairan !== ""
      ) {
        topLevelOps.visual_perairan = source.visual_perairan;
      }

      const serverTanks =
        pbTanksRes.status === "fulfilled" && pbTanksRes.value?.length > 0
          ? pbTanksRes.value
          : tanks;
      if (pbTanksRes.status === "fulfilled" && pbTanksRes.value?.length > 0) {
        setTanks(pbTanksRes.value);
      }
      if (pbLimitsRes.status === "fulfilled" && pbLimitsRes.value?.length > 0) {
        setSampleLimits(pbLimitsRes.value);
      }

      // Revert/update operation mode directly from server (discarding local changes)
      const savedModes =
        source?.unit_modes && typeof source.unit_modes === "object"
          ? source.unit_modes
          : null;

      const serverModes = savedModes
        ? {
            unit023: savedModes.unit023 || "MMO",
            unit024: savedModes.unit024 || "LMO",
          }
        : { unit023: "MMO", unit024: "LMO" };
      setUnitModes(serverModes);

      // Revert/update unit statuses directly from server
      const serverStatuses =
        savedModes?.statuses ||
        source?.unit_statuses ||
        savedFeuMdu?.unit_statuses || {
          unit021: "Normal Operasi",
          unit022: "Normal Operasi",
          unit023: "Normal Operasi",
          unit024: "Normal Operasi",
          hos: "Normal Operasi",
        };
      setUnitStatuses(serverStatuses);

      // Revert/update FEU MDU data from server (discarding any manual edits)
      // Requirements:
      // 1. Pompa Hos, burner FG/FO, status pompa CPI, visual perairan, produk dest, sts, rph
      //    update directly from last saved record in PocketBase.
      // 2. Data T/D dan data lain yang bersumber dari PHD: ketika refresh data PRIORITAS diambil
      //    dari PHD bukan dari PocketBase.
      //    Semua field T/D actuals, levels, stocks, LOC II flows, dan achieved percentages
      //    dilepaskan dari savedFeuMdu agar tidak menimpa perhitungan PHD segar.
      //    Nilai dari database disimpan ke pbFallbacks HANYA sebagai cadangan jika tag PHD null/gagal.
      const {
        // T/D Feed actuals & achieved percentages
        hvu_actual,
        pdu_actual,
        feu_actual,
        mdu_actual,
        hos_actual,
        hvu_percent_design,
        hvu_percent_rph,
        hvu_percent_sts,
        pdu_percent_design,
        pdu_percent_rph,
        pdu_percent_sts,
        feu_percent_design,
        feu_percent_rph,
        feu_percent_sts,
        mdu_percent_design,
        mdu_percent_rph,
        mdu_percent_sts,
        // Levels
        level_023c104,
        level_cpi,
        // Produksi actuals (T/D)
        spo_actual,
        lmo_dist_actual,
        mmo_dist_actual,
        short_residue_actual,
        dao_actual,
        asphalt_actual,
        raff_actual,
        extract_actual,
        dor_actual,
        slack_wax_actual,
        // Tank farm stocks & LOC II flows
        stock_hvi_95,
        stock_hvi_160s,
        stock_hvi_650,
        flow_hvi_95_loc2,
        flow_hvi_160s_loc2,
        flow_hvi_650_loc2,
        // Design / Target overrides
        feu_design_override,
        mdu_design_override,
        feu_target_rph,
        feu_target_sts,
        mdu_target_rph,
        mdu_target_sts,
        _userOverrides,
        _pbFallbacks,
        ...restSavedFeuMdu
      } = savedFeuMdu;

      const pbFallbacks = {
        hvu_actual,
        pdu_actual,
        feu_actual,
        mdu_actual,
        hos_actual,
        spo_actual,
        lmo_dist_actual,
        mmo_dist_actual,
        short_residue_actual,
        dao_actual,
        asphalt_actual,
        raff_actual,
        extract_actual,
        dor_actual,
        slack_wax_actual,
        level_023c104,
        level_cpi,
        stock_hvi_95,
        stock_hvi_160s,
        stock_hvi_650,
        flow_hvi_95_loc2,
        flow_hvi_160s_loc2,
        flow_hvi_650_loc2,
      };

      const cleanServerFeuMdu = {
        ...defaultFeuMdu,
        ...restSavedFeuMdu,
        ...topLevelOps,
        _pbFallbacks: {},
        _userOverrides: {},
        _isViewingSaved: false,
      };
      setFeuMduData(cleanServerFeuMdu);

      // Revert/update issues from server - empty if not present or empty on server
      const savedOperational =
        source?.issue_operational !== undefined && source?.issue_operational !== null
          ? source.issue_operational
          : archivePayload?.issue_operational;
      if (
        savedOperational &&
        (Array.isArray(savedOperational)
          ? savedOperational.length > 0
          : String(savedOperational).trim() !== "" && String(savedOperational).trim() !== "[]")
      ) {
        setIssueOperational(normalizeOperationalIssues(savedOperational));
      } else {
        setIssueOperational([]);
      }

      const savedMaintenance =
        source?.issue_maintenance !== undefined && source?.issue_maintenance !== null
          ? source.issue_maintenance
          : archivePayload?.issue_maintenance;
      if (
        savedMaintenance &&
        (Array.isArray(savedMaintenance)
          ? savedMaintenance.length > 0
          : String(savedMaintenance).trim() !== "" && String(savedMaintenance).trim() !== "[]")
      ) {
        setIssueMaintenance(normalizeMaintenanceIssues(savedMaintenance));
      } else {
        setIssueMaintenance([]);
      }

      // Query PHD Tags based on resolved serverModes and serverTanks
      const activeTags = getActivePhdTags(serverModes, serverTanks);
      let apiPhd = {};
      try {
        apiPhd = await fetchPhdData(activeTags, currentRange.start, currentRange.end);
      } catch (err) {
        console.error("fetchPhdData error:", err);
      }

      const apiLims = limsApiRes.status === "fulfilled" ? limsApiRes.value : null;

      // PHD tags: strictly prioritize fresh API from PHD. Do not overwrite fresh data with stale DB snapshot.
      if (apiPhd && Object.keys(apiPhd).length > 0) {
        setPhdData(apiPhd);
      } else if (archivePayload?.phd_data_snapshot) {
        setPhdData(archivePayload.phd_data_snapshot);
      } else {
        setPhdData({});
      }

      // LIMS samples: strictly prioritize fresh API from LIMS.
      if (apiLims?.samples && Object.keys(apiLims.samples).length > 0) {
        setLimsData(apiLims);
      } else if (archivePayload?.lims_snapshot?.samples) {
        setLimsData({
          samples: archivePayload.lims_snapshot.samples,
          shift: archivePayload.lims_snapshot.shift || "Malam",
        });
      } else {
        setLimsData({
          samples: {},
          shift: "Malam",
        });
      }

      setLastSavedTime(
        reportData?.updated ||
          reportData?.created ||
          archiveData?.created ||
          archivePayload?.saved_at ||
          new Date().toISOString()
      );
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    dateRange,
    phdPreset,
    tanks,
    normalizeOperationalIssues,
    normalizeMaintenanceIssues,
  ]);

  // LIMS parameter change handler (auto-updates state and caches locally)
  const handleLimsParamChange = useCallback((sampleCode, paramName, newVal) => {
    setLimsData((prev) => {
      const prevSamples = prev?.samples || {};
      const prevSample = prevSamples[sampleCode] || {};
      const updatedSample = {
        ...prevSample,
        [paramName]: {
          ...(prevSample[paramName] || {}),
          value: newVal,
        },
      };
      const nextLims = {
        ...prev,
        samples: {
          ...prevSamples,
          [sampleCode]: updatedSample,
        },
      };
      try {
        localStorage.setItem("cached_lims_data", JSON.stringify(nextLims));
      } catch {}
      return nextLims;
    });
  }, []);

  // Operational Unit Status change handler (Unit 021, Unit 022, Unit 023, Unit 024, HOS II)
  const handleUnitStatusChange = (unitKey, newStatus) => {
    const updated = { ...unitStatuses, [unitKey]: newStatus };
    setUnitStatuses(updated);
  };

  // 4. Manual Save to PocketBase daily_report
  const handleManualSave = async () => {
    setIsSaving(true);
    const saveDate = activeReportDate || getTodayDateStr();

    try {
      const { _userOverrides: _uo, _pbFallbacks: _pf, _isViewingSaved: _ivs, ...cleanFeuMduToSave } =
        stateRef.current.feuMduData || {};
      // Sync daily_report
      const currentReportState = {
        feu_mdu_data: {
          ...cleanFeuMduToSave,
          unit_statuses: stateRef.current.unitStatuses,
        },
        issue_operational: stateRef.current.issueOperational,
        issue_maintenance: stateRef.current.issueMaintenance,
        unit_modes: {
          ...stateRef.current.unitModes,
          statuses: stateRef.current.unitStatuses,
        },
      };
      await saveDailyReport(saveDate, currentReportState);
      setLastSavedTime(new Date().toISOString());
      setPocketBaseConnected(true);
    } catch (err) {
      console.error("Save to PocketBase error:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Load a historical or specific date's saved report from PocketBase into the dashboard
  const handleLoadSavedReport = useCallback(
    (reportResult) => {
      if (!reportResult || !reportResult.record) return;
      const rec = reportResult.record;
      const targetDate = reportResult.date || rec.date || getTodayDateStr();
      setActiveReportDate(targetDate);

      const rawFeu = rec.feu_mdu_data || {};
      const parsedFeu =
        typeof rawFeu === "string" ? JSON.parse(rawFeu) : rawFeu;

      const modes = rec.unit_modes || { unit023: "MMO", unit024: "LMO" };
      setUnitModes({
        unit023: modes.unit023 || "MMO",
        unit024: modes.unit024 || "LMO",
      });

      const statuses =
        modes.statuses ||
        rec.unit_statuses ||
        parsedFeu.unit_statuses || {
          unit021: "Normal Operasi",
          unit022: "Normal Operasi",
          unit023: "Normal Operasi",
          unit024: "Normal Operasi",
          hos: "Normal Operasi",
        };
      setUnitStatuses(statuses);

      setIssueOperational(
        normalizeOperationalIssues(rec.issue_operational || []),
      );
      setIssueMaintenance(
        normalizeMaintenanceIssues(rec.issue_maintenance || []),
      );

      const isToday = targetDate === getTodayDateStr();
      setFeuMduData({
        ...defaultFeuMdu,
        ...parsedFeu,
        _isViewingSaved: !isToday,
        _userOverrides: {},
      });
    },
    [normalizeOperationalIssues, normalizeMaintenanceIssues],
  );

  // Reset back to today's date & live PHD priority
  const handleResetToToday = useCallback(() => {
    const today = getTodayDateStr();
    setActiveReportDate(today);
    handleRefresh();
  }, [handleRefresh]);

  // Format date display for header
  const formatDateDisplay = (dateStr) => {
    let d = new Date();
    if (dateStr) {
      const parts = String(dateStr).slice(0, 10).split("-");
      if (parts.length === 3) {
        d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      }
    }
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Top bar visibility state (stored in localStorage for persistence)
  const [isTopBarVisible, setIsTopBarVisible] = useState(() => {
    const saved = localStorage.getItem("report_top_bar_visible");
    return saved !== null ? saved === "true" : true;
  });

  const toggleTopBar = () => {
    setIsTopBarVisible((prev) => {
      const next = !prev;
      localStorage.setItem("report_top_bar_visible", String(next));
      return next;
    });
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#eef5f9] relative">
      {/* Top Collapsible Controls Bar */}
      {isTopBarVisible && (
        <TopSettingsBar
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          phdPreset={phdPreset}
          onPhdPresetChange={handlePhdPresetChange}
          onRefreshData={handleRefresh}
          onManualSave={handleManualSave}
          isSaving={isSaving}
          isRefreshing={isRefreshing}
          pocketBaseConnected={pocketBaseConnected}
          lastSavedTime={lastSavedTime}
          onToggleVisibility={toggleTopBar}
          feuMduData={feuMduData}
          onFeuMduChange={handleFeuMduChange}
          unitModes={unitModes}
          activeReportDate={activeReportDate}
          onLoadSavedReport={handleLoadSavedReport}
          onResetToToday={handleResetToToday}
        />
      )}

      {/* Floating transparent button when top bar is hidden */}
      {!isTopBarVisible && (
        <button
          onClick={toggleTopBar}
          className="fixed top-2 right-4 z-50 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/35 hover:bg-slate-900/85 backdrop-blur-md text-white/80 hover:text-white text-xs font-semibold shadow-md border border-white/20 transition-all duration-200 cursor-pointer opacity-40 hover:opacity-100 group select-none"
          title="Tampilkan Menu Bar (Show Top Bar)"
        >
          <ChevronDown className="w-3.5 h-3.5 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
          <span className="text-[11px] font-medium">Show Bar</span>
        </button>
      )}

      {/* Main Operational Report Dashboard */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <DailyReport
          dateDisplay={formatDateDisplay(activeReportDate)}
          feuMduData={feuMduData}
          onFeuMduChange={handleFeuMduChange}
          issueOperational={issueOperational}
          onIssueOperationalChange={handleIssueOperationalChange}
          issueMaintenance={issueMaintenance}
          onIssueMaintenanceChange={handleIssueMaintenanceChange}
          unitModes={unitModes}
          onUnitModeChange={handleUnitModeChange}
          unitStatuses={unitStatuses}
          onUnitStatusChange={handleUnitStatusChange}
          phdData={phdData}
          tanks={tanks}
          sampleLimits={sampleLimits}
          limsData={limsData}
          onLimsParamChange={handleLimsParamChange}
        />
      </div>
    </div>
  );
}

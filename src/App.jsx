import { useState, useEffect, useCallback, useRef } from "react";
import TopSettingsBar from "./components/TopSettingsBar.jsx";
import DailyReport from "./DailyReport.jsx";
import {
  getDailyReport,
  saveDailyReport,
  getTanks,
  getSampleLimits,
  archiveDailyReport,
  checkPocketBaseHealth,
} from "./services/pocketbase.js";
import { fetchPhdData } from "./services/phdApi.js";
import { fetchLimsData } from "./services/limsApi.js";
import { calculateDateRangeForPreset } from "./utils/calculations.js";

export default function App() {
  const getTodayDateStr = () => new Date().toISOString().slice(0, 10);

  // PHD query preset ('now' | 'last_10m' | 'last_1h' | 'last_3h' | 'last_8h' | 'last_24h' | 'this_day' | 'custom')
  const [phdPreset, setPhdPreset] = useState("this_day");

  // Date Range for PHD queries
  const [dateRange, setDateRange] = useState(() => {
    return (
      calculateDateRangeForPreset("this_day") || {
        start: `${getTodayDateStr()}T00:00`,
        end: `${getTodayDateStr()}T23:59`,
      }
    );
  });

  // State for FEU MDU Table & Operational Statuses (Section A & Kapasitas Feed)
  const [feuMduData, setFeuMduData] = useState({
    feu_lmo_design: 2180,
    feu_lmo_sts: 70,
    feu_rph: 65,
    feu_mmo_design: 2270,
    feu_mmo_sts: 65,
    feu_dao_design: 1786,
    feu_dao_sts: 70,
    mdu_lmo_design: 841,
    mdu_lmo_sts: 65,
    mdu_rph: 65,
    mdu_mmo_design: 777,
    mdu_mmo_sts: 65,
    mdu_dao_design: 501,
    mdu_dao_sts: 0,
    note: "",
    pompa_hos: "025P101AT",
    visual_perairan: "CLEAR",
    status_pompa_cpi_a: "Perbaikan",
    status_pompa_cpi_b: "AUTO",
  });

  // State for Issue Operational (Section B)
  const [issueOperational, setIssueOperational] = useState([
    "Unit FEU II 023 : Ketahanan stock furfural",
    "024K-101 : Temperature discharge panas & ASC hunting",
    "021F-102 : Flow fuel gas max 197 M3/h",
  ]);

  // State for Issue Maintenance (Section B)
  const [issueMaintenance, setIssueMaintenance] = useState([
    {
      equipment: "024P-107A",
      issue: "Motor vibrasi",
      mitigation: "Perbaikan motor di WS bls ( WO No. 8302570004 )",
    },
    {
      equipment: "002P-101A",
      issue: "Casing bocor",
      mitigation: "Perbaikan pompa di WS bls",
    },
  ]);

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
  const [tanks, setTanks] = useState([]);
  const [sampleLimits, setSampleLimits] = useState([]);
  const [phdData, setPhdData] = useState({});
  const [limsData, setLimsData] = useState({ samples: {}, shift: "Malam" });

  // Status & loading indicators
  const [pocketBaseConnected, setPocketBaseConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  const autoSaveDebounceTimer = useRef(null);

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

  // 1. Load initial PocketBase, LIMS, and Tank data
  const loadInitialData = useCallback(async () => {
    setIsRefreshing(true);
    const today = getTodayDateStr();

    try {
      // Check PB Health
      const isHealthy = await checkPocketBaseHealth();
      setPocketBaseConnected(isHealthy);

      // Fetch PB collections in parallel
      const [pbReport, pbTanks, pbLimits, limsResult] = await Promise.all([
        getDailyReport(today),
        getTanks(),
        getSampleLimits(),
        fetchLimsData(),
      ]);

      if (pbTanks && pbTanks.length > 0) setTanks(pbTanks);
      if (pbLimits && pbLimits.length > 0) setSampleLimits(pbLimits);
      if (limsResult) setLimsData(limsResult);

      // Populate existing daily report if available
      if (pbReport) {
        if (pbReport.feu_mdu_data) {
          setFeuMduData((prev) => ({
            ...prev,
            ...pbReport.feu_mdu_data,
          }));
        }
        if (pbReport.issue_operational) {
          setIssueOperational(
            normalizeOperationalIssues(pbReport.issue_operational),
          );
        }
        if (pbReport.issue_maintenance) {
          setIssueMaintenance(
            normalizeMaintenanceIssues(pbReport.issue_maintenance),
          );
        }
        if (pbReport.unit_modes) {
          setUnitModes(pbReport.unit_modes);
          if (pbReport.unit_modes.statuses) {
            setUnitStatuses((prev) => ({
              ...prev,
              ...pbReport.unit_modes.statuses,
            }));
          }
        }
        if (pbReport.feu_mdu_data?.unit_statuses) {
          setUnitStatuses((prev) => ({
            ...prev,
            ...pbReport.feu_mdu_data.unit_statuses,
          }));
        }
        setLastSavedTime(
          pbReport.updated || pbReport.created || pbReport.updated_at,
        );
      }
    } catch (err) {
      console.error("Error loading initial report data:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [normalizeOperationalIssues, normalizeMaintenanceIssues]);

  // 2. Query PHD Tags based on active modes & tank tags
  const loadPhdTags = useCallback(
    async (currentRange, currentModes, currentTanks) => {
      const mode023 = currentModes?.unit023 || "MMO";

      // Base operational tags (Kapasitas Feed)
      const activeTags = [
        "021FI_004.pv",
        "021FY_004X.C1",
        "022FI_001.pv",
        "022FY_001X.C1",
        "023FI_004.pv",
        "024FI_001.pv",
        "025FIC_004.pv",
        "025FY_004X.PV",
        "002LI_051.PV",
        "023LI_005.PV",
        // Produksi Unit 021 HVU II
        "021FIC_058.PV",
        "021FY_058X.C1",
        "021FIC_057.PV",
        "021FY_057X.C1",
        "021FI_008.PV",
        "021FY_008X.PV",
        "021FI_002.PV",
        "021FY_002X.PV",
        // Produksi Unit 022 PDU II
        "022FI_007.PV",
        "022FY_007X.C1",
        "022FI_013.PV",
        "022FY_013X.PV",
        // Produksi Unit 023 FEU II
        "023FI_031.PV",
        "023FI_703.PV",
        "023FY_031BX.C1",
        "023FY_031CX.C1",
        "023FY_031DX.C1",
        "023FI_028.pv",
        "023FY_028BX.C1",
        "023FY_028CX.C1",
        "023FY_028DX.C1",
        // Produksi Unit 024 MDU II
        "024FI_023.PV",
        "024FY_023BX.C1",
        "024FI_031.PV",
        "024FY_031X.PV",
      ];

      // Add SG tag for Unit 023 feed based on active mode
      if (mode023 === "LMO") activeTags.push("023FY_004BX.C1");
      else if (mode023 === "DAO") activeTags.push("023FY_004DX.C1");
      else activeTags.push("023FY_004CX.C1");

      // Add tank level tags
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

      setIsRefreshing(true);
      try {
        const results = await fetchPhdData(
          activeTags,
          currentRange.start,
          currentRange.end,
        );
        setPhdData((prev) => ({ ...prev, ...results }));
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
      loadPhdTags(newRange, unitModes, tanks);
    },
    [unitModes, tanks, loadPhdTags],
  );

  // Initial mount trigger
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Trigger PHD fetch when modes or tanks change
  useEffect(() => {
    loadPhdTags(dateRange, unitModes, tanks);
  }, [unitModes, tanks, loadPhdTags]);

  // 3. Auto-save helper to sync changes with PocketBase daily_report
  const triggerAutoSync = (updatedFields) => {
    clearTimeout(autoSaveDebounceTimer.current);
    autoSaveDebounceTimer.current = setTimeout(async () => {
      const today = getTodayDateStr();
      const currentUnitModes = updatedFields.unit_modes ?? unitModes;
      const currentStatuses = updatedFields.unit_statuses ?? unitStatuses;
      const currentFeuMdu = updatedFields.feu_mdu_data ?? feuMduData;

      const payload = {
        feu_mdu_data: {
          ...currentFeuMdu,
          unit_statuses: currentStatuses,
        },
        issue_operational: updatedFields.issue_operational ?? issueOperational,
        issue_maintenance: updatedFields.issue_maintenance ?? issueMaintenance,
        unit_modes: {
          ...currentUnitModes,
          statuses: currentStatuses,
        },
      };
      try {
        await saveDailyReport(today, payload);
        setLastSavedTime(new Date().toISOString());
      } catch (err) {
        console.error("Auto-sync to PocketBase failed:", err);
      }
    }, 600);
  };

  // Section A: FEU MDU change handler
  const handleFeuMduChange = (newData) => {
    setFeuMduData(newData);
    triggerAutoSync({ feu_mdu_data: newData });
  };

  // Section B: Issue Operational change handler
  const handleIssueOperationalChange = (newData) => {
    const normalized = normalizeOperationalIssues(newData);
    setIssueOperational(normalized);
    triggerAutoSync({ issue_operational: normalized });
  };

  // Section B: Issue Maintenance change handler
  const handleIssueMaintenanceChange = (newData) => {
    const normalized = normalizeMaintenanceIssues(newData);
    setIssueMaintenance(normalized);
    triggerAutoSync({ issue_maintenance: normalized });
  };

  // Section C: Switchable Unit Mode change handler
  const handleUnitModeChange = (unitKey, newMode) => {
    const updated = { ...unitModes, [unitKey]: newMode };
    setUnitModes(updated);
    triggerAutoSync({ unit_modes: updated });
  };

  // Operational Unit Status change handler (Unit 021, Unit 022, Unit 023, Unit 024, HOS II)
  const handleUnitStatusChange = (unitKey, newStatus) => {
    const updated = { ...unitStatuses, [unitKey]: newStatus };
    setUnitStatuses(updated);
    triggerAutoSync({ unit_statuses: updated });
  };

  // 4. Manual Save & 23:00 Archive Trigger
  const handleManualSave = async (isAuto = false) => {
    setIsSaving(true);
    const today = getTodayDateStr();

    try {
      // 1. Sync daily_report
      const currentReportState = {
        feu_mdu_data: {
          ...feuMduData,
          unit_statuses: unitStatuses,
        },
        issue_operational: issueOperational,
        issue_maintenance: issueMaintenance,
        unit_modes: {
          ...unitModes,
          statuses: unitStatuses,
        },
      };
      await saveDailyReport(today, currentReportState);

      // 2. Archive snapshot to report_daily_archive
      const snapshotPayload = {
        date: today,
        date_range: dateRange,
        saved_at: new Date().toISOString(),
        is_auto_scheduled: isAuto,
        feu_mdu_data: feuMduData,
        issue_operational: issueOperational,
        issue_maintenance: issueMaintenance,
        unit_modes: unitModes,
        unit_statuses: unitStatuses,
        phd_data_snapshot: phdData,
        lims_snapshot: limsData,
      };

      await archiveDailyReport(today, snapshotPayload);
      setLastSavedTime(new Date().toISOString());
      setPocketBaseConnected(true);
    } catch (err) {
      console.error("Save to PocketBase error:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Format date display for header
  const formatDateDisplay = () => {
    const now = new Date();
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
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  return (
    <div className="min-h-screen w-screen flex flex-col overflow-hidden bg-[#eef5f9]">
      {/* Top Collapsible Controls Bar */}
      <TopSettingsBar
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        phdPreset={phdPreset}
        onPhdPresetChange={handlePhdPresetChange}
        onRefreshData={() => {
          let currentRange = dateRange;
          if (phdPreset !== "custom") {
            const refreshed = calculateDateRangeForPreset(phdPreset);
            if (refreshed) {
              currentRange = refreshed;
              setDateRange(refreshed);
            }
          }
          loadInitialData();
          loadPhdTags(currentRange, unitModes, tanks);
        }}
        onManualSave={handleManualSave}
        isSaving={isSaving}
        isRefreshing={isRefreshing}
        pocketBaseConnected={pocketBaseConnected}
        lastSavedTime={lastSavedTime}
      />

      {/* Main Operational Report Dashboard */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <DailyReport
          dateDisplay={formatDateDisplay()}
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
        />
      </div>
    </div>
  );
}

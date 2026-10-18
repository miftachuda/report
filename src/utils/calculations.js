// Calculation Utilities for Operational Daily Report

/**
 * Calculate Actual T/D from Flow (m3/h) and SG (ton/m3)
 * Formula: Flow * SG * 24
 */
export function calculateActualTD(flow, sg) {
  if (flow === null || flow === undefined || isNaN(Number(flow))) return null
  if (sg === null || sg === undefined || isNaN(Number(sg))) return null
  const f = Number(flow)
  const s = Number(sg)
  if (f <= 0 || s <= 0) return 0
  return Math.round(f * s * 24)
}

/**
 * Calculate Target (T/D) from percentage and design
 */
export function calculateTargetTD(percentage, design) {
  if (!percentage || !design || isNaN(Number(percentage)) || isNaN(Number(design))) return null
  return Math.round((Number(percentage) / 100) * Number(design))
}

/**
 * Calculate achieved percentage: (Actual / Target) * 100
 */
export function calculateAchievedPercent(actual, target) {
  if (!actual || !target || Number(target) <= 0) return null
  return ((Number(actual) / Number(target)) * 100).toFixed(1)
}

/**
 * Calculate Metric Tons in a vertical cylindrical tank
 * @param {number|string} diaMm - Tank diameter in mm (e.g. 15374)
 * @param {number|string} levelMm - Current liquid level in mm (e.g. 8690)
 * @param {number|string} sg - Specific gravity (e.g. 0.9330)
 * @returns {number} Metric tons
 */
export function calculateTankTons(diaMm, levelMm, sg) {
  const d = Number(diaMm)
  const l = Number(levelMm)
  const s = Number(sg)

  if (!d || isNaN(d) || !l || isNaN(l) || !s || isNaN(s) || l <= 0 || d <= 0) {
    return 0
  }

  // Convert to meters
  const radiusMeters = d / 2000
  const heightMeters = l / 1000

  // Volume in m3 = PI * r^2 * h
  const volumeM3 = Math.PI * Math.pow(radiusMeters, 2) * heightMeters

  // Mass in metric tons = Volume * SG
  const tons = volumeM3 * s
  return Math.round(tons)
}

/**
 * Normalize tank name strings: "41T-101" -> "41T101"
 */
export function normalizeTankName(name) {
  if (!name) return ''
  return String(name).replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

/**
 * Calculate Group Total Tons for product tanks
 * @param {string[]} tankNames - Array of tank names, e.g. ['41T-101', '41T-102']
 * @param {Array} tanksDb - Array of tank records from PocketBase
 * @param {Record<string, number>} phdTags - Mapped PHD tag values
 */
export function calculateProductGroupTons(tankNames, tanksDb = [], phdTags = {}) {
  let totalTons = 0

  tankNames.forEach((targetName) => {
    const normTarget = normalizeTankName(targetName)
    const tankRecord = tanksDb.find((t) => normalizeTankName(t.tank_name) === normTarget)

    if (tankRecord) {
      const tagLevel = tankRecord.tag_level
      const level = phdTags[tagLevel] ?? null

      if (level !== null && level !== undefined) {
        const tons = calculateTankTons(tankRecord.tank_dia, level, tankRecord.sg)
        totalTons += tons
      }
    }
  })

  return Math.round(totalTons)
}

/**
 * Compare a parameter value against sample_limit (low_limit and high_limit)
 * @param {string|number} rawValue - The sample test value
 * @param {object} limitRecord - The sample_limit record from PocketBase
 * @returns {{ isOutOfRange: boolean, limitLabel: string, formattedValue: string }}
 */
export function evaluateSampleLimit(rawValue, limitRecord) {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return { isOutOfRange: false, limitLabel: '', formattedValue: '-' }
  }

  const valStr = String(rawValue).trim()
  const numVal = parseFloat(valStr)

  let low = null
  let high = null

  if (limitRecord) {
    if (limitRecord.low_limit !== null && limitRecord.low_limit !== undefined && limitRecord.low_limit !== '') {
      const parsedLow = parseFloat(limitRecord.low_limit)
      if (!isNaN(parsedLow)) low = parsedLow
    }
    if (limitRecord.high_limit !== null && limitRecord.high_limit !== undefined && limitRecord.high_limit !== '') {
      // Handles values like "max 2.0" or "L8.0" or "0.960"
      const cleaned = String(limitRecord.high_limit).replace(/[^0-9.-]/g, '')
      const parsedHigh = parseFloat(cleaned)
      if (!isNaN(parsedHigh)) high = parsedHigh
    }
  }

  // Construct limit range label
  let limitLabel = ''
  if (low !== null && high !== null) {
    limitLabel = `(${low} - ${high})`
  } else if (low !== null) {
    limitLabel = `(Min ${low})`
  } else if (high !== null) {
    limitLabel = `(Max ${high})`
  } else if (limitRecord?.high_limit) {
    limitLabel = `(${limitRecord.high_limit})`
  }

  // Range evaluation
  let isOutOfRange = false
  if (!isNaN(numVal)) {
    if (low !== null && numVal < low) isOutOfRange = true
    if (high !== null && numVal > high) isOutOfRange = true
  }

  return {
    isOutOfRange,
    limitLabel,
    formattedValue: valStr,
  }
}


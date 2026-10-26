// PocketBase Client & API Service for base.loc-2.com

const BASE_URL = 'https://base.loc-2.com'

/**
 * Helper to perform fetch with timeout and json parsing
 */
async function apiRequest(endpoint, options = {}) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), options.timeout || 8000)

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
    clearTimeout(id)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
    }

    if (response.status === 204) {
      return { success: true }
    }

    const text = await response.text()
    if (!text || !text.trim()) {
      return { success: true }
    }

    return JSON.parse(text)
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

/**
 * Recursively sanitize objects/arrays for database save.
 * Requirement: Never save 0 as null or undefined.
 */
export function sanitizeForSave(val) {
  if (val === null || val === undefined) {
    return 0
  }
  if (Array.isArray(val)) {
    return val.map((item) => sanitizeForSave(item))
  }
  if (typeof val === 'object') {
    const clean = {}
    for (const [k, v] of Object.entries(val)) {
      if (v === null || v === undefined) {
        clean[k] = 0
      } else if (typeof v === 'object') {
        clean[k] = sanitizeForSave(v)
      } else {
        clean[k] = v
      }
    }
    return clean
  }
  return val
}

/**
 * Safely parse JSON strings from PocketBase daily_report text fields
 */
export function parsePbDailyReport(record) {
  if (!record) return record
  const res = { ...record }
  const jsonFields = ['feu_mdu_data', 'issue_maintenance', 'issue_operational', 'unit_modes']
  for (const f of jsonFields) {
    if (typeof res[f] === 'string') {
      const trimmed = res[f].trim()
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          res[f] = JSON.parse(trimmed)
        } catch {}
      }
    }
  }
  return res
}

/**
 * Helper to find existing records for a given date string across various date formats/types
 */
async function findExistingRecords(collectionName, dateStr) {
  if (collectionName === 'report_daily_archive') {
    // 1. In report_daily_archive, date is nested inside payload_data JSON
    try {
      const filter = encodeURIComponent(`payload_data.date = "${dateStr}"`)
      const res = await apiRequest(`/api/collections/${collectionName}/records?filter=${filter}&perPage=50`)
      if (res.items && res.items.length > 0) {
        return res.items
      }
    } catch (err) {}

    // 2. Created date range
    try {
      const filter = encodeURIComponent(`created >= "${dateStr} 00:00:00" && created <= "${dateStr} 23:59:59"`)
      const res = await apiRequest(`/api/collections/${collectionName}/records?filter=${filter}&perPage=50`)
      if (res.items && res.items.length > 0) {
        return res.items
      }
    } catch (err) {}

    // 3. Fallback: inspect recent records
    try {
      const res = await apiRequest(`/api/collections/${collectionName}/records?perPage=100&sort=-created`)
      if (res.items && res.items.length > 0) {
        const matched = res.items.filter((item) => {
          const d = item.date || item.payload_data?.date || (item.created ? item.created.slice(0, 10) : '')
          return d === dateStr || String(d).startsWith(dateStr)
        })
        if (matched.length > 0) {
          return matched
        }
      }
    } catch (err) {}

    return []
  }

  // 1. Exact string match on date field (daily_report)
  try {
    const filter = encodeURIComponent(`date="${dateStr}" || date~"${dateStr}"`)
    const res = await apiRequest(`/api/collections/${collectionName}/records?filter=${filter}&perPage=50`)
    if (res.items && res.items.length > 0) {
      return res.items
    }
  } catch (err) {
    console.warn(`[PocketBase] Filter query on ${collectionName} warning:`, err.message)
  }

  // 2. Date range filter
  try {
    const filter = encodeURIComponent(`created >= "${dateStr} 00:00:00" && created <= "${dateStr} 23:59:59"`)
    const res = await apiRequest(`/api/collections/${collectionName}/records?filter=${filter}&perPage=50`)
    if (res.items && res.items.length > 0) {
      return res.items
    }
  } catch (err) {}

  // 3. Fallback: query last 100 records and match date in JS
  try {
    const res = await apiRequest(`/api/collections/${collectionName}/records?perPage=100&sort=-created`)
    if (res.items && res.items.length > 0) {
      const matched = res.items.filter((item) => {
        const d = String(item.date || item.created?.slice(0, 10) || '').trim()
        return d === dateStr || d.startsWith(dateStr) || d.includes(dateStr)
      })
      if (matched.length > 0) {
        return matched
      }
    }
  } catch (err) {}

  return []
}

/**
 * 1. daily_report Collection
 * Key: date (YYYY-MM-DD)
 * Fields: date, feu_mdu_data, issue_operational, issue_maintenance, unit_modes
 */
export async function getDailyReport(dateStr) {
  try {
    const existing = await findExistingRecords('daily_report', dateStr)
    if (existing && existing.length > 0) {
      return parsePbDailyReport(existing[0])
    }
  } catch (err) {
    console.warn(`[PocketBase] getDailyReport for ${dateStr} warning:`, err.message)
  }
  return null
}

/**
 * Detailed report lookup by date with fallbacks (daily_report -> report_daily_archive -> local cache)
 */
export async function getSavedReportByDate(dateStr) {
  // 1. Check daily_report collection
  try {
    const existing = await findExistingRecords('daily_report', dateStr)
    if (existing && existing.length > 0) {
      const parsed = parsePbDailyReport(existing[0])
      return {
        success: true,
        source: 'daily_report',
        id: parsed.id,
        date: dateStr,
        created: parsed.created,
        updated: parsed.updated,
        record: parsed,
      }
    }
  } catch (err) {
    console.warn(`[PocketBase] getSavedReportByDate daily_report error:`, err.message)
  }

  // 2. Check report_daily_archive collection
  try {
    const archives = await findExistingRecords('report_daily_archive', dateStr)
    if (archives && archives.length > 0) {
      const rec = archives[0]
      let payload = rec.payload_data
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload) } catch {}
      }
      return {
        success: true,
        source: 'report_daily_archive',
        id: rec.id,
        date: dateStr,
        created: rec.created,
        updated: rec.updated,
        record: {
          id: rec.id,
          date: dateStr,
          created: rec.created,
          updated: rec.updated,
          feu_mdu_data: payload?.feu_mdu_data || payload,
          issue_operational: payload?.issue_operational || [],
          issue_maintenance: payload?.issue_maintenance || [],
          unit_modes: payload?.unit_modes || { unit023: 'MMO', unit024: 'LMO' },
        },
      }
    }
  } catch (err) {
    console.warn(`[PocketBase] getSavedReportByDate archive error:`, err.message)
  }

  // 3. Check localStorage cache
  try {
    const localDaily = localStorage.getItem(`daily_report_${dateStr}`)
    if (localDaily) {
      const parsed = JSON.parse(localDaily)
      return {
        success: true,
        source: 'local_cache',
        id: 'local-' + dateStr,
        date: dateStr,
        created: parsed.updated_at || new Date().toISOString(),
        updated: parsed.updated_at || new Date().toISOString(),
        record: {
          id: 'local-' + dateStr,
          date: dateStr,
          created: parsed.updated_at,
          updated: parsed.updated_at,
          feu_mdu_data: parsed.feu_mdu_data || {},
          issue_operational: parsed.issue_operational || [],
          issue_maintenance: parsed.issue_maintenance || [],
          unit_modes: parsed.unit_modes || { unit023: 'MMO', unit024: 'LMO' },
        },
      }
    }

    const localArchive = localStorage.getItem(`daily_archive_${dateStr}`)
    if (localArchive) {
      const parsed = JSON.parse(localArchive)
      const payload = parsed.payload_data || parsed
      return {
        success: true,
        source: 'local_archive_cache',
        id: 'local-arch-' + dateStr,
        date: dateStr,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        record: {
          id: 'local-arch-' + dateStr,
          date: dateStr,
          feu_mdu_data: payload?.feu_mdu_data || payload,
          issue_operational: payload?.issue_operational || [],
          issue_maintenance: payload?.issue_maintenance || [],
          unit_modes: payload?.unit_modes || { unit023: 'MMO', unit024: 'LMO' },
        },
      }
    }
  } catch (err) {}

  return {
    success: false,
    date: dateStr,
    message: `Tidak ditemukan data laporan di PocketBase untuk tanggal ${dateStr}.`,
  }
}

/**
 * Get list of dates that have saved reports in PocketBase
 */
export async function getSavedReportDates() {
  const datesSet = new Set()

  try {
    const res = await apiRequest('/api/collections/daily_report/records?perPage=50&sort=-created')
    if (res.items && Array.isArray(res.items)) {
      res.items.forEach((item) => {
        const d = item.date || item.created?.slice(0, 10)
        if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
          datesSet.add(d)
        }
      })
    }
  } catch (err) {}

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('daily_report_')) {
        const d = k.replace('daily_report_', '')
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) datesSet.add(d)
      }
    }
  } catch {}

  return Array.from(datesSet).sort().reverse()
}

export async function saveDailyReport(dateStr, data) {
  // Sanitize numeric nulls so 0 is never stored as null
  const sanitizedFeuMdu = sanitizeForSave(data.feu_mdu_data || {})

  // Stringify objects for PocketBase text fields
  const payload = {
    date: dateStr,
    feu_mdu_data: typeof sanitizedFeuMdu === 'object' ? JSON.stringify(sanitizedFeuMdu) : (sanitizedFeuMdu ?? ''),
    issue_operational: typeof data.issue_operational === 'object' ? JSON.stringify(data.issue_operational) : (data.issue_operational ?? ''),
    issue_maintenance: typeof data.issue_maintenance === 'object' ? JSON.stringify(data.issue_maintenance) : (data.issue_maintenance ?? ''),
    unit_modes: typeof data.unit_modes === 'object' ? JSON.stringify(data.unit_modes) : (data.unit_modes ?? ''),
    updated_at: new Date().toISOString(),
  }

  // Always cache parsed version locally for immediate instant-load
  const localCache = {
    date: dateStr,
    feu_mdu_data: sanitizedFeuMdu,
    issue_operational: data.issue_operational,
    issue_maintenance: data.issue_maintenance,
    unit_modes: data.unit_modes,
    updated_at: payload.updated_at,
  }
  localStorage.setItem(`daily_report_${dateStr}`, JSON.stringify(localCache))
  localStorage.setItem('last_saved_daily_report', JSON.stringify(localCache))

  try {
    const existingItems = await findExistingRecords('daily_report', dateStr)

    if (existingItems && existingItems.length > 0) {
      const existingId = existingItems[0].id
      // Clean up extra duplicate records if any exist
      if (existingItems.length > 1) {
        for (let i = 1; i < existingItems.length; i++) {
          try {
            await apiRequest(`/api/collections/daily_report/records/${existingItems[i].id}`, {
              method: 'DELETE',
            })
          } catch {
            // ignore
          }
        }
      }
      return await apiRequest(`/api/collections/daily_report/records/${existingId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      return await apiRequest(`/api/collections/daily_report/records`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
  } catch (err) {
    console.warn(`[PocketBase] saveDailyReport remote error (persisted locally):`, err.message)
    return { success: false, localOnly: true, error: err.message, data: payload }
  }
}

/**
 * Fetch the latest saved daily_report record directly from PocketBase database
 */
export async function getLatestDailyReport() {
  try {
    const res = await apiRequest(`/api/collections/daily_report/records?sort=-created&perPage=1`)
    if (res.items && res.items.length > 0) {
      return parsePbDailyReport(res.items[0])
    }
  } catch (err) {
    console.warn('[PocketBase] getLatestDailyReport remote error:', err.message)
  }
  return null
}

/**
 * 2. tank Collection
 * Fields: tank_name, tank_dia, sg, tag_level
 */
export async function getTanks() {
  try {
    const res = await apiRequest(`/api/collections/tank/records?perPage=250`)
    if (res.items) {
      localStorage.setItem('cached_tanks', JSON.stringify(res.items))
      return res.items
    }
  } catch (err) {
    console.warn('[PocketBase] getTanks fallback to cache:', err.message)
    const cached = localStorage.getItem('cached_tanks')
    if (cached) return JSON.parse(cached)
  }
  return []
}

/**
 * 3. sample_limit Collection
 * Fields: sample_code, param_name, low_limit, high_limit
 */
export async function getSampleLimits() {
  try {
    const res = await apiRequest(`/api/collections/sample_limit/records?perPage=250`)
    if (res.items) {
      localStorage.setItem('cached_sample_limits', JSON.stringify(res.items))
      return res.items
    }
  } catch (err) {
    console.warn('[PocketBase] getSampleLimits fallback to cache:', err.message)
    const cached = localStorage.getItem('cached_sample_limits')
    if (cached) return JSON.parse(cached)
  }
  return []
}

/**
 * 4. report_daily_archive Collection
 * Fields: date, payload_data
 * Checks for existing record on the same date and replaces (PATCH) it instead of creating duplicates
 */
export async function archiveDailyReport(dateStr, payloadData) {
  // Sanitize numeric nulls so 0 is never stored as null
  const sanitizedPayload = sanitizeForSave(payloadData)
  sanitizedPayload.date = dateStr

  const archiveItem = {
    date: dateStr,
    payload_data: sanitizedPayload,
  }

  // Backup locally
  localStorage.setItem(`daily_archive_${dateStr}`, JSON.stringify(archiveItem))
  localStorage.setItem('last_saved_archive', JSON.stringify(archiveItem))

  try {
    // Check if record exists for this date using robust matching across string/datetime
    const existingItems = await findExistingRecords('report_daily_archive', dateStr)

    // PocketBase report_daily_archive collection payload body
    const pbBody = {
      payload_data: sanitizedPayload,
    }

    if (existingItems && existingItems.length > 0) {
      const existingId = existingItems[0].id
      // Clean up extra duplicate records if any exist from previous saves
      if (existingItems.length > 1) {
        for (let i = 1; i < existingItems.length; i++) {
          try {
            await apiRequest(`/api/collections/report_daily_archive/records/${existingItems[i].id}`, {
              method: 'DELETE',
            })
          } catch {
            // ignore
          }
        }
      }

      // Replace / update existing record (PATCH)
      return await apiRequest(`/api/collections/report_daily_archive/records/${existingId}`, {
        method: 'PATCH',
        body: JSON.stringify(pbBody),
      })
    } else {
      // Create new record (POST)
      return await apiRequest(`/api/collections/report_daily_archive/records`, {
        method: 'POST',
        body: JSON.stringify(pbBody),
      })
    }
  } catch (err) {
    console.warn('[PocketBase] archiveDailyReport error:', err.message)
    throw err
  }
}

/**
 * Get latest archive snapshot synchronously from localStorage
 */
export function getLastSavedLocalArchive() {
  try {
    const direct = localStorage.getItem('last_saved_archive')
    if (direct) {
      const parsed = JSON.parse(direct)
      if (parsed) {
        if (typeof parsed.payload_data === 'string') {
          try { parsed.payload_data = JSON.parse(parsed.payload_data) } catch {}
        }
        return parsed
      }
    }
  } catch {}

  try {
    const keys = Object.keys(localStorage)
      .filter((k) => k.startsWith('daily_archive_'))
      .sort()
      .reverse()
    if (keys.length > 0) {
      const parsed = JSON.parse(localStorage.getItem(keys[0]))
      if (parsed) {
        if (typeof parsed.payload_data === 'string') {
          try { parsed.payload_data = JSON.parse(parsed.payload_data) } catch {}
        }
        return parsed
      }
    }
  } catch {}

  return null
}

/**
 * Get latest daily_report payload synchronously from localStorage
 */
export function getLastSavedLocalReport() {
  try {
    const direct = localStorage.getItem('last_saved_daily_report')
    if (direct) return JSON.parse(direct)
  } catch {}

  try {
    const keys = Object.keys(localStorage)
      .filter((k) => k.startsWith('daily_report_'))
      .sort()
      .reverse()
    if (keys.length > 0) {
      return JSON.parse(localStorage.getItem(keys[0]))
    }
  } catch {}

  return null
}

/**
 * Fetch latest archive report directly from database
 */
export async function getLatestArchiveReport() {
  try {
    const res = await apiRequest('/api/collections/report_daily_archive/records?sort=-created&perPage=1')
    if (res.items && res.items.length > 0) {
      const record = res.items[0]
      if (record && typeof record.payload_data === 'string') {
        try {
          record.payload_data = JSON.parse(record.payload_data)
        } catch {}
      }
      return record
    }
  } catch (err) {
    console.warn('[Database] getLatestArchiveReport remote error:', err.message)
  }
  return null
}

/**
 * Health check
 */
export async function checkPocketBaseHealth() {
  try {
    const res = await apiRequest('/api/health', { timeout: 3000 })
    return res && res.code === 200
  } catch {
    return false
  }
}


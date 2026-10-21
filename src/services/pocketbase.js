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

    return await response.json()
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

/**
 * Helper to find existing records for a given date string across various date formats/types
 */
async function findExistingRecords(collectionName, dateStr) {
  // 1. Exact string match or substring match
  try {
    const filter = encodeURIComponent(`date="${dateStr}" || date~"${dateStr}"`)
    const res = await apiRequest(`/api/collections/${collectionName}/records?filter=${filter}&perPage=50`)
    if (res.items && res.items.length > 0) {
      return res.items
    }
  } catch (err) {
    console.warn(`[PocketBase] Filter query on ${collectionName} warning:`, err.message)
  }

  // 2. Date range filter (in case field is datetime in PocketBase)
  try {
    const filter = encodeURIComponent(`date >= "${dateStr} 00:00:00" && date <= "${dateStr} 23:59:59"`)
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
        if (!item.date) return false
        const d = String(item.date).trim()
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
      return existing[0]
    }
  } catch (err) {
    console.warn(`[PocketBase] getDailyReport for ${dateStr} fallback:`, err.message)
  }

  // Fallback to local storage if remote collection is empty or fails
  const local = localStorage.getItem(`daily_report_${dateStr}`)
  if (local) {
    try {
      return JSON.parse(local)
    } catch {
      // ignore
    }
  }
  return null
}

export async function saveDailyReport(dateStr, data) {
  // Always cache locally first
  const payload = {
    date: dateStr,
    feu_mdu_data: data.feu_mdu_data,
    issue_operational: data.issue_operational,
    issue_maintenance: data.issue_maintenance,
    unit_modes: data.unit_modes,
    updated_at: new Date().toISOString(),
  }
  localStorage.setItem(`daily_report_${dateStr}`, JSON.stringify(payload))
  localStorage.setItem('last_saved_daily_report', JSON.stringify(payload))

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
 * Fetch the latest saved daily_report record
 */
export async function getLatestDailyReport() {
  try {
    const res = await apiRequest(`/api/collections/daily_report/records?sort=-date,-created&perPage=1`)
    if (res.items && res.items.length > 0) {
      localStorage.setItem('last_saved_daily_report', JSON.stringify(res.items[0]))
      return res.items[0]
    }
  } catch (err) {
    console.warn('[PocketBase] getLatestDailyReport remote error:', err.message)
  }
  return getLastSavedLocalReport()
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
  const archiveItem = {
    date: dateStr,
    payload_data: payloadData,
  }

  // Backup locally
  localStorage.setItem(`daily_archive_${dateStr}`, JSON.stringify(archiveItem))
  localStorage.setItem('last_saved_archive', JSON.stringify(archiveItem))

  try {
    // Check if record exists for this date using robust matching across string/datetime
    const existingItems = await findExistingRecords('report_daily_archive', dateStr)

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
        body: JSON.stringify(archiveItem),
      })
    } else {
      // Create new record (POST)
      return await apiRequest(`/api/collections/report_daily_archive/records`, {
        method: 'POST',
        body: JSON.stringify(archiveItem),
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
 * Fetch latest archive report from database with localStorage fallback
 */
export async function getLatestArchiveReport() {
  try {
    const res = await apiRequest('/api/collections/report_daily_archive/records?sort=-date,-created&perPage=1')
    if (res.items && res.items.length > 0) {
      const record = res.items[0]
      if (record && typeof record.payload_data === 'string') {
        try {
          record.payload_data = JSON.parse(record.payload_data)
        } catch {}
      }
      try {
        localStorage.setItem('last_saved_archive', JSON.stringify(record))
      } catch {}
      return record
    }
  } catch (err) {
    console.warn('[Database] getLatestArchiveReport remote error:', err.message)
  }

  // Fallback to local storage
  return getLastSavedLocalArchive()
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


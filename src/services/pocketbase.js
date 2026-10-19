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
 * 1. daily_report Collection
 * Key: date (YYYY-MM-DD)
 * Fields: date, feu_mdu_data, issue_operational, issue_maintenance, unit_modes
 */
export async function getDailyReport(dateStr) {
  try {
    const filter = encodeURIComponent(`date="${dateStr}"`)
    const res = await apiRequest(`/api/collections/daily_report/records?filter=${filter}`)
    if (res.items && res.items.length > 0) {
      return res.items[0]
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

  try {
    // Check if record exists
    const filter = encodeURIComponent(`date="${dateStr}" || date~"${dateStr}"`)
    const res = await apiRequest(`/api/collections/daily_report/records?filter=${filter}`)

    if (res.items && res.items.length > 0) {
      const existingId = res.items[0].id
      // Clean up extra duplicate records if any exist
      if (res.items.length > 1) {
        for (let i = 1; i < res.items.length; i++) {
          try {
            await apiRequest(`/api/collections/daily_report/records/${res.items[i].id}`, {
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

  try {
    // Check if record exists for this date
    const filter = encodeURIComponent(`date="${dateStr}" || date~"${dateStr}"`)
    const res = await apiRequest(`/api/collections/report_daily_archive/records?filter=${filter}`)

    if (res.items && res.items.length > 0) {
      const existingId = res.items[0].id
      // Clean up extra duplicate records if any exist from previous saves
      if (res.items.length > 1) {
        for (let i = 1; i < res.items.length; i++) {
          try {
            await apiRequest(`/api/collections/report_daily_archive/records/${res.items[i].id}`, {
              method: 'DELETE',
            })
          } catch {
            // ignore
          }
        }
      }

      // Replace / update existing record
      return await apiRequest(`/api/collections/report_daily_archive/records/${existingId}`, {
        method: 'PATCH',
        body: JSON.stringify(archiveItem),
      })
    } else {
      // Create new record
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


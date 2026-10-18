// DCS/PHD Data Service: https://apiv2.miftachuda.my.id/GetData

const PHD_API_URL = 'https://apiv2.miftachuda.my.id/GetData'

/**
 * Fetch PHD tag data for a list of tag names within a given time range.
 * @param {string[]} tagNames - Array of tag names to query
 * @param {string} startTime - ISO string or 'YYYY-MM-DDTHH:mm:ss'
 * @param {string} endTime - ISO string or 'YYYY-MM-DDTHH:mm:ss'
 * @param {number} interval - Polling interval in ms (default 900000 = 15m)
 * @returns {Promise<Record<string, number>>} Map of TagName -> Latest Numeric Value
 */
export async function fetchPhdData(tagNames, startTime, endTime, interval = null) {
  if (!tagNames || tagNames.length === 0) return {}

  // Format ISO strings if needed
  const formatTime = (t) => {
    if (!t) return new Date().toISOString().slice(0, 19)
    if (t instanceof Date) return t.toISOString().slice(0, 19)
    return String(t).slice(0, 19)
  }

  const sTime = formatTime(startTime)
  const eTime = formatTime(endTime)

  // Dynamically determine optimal polling interval if not explicitly supplied
  let queryInterval = interval
  if (!queryInterval) {
    const diffMs = Math.abs(new Date(eTime).getTime() - new Date(sTime).getTime())
    if (diffMs <= 15 * 60 * 1000) {
      queryInterval = 60000 // 1 minute for small ranges (Now, Last 10 min)
    } else if (diffMs <= 3 * 3600 * 1000) {
      queryInterval = 300000 // 5 minutes for Last 1h - 3h
    } else {
      queryInterval = 900000 // 15 minutes for 8h - 24h
    }
  }

  const payload = [
    {
      TagName: Array.from(new Set(tagNames)),
      StartTime: sTime,
      EndTime: eTime,
      Interval: queryInterval,
    },
  ]

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 12000)

  try {
    const response = await fetch(PHD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`PHD API error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    if (!Array.isArray(data)) {
      if (data && data.error) throw new Error(data.error)
      return {}
    }

    // Map each Tag to its latest valid value
    const tagValues = {}
    data.forEach((item) => {
      if (!item.TagName) return
      let val = null

      if (Array.isArray(item.Value) && item.Value.length > 0) {
        // Look for the last non-null numeric value in the time series
        for (let i = item.Value.length - 1; i >= 0; i--) {
          const v = item.Value[i]
          if (v !== null && v !== undefined && !isNaN(Number(v))) {
            val = Number(v)
            break
          }
        }
      } else if (item.Value !== null && item.Value !== undefined && !isNaN(Number(item.Value))) {
        val = Number(item.Value)
      }

      tagValues[item.TagName] = val
    })

    // Cache latest successful read to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('cached_phd_tags') || '{}')
      localStorage.setItem('cached_phd_tags', JSON.stringify({ ...existing, ...tagValues }))
    } catch {
      // ignore
    }

    return tagValues
  } catch (err) {
    clearTimeout(timeoutId)
    console.warn('[PHD API] fetch failed, using cached tags:', err.message)
    try {
      return JSON.parse(localStorage.getItem('cached_phd_tags') || '{}')
    } catch {
      return {}
    }
  }
}


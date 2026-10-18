// DCS/PHD Data Service: https://apiv2.miftachuda.my.id/GetData

const PHD_API_URL = 'https://apiv2.miftachuda.my.id/GetData'

/**
 * Format date string to DCS/PHD API specification: MM/DD/YYYY HH:mm:ss.000
 * Example: 10/18/2026 23:00:00.000
 */
export function formatPhdApiDate(input) {
  if (!input) input = new Date()
  if (typeof input === 'string' && /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}\.\d{3}$/.test(input.trim())) {
    return input.trim()
  }

  let d = input
  if (typeof input === 'string') {
    if (input.includes('T')) {
      const [datePart, timePart] = input.split('T')
      const [year, month, day] = datePart.split('-').map(Number)
      const timeTokens = timePart.split(':').map(Number)
      const hour = timeTokens[0] || 0
      const minute = timeTokens[1] || 0
      const second = timeTokens[2] || 0
      d = new Date(year, month - 1, day, hour, minute, second)
    } else {
      d = new Date(input)
    }
  }

  if (isNaN(d.getTime())) {
    d = new Date()
  }

  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')

  return `${mm}/${dd}/${yyyy} ${hh}:${min}:${ss}.000`
}

/**
 * Fetch PHD tag data for a list of tag names within a given time range.
 * @param {string[]} tagNames - Array of tag names to query
 * @param {string} startTime - Formatted as 'MM/DD/YYYY HH:mm:ss.000' or ISO
 * @param {string} endTime - Formatted as 'MM/DD/YYYY HH:mm:ss.000' or ISO
 * @param {number|null} interval - Polling interval in ms (auto-computed if null)
 * @returns {Promise<Record<string, number>>} Map of TagName -> Average Numeric Value
 */
export async function fetchPhdData(tagNames, startTime, endTime, interval = null) {
  if (!tagNames || tagNames.length === 0) return {}

  const sTime = formatPhdApiDate(startTime)
  const eTime = formatPhdApiDate(endTime)

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

    // Map each Tag to its average value across the queried time range
    const tagValues = {}
    data.forEach((item) => {
      if (!item.TagName) return
      let val = null

      if (Array.isArray(item.Value) && item.Value.length > 0) {
        let sum = 0
        let count = 0
        for (let i = 0; i < item.Value.length; i++) {
          const v = item.Value[i]
          if (v !== null && v !== undefined && !isNaN(Number(v))) {
            sum += Number(v)
            count++
          }
        }
        val = count > 0 ? sum / count : null
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


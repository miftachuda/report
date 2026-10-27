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

// In-flight request management to prevent redundant concurrent queries
let activeRequestKey = null
let activeRequestPromise = null
let activeAbortController = null

/**
 * Worker to fetch a single batch of tags
 */
async function fetchTagChunk(chunk, sTime, eTime, queryInterval, controller) {
  const payload = [
    {
      TagName: chunk,
      StartTime: sTime,
      EndTime: eTime,
      Interval: queryInterval,
    },
  ]

  const response = await fetch(PHD_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  })

  if (!response.ok) {
    throw new Error(`PHD API error ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  if (!Array.isArray(data)) {
    if (data && data.error) throw new Error(data.error)
    return {}
  }

  const chunkValues = {}
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

    chunkValues[item.TagName] = val
  })

  return chunkValues
}

/**
 * Internal worker to execute the network fetch for PHD data
 */
async function executePhdFetch(tagNames, sTime, eTime, queryInterval, controller) {
  const uniqueTags = Array.from(new Set(tagNames))
  if (uniqueTags.length === 0) return {}

  // Increased timeout to 45s for large tag batches and server query queues
  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException('PHD query timed out after 45s', 'TimeoutError'))
  }, 45000)

  try {
    // Query in parallel batches of up to 15 tags to optimize throughput and DCS response time
    const chunkSize = 15
    const chunks = []
    for (let i = 0; i < uniqueTags.length; i += chunkSize) {
      chunks.push(uniqueTags.slice(i, i + chunkSize))
    }

    const chunkPromises = chunks.map((chunk) =>
      fetchTagChunk(chunk, sTime, eTime, queryInterval, controller),
    )

    const settled = await Promise.allSettled(chunkPromises)
    clearTimeout(timeoutId)

    const tagValues = {}
    let successCount = 0

    settled.forEach((res) => {
      if (res.status === 'fulfilled' && res.value) {
        Object.assign(tagValues, res.value)
        successCount++
      } else if (res.status === 'rejected') {
        console.warn('[PHD API] Chunk error:', res.reason?.message || res.reason)
      }
    })

    console.log(
      `[PHD API] Successfully fetched ${Object.keys(tagValues).length} tags (${successCount}/${chunks.length} chunks)`,
    )

    // Cache latest successful read to localStorage
    if (Object.keys(tagValues).length > 0) {
      try {
        const existing = JSON.parse(localStorage.getItem('cached_phd_tags') || '{}')
        localStorage.setItem('cached_phd_tags', JSON.stringify({ ...existing, ...tagValues }))
      } catch {
        // ignore
      }
    }

    return tagValues
  } catch (err) {
    clearTimeout(timeoutId)

    // If request was superseded by a newer query or intentionally aborted, handle cleanly
    const isSuperseded =
      err.name === 'AbortError' &&
      (err.message?.includes('Superseded') ||
        controller.signal.reason?.message?.includes?.('Superseded') ||
        controller.signal.reason === 'Superseded')

    if (isSuperseded) {
      return {}
    }

    console.warn('[PHD API] fetch failed:', err.message || err)
    return {}
  }
}

/**
 * Fetch PHD tag data for a list of tag names within a given time range.
 * Automatically deduplicates duplicate in-flight requests and cancels stale requests.
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

  const uniqueTags = Array.from(new Set(tagNames)).sort()
  const requestKey = `${sTime}|${eTime}|${queryInterval}|${uniqueTags.join(',')}`

  // 1. If an identical request is already actively in-flight, return the existing promise
  if (activeRequestPromise && activeRequestKey === requestKey) {
    return activeRequestPromise
  }

  // 2. If a different query was in-flight, cleanly abort it
  if (activeAbortController) {
    try {
      activeAbortController.abort(new DOMException('Superseded by newer query', 'AbortError'))
    } catch {
      // ignore
    }
  }

  const controller = new AbortController()
  activeAbortController = controller
  activeRequestKey = requestKey

  activeRequestPromise = executePhdFetch(uniqueTags, sTime, eTime, queryInterval, controller)
    .finally(() => {
      if (activeRequestKey === requestKey) {
        activeRequestPromise = null
        activeRequestKey = null
        activeAbortController = null
      }
    })

  return activeRequestPromise
}



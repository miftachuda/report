// LIMS API Service: https://lims.loc-2.com/malam

const LIMS_URL = 'https://lims.loc-2.com/malam'

/**
 * Fetch LIMS laboratory samples data
 */
export async function fetchLimsData() {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(LIMS_URL, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`LIMS API error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    if (data && data.samples) {
      localStorage.setItem('cached_lims_data', JSON.stringify(data))
      return data
    }
    return { samples: {}, shift: 'Malam' }
  } catch (err) {
    clearTimeout(timeoutId)
    console.warn('[LIMS API] fetch failed, falling back to cached:', err.message)
    const cached = localStorage.getItem('cached_lims_data')
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        // ignore
      }
    }
    return { samples: {}, shift: 'Malam' }
  }
}

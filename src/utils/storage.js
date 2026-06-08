const KEY = 'golf-analytics-v2'

export function saveData(players) {
  try {
    localStorage.setItem(KEY, JSON.stringify(players))
  } catch (e) {
    console.warn('localStorage save failed:', e)
  }
}

export function loadData() {
  try {
    // Clear stale data from old format versions
    localStorage.removeItem('golf-analytics-v1')
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    // Validate: must be an array of objects with a name field
    if (!Array.isArray(data) || !data[0]?.name) return null
    return data
  } catch {
    return null
  }
}

export function clearData() {
  localStorage.removeItem(KEY)
}

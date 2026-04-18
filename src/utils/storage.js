const KEY = 'golf-analytics-v1'

export function saveData(players) {
  try {
    localStorage.setItem(KEY, JSON.stringify(players))
  } catch (e) {
    console.warn('localStorage save failed:', e)
  }
}

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearData() {
  localStorage.removeItem(KEY)
}

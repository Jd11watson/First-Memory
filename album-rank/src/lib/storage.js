import { FRIENDS } from './mockFriends'

const KEYS = {
  LIBRARY: 'albumrank_library',
  RANKS: 'albumrank_ranks',
  SONG_HISTORY: 'albumrank_song_history',
  NOTES: 'albumrank_notes',
  SOCIAL: 'albumrank_social',
}

function getJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function round1(n) {
  return Math.round(n * 10) / 10
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

export function getLibrary() {
  return getJSON(KEYS.LIBRARY, [])
}

export function addAlbumToLibrary(album) {
  const library = getLibrary()
  if (library.some(a => a.id === album.id)) return library
  const next = [...library, album]
  setJSON(KEYS.LIBRARY, next)
  return next
}

export function updateAlbumTracks(albumId, tracks) {
  const library = getLibrary()
  const next = library.map(a => (a.id === albumId ? { ...a, tracks } : a))
  setJSON(KEYS.LIBRARY, next)
  return next
}

export function getRanks() {
  return getJSON(KEYS.RANKS, {})
}

export function setAlbumRank(albumId, score) {
  const ranks = getRanks()
  const next = { ...ranks, [albumId]: { score, updatedAt: Date.now() } }
  setJSON(KEYS.RANKS, next)
  return next
}

export function getAllSongHistory() {
  return getJSON(KEYS.SONG_HISTORY, {})
}

export function getSongHistory(trackId) {
  const all = getAllSongHistory()
  return all[trackId] || []
}

export function addSongRank(trackId, score) {
  const all = getAllSongHistory()
  const existing = all[trackId] || []
  const entry = { id: `${trackId}-${Date.now()}`, score, timestamp: Date.now() }
  const next = { ...all, [trackId]: [...existing, entry] }
  setJSON(KEYS.SONG_HISTORY, next)
  return next
}

export function getAllNotes() {
  return getJSON(KEYS.NOTES, {})
}

export function getNotes(albumId) {
  const all = getAllNotes()
  return all[albumId] || []
}

export function addNote(albumId, text) {
  const all = getAllNotes()
  const existing = all[albumId] || []
  const entry = { id: `${albumId}-${Date.now()}`, text, timestamp: Date.now() }
  const next = { ...all, [albumId]: [...existing, entry] }
  setJSON(KEYS.NOTES, next)
  return next
}

function generateSocialStats() {
  const base = 5.5 + Math.random() * 3.5
  const friendCount = 2 + Math.floor(Math.random() * 4)
  const shuffled = [...FRIENDS].sort(() => Math.random() - 0.5)
  const friends = shuffled.slice(0, friendCount).map(f => ({
    friendId: f.id,
    score: round1(clamp(base + (Math.random() * 2 - 1), 1, 10)),
  }))
  const global = {
    avg: round1(clamp(base + (Math.random() - 0.5), 1, 10)),
    count: 50 + Math.floor(Math.random() * 5000),
  }
  return { friends, global }
}

export function getOrCreateSocialStats(albumId) {
  const all = getJSON(KEYS.SOCIAL, {})
  if (all[albumId]) return all[albumId]
  const stats = generateSocialStats()
  setJSON(KEYS.SOCIAL, { ...all, [albumId]: stats })
  return stats
}

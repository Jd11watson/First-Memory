const BASE = 'https://itunes.apple.com'

function upsizeArtwork(url) {
  return url ? url.replace('100x100bb', '600x600bb') : ''
}

function albumYear(releaseDate) {
  return releaseDate ? new Date(releaseDate).getFullYear() : null
}

export async function searchAlbums(term) {
  const q = encodeURIComponent(term)
  const res = await fetch(`${BASE}/search?term=${q}&media=music&entity=album&limit=10`)
  const data = await res.json()
  const results = data.results || []
  return results.map(r => ({
    id: r.collectionId,
    title: r.collectionName,
    artist: r.artistName,
    artworkUrl: upsizeArtwork(r.artworkUrl100),
    year: albumYear(r.releaseDate),
    appleAlbumUrl: r.collectionViewUrl || '',
    trackCount: r.trackCount || 0,
  }))
}

export async function getAlbumWithTracks(collectionId) {
  const res = await fetch(`${BASE}/lookup?id=${collectionId}&entity=song`)
  const data = await res.json()
  const results = data.results || []
  const collection = results.find(r => r.wrapperType === 'collection')
  const tracks = results
    .filter(r => r.wrapperType === 'track')
    .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0))
    .map(t => ({
      id: t.trackId,
      title: t.trackName,
      trackNumber: t.trackNumber || 0,
      durationMs: t.trackTimeMillis || 0,
      appleTrackUrl: t.trackViewUrl || collection?.collectionViewUrl || '',
    }))

  return {
    id: collection?.collectionId ?? Number(collectionId),
    title: collection?.collectionName ?? '',
    artist: collection?.artistName ?? '',
    artworkUrl: upsizeArtwork(collection?.artworkUrl100),
    year: albumYear(collection?.releaseDate),
    appleAlbumUrl: collection?.collectionViewUrl || '',
    tracks,
  }
}

export function appleSearchFallbackUrl(query) {
  return `https://music.apple.com/search?term=${encodeURIComponent(query)}`
}

export function formatDuration(ms) {
  if (!ms) return '--:--'
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

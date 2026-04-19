export default function SeedSong({ song }) {
  return (
    <div className="seed-song">
      <div className="seed-art">
        {song.image ? (
          <img src={song.image} alt={song.name} onError={e => { e.target.style.display = 'none' }} />
        ) : (
          <span className="seed-art-placeholder">♪</span>
        )}
      </div>
      <div className="seed-info">
        <div className="seed-label">Finding songs like</div>
        <div className="seed-name">{song.name}</div>
        <div className="seed-artist">{song.artist}</div>
      </div>
    </div>
  )
}

function scoreBandClass(score) {
  if (score >= 7) return 'score-high'
  if (score >= 4) return 'score-mid'
  return 'score-low'
}

export default function AlbumListItem({ album, score, onClick }) {
  return (
    <div className="album-row" onClick={onClick}>
      <div className="album-art">
        {album.artworkUrl && <img src={album.artworkUrl} alt="" />}
      </div>
      <div className="album-row-info">
        <div className="album-row-title">{album.title}</div>
        <div className="album-row-artist">{album.artist}</div>
      </div>
      <div className={`score-badge ${scoreBandClass(score)}`}>
        {score.toFixed(1)}<span className="score-scale">/10</span>
      </div>
    </div>
  )
}

// Compact insight rail shared by every view. Turns a view's numbers into the
// "so what": a couple of stat tiles, a labeled breakdown (thin bars, direct
// labels — never color alone), and one plain-language insight note.
export default function StatsPanel({ title, subtitle, tiles = [], breakdown, note }) {
  return (
    <aside className="rail">
      <h3>{title}</h3>
      {subtitle && <div className="rail-sub">{subtitle}</div>}

      {tiles.length > 0 && (
        <div className="stat-row">
          {tiles.map((t) => (
            <div className="stat-tile" key={t.label}>
              <div className="value">{t.value}</div>
              <div className="label">{t.label}</div>
            </div>
          ))}
        </div>
      )}

      {breakdown && (
        <div className="breakdown">
          <h4>{breakdown.title}</h4>
          {breakdown.rows.map((r) => (
            <div className="bar-row" key={r.key ?? r.label}>
              <div className="bar-top">
                <span>{r.label}</span>
                <span className="n">{r.count} · {Math.round(r.pct * 100)}%</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${Math.max(4, r.pct * 100)}%`, background: r.color }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {note && <div className="insight-note">{note}</div>}
    </aside>
  )
}

// Legend for the graph views — identity by label + swatch (never color alone),
// and clicking an entry filters the active view to that group.
export default function Legend({ title, items, activeKey, onToggle }) {
  return (
    <div className="legend">
      <h4>{title}</h4>
      <ul>
        {items.map((it) => (
          <li
            key={it.key}
            className={activeKey && activeKey !== it.key ? 'muted' : ''}
            onClick={() => onToggle(activeKey === it.key ? null : it.key)}
          >
            <span className="swatch" style={{ background: it.color }} />
            <span>{it.label}</span>
            <span className="lcount">{it.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

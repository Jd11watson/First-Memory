export const SORT_MODES = [
  { id: 'favorite', label: 'Favorite → Least' },
  { id: 'least', label: 'Least → Favorite' },
  { id: 'recent', label: 'Recently ranked' },
  { id: 'alpha', label: 'A → Z' },
  { id: 'artist', label: 'By artist' },
]

export default function SortFilterBar({ value, onChange }) {
  return (
    <div className="sort-bar">
      {SORT_MODES.map(mode => (
        <button
          key={mode.id}
          className={`sort-chip ${value === mode.id ? 'active' : ''}`}
          onClick={() => onChange(mode.id)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}

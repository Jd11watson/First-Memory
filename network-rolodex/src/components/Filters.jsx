import { INDUSTRY_LABEL, REGION_LABEL } from '../lib/inference.js'

// Shared filter bar — one row above the views (dataviz interaction rule). Filters
// apply to the single store, so every lens re-projects the same filtered set.
export default function Filters({ filters, setFilters, options, resultCount, totalCount }) {
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }))
  const active =
    filters.search || filters.industry || filters.region || filters.city || filters.tag || filters.minStrength > 1

  return (
    <div className="filters">
      <input
        type="search"
        placeholder="Search name, company, title…"
        value={filters.search}
        onChange={(e) => set({ search: e.target.value })}
      />
      <div className="field">
        <label>Industry</label>
        <select value={filters.industry} onChange={(e) => set({ industry: e.target.value })}>
          <option value="">All</option>
          {options.industries.map((k) => <option key={k} value={k}>{INDUSTRY_LABEL[k]}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Region</label>
        <select value={filters.region} onChange={(e) => set({ region: e.target.value })}>
          <option value="">All</option>
          {options.regions.map((k) => <option key={k} value={k}>{REGION_LABEL[k]}</option>)}
        </select>
      </div>
      <div className="field">
        <label>City</label>
        <select value={filters.city} onChange={(e) => set({ city: e.target.value })}>
          <option value="">All</option>
          {options.cities.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Tag</label>
        <select value={filters.tag} onChange={(e) => set({ tag: e.target.value })}>
          <option value="">All</option>
          {options.tags.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Min tie</label>
        <select value={filters.minStrength} onChange={(e) => set({ minStrength: Number(e.target.value) })}>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n === 1 ? 'Any' : `${n}+`}</option>)}
        </select>
      </div>
      {active && (
        <button
          className="ghost-btn clear"
          onClick={() => setFilters({ search: '', industry: '', region: '', city: '', tag: '', minStrength: 1 })}
        >
          Clear
        </button>
      )}
      <span className="count" style={active ? undefined : { marginLeft: 'auto' }}>
        {resultCount} of {totalCount}
      </span>
    </div>
  )
}

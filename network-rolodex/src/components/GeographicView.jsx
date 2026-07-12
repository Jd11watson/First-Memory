import { useMemo } from 'react'
import StatsPanel from './StatsPanel.jsx'
import { regionColorMap } from '../lib/colors.js'
import { REGION_LABEL } from '../lib/inference.js'
import { regionBreakdown, cityBreakdown, concentration } from '../lib/stats.js'

// Geographic lens — v1 renders GROUPED REGION CLUSTERS as cards, no real map.
//
// MAP-READY BY DESIGN: the Contact already carries a nullable `latLng`, and the
// grouping/layout is fully isolated in this component. Phase 2 drops in a real
// map by (a) geocoding contacts into `latLng` and (b) swapping the card grid
// below for a <Map> that plots those points — the store, inference, stats, and
// every other view stay untouched. Nothing outside this file assumes cards.
export default function GeographicView({ contacts, mode, tokens, selectedId, onSelect }) {
  const colorMap = useMemo(() => regionColorMap(mode), [mode])
  const regions = useMemo(() => regionBreakdown(contacts), [contacts])
  const cities = useMemo(() => cityBreakdown(contacts), [contacts])

  // Group contacts by region for the cluster cards (the swappable layout unit).
  const grouped = useMemo(() => {
    const m = new Map()
    for (const c of contacts) {
      if (!m.has(c.region)) m.set(c.region, [])
      m.get(c.region).push(c)
    }
    for (const list of m.values()) list.sort((a, b) => b.strength - a.strength || a.name.localeCompare(b.name))
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [contacts])

  const topCity = cities[0]
  const hhi = concentration(regions)
  const note = topCity
    ? `${topCity.label} is your densest city (${topCity.count} contact${topCity.count > 1 ? 's' : ''}). ` +
      `Across ${regions.length} regions your footprint is ` +
      `${hhi > 0.4 ? 'concentrated' : hhi > 0.25 ? 'moderately spread' : 'widely spread'}.`
    : 'No contacts match the current filters.'

  return (
    <>
      {contacts.length === 0 ? (
        <div className="canvas-wrap">
          <div className="empty">No contacts match the current filters.</div>
        </div>
      ) : (
        <div className="groups">
          {grouped.map(([region, list]) => (
            <div className="group-card" key={region} style={{ borderTopColor: colorMap[region] }}>
              <div className="gc-head">
                <span className="gc-title">{REGION_LABEL[region] || region}</span>
                <span className="gc-count">{list.length}</span>
              </div>
              <ul>
                {list.map((c) => (
                  <li
                    key={c.id}
                    onClick={() => onSelect(c.id)}
                    style={selectedId === c.id ? { background: 'var(--hover-wash)' } : undefined}
                  >
                    <span className="li-name">{c.name}</span>
                    <span className="li-sub">{c.city || '—'}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <StatsPanel
        title="Geographic spread"
        subtitle={`${contacts.length} connections · ${cities.length} cities`}
        tiles={[
          { value: regions.length, label: 'Regions' },
          { value: topCity ? topCity.count : '—', label: topCity ? topCity.label : 'Top city' },
        ]}
        breakdown={{
          title: 'Top cities',
          rows: cities.slice(0, 6).map((c) => ({ ...c, color: tokens.categorical[0] })),
        }}
        note={note}
      />
    </>
  )
}

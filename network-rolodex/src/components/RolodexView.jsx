import { useMemo, useState } from 'react'
import StatsPanel from './StatsPanel.jsx'
import { industryColorMap } from '../lib/colors.js'
import { INDUSTRY_LABEL, REGION_LABEL } from '../lib/inference.js'
import { totals, industryBreakdown } from '../lib/stats.js'

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'company', label: 'Company' },
  { key: 'industry', label: 'Industry' },
  { key: 'city', label: 'Location' },
  { key: 'strength', label: 'Tie' },
  { key: 'tags', label: 'Tags' },
]

function StrengthDots({ n }) {
  return (
    <span className="strength-dots" title={`Strength ${n}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= n ? 'on' : ''} />
      ))}
    </span>
  )
}

// The full-rolodex lens: every connection with all attributes and group
// memberships, sortable and searchable (search/filter come from the shared
// filter bar above; column sort is local).
export default function RolodexView({ contacts, mode, tokens, selectedId, onSelect }) {
  const [sort, setSort] = useState({ key: 'name', dir: 1 })
  const colorMap = useMemo(() => industryColorMap(mode), [mode])

  const rows = useMemo(() => {
    const sorted = [...contacts].sort((a, b) => {
      let av = a[sort.key]
      let bv = b[sort.key]
      if (sort.key === 'tags') { av = a.tags.length; bv = b.tags.length }
      if (typeof av === 'string') return av.localeCompare(bv) * sort.dir
      return ((av ?? 0) - (bv ?? 0)) * sort.dir
    })
    return sorted
  }, [contacts, sort])

  const t = totals(contacts)
  const breakdown = industryBreakdown(contacts).map((b) => ({ ...b, color: colorMap[b.key] }))

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: 1 }))

  return (
    <>
      <div className="rolodex">
        {contacts.length === 0 ? (
          <div className="empty">No contacts match the current filters.</div>
        ) : (
          <table className="contacts">
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key} onClick={() => toggleSort(c.key)}>
                    {c.label}
                    {sort.key === c.key && <span className="arrow"> {sort.dir > 0 ? '↑' : '↓'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  style={selectedId === c.id ? { background: 'var(--hover-wash)' } : undefined}
                >
                  <td>
                    <div className="cell-name">{c.name}</div>
                    <div className="cell-sub">{c.title || '—'}</div>
                  </td>
                  <td>{c.company || '—'}</td>
                  <td>
                    <span className="pill">
                      <span className="dot" style={{ background: colorMap[c.industry] }} />
                      {INDUSTRY_LABEL[c.industry]}
                      {c.industryOverride && <span title="Manually set" className="source-tag"> ✎</span>}
                    </span>
                  </td>
                  <td>
                    <div>{c.city || '—'}</div>
                    <div className="cell-sub">{REGION_LABEL[c.region]}</div>
                  </td>
                  <td><StrengthDots n={c.strength} /></td>
                  <td>
                    {c.tags.length ? c.tags.map((tg) => <span className="tag" key={tg}>{tg}</span>) : <span className="cell-sub">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <StatsPanel
        title="Rolodex"
        subtitle={`${t.count} connections`}
        tiles={[
          { value: t.strongTies, label: 'Strong ties' },
          { value: t.imported, label: 'Imported' },
        ]}
        breakdown={{ title: 'Industry mix', rows: breakdown }}
        note={`${t.manual} added manually, ${t.imported} imported. Click any row to inspect or correct a contact.`}
      />
    </>
  )
}

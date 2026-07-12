import { useMemo, useState } from 'react'
import NetworkGraph from './NetworkGraph.jsx'
import Legend from './Legend.jsx'
import StatsPanel from './StatsPanel.jsx'
import { buildGroupedGraph } from '../lib/graph.js'
import { industryColorMap } from '../lib/colors.js'
import { INDUSTRY_LABEL } from '../lib/inference.js'
import { industryBreakdown, diversity } from '../lib/stats.js'

// Industry lens: the same people force-clustered by inferred industry, colored by
// a fixed per-industry palette slot, each cluster labeled with its count.
export default function IndustryView({ contacts, mode, tokens, selectedId, onSelect }) {
  const [activeGroup, setActiveGroup] = useState(null)
  const colorMap = useMemo(() => industryColorMap(mode), [mode])

  const shown = useMemo(
    () => (activeGroup ? contacts.filter((c) => c.industry === activeGroup) : contacts),
    [contacts, activeGroup],
  )
  const graph = useMemo(() => buildGroupedGraph(shown, 'industry'), [shown])

  const breakdown = useMemo(() => industryBreakdown(contacts), [contacts])
  const legendItems = breakdown.map((b) => ({ ...b, color: colorMap[b.key] }))
  const div = diversity(breakdown)
  const top = breakdown[0]

  const note = top
    ? `${top.label} is your largest cluster at ${Math.round(top.pct * 100)}% of connections. ` +
      `Your network spans ${div.distinct} industries with an evenness of ${div.evenness}/100` +
      `${div.evenness < 45 ? ' — fairly concentrated.' : div.evenness > 70 ? ' — well diversified.' : '.'}`
    : 'No contacts match the current filters.'

  return (
    <>
      <div className="canvas-wrap">
        {shown.length === 0 ? (
          <div className="empty">No contacts match the current filters.</div>
        ) : (
          <>
            <Legend title="Industry" items={legendItems} activeKey={activeGroup} onToggle={setActiveGroup} />
            <NetworkGraph
              graph={graph}
              colorMap={colorMap}
              labelMap={INDUSTRY_LABEL}
              tokens={tokens}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          </>
        )}
      </div>
      <StatsPanel
        title="Industry breakdown"
        subtitle={`${contacts.length} connections`}
        tiles={[
          { value: div.distinct, label: 'Industries' },
          { value: top ? `${Math.round(top.pct * 100)}%` : '—', label: top ? top.label : 'Top' },
        ]}
        breakdown={{ title: 'By industry', rows: legendItems }}
        note={note}
      />
    </>
  )
}

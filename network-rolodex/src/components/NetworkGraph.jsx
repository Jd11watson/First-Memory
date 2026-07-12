import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { nodeRadius } from '../lib/graph.js'

// Shared force-directed canvas. Renders contact nodes as circles colored by their
// group and hub nodes as bold labels the cluster forms around. Used by the
// Industry view; the same component would drive a social-clustering view once
// contact<->contact links are added in graph.js (see EXTENSION POINT there).
export default function NetworkGraph({ graph, colorMap, labelMap, tokens, selectedId, onSelect }) {
  const wrapRef = useRef(null)
  const fgRef = useRef(null)
  const fitPending = useRef(true)
  const [size, setSize] = useState({ w: 600, h: 400 })

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      setSize({ w: Math.max(200, r.width), h: Math.max(200, r.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Tune forces so clusters separate cleanly and hubs anchor their members.
  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return
    fg.d3Force('charge').strength(-55)
    const link = fg.d3Force('link')
    if (link) link.distance((l) => (l.hub ? 34 : 60)).strength(0.7)
    fitPending.current = true // re-frame once this new layout settles
    fg.d3ReheatSimulation()
  }, [graph])

  // Stable data object identity per graph so the sim doesn't reset on hover.
  const data = useMemo(() => graph, [graph])

  const paintNode = (node, ctx, scale) => {
    if (node.kind === 'hub') {
      const label = `${labelMap[node.group] || node.group}`
      const fontSize = Math.max(11, 13 / Math.sqrt(scale))
      ctx.font = `600 ${fontSize}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = tokens.textPrimary
      ctx.fillText(label, node.x, node.y - 2)
      ctx.font = `500 ${fontSize * 0.8}px system-ui, sans-serif`
      ctx.fillStyle = tokens.textMuted
      ctx.fillText(`${node.count}`, node.x, node.y + fontSize)
      return
    }
    const r = nodeRadius(node.strength)
    const selected = node.id === selectedId
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
    ctx.fillStyle = colorMap[node.group] || tokens.neutral
    ctx.fill()
    // 2px surface ring keeps overlapping marks legible; selection thickens it.
    ctx.lineWidth = selected ? 2.5 : 1.2
    ctx.strokeStyle = selected ? tokens.textPrimary : tokens.surface
    ctx.stroke()
  }

  const paintPointerArea = (node, color, ctx) => {
    const r = node.kind === 'hub' ? 16 : nodeRadius(node.strength) + 3
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
    ctx.fill()
  }

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0 }}>
      <ForceGraph2D
        ref={fgRef}
        width={size.w}
        height={size.h}
        graphData={data}
        backgroundColor={tokens.surface}
        nodeRelSize={4}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={paintPointerArea}
        nodeLabel={(n) => (n.kind === 'hub' ? '' : `${n.name} · strength ${n.strength}`)}
        linkColor={() => tokens.link}
        linkWidth={1}
        cooldownTicks={120}
        d3VelocityDecay={0.32}
        onEngineStop={() => {
          // Auto-fit only the first settle after a data/layout change, so a user's
          // own pan/zoom isn't yanked back on every idle tick.
          if (fitPending.current) {
            fitPending.current = false
            fgRef.current?.zoomToFit(400, 50)
          }
        }}
        onNodeClick={(n) => n.kind === 'contact' && onSelect(n.id)}
        onBackgroundClick={() => onSelect(null)}
      />
    </div>
  )
}

// graph.js — turn the flat contact list into a {nodes, links} graph for
// react-force-graph-2d, clustered around one hub node per group.
//
// The hub-per-group trick IS the clustering mechanism: every contact links to
// its group's hub, so the force simulation naturally pulls same-group contacts
// together. Switching the `groupBy` key (industry vs region) re-projects the
// exact same people — this is the "one graph, many lenses" contract.
//
// EXTENSION POINT (Phase 2, social/mutual clustering): add contact<->contact
// links here (shared employer, shared tag, mutual connection) alongside the hub
// links. The renderer already draws whatever links this returns, so social
// affinity is purely additive — no view changes required.

export function buildGroupedGraph(contacts, groupBy) {
  const groups = new Map() // key -> count
  const nodes = []
  const links = []

  for (const c of contacts) {
    const g = c[groupBy] || 'other'
    groups.set(g, (groups.get(g) || 0) + 1)
    nodes.push({
      id: c.id,
      kind: 'contact',
      group: g,
      name: c.name,
      strength: c.strength,
      contact: c,
    })
    links.push({ source: c.id, target: `hub:${g}`, hub: true })
  }

  for (const [key, count] of groups) {
    nodes.push({ id: `hub:${key}`, kind: 'hub', group: key, count })
  }

  return { nodes, links, groups }
}

// Node radius from relationship strength (1..5) -> 4..9px. Hubs are invisible
// anchors (drawn as text labels instead of dots).
export function nodeRadius(strength) {
  return 4 + (Math.max(1, Math.min(5, strength)) - 1) * 1.25
}

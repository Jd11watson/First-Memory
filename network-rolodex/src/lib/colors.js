// colors.js — map grouping entities (industry / region) to fixed palette slots.
//
// Color follows the ENTITY, never its rank: each industry/region owns a fixed
// categorical slot, so filtering the view (which changes how many groups are on
// screen) never repaints the survivors. "Other" is always the neutral gray, not
// a categorical hue.

import { INDUSTRIES, REGIONS } from './inference.js'
import { tokens } from '../theme.js'

export function industryColorMap(mode) {
  const t = tokens(mode)
  const map = {}
  for (const ind of INDUSTRIES) {
    map[ind.key] = ind.slot >= 0 ? t.categorical[ind.slot] : t.neutral
  }
  return map
}

export function regionColorMap(mode) {
  const t = tokens(mode)
  const map = {}
  let slot = 0
  for (const r of REGIONS) {
    map[r.key] = r.key === 'other' ? t.neutral : t.categorical[slot++ % t.categorical.length]
  }
  return map
}

export function colorMapFor(groupBy, mode) {
  return groupBy === 'region' ? regionColorMap(mode) : industryColorMap(mode)
}

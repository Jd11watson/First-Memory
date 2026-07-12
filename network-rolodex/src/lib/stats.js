// stats.js — pure functions that turn the contact list into the "so what" each
// view's insight panel shows. No React, no side effects.

import { INDUSTRY_LABEL, REGION_LABEL } from './inference.js'

function countBy(items, keyFn) {
  const m = new Map()
  for (const it of items) {
    const k = keyFn(it)
    if (k == null || k === '') continue
    m.set(k, (m.get(k) || 0) + 1)
  }
  return m
}

function toSortedList(map, labelFn) {
  const total = [...map.values()].reduce((a, b) => a + b, 0) || 1
  return [...map.entries()]
    .map(([key, count]) => ({ key, label: labelFn(key), count, pct: count / total }))
    .sort((a, b) => b.count - a.count)
}

export function industryBreakdown(contacts) {
  return toSortedList(countBy(contacts, (c) => c.industry), (k) => INDUSTRY_LABEL[k] || k)
}

export function regionBreakdown(contacts) {
  return toSortedList(countBy(contacts, (c) => c.region), (k) => REGION_LABEL[k] || k)
}

export function cityBreakdown(contacts) {
  return toSortedList(countBy(contacts, (c) => c.city), (k) => k)
}

// Herfindahl-based concentration -> 0 (perfectly even) .. 1 (all in one bucket).
export function concentration(list) {
  const total = list.reduce((a, b) => a + b.count, 0) || 1
  const hhi = list.reduce((a, b) => a + (b.count / total) ** 2, 0)
  return hhi
}

// Simple diversity readout: distinct buckets present, and a 0..100 evenness score
// (100 = perfectly spread across all buckets that appear).
export function diversity(list) {
  const distinct = list.length
  if (distinct <= 1) return { distinct, evenness: 0 }
  const hhi = concentration(list)
  const evenness = Math.round(((1 - hhi) / (1 - 1 / distinct)) * 100)
  return { distinct, evenness: Math.max(0, Math.min(100, evenness)) }
}

export function totals(contacts) {
  return {
    count: contacts.length,
    manual: contacts.filter((c) => c.source === 'manual').length,
    imported: contacts.filter((c) => c.source === 'linkedin-csv').length,
    strongTies: contacts.filter((c) => c.strength >= 4).length,
  }
}

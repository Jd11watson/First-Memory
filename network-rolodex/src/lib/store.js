// store.js — the single shared contact store. Every view reads from here; a view
// only changes how contacts are grouped/colored/laid out, never the data.
//
// Persistence is localStorage (no backend in v1). The Contact shape carries a
// few fields that v1 does not surface but Phase 2 will (latLng, lastContacted) —
// they travel with the record so adding the real map / CRM is additive.

import { useCallback, useEffect, useState } from 'react'
import { inferIndustry, inferRegion } from './inference.js'
import { SAMPLE_CONTACTS } from '../data/sampleContacts.js'

const STORAGE_KEY = 'network-rolodex.contacts.v1'

let _seq = 1
const nextId = () => `c${Date.now().toString(36)}${(_seq++).toString(36)}`

// Fill derived fields. Derivation NEVER overrides a user-corrected value:
// if industryOverride/regionOverride is set, the stored value is kept as-is.
export function normalizeContact(partial) {
  const c = {
    id: partial.id || nextId(),
    name: (partial.name || '').trim(),
    company: partial.company || '',
    title: partial.title || '',
    city: partial.city || '',
    country: partial.country || '',
    latLng: partial.latLng ?? null, // reserved for Phase 2 real map
    strength: clampStrength(partial.strength),
    tags: Array.isArray(partial.tags) ? partial.tags.filter(Boolean) : [],
    notes: partial.notes || '',
    source: partial.source || 'manual',
    lastContacted: partial.lastContacted ?? null, // reserved for Phase 2 CRM
    connectedOn: partial.connectedOn || '',
    industryOverride: !!partial.industryOverride,
    regionOverride: !!partial.regionOverride,
  }
  c.industry = c.industryOverride && partial.industry ? partial.industry : inferIndustry(c)
  c.region = c.regionOverride && partial.region ? partial.region : inferRegion(c)
  return c
}

function clampStrength(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 3
  return Math.min(5, Math.max(1, Math.round(n)))
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return SAMPLE_CONTACTS.map(normalizeContact)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return SAMPLE_CONTACTS.map(normalizeContact)
    return parsed.map(normalizeContact)
  } catch {
    return SAMPLE_CONTACTS.map(normalizeContact)
  }
}

export function useContacts() {
  const [contacts, setContacts] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
    } catch {
      /* quota / private mode — ignore, in-memory state still works */
    }
  }, [contacts])

  const addContact = useCallback((partial) => {
    const c = normalizeContact({ ...partial, source: partial.source || 'manual' })
    setContacts((prev) => [...prev, c])
    return c
  }, [])

  const importMany = useCallback((partials) => {
    const normalized = partials.map((p) => normalizeContact(p))
    setContacts((prev) => [...prev, ...normalized])
    return normalized.length
  }, [])

  // Patch a contact. When the user edits industry/region directly we flip the
  // corresponding override flag so re-inference can't stomp the correction.
  const updateContact = useCallback((id, patch) => {
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const merged = { ...c, ...patch }
        if ('industry' in patch && patch.industry !== c.industry) merged.industryOverride = true
        if ('region' in patch && patch.region !== c.region) merged.regionOverride = true
        return normalizeContact(merged)
      }),
    )
  }, [])

  const removeContact = useCallback((id) => {
    setContacts((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const resetToSample = useCallback(() => {
    setContacts(SAMPLE_CONTACTS.map(normalizeContact))
  }, [])

  return { contacts, addContact, importMany, updateContact, removeContact, resetToSample }
}

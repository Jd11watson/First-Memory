import { useEffect, useMemo, useState } from 'react'
import { useContacts } from './lib/store.js'
import { tokens as tokensFor } from './theme.js'
import { INDUSTRIES, REGIONS } from './lib/inference.js'
import Filters from './components/Filters.jsx'
import IndustryView from './components/IndustryView.jsx'
import GeographicView from './components/GeographicView.jsx'
import RolodexView from './components/RolodexView.jsx'
import DetailPanel from './components/DetailPanel.jsx'
import AddContactModal from './components/AddContactModal.jsx'
import ImportModal from './components/ImportModal.jsx'

const VIEWS = [
  { key: 'industry', label: 'Industry' },
  { key: 'geographic', label: 'Geographic' },
  { key: 'rolodex', label: 'Rolodex' },
]

const EMPTY_FILTERS = { search: '', industry: '', region: '', city: '', tag: '', minStrength: 1 }

export default function App() {
  const { contacts, addContact, importMany, updateContact, removeContact, resetToSample } = useContacts()
  const [view, setView] = useState('industry')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [selectedId, setSelectedId] = useState(null)
  const [modal, setModal] = useState(null) // 'add' | 'import' | null

  const [mode, setMode] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  )
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])
  const tokens = useMemo(() => tokensFor(mode), [mode])

  // Stable filter option lists (derived from ALL contacts, in taxonomy order).
  const options = useMemo(() => {
    const present = (field, order) => {
      const set = new Set(contacts.map((c) => c[field]))
      return order.filter((o) => set.has(o))
    }
    const cities = [...new Set(contacts.map((c) => c.city).filter(Boolean))].sort()
    const tags = [...new Set(contacts.flatMap((c) => c.tags))].sort()
    return {
      industries: present('industry', INDUSTRIES.map((i) => i.key)),
      regions: present('region', REGIONS.map((r) => r.key)),
      cities,
      tags,
    }
  }, [contacts])

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return contacts.filter((c) => {
      if (q && !`${c.name} ${c.company} ${c.title}`.toLowerCase().includes(q)) return false
      if (filters.industry && c.industry !== filters.industry) return false
      if (filters.region && c.region !== filters.region) return false
      if (filters.city && c.city !== filters.city) return false
      if (filters.tag && !c.tags.includes(filters.tag)) return false
      if (c.strength < filters.minStrength) return false
      return true
    })
  }, [contacts, filters])

  const selected = useMemo(() => contacts.find((c) => c.id === selectedId) || null, [contacts, selectedId])

  const viewProps = { contacts: filtered, mode, tokens, selectedId, onSelect: setSelectedId }

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <h1>Network Rolodex</h1>
          <span className="sub">the shape of your network</span>
        </div>
        <div className="switcher">
          {VIEWS.map((v) => (
            <button key={v.key} className={view === v.key ? 'active' : ''} onClick={() => setView(v.key)}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="spacer" />
        <button className="ghost-btn" onClick={() => setModal('import')}>Import CSV</button>
        <button className="primary-btn" onClick={() => setModal('add')}>+ Add</button>
        <button
          className="icon-btn"
          onClick={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
          title="Toggle theme"
        >
          {mode === 'dark' ? '☀' : '☾'}
        </button>
      </div>

      <Filters
        filters={filters}
        setFilters={setFilters}
        options={options}
        resultCount={filtered.length}
        totalCount={contacts.length}
      />

      <div className="body">
        <div className="main">
          <div className="stage">
            {view === 'industry' && <IndustryView {...viewProps} />}
            {view === 'geographic' && <GeographicView {...viewProps} />}
            {view === 'rolodex' && <RolodexView {...viewProps} />}
            {selected && (
              <DetailPanel
                contact={selected}
                onUpdate={updateContact}
                onDelete={removeContact}
                onClose={() => setSelectedId(null)}
              />
            )}
          </div>
        </div>
      </div>

      {modal === 'add' && <AddContactModal onAdd={addContact} onClose={() => setModal(null)} />}
      {modal === 'import' && <ImportModal onImport={importMany} onClose={() => setModal(null)} />}
    </div>
  )
}

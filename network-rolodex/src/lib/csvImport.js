// csvImport.js — parse a LinkedIn "Connections.csv" export into raw contact rows.
//
// LinkedIn's export has columns: First Name, Last Name, URL, Email Address,
// Company, Position, Connected On. It also prefixes the file with a few "Notes:"
// lines before the real header row, so we scan for the header rather than
// assuming row 0. City/country are NOT in the export — those stay blank and can
// be filled manually or via a future enrichment step.
//
// Returns partial contacts: { name, company, title, connectedOn, source }.
// Industry/region inference and id assignment happen in the store on ingest.

// Minimal RFC-4180-ish line parser (handles quoted fields with commas/quotes).
function parseLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else { inQuotes = false }
      } else cur += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

function findHeaderIndex(rows) {
  for (let i = 0; i < rows.length; i++) {
    const lower = rows[i].map((c) => c.toLowerCase())
    if (lower.includes('first name') && lower.includes('last name')) return i
  }
  return -1
}

export function parseLinkedInCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  const rows = lines.map(parseLine)
  const headerIdx = findHeaderIndex(rows)
  if (headerIdx === -1) {
    throw new Error('Could not find a LinkedIn header row (expected "First Name", "Last Name" columns).')
  }
  const header = rows[headerIdx].map((c) => c.toLowerCase())
  const col = (name) => header.indexOf(name)
  const iFirst = col('first name')
  const iLast = col('last name')
  const iCompany = col('company')
  const iPosition = col('position')
  const iConnected = col('connected on')

  const contacts = []
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r]
    const first = row[iFirst] || ''
    const last = row[iLast] || ''
    const name = `${first} ${last}`.trim()
    if (!name) continue
    contacts.push({
      name,
      company: iCompany >= 0 ? row[iCompany] || '' : '',
      title: iPosition >= 0 ? row[iPosition] || '' : '',
      connectedOn: iConnected >= 0 ? row[iConnected] || '' : '',
      source: 'linkedin-csv',
    })
  }
  return contacts
}

import * as XLSX from 'xlsx'

const PLAYER_NAMES = ['Lukas', 'Davis', 'Reggie', 'Jaivir', 'Braeden', 'Daniel', 'Will', 'Raines', 'Henry']

function norm(s) {
  return String(s ?? '').toLowerCase().replace(/[\s%\-_/]/g, '')
}

function findCol(headers, ...keys) {
  const normalized = headers.map(norm)
  for (const key of keys) {
    const idx = normalized.indexOf(norm(key))
    if (idx !== -1) return idx
  }
  return -1
}

function toNum(v) {
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

function toInt(v) {
  const n = parseInt(v)
  return isNaN(n) ? null : n
}

// Percentages in Excel are stored as decimals (0.5 = 50%) when the cell is
// formatted as %. We normalise everything to 0–100 for display.
function toPct(v) {
  const n = parseFloat(v)
  if (isNaN(n)) return null
  // If the value is clearly a decimal fraction (≤ 1.5) treat it as 0–1 scale
  return n <= 1.5 ? Math.round(n * 100) : Math.round(n)
}

function parseSummarySheet(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  let headerRowIdx = -1
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i].map(norm)
    if (r.includes(norm('Rounds')) && (r.includes(norm('AVG')) || r.includes(norm('SG Driving')))) {
      headerRowIdx = i
      break
    }
  }
  if (headerRowIdx === -1) return []

  const headers = rows[headerRowIdx]
  const c = {
    rounds:      findCol(headers, 'Rounds'),
    avg:         findCol(headers, 'AVG'),
    tAvg:        findCol(headers, 'T- AVG', 'T-AVG', 'TAVG', 'T AVG'),
    qAvg:        findCol(headers, 'Q- AVG', 'Q-AVG', 'QAVG', 'Q AVG'),
    sgDriving:   findCol(headers, 'SG Driving', 'SGDriving'),
    sgApproach:  findCol(headers, 'SG Approach', 'SGApproach'),
    sgShortGame: findCol(headers, 'SG Short Gam', 'SG Short Game', 'SGShortGame'),
    sgPutting:   findCol(headers, 'SG Putting', 'SGPutting'),
    fwPct:       findCol(headers, 'FW%', 'FW'),
    sgOtt:       findCol(headers, 'SG - OTT', 'SGOTT', 'SG OTT'),
    girPct:      findCol(headers, 'GIR%', 'GIR'),
    scrambling:  findCol(headers, 'Scrambling%', 'Scrambling'),
    sandSave:    findCol(headers, 'Sandsave%', 'Sandsave', 'Sand Save'),
    threePutt:   findCol(headers, '3-Putt%', '3Putt', '3-Putt'),
    puttUnder5:  findCol(headers, 'Putting under 5', 'PuttingUnder5', 'Puttingunder5'),
    putt5to10:   findCol(headers, 'Putting 5-10ft', 'Putting5-10', 'Putting510'),
    birdieAvg:   findCol(headers, 'Birdie Average', 'BirdieAverage'),
    bogeyAvg:    findCol(headers, 'Bogey Average', 'BogeyAverage'),
    par3:        findCol(headers, 'Par 3', 'Par3'),
    par4:        findCol(headers, 'Par 4', 'Par4'),
    par5:        findCol(headers, 'Par 5', 'Par5'),
    pctRounds:   findCol(headers, '% of Total Rounds', 'TotalRounds'),
  }

  const players = []
  const seen = new Set()
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    const name = String(row[0] ?? '').trim()
    if (!name) continue
    const isPlayer = PLAYER_NAMES.some(p => p.toLowerCase() === name.toLowerCase())
      || (isNaN(Number(name)) && name.length > 1 && name !== 'AVG' && name !== 'STD DEV')
    if (!isPlayer) continue
    // Skip duplicates — the Summary sheet has an "All Data" section and a
    // "Spring" section; only take the first (All Data) occurrence per player
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    players.push({
      name: PLAYER_NAMES.find(p => p.toLowerCase() === name.toLowerCase()) ?? name,
      rounds:      toInt(row[c.rounds]),
      avg:         toNum(row[c.avg]),
      tAvg:        toNum(row[c.tAvg]),
      qAvg:        toNum(row[c.qAvg]),
      sgDriving:   toNum(row[c.sgDriving]),
      sgApproach:  toNum(row[c.sgApproach]),
      sgShortGame: toNum(row[c.sgShortGame]),
      sgPutting:   toNum(row[c.sgPutting]),
      fwPct:       toPct(row[c.fwPct]),
      sgOtt:       toNum(row[c.sgOtt]),
      girPct:      toPct(row[c.girPct]),
      scrambling:  toPct(row[c.scrambling]),
      sandSave:    toPct(row[c.sandSave]),
      threePutt:   toPct(row[c.threePutt]),
      puttUnder5:  toPct(row[c.puttUnder5]),
      putt5to10:   toPct(row[c.putt5to10]),
      birdieAvg:   toNum(row[c.birdieAvg]),
      bogeyAvg:    toNum(row[c.bogeyAvg]),
      par3:        toNum(row[c.par3]),
      par4:        toNum(row[c.par4]),
      par5:        toNum(row[c.par5]),
      pctRounds:   toNum(row[c.pctRounds]),
    })
  }
  return players
}

function parsePlayerSheet(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  const summary = { qAvg: null, tAvg: null, avg: null, parOrBetter: null, scoreStdDev: null }
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    const r = rows[i]
    for (let j = 0; j < r.length; j++) {
      const h = norm(String(r[j] ?? ''))
      if (h === norm('Q- AVG') || h === norm('Q-AVG') || h === norm('QAVG') || h === norm('Q AVG')) summary.qAvg = toNum(r[j + 1])
      if (h === norm('T- AVG') || h === norm('T-AVG') || h === norm('TAVG') || h === norm('T AVG')) summary.tAvg = toNum(r[j + 1])
      if (h === norm('AVG') && summary.avg === null) summary.avg = toNum(r[j + 1])
      if (h === norm('Par or Better') || h === norm('ParorBetter')) summary.parOrBetter = toPct(r[j + 1])
      if (h === norm('Score STD DEV') || h === norm('ScoreSTDDEV')) summary.scoreStdDev = toNum(r[j + 1])
    }
  }

  let headerRowIdx = -1
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const r = rows[i].map(norm)
    if (r.includes(norm('Date')) && r.includes(norm('Course'))) {
      headerRowIdx = i
      break
    }
  }
  if (headerRowIdx === -1) return { summary, roundLog: [] }

  const headers = rows[headerRowIdx]
  const c = {
    date:        findCol(headers, 'Date'),
    course:      findCol(headers, 'Course'),
    type:        findCol(headers, 'Type'),
    par:         findCol(headers, 'Par'),
    score:       findCol(headers, 'Score'),
    sgDriving:   findCol(headers, 'SG Driving', 'SGDriving'),
    sgApproach:  findCol(headers, 'SG Approach', 'SGApproach'),
    sgShortGame: findCol(headers, 'SG Short Gam', 'SG Short Game'),
    sgPutting:   findCol(headers, 'SG Putting', 'SGPutting'),
    fwPct:       findCol(headers, 'FW%', 'FW'),
    girPct:      findCol(headers, 'GIR%', 'GIR'),
    scrambling:  findCol(headers, 'Scrambling%', 'Scrambling'),
    sandSave:    findCol(headers, 'Sandsave%', 'Sandsave'),
    threePutt:   findCol(headers, '3-Putt%', '3Putt'),
    puttUnder5:  findCol(headers, 'Putting under 5', 'PuttingUnder5'),
    putt5to10:   findCol(headers, 'Putting 5-10ft', 'Putting510'),
    birdieAvg:   findCol(headers, 'Birdie Average', 'BirdieAverage'),
    bogeyAvg:    findCol(headers, 'Bogey Average', 'BogeyAverage'),
    par3:        findCol(headers, 'Par 3', 'Par3'),
    par4:        findCol(headers, 'Par 4', 'Par4'),
    par5:        findCol(headers, 'Par 5', 'Par5'),
  }

  const roundLog = []
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    const dateRaw = row[c.date]
    if (!dateRaw) continue

    let date = null
    if (typeof dateRaw === 'number') {
      try {
        const d = XLSX.SSF.parse_date_code(dateRaw)
        if (d) date = `${d.m}/${d.d}/${String(d.y).slice(2)}`
      } catch {
        date = String(dateRaw)
      }
    } else {
      date = String(dateRaw).trim()
    }
    if (!date) continue

    const type = String(row[c.type] ?? '').trim().toUpperCase()
    if (type !== 'Q' && type !== 'T') continue

    roundLog.push({
      date,
      course:      String(row[c.course] ?? '').trim(),
      type,
      par:         toInt(row[c.par]),
      score:       toInt(row[c.score]),
      sgDriving:   toNum(row[c.sgDriving]),
      sgApproach:  toNum(row[c.sgApproach]),
      sgShortGame: toNum(row[c.sgShortGame]),
      sgPutting:   toNum(row[c.sgPutting]),
      fwPct:       toPct(row[c.fwPct]),
      girPct:      toPct(row[c.girPct]),
      scrambling:  toPct(row[c.scrambling]),
      sandSave:    toPct(row[c.sandSave]),
      threePutt:   toPct(row[c.threePutt]),
      puttUnder5:  toPct(row[c.puttUnder5]),
      putt5to10:   toPct(row[c.putt5to10]),
      birdieAvg:   toNum(row[c.birdieAvg]),
      bogeyAvg:    toNum(row[c.bogeyAvg]),
      par3:        toNum(row[c.par3]),
      par4:        toNum(row[c.par4]),
      par5:        toNum(row[c.par5]),
    })
  }

  return { summary, roundLog }
}

export function parseWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const wb = XLSX.read(data, { type: 'array', cellDates: false })

        const sheetNames = wb.SheetNames
        const summarySheetName = sheetNames.find(n => n.toLowerCase() === 'summary') ?? sheetNames[0]
        const teamPlayers = parseSummarySheet(wb.Sheets[summarySheetName])

        // Parse individual player sheets — match by name (case-insensitive)
        const playerSheetData = {}
        for (const sheetName of sheetNames) {
          const match = PLAYER_NAMES.find(n => n.toLowerCase() === sheetName.toLowerCase())
          if (match && wb.Sheets[sheetName]) {
            playerSheetData[match] = parsePlayerSheet(wb.Sheets[sheetName])
          }
        }

        // Build final player list — rounds (count) stays as number,
        // roundLog (array) comes from individual sheets
        const players = teamPlayers.map(p => {
          const pd = playerSheetData[p.name]
          return {
            ...p,
            // rounds stays as the number from the summary sheet
            roundLog: pd?.roundLog ?? [],
            // Override qAvg/tAvg from individual sheet if more precise
            qAvg: pd?.summary?.qAvg ?? p.qAvg,
            tAvg: pd?.summary?.tAvg ?? p.tAvg,
            parOrBetter: pd?.summary?.parOrBetter ?? null,
            scoreStdDev: pd?.summary?.scoreStdDev ?? null,
          }
        })

        // Add players found only in individual sheets (not in summary)
        for (const name of PLAYER_NAMES) {
          if (playerSheetData[name] && !players.find(p => p.name === name)) {
            const pd = playerSheetData[name]
            players.push({
              name,
              rounds: pd.roundLog.length,
              roundLog: pd.roundLog,
              qAvg: pd.summary?.qAvg ?? null,
              tAvg: pd.summary?.tAvg ?? null,
              avg: pd.summary?.avg ?? null,
              parOrBetter: pd.summary?.parOrBetter ?? null,
              scoreStdDev: pd.summary?.scoreStdDev ?? null,
              sgDriving: null, sgApproach: null, sgShortGame: null, sgPutting: null,
              fwPct: null, girPct: null, scrambling: null, sandSave: null,
              threePutt: null, puttUnder5: null, putt5to10: null,
              birdieAvg: null, bogeyAvg: null, par3: null, par4: null, par5: null,
            })
          }
        }

        if (!players.length) {
          throw new Error('No player data found. Check that your sheet names match player names (Lukas, Davis, Reggie…) and the Summary tab is present.')
        }

        resolve(players)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

import * as XLSX from 'xlsx'

const PLAYER_NAMES = ['Lukas', 'Davis', 'Reggie', 'Jaivir', 'Braeden', 'Daniel', 'Will', 'Raines', 'Henry']

// Normalize a header string for fuzzy matching
function norm(s) {
  return String(s ?? '').toLowerCase().replace(/[\s%\-_/]/g, '')
}

// Find the column index in a header row matching a set of possible keys
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

function parseSummarySheet(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  // Find the header row — look for a row containing "Rounds" and "AVG"
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
    name:          0, // player name is always col A
    rounds:        findCol(headers, 'Rounds'),
    avg:           findCol(headers, 'AVG'),
    tAvg:          findCol(headers, 'T- AVG', 'T-AVG', 'TAVG'),
    qAvg:          findCol(headers, 'Q- AVG', 'Q-AVG', 'QAVG'),
    sgDriving:     findCol(headers, 'SG Driving', 'SGDriving'),
    sgApproach:    findCol(headers, 'SG Approach', 'SGApproach'),
    sgShortGame:   findCol(headers, 'SG Short Gam', 'SG Short Game', 'SGShortGame'),
    sgPutting:     findCol(headers, 'SG Putting', 'SGPutting'),
    fwPct:         findCol(headers, 'FW%', 'FW'),
    sgOtt:         findCol(headers, 'SG - OTT', 'SGOTT', 'SG OTT'),
    girPct:        findCol(headers, 'GIR%', 'GIR'),
    scrambling:    findCol(headers, 'Scrambling%', 'Scrambling'),
    sandSave:      findCol(headers, 'Sandsave%', 'Sandsave', 'Sand Save'),
    threePutt:     findCol(headers, '3-Putt%', '3Putt', '3-Putt'),
    puttUnder5:    findCol(headers, 'Putting under 5', 'PuttingUnder5', 'Puttingunder5'),
    putt5to10:     findCol(headers, 'Putting 5-10ft', 'Putting5-10', 'Putting510'),
    birdieAvg:     findCol(headers, 'Birdie Average', 'BirdieAverage'),
    bogeyAvg:      findCol(headers, 'Bogey Average', 'BogeyAverage'),
    par3:          findCol(headers, 'Par 3', 'Par3'),
    par4:          findCol(headers, 'Par 4', 'Par4'),
    par5:          findCol(headers, 'Par 5', 'Par5'),
    pctRounds:     findCol(headers, '% of Total Rounds', 'TotalRounds'),
  }

  const players = []
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    const name = String(row[0] ?? '').trim()
    if (!name || !PLAYER_NAMES.some(p => p.toLowerCase() === name.toLowerCase())) continue

    players.push({
      name,
      rounds:      toInt(row[c.rounds]),
      avg:         toNum(row[c.avg]),
      tAvg:        toNum(row[c.tAvg]),
      qAvg:        toNum(row[c.qAvg]),
      sgDriving:   toNum(row[c.sgDriving]),
      sgApproach:  toNum(row[c.sgApproach]),
      sgShortGame: toNum(row[c.sgShortGame]),
      sgPutting:   toNum(row[c.sgPutting]),
      fwPct:       toNum(row[c.fwPct]),
      sgOtt:       toNum(row[c.sgOtt]),
      girPct:      toNum(row[c.girPct]),
      scrambling:  toNum(row[c.scrambling]),
      sandSave:    toNum(row[c.sandSave]),
      threePutt:   toNum(row[c.threePutt]),
      puttUnder5:  toNum(row[c.puttUnder5]),
      putt5to10:   toNum(row[c.putt5to10]),
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

function parsePlayerSheet(ws, playerName) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  // Extract summary stats from the top block (rows 0-7 approx)
  const summary = { qAvg: null, tAvg: null, avg: null, rounds: null, parOrBetter: null, scoreStdDev: null }
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    const r = rows[i]
    for (let j = 0; j < r.length; j++) {
      const h = norm(String(r[j] ?? ''))
      if (h === norm('Q- AVG') || h === norm('Q-AVG') || h === norm('QAVG')) summary.qAvg = toNum(r[j + 1])
      if (h === norm('T- AVG') || h === norm('T-AVG') || h === norm('TAVG')) summary.tAvg = toNum(r[j + 1])
      if (h === norm('AVG') && summary.avg === null) summary.avg = toNum(r[j + 1])
      if (h === norm('Rounds')) summary.rounds = toInt(r[j + 1])
      if (h === norm('Par or Better') || h === norm('ParorBetter')) summary.parOrBetter = toNum(r[j + 1])
      if (h === norm('Score STD DEV') || h === norm('ScoreSTDDEV')) summary.scoreStdDev = toNum(r[j + 1])
    }
  }

  // Find round data header row — look for "Date" and "Course"
  let headerRowIdx = -1
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const r = rows[i].map(norm)
    if (r.includes(norm('Date')) && r.includes(norm('Course'))) {
      headerRowIdx = i
      break
    }
  }
  if (headerRowIdx === -1) return { summary, rounds: [] }

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

  const rounds = []
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    const dateRaw = row[c.date]
    if (!dateRaw) continue

    // Convert Excel date serial or string
    let date = null
    if (typeof dateRaw === 'number') {
      date = XLSX.SSF.parse_date_code(dateRaw)
      if (date) date = `${date.m}/${date.d}/${String(date.y).slice(2)}`
    } else {
      date = String(dateRaw).trim()
    }
    if (!date) continue

    const type = String(row[c.type] ?? '').trim().toUpperCase()
    if (type !== 'Q' && type !== 'T') continue // skip non-round rows

    rounds.push({
      date,
      course:      String(row[c.course] ?? '').trim(),
      type,        // 'Q' = Qualifying, 'T' = Tournament
      par:         toInt(row[c.par]),
      score:       toInt(row[c.score]),
      sgDriving:   toNum(row[c.sgDriving]),
      sgApproach:  toNum(row[c.sgApproach]),
      sgShortGame: toNum(row[c.sgShortGame]),
      sgPutting:   toNum(row[c.sgPutting]),
      fwPct:       toNum(row[c.fwPct]),
      girPct:      toNum(row[c.girPct]),
      scrambling:  toNum(row[c.scrambling]),
      sandSave:    toNum(row[c.sandSave]),
      threePutt:   toNum(row[c.threePutt]),
      puttUnder5:  toNum(row[c.puttUnder5]),
      putt5to10:   toNum(row[c.putt5to10]),
      birdieAvg:   toNum(row[c.birdieAvg]),
      bogeyAvg:    toNum(row[c.bogeyAvg]),
      par3:        toNum(row[c.par3]),
      par4:        toNum(row[c.par4]),
      par5:        toNum(row[c.par5]),
    })
  }

  return { summary, rounds }
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

        const playerData = {}
        for (const name of PLAYER_NAMES) {
          const sheet = wb.Sheets[name]
          if (sheet) {
            playerData[name] = parsePlayerSheet(sheet, name)
          }
        }

        // Merge: enrich team summary entries with round data
        const players = teamPlayers.map(p => ({
          ...p,
          ...playerData[p.name],
        }))

        // Also add players found in individual sheets but not in summary
        for (const name of PLAYER_NAMES) {
          if (playerData[name] && !players.find(p => p.name === name)) {
            players.push({ name, ...playerData[name] })
          }
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

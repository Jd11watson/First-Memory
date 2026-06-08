import { useState } from 'react'

const FIELDS = [
  { section: 'Round Info' },
  { key: 'date',        label: 'Date',            type: 'text',   placeholder: 'e.g. 4/18/25',  required: true },
  { key: 'course',      label: 'Course',          type: 'text',   placeholder: 'Course name',    required: true },
  { key: 'type',        label: 'Type',            type: 'select', options: ['Q', 'T'],           required: true },
  { key: 'par',         label: 'Course Par',      type: 'number', placeholder: '72',             required: true },
  { key: 'score',       label: 'Score',           type: 'number', placeholder: '72',             required: true },

  { section: 'Strokes Gained' },
  { key: 'sgDriving',   label: 'SG: Driving',     type: 'decimal', placeholder: '+0.00' },
  { key: 'sgApproach',  label: 'SG: Approach',    type: 'decimal', placeholder: '+0.00' },
  { key: 'sgShortGame', label: 'SG: Short Game',  type: 'decimal', placeholder: '+0.00' },
  { key: 'sgPutting',   label: 'SG: Putting',     type: 'decimal', placeholder: '+0.00' },

  { section: 'Ball Striking' },
  { key: 'fwPct',       label: 'Fairways %',      type: 'pct',    placeholder: '60' },
  { key: 'girPct',      label: 'GIR %',           type: 'pct',    placeholder: '67' },
  { key: 'scrambling',  label: 'Scrambling %',    type: 'pct',    placeholder: '60' },
  { key: 'sandSave',    label: 'Sand Save %',     type: 'pct',    placeholder: '50' },

  { section: 'Putting' },
  { key: 'threePutt',   label: '3-Putt %',        type: 'pct',    placeholder: '5' },
  { key: 'puttUnder5',  label: 'Make % <5ft',     type: 'pct',    placeholder: '90' },
  { key: 'putt5to10',   label: 'Make % 5–10ft',   type: 'pct',    placeholder: '45' },

  { section: 'Scoring' },
  { key: 'birdieAvg',   label: 'Birdies',         type: 'decimal', placeholder: '3.5' },
  { key: 'bogeyAvg',    label: 'Bogeys',          type: 'decimal', placeholder: '3.0' },
  { key: 'par3',        label: 'Par 3 Avg',       type: 'decimal', placeholder: '3.10' },
  { key: 'par4',        label: 'Par 4 Avg',       type: 'decimal', placeholder: '4.05' },
  { key: 'par5',        label: 'Par 5 Avg',       type: 'decimal', placeholder: '4.75' },
]

function toNum(v, type) {
  if (v === '' || v === null || v === undefined) return null
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

export default function AddRoundModal({ playerName, onSave, onClose }) {
  const today = new Date()
  const defaultDate = `${today.getMonth() + 1}/${today.getDate()}/${String(today.getFullYear()).slice(2)}`

  const [form, setForm] = useState({ date: defaultDate, type: 'Q', par: '72', score: '' })
  const [errors, setErrors] = useState({})

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate() {
    const errs = {}
    if (!form.date?.trim()) errs.date = 'Required'
    if (!form.course?.trim()) errs.course = 'Required'
    if (!form.par) errs.par = 'Required'
    if (!form.score) errs.score = 'Required'
    return errs
  }

  function submit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const round = {
      date:        form.date.trim(),
      course:      form.course?.trim() ?? '',
      type:        form.type,
      par:         parseInt(form.par) || null,
      score:       parseInt(form.score) || null,
      sgDriving:   toNum(form.sgDriving),
      sgApproach:  toNum(form.sgApproach),
      sgShortGame: toNum(form.sgShortGame),
      sgPutting:   toNum(form.sgPutting),
      fwPct:       toNum(form.fwPct),
      girPct:      toNum(form.girPct),
      scrambling:  toNum(form.scrambling),
      sandSave:    toNum(form.sandSave),
      threePutt:   toNum(form.threePutt),
      puttUnder5:  toNum(form.puttUnder5),
      putt5to10:   toNum(form.putt5to10),
      birdieAvg:   toNum(form.birdieAvg),
      bogeyAvg:    toNum(form.bogeyAvg),
      par3:        toNum(form.par3),
      par4:        toNum(form.par4),
      par5:        toNum(form.par5),
    }
    onSave(round)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="font-display font-bold text-white text-lg">Add Round</h2>
            <p className="text-zinc-500 text-xs mt-0.5">{playerName}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all flex items-center justify-center text-lg leading-none">
            ×
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-6">
          {FIELDS.map((f, i) => {
            if (f.section) return (
              <p key={f.section} className="label-xs pt-2 border-t border-zinc-800 first:border-0 first:pt-0">
                {f.section}
              </p>
            )

            const isErr = !!errors[f.key]
            const inputBase = `w-full bg-zinc-800 border rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors ${
              isErr ? 'border-red-700 focus:ring-red-600' : 'border-zinc-700 focus:border-zinc-500 focus:ring-zinc-500'
            }`

            return (
              <div key={f.key} className="flex items-center gap-4">
                <label className="label-xs w-28 shrink-0 text-right">{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</label>
                <div className="flex-1">
                  {f.type === 'select' ? (
                    <div className="flex gap-2">
                      {f.options.map(opt => (
                        <button key={opt} type="button"
                          onClick={() => set(f.key, opt)}
                          className={`flex-1 py-2 rounded-lg text-sm font-display font-semibold border transition-all ${
                            form[f.key] === opt
                              ? 'bg-green-600 border-green-600 text-white'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                          }`}>
                          {opt === 'Q' ? 'Qualifying' : 'Tournament'}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type={f.type === 'decimal' || f.type === 'pct' ? 'number' : f.type}
                      step={f.type === 'decimal' ? '0.01' : f.type === 'pct' ? '1' : undefined}
                      placeholder={f.placeholder}
                      value={form[f.key] ?? ''}
                      onChange={e => set(f.key, e.target.value)}
                      className={inputBase}
                    />
                  )}
                  {isErr && <p className="text-red-500 text-[10px] mt-1">{errors[f.key]}</p>}
                </div>
              </div>
            )
          })}

          <div className="flex gap-3 pt-2 border-t border-zinc-800">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm font-display font-semibold transition-all">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-display font-semibold transition-colors">
              Save Round
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

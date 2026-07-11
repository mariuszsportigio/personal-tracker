import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { sanitizeImportedState, useAppDispatch, useAppState } from '../state/store'
import { CATEGORIES, SPLIT_META, expensesInMonth, formatZl, monthKey, netAmount } from '../lib/money'
import { dateStr } from '../lib/util'

const TICK = { fill: '#8B9490', fontSize: 11 }
const TOOLTIP_STYLE = {
  backgroundColor: '#1E2622',
  border: '1px solid #2A342F',
  borderRadius: 12,
  color: '#fff',
  fontSize: 12,
}

export function StatsScreen() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const [offset, setOffset] = useState(0)

  const monthDate = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + offset)
    return d
  }, [offset])
  const key = monthKey(monthDate)
  const label = monthDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })

  const monthExpenses = useMemo(() => expensesInMonth(state.expenses, key), [state.expenses, key])
  const net = monthExpenses.reduce((s, e) => s + netAmount(e), 0)
  const tripNet = monthExpenses.filter((e) => e.trip).reduce((s, e) => s + netAmount(e), 0)
  const subsMonthly = state.subscriptions.filter((s) => s.active).reduce((s, x) => s + x.amount, 0)

  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
  const isCurrentMonth = offset === 0
  const dayOfMonth = isCurrentMonth ? new Date().getDate() : daysInMonth
  const perDay = dayOfMonth > 0 ? net / dayOfMonth : 0

  const byCategory = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        name: c.name,
        emoji: c.emoji,
        value: Math.round(monthExpenses.filter((e) => e.category === c.id).reduce((s, e) => s + netAmount(e), 0) * 100) / 100,
        color: c.color,
      })).filter((c) => c.value > 0),
    [monthExpenses],
  )

  const daily = useMemo(() => {
    const map = new Map<number, number>()
    for (const e of monthExpenses) {
      const day = new Date(e.ts).getDate()
      map.set(day, (map.get(day) ?? 0) + netAmount(e))
    }
    return Array.from({ length: daysInMonth }, (_, i) => ({
      d: i + 1,
      zl: Math.round((map.get(i + 1) ?? 0) * 100) / 100,
    }))
  }, [monthExpenses, daysInMonth])

  const splitTotals = useMemo(() => {
    const totals = SPLIT_META.map((m) => ({
      ...m,
      value: monthExpenses.reduce((s, e) => s + (e.split?.[m.key] ?? 0), 0),
    }))
    const max = Math.max(1, ...totals.map((t) => t.value))
    return { totals, max }
  }, [monthExpenses])
  const splitSum = splitTotals.totals.reduce((s, t) => s + t.value, 0)

  return (
    <div className="px-5 pt-6 pb-32">
      <header className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Dowody, nie opinie</p>
        <h1 className="text-2xl font-extrabold">Staty</h1>
      </header>

      <div className="flex items-center justify-between mb-4">
        <button
          aria-label="poprzedni miesiąc"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-line text-muted"
          onClick={() => setOffset((o) => o - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <p className="font-bold first-letter:uppercase">{label}</p>
        <button
          aria-label="następny miesiąc"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-line text-muted disabled:opacity-30"
          disabled={offset >= 0}
          onClick={() => setOffset((o) => o + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Tile value={formatZl(net)} label="wydane netto" accent="#F5A524" />
        <Tile value={formatZl(perDay)} label={isCurrentMonth ? 'średnio / dzień (dotąd)' : 'średnio / dzień'} />
        <Tile value={`🧳 ${formatZl(tripNet)}`} label="wyjazdy" />
        <Tile value={formatZl(subsMonthly)} label="subskrypcje / mies." accent="#F472B6" />
      </div>

      {byCategory.length > 0 && (
        <Section title="Kategorie">
          <div className="flex items-center gap-2">
            <ResponsiveContainer width="45%" height={150}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} strokeWidth={0} isAnimationActive={false}>
                  {byCategory.map((c) => (
                    <Cell key={c.name} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [formatZl(v), '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 flex flex-col gap-1.5">
              {byCategory.map((c) => (
                <div key={c.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                  <span className="flex-1 text-muted">{c.name}</span>
                  <span className="font-bold tabular-nums">{formatZl(c.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      <Section title="Dzień po dniu">
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={daily} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
            <CartesianGrid stroke="#232B27" vertical={false} />
            <XAxis dataKey="d" tick={TICK} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={TICK} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [formatZl(v), 'wydane']} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="zl" fill="#F5A524" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {splitSum > 0 && (
        <Section title="Zakupy — na co realnie idzie">
          <div className="flex flex-col gap-2.5">
            {splitTotals.totals.map((t) => (
              <div key={t.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{t.name}</span>
                  <span className="font-bold tabular-nums">
                    {formatZl(t.value)}
                    <span className="text-muted font-normal"> · {splitSum > 0 ? Math.round((t.value / splitSum) * 100) : 0}%</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-card2 overflow-hidden">
                  <div className="h-full rounded-full bg-mint" style={{ width: `${(t.value / splitTotals.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Domknięte dni">
        <DayCloseCalendar monthDate={monthDate} />
      </Section>

      <div className="flex gap-3 mt-2">
        <button
          className="inline-flex flex-1 h-11 items-center justify-center gap-2 rounded-xl bg-card border border-line text-sm font-medium"
          onClick={() => {
            const blob = new Blob([localStorage.getItem('personal-tracker/v1') ?? '{}'], { type: 'application/json' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `personal-tracker-backup-${dateStr()}.json`
            a.click()
            URL.revokeObjectURL(a.href)
          }}
        >
          <Download size={15} /> Eksport JSON
        </button>
        <label className="inline-flex flex-1 h-11 items-center justify-center gap-2 rounded-xl bg-card border border-line text-sm font-medium cursor-pointer">
          <Upload size={15} /> Import JSON
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const imported = sanitizeImportedState(JSON.parse(await file.text()))
                if (!imported) throw new Error('bad shape')
                if (confirm('Nadpisać WSZYSTKIE obecne dane danymi z backupu?')) {
                  dispatch({ type: 'importState', state: imported })
                }
              } catch {
                alert('Ten plik nie wygląda na backup Personal OS.')
              } finally {
                e.target.value = ''
              }
            }}
          />
        </label>
      </div>
    </div>
  )
}

function DayCloseCalendar({ monthDate }: { monthDate: Date }) {
  const state = useAppState()
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const todayKey = dateStr()

  return (
    <>
      <div className="grid grid-cols-7 gap-1.5 mb-1">
        {['P', 'W', 'Ś', 'C', 'P', 'S', 'N'].map((d, i) => (
          <span key={i} className="text-center text-[10px] text-muted/60">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: firstWeekday }, (_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum = i + 1
          const dKey = dateStr(new Date(year, month, dayNum))
          const dd = state.days[dKey]
          const future = dKey > todayKey
          const cls = future
            ? 'text-muted/30'
            : dd?.closed
              ? dd.closed.rating >= 7
                ? 'bg-mint text-black font-bold'
                : dd.closed.rating >= 4
                  ? 'bg-accent text-black font-bold'
                  : 'bg-danger text-black font-bold'
              : dd?.mit
                ? 'border border-accent/40 text-accent'
                : 'text-muted/50'
          return (
            <span
              key={dayNum}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs ${cls} ${dKey === todayKey ? 'ring-2 ring-white/40' : ''}`}
            >
              {dayNum}
            </span>
          )
        })}
      </div>
      <p className="text-[10px] text-muted/70 mt-2">kolor = ocena z zamknięcia dnia · obwódka = dzień z MIT bez domknięcia</p>
    </>
  )
}

function Tile({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div className="rounded-2xl bg-card border border-line p-4">
      <p className="text-xl font-extrabold tabular-nums" style={accent ? { color: accent } : undefined}>
        {value}
      </p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-card border border-line p-4 mb-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted mb-3">{title}</p>
      {children}
    </section>
  )
}

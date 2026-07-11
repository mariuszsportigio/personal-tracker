import { useState } from 'react'
import { Check, Lock, Moon, Plus, RotateCcw, X } from 'lucide-react'
import { useAppDispatch, useAppState, useToday } from '../state/store'
import { Modal } from '../components/Modal'
import { addDays, dateStr, formatClock, haptic, streakOf } from '../lib/util'

function greeting(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Dzień dobry ☀️'
  if (h >= 12 && h < 18) return 'Dobre popołudnie 🌤️'
  if (h >= 18 && h < 23) return 'Dobry wieczór 🌙'
  return 'Późno już… 🌌'
}

export function TodayScreen() {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const day = useToday()
  const [mitText, setMitText] = useState('')
  const [taskText, setTaskText] = useState('')
  const [showClose, setShowClose] = useState(false)

  const todayKey = dateStr()
  const closedDates = Object.values(state.days)
    .filter((d) => d.closed)
    .map((d) => d.date)
  const closeStreak = streakOf(closedDates)
  const mitStreak = streakOf(
    Object.values(state.days)
      .filter((d) => d.mit?.doneAt)
      .map((d) => d.date),
  )
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(todayKey, i - 6))
  const habitsDone = state.habits.filter((h) => h.doneDates.includes(todayKey)).length
  const sideDone = day.sideTasks.filter((t) => t.doneAt).length

  return (
    <div className="px-5 pt-6 pb-32">
      <header className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{greeting()}</p>
        <h1 className="text-2xl font-extrabold first-letter:uppercase">
          {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h1>
      </header>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl bg-card border border-line p-4">
          <p className="text-2xl font-extrabold">🔥 {mitStreak}</p>
          <p className="text-xs text-muted">dni z domkniętym MIT</p>
        </div>
        <div className="rounded-2xl bg-card border border-line p-4">
          <div className="flex gap-1.5 mt-1.5 mb-1.5">
            {last7.map((d) => {
              const dd = state.days[d]
              return (
                <span
                  key={d}
                  className={`h-3.5 w-3.5 rounded-full ${
                    dd?.closed ? 'bg-mint' : dd?.mit ? 'bg-accent/60' : 'bg-card2 border border-line'
                  }`}
                />
              )
            })}
          </div>
          <p className="text-xs text-muted">domknięte dni · streak {closeStreak}</p>
        </div>
      </div>

      {/* ---- MIT ---- */}
      {!day.mit && (
        <section className="rounded-3xl bg-gradient-to-b from-[#1B2320] to-card border border-line p-5 mb-4 card-shadow">
          <p className="text-[11px] uppercase tracking-[0.2em] text-accent mb-1">Most Important Task</p>
          <h2 className="text-xl font-extrabold mb-1">Jedna rzecz. Dziś.</h2>
          <p className="text-sm text-muted mb-4">
            Wybierz to, co MUSI być skończone. Po zablokowaniu nie ma zmiany — to zobowiązanie.
          </p>
          <textarea
            value={mitText}
            onChange={(e) => setMitText(e.target.value)}
            placeholder="np. Wysłać ofertę do klienta X"
            rows={2}
            className="w-full rounded-2xl bg-black/30 border border-line p-4 text-base mb-3 resize-none focus:outline-none focus:border-accent/60"
          />
          <button
            disabled={mitText.trim().length < 3}
            className="inline-flex h-13 w-full items-center justify-center gap-2 py-3.5 rounded-2xl bg-accent text-black font-bold disabled:opacity-40"
            onClick={() => {
              dispatch({ type: 'commitMit', text: mitText.trim() })
              haptic([15, 40, 15])
            }}
          >
            <Lock size={16} /> Zablokuj jako zobowiązanie
          </button>
        </section>
      )}

      {day.mit && !day.mit.doneAt && (
        <section className="rounded-3xl border border-accent/35 bg-gradient-to-b from-[#2E2510] to-card p-5 mb-4 card-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent">MIT · {formatClock(day.mit.committedAt)}</p>
            <span className="h-2.5 w-2.5 rounded-full bg-accent pulse-dot" />
          </div>
          <p className="text-xl font-extrabold leading-snug mb-4">{day.mit.text}</p>
          <button
            className="inline-flex h-13 w-full items-center justify-center gap-2 py-3.5 rounded-2xl bg-mint text-black font-bold"
            onClick={() => {
              dispatch({ type: 'completeMit' })
              haptic([20, 60, 20, 60, 40])
            }}
          >
            <Check size={18} strokeWidth={2.5} /> Zrobione
          </button>
        </section>
      )}

      {day.mit?.doneAt && (
        <section className="rounded-3xl border border-mint/35 bg-gradient-to-b from-[#12301F] to-card p-5 mb-4 card-shadow">
          <p className="text-[11px] uppercase tracking-[0.2em] text-mint mb-2">MIT domknięty · {formatClock(day.mit.doneAt)}</p>
          <p className="text-xl font-extrabold leading-snug line-through decoration-mint/60 decoration-4">{day.mit.text}</p>
        </section>
      )}

      {/* ---- side tasks ---- */}
      <section className="rounded-3xl bg-card border border-line p-5 mb-4">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-bold">Poboczne ({sideDone}/{day.sideTasks.length})</h2>
          <span className="text-xs text-muted">max 3</span>
        </div>
        <div className="flex flex-col gap-2 mb-3">
          {day.sideTasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3">
              <button
                aria-label="odhacz task"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  t.doneAt ? 'bg-mint border-mint text-black' : 'border-line text-transparent'
                }`}
                onClick={() => {
                  dispatch({ type: 'toggleSideTask', id: t.id })
                  if (!t.doneAt) haptic()
                }}
              >
                <Check size={15} strokeWidth={3} />
              </button>
              <span className={`flex-1 text-sm ${t.doneAt ? 'line-through text-muted' : ''}`}>{t.text}</span>
              <button aria-label="usuń task" className="text-muted/50" onClick={() => dispatch({ type: 'removeSideTask', id: t.id })}>
                <X size={14} />
              </button>
            </div>
          ))}
          {day.sideTasks.length === 0 && <p className="text-sm text-muted">Dorzuć do trzech mniejszych rzeczy na dziś.</p>}
        </div>
        {day.sideTasks.length < 3 && (
          <div className="flex gap-2">
            <input
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              placeholder="Nowy task…"
              className="flex-1 h-11 rounded-xl bg-card2 border border-line px-3 text-sm focus:outline-none focus:border-mint/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && taskText.trim()) {
                  dispatch({ type: 'addSideTask', text: taskText.trim() })
                  setTaskText('')
                }
              }}
            />
            <button
              disabled={!taskText.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-card2 border border-line disabled:opacity-40"
              onClick={() => {
                dispatch({ type: 'addSideTask', text: taskText.trim() })
                setTaskText('')
              }}
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </section>

      {/* ---- day close ---- */}
      {day.closed ? (
        <section className="rounded-3xl border border-mint/30 bg-gradient-to-b from-[#12251C] to-card p-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-mint mb-2">
            Dzień domknięty · {formatClock(day.closed.at)}
          </p>
          <p className="text-3xl font-extrabold mb-1">{day.closed.rating}/10</p>
          <p className="text-sm text-muted">
            MIT {day.mit?.doneAt ? '✓' : '✗'} · poboczne {sideDone}/{day.sideTasks.length} · nawyki{' '}
            {day.closed.habitsDone}/{day.closed.habitsTotal}
          </p>
          {day.closed.note && <p className="text-sm text-white/80 mt-2 italic">„{day.closed.note}"</p>}
          <button
            className="inline-flex items-center gap-1.5 text-xs text-muted underline mt-3"
            onClick={() => dispatch({ type: 'reopenDay' })}
          >
            <RotateCcw size={12} /> otwórz ponownie
          </button>
        </section>
      ) : (
        <button
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-card border border-line font-bold"
          onClick={() => setShowClose(true)}
        >
          <Moon size={17} className="text-aqua" /> Zamknij dzień
        </button>
      )}

      {showClose && (
        <CloseDayModal
          habitsDone={habitsDone}
          habitsTotal={state.habits.length}
          onClose={() => setShowClose(false)}
        />
      )}
    </div>
  )
}

function CloseDayModal({
  habitsDone,
  habitsTotal,
  onClose,
}: {
  habitsDone: number
  habitsTotal: number
  onClose: () => void
}) {
  const day = useToday()
  const dispatch = useAppDispatch()
  const [rating, setRating] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const sideDone = day.sideTasks.filter((t) => t.doneAt).length

  return (
    <Modal title="Zamknięcie dnia" icon={<Moon size={16} className="text-aqua" />} onClose={onClose}>
      <p className="text-sm text-muted mb-4">Spowiedź z dnia — szybki przegląd i szczera ocena.</p>

      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between rounded-xl bg-card2 border border-line px-4 py-3 text-sm">
          <span>MIT: {day.mit ? day.mit.text : '— nie ustawiony'}</span>
          {day.mit && !day.mit.doneAt ? (
            <button
              className="rounded-full bg-mint text-black text-xs font-bold px-3 py-1.5"
              onClick={() => dispatch({ type: 'completeMit' })}
            >
              jednak zrobiony
            </button>
          ) : (
            <span className={day.mit?.doneAt ? 'text-mint font-bold' : 'text-danger font-bold'}>
              {day.mit?.doneAt ? '✓' : '✗'}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between rounded-xl bg-card2 border border-line px-4 py-3 text-sm">
          <span>Poboczne taski</span>
          <span className={sideDone === day.sideTasks.length && day.sideTasks.length > 0 ? 'text-mint font-bold' : 'font-bold'}>
            {sideDone}/{day.sideTasks.length}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-card2 border border-line px-4 py-3 text-sm">
          <span>Nawyki</span>
          <span className={habitsTotal > 0 && habitsDone === habitsTotal ? 'text-mint font-bold' : 'font-bold'}>
            {habitsDone}/{habitsTotal || '—'}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted mb-2">Jak oceniasz dzień? (1–10)</p>
      <div className="grid grid-cols-10 gap-1 mb-4">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((r) => (
          <button
            key={r}
            className={`h-9 rounded-lg border text-xs font-bold transition-colors ${
              rating === r
                ? 'bg-mint text-black border-mint'
                : r <= 3
                  ? 'border-danger/40 text-danger bg-card2'
                  : r <= 6
                    ? 'border-accent/40 text-accent bg-card2'
                    : 'border-mint/40 text-mint bg-card2'
            }`}
            onClick={() => {
              setRating(r)
              haptic(8)
            }}
          >
            {r}
          </button>
        ))}
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Notka (opcjonalnie) — co zadziałało, co poprawić…"
        rows={2}
        className="w-full rounded-xl bg-black/30 border border-line p-3 text-sm mb-4 resize-none focus:outline-none focus:border-aqua/50"
      />

      <button
        disabled={rating == null}
        className="inline-flex h-13 w-full items-center justify-center gap-2 py-3.5 rounded-2xl bg-mint text-black font-bold disabled:opacity-40"
        onClick={() => {
          dispatch({ type: 'closeDay', rating: rating!, note, habitsDone, habitsTotal })
          haptic([15, 50, 15])
          onClose()
        }}
      >
        <Check size={17} strokeWidth={2.5} /> Domknij dzień
      </button>
    </Modal>
  )
}

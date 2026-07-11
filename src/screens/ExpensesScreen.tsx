import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, CreditCard, HandCoins, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useAppDispatch, useAppState } from '../state/store'
import { Modal } from '../components/Modal'
import {
  CATEGORIES,
  CATEGORY_BY_ID,
  SPLIT_META,
  TRIP_PLACES,
  expensesInMonth,
  formatZl,
  monthKey,
  netAmount,
  splitAssigned,
} from '../lib/money'
import type { Expense, ExpenseCategory, GrocerySplit } from '../lib/types'
import { formatClock, formatDate, haptic } from '../lib/util'

export function ExpensesScreen() {
  const state = useAppState()
  const [sheetCategory, setSheetCategory] = useState<ExpenseCategory | null>(null)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [showSubs, setShowSubs] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2800)
  }

  const thisMonth = expensesInMonth(state.expenses, monthKey(new Date()))
  const monthNet = thisMonth.reduce((s, e) => s + netAmount(e), 0)
  const subsMonthly = state.subscriptions.filter((s) => s.active).reduce((s, x) => s + x.amount, 0)
  const recent = [...state.expenses].sort((a, b) => b.ts - a.ts).slice(0, 12)

  return (
    <div className="px-5 pt-6 pb-32">
      <header className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Kasa pod kontrolą</p>
          <h1 className="text-2xl font-extrabold">Wydatki</h1>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold text-accent">{formatZl(monthNet)}</p>
          <p className="text-[10px] text-muted">ten miesiąc · netto</p>
        </div>
      </header>

      <p className="text-[11px] uppercase tracking-[0.2em] text-muted mb-2">Dodaj wydatek</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className="flex items-center gap-3 rounded-2xl bg-card border border-line p-4 text-left active:bg-card2"
            onClick={() => setSheetCategory(c.id)}
          >
            <span className="text-2xl">{c.emoji}</span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-sm">{c.name}</span>
              <span className="block truncate text-xs text-muted">
                {c.hint ?? (c.places.slice(0, 3).join(' · ') || 'cokolwiek innego')}
              </span>
            </span>
            <Plus size={16} className="text-muted" />
          </button>
        ))}
        <button
          className="flex items-center gap-3 rounded-2xl bg-card border border-line p-4 text-left active:bg-card2"
          onClick={() => setShowSubs(true)}
        >
          <CreditCard size={22} className="text-[#F472B6]" />
          <span className="flex-1">
            <span className="block font-bold text-sm">Subskrypcje</span>
            <span className="block text-xs text-muted">{formatZl(subsMonthly)}/mies.</span>
          </span>
        </button>
      </div>

      {recent.length > 0 && (
        <>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted mb-2 mt-6">Ostatnie</p>
          <div className="flex flex-col gap-2">
            {recent.map((e) => {
              const cat = CATEGORY_BY_ID[e.category]
              return (
                <button
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl bg-card border border-line px-4 py-3 text-left"
                  onClick={() => setEditing(e)}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {e.place ?? cat.name}
                      {e.trip && <span className="ml-1.5 text-[10px] rounded-full border border-[#A78BFA]/50 text-[#A78BFA] px-1.5 py-0.5">🧳 wyjazd</span>}
                    </span>
                    <span className="block text-[11px] text-muted">
                      {formatDate(e.ts)} · {formatClock(e.ts)}
                      {e.refunded ? ` · oddane ${formatZl(e.refunded)}` : ''}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-bold tabular-nums" style={{ color: cat.color }}>
                      {formatZl(netAmount(e))}
                    </span>
                    {e.refunded ? (
                      <span className="block text-[10px] text-muted line-through tabular-nums">{formatZl(e.amount)}</span>
                    ) : null}
                  </span>
                  <Pencil size={13} className="text-muted/50 shrink-0" />
                </button>
              )
            })}
          </div>
        </>
      )}
      {recent.length === 0 && (
        <p className="text-sm text-muted rounded-2xl bg-card border border-line p-5 text-center mt-4">
          Pusto. Pierwszy wydatek dodasz jednym tapem powyżej.
        </p>
      )}

      {sheetCategory && (
        <ExpenseSheet
          key={sheetCategory}
          category={sheetCategory}
          onClose={() => setSheetCategory(null)}
          onSaved={(msg) => flash(msg)}
        />
      )}
      {editing && (
        <ExpenseSheet key={editing.id} category={editing.category} existing={editing} onClose={() => setEditing(null)} onSaved={(m) => flash(m)} />
      )}
      {showSubs && <SubscriptionsSheet onClose={() => setShowSubs(false)} />}

      {toast &&
        createPortal(
          <div className="toast-in fixed bottom-24 left-1/2 z-[70] rounded-full bg-card2 border border-line px-5 py-3 text-sm card-shadow whitespace-nowrap">
            {toast}
          </div>,
          document.body,
        )}
    </div>
  )
}

function ExpenseSheet({
  category,
  existing,
  onClose,
  onSaved,
}: {
  category: ExpenseCategory
  existing?: Expense
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const dispatch = useAppDispatch()
  const cat = CATEGORY_BY_ID[category]
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '')
  const [place, setPlace] = useState<string | undefined>(existing?.place ?? cat.places[0])
  const [refunded, setRefunded] = useState(existing?.refunded ? String(existing.refunded) : '')
  const [showRefund, setShowRefund] = useState(!!existing?.refunded)
  const [trip, setTrip] = useState(existing?.trip ?? false)
  const [note, setNote] = useState(existing?.note ?? '')
  const [split, setSplit] = useState<GrocerySplit>(existing?.split ?? {})

  const amountNum = Number(amount.replace(',', '.')) || 0
  const refundedNum = Number(refunded.replace(',', '.')) || 0
  const assigned = splitAssigned(split)
  const valid = amountNum > 0 && refundedNum <= amountNum && assigned <= amountNum + 0.01

  function setSplitVal(key: keyof GrocerySplit, val: number) {
    setSplit((s) => ({ ...s, [key]: val || undefined }))
  }

  function save() {
    const payload = {
      category,
      amount: amountNum,
      refunded: refundedNum > 0 ? refundedNum : undefined,
      place,
      trip: trip || undefined,
      note: note.trim() || undefined,
      split: category === 'groceries' && assigned > 0 ? split : undefined,
    }
    if (existing) {
      dispatch({ type: 'updateExpense', id: existing.id, patch: payload })
      onSaved('Wydatek zaktualizowany')
    } else {
      dispatch({ type: 'addExpense', expense: payload })
      onSaved(`${cat.emoji} ${place ?? cat.name} · ${formatZl(amountNum - refundedNum)}`)
    }
    haptic()
    onClose()
  }

  return (
    <Modal title={existing ? 'Edytuj wydatek' : cat.name} icon={<span className="text-base">{cat.emoji}</span>} onClose={onClose}>
      <div className="mb-4">
        <p className="text-xs text-muted mb-1">Kwota (zł)</p>
        <input
          type="text"
          inputMode="decimal"
          autoFocus={!existing}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          className="w-full h-16 rounded-2xl bg-black/30 border border-line px-4 text-3xl font-extrabold tabular-nums focus:outline-none focus:border-mint/60"
        />
      </div>

      {cat.places.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {cat.places.map((p) => (
            <button
              key={p}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                place === p ? 'bg-mint text-black border-mint' : 'bg-card2 border-line'
              }`}
              onClick={() => {
                setPlace(p)
                if (TRIP_PLACES.has(p)) setTrip(true)
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {category === 'groceries' && amountNum > 0 && (
        <div className="rounded-2xl bg-card2 border border-line p-4 mb-4">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Co poszło na co?</p>
            <p className={`text-[11px] tabular-nums ${assigned > amountNum ? 'text-danger font-bold' : 'text-muted'}`}>
              nieprzypisane: {formatZl(Math.max(0, amountNum - assigned))}
            </p>
          </div>
          {SPLIT_META.map(({ key, name }) => {
            const val = split[key] ?? 0
            return (
              <div key={key} className="mb-2.5 last:mb-0">
                <div className="flex items-center justify-between text-[12px] mb-0.5">
                  <span>{name}</span>
                  <span className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={val || ''}
                      placeholder="0"
                      onChange={(e) => setSplitVal(key, Number(e.target.value.replace(',', '.')) || 0)}
                      className="w-16 h-7 rounded-lg bg-black/30 border border-line px-2 text-right text-xs tabular-nums focus:outline-none"
                    />
                    <span className="text-muted text-[10px]">zł</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.round(amountNum)}
                  step={1}
                  value={Math.min(val, amountNum)}
                  onChange={(e) => setSplitVal(key, Number(e.target.value))}
                />
              </div>
            )
          })}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          className={`inline-flex flex-1 items-center justify-center gap-1.5 h-11 rounded-xl border text-sm font-medium ${
            showRefund ? 'border-mint/50 text-mint bg-mint/5' : 'border-line bg-card2'
          }`}
          onClick={() => setShowRefund((s) => !s)}
        >
          <HandCoins size={15} /> ktoś się dorzucił
        </button>
        <button
          className={`inline-flex flex-1 items-center justify-center gap-1.5 h-11 rounded-xl border text-sm font-medium ${
            trip ? 'border-[#A78BFA]/60 text-[#A78BFA] bg-[#A78BFA]/5' : 'border-line bg-card2'
          }`}
          onClick={() => setTrip((t) => !t)}
        >
          🧳 wyjazd
        </button>
      </div>

      {showRefund && (
        <div className="mb-4 screen-in">
          <p className="text-xs text-muted mb-1">Oddane / zwrócone (zł)</p>
          <input
            type="text"
            inputMode="decimal"
            value={refunded}
            onChange={(e) => setRefunded(e.target.value)}
            placeholder="0,00"
            className="w-full h-12 rounded-xl bg-black/30 border border-line px-4 tabular-nums focus:outline-none focus:border-mint/50"
          />
          {refundedNum > 0 && amountNum > 0 && (
            <p className="text-[11px] text-muted mt-1">Realnie z Twojej kieszeni: {formatZl(Math.max(0, amountNum - refundedNum))}</p>
          )}
        </div>
      )}

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Notka (opcjonalnie)"
        className="w-full h-11 rounded-xl bg-black/30 border border-line px-4 text-sm mb-4 focus:outline-none"
      />

      <div className="flex gap-3">
        <button
          disabled={!valid}
          className="inline-flex flex-1 h-13 items-center justify-center gap-2 py-3.5 rounded-2xl bg-mint text-black font-bold disabled:opacity-40"
          onClick={save}
        >
          <Check size={17} strokeWidth={2.5} /> {existing ? 'Zapisz' : `Dodaj${amountNum > 0 ? ` (${formatZl(amountNum - refundedNum)})` : ''}`}
        </button>
        {existing && (
          <button
            aria-label="usuń wydatek"
            className="flex h-13 w-13 items-center justify-center py-3.5 px-4 rounded-2xl bg-danger/10 border border-danger/40 text-danger"
            onClick={() => {
              if (confirm('Usunąć ten wydatek?')) {
                dispatch({ type: 'removeExpense', id: existing.id })
                onClose()
              }
            }}
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>
    </Modal>
  )
}

function SubscriptionsSheet({ onClose }: { onClose: () => void }) {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const amountNum = Number(amount.replace(',', '.')) || 0
  const total = useMemo(
    () => state.subscriptions.filter((s) => s.active).reduce((s, x) => s + x.amount, 0),
    [state.subscriptions],
  )

  return (
    <Modal title="Subskrypcje" icon={<CreditCard size={16} className="text-[#F472B6]" />} onClose={onClose}>
      <p className="text-sm text-muted mb-4">
        Aktywne: <span className="text-white font-bold">{formatZl(total)}/mies.</span> ·{' '}
        {formatZl(total * 12)}/rok
      </p>
      <div className="flex flex-col gap-2 mb-4">
        {state.subscriptions.map((s) => (
          <div key={s.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${s.active ? 'bg-card2 border-line' : 'bg-card border-line opacity-50'}`}>
            <button
              aria-label="przełącz subskrypcję"
              className={`h-6 w-11 rounded-full border transition-colors relative ${s.active ? 'bg-mint/80 border-mint' : 'bg-card2 border-line'}`}
              onClick={() => dispatch({ type: 'toggleSubscription', id: s.id })}
            >
              <span
                className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-all ${s.active ? 'left-[22px]' : 'left-0.5'}`}
              />
            </button>
            <span className={`flex-1 ${s.active ? '' : 'line-through'}`}>{s.name}</span>
            <span className="font-bold tabular-nums">{formatZl(s.amount)}</span>
            <button aria-label="usuń subskrypcję" className="text-muted/50" onClick={() => dispatch({ type: 'removeSubscription', id: s.id })}>
              <X size={14} />
            </button>
          </div>
        ))}
        {state.subscriptions.length === 0 && <p className="text-sm text-muted">Dodaj pierwszą — Spotify, Netflix, siłownia…</p>}
      </div>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nazwa"
          className="flex-1 h-11 rounded-xl bg-black/30 border border-line px-3 text-sm focus:outline-none"
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="zł/mies."
          className="w-24 h-11 rounded-xl bg-black/30 border border-line px-3 text-sm tabular-nums focus:outline-none"
        />
        <button
          disabled={!name.trim() || amountNum <= 0}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-black disabled:opacity-40"
          onClick={() => {
            dispatch({ type: 'addSubscription', name: name.trim(), amount: amountNum })
            setName('')
            setAmount('')
            haptic()
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </Modal>
  )
}

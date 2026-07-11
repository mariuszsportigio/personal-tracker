import { createContext, useContext, useEffect, useReducer, type ReactNode, type Dispatch } from 'react'
import { initialState, type AppState, type DayData, type Expense, type Subscription } from '../lib/types'
import { dateStr, uid } from '../lib/util'

const STORAGE_KEY = 'personal-tracker/v1'

export type Action =
  | { type: 'commitMit'; text: string }
  | { type: 'completeMit' }
  | { type: 'addSideTask'; text: string }
  | { type: 'toggleSideTask'; id: string }
  | { type: 'removeSideTask'; id: string }
  | { type: 'closeDay'; rating: number; note?: string; habitsDone: number; habitsTotal: number }
  | { type: 'reopenDay' }
  | { type: 'addHabit'; name: string }
  | { type: 'removeHabit'; id: string }
  | { type: 'toggleHabit'; id: string }
  | { type: 'addExpense'; expense: Omit<Expense, 'id' | 'ts'> & { ts?: number; id?: string } }
  | { type: 'updateExpense'; id: string; patch: Partial<Expense> }
  | { type: 'removeExpense'; id: string }
  | { type: 'addSubscription'; name: string; amount: number }
  | { type: 'toggleSubscription'; id: string }
  | { type: 'removeSubscription'; id: string }
  | { type: 'importState'; state: AppState }

function today(state: AppState): DayData {
  const date = dateStr()
  return state.days[date] ?? { date, sideTasks: [] }
}

function withToday(state: AppState, patch: (d: DayData) => DayData): AppState {
  const d = today(state)
  return { ...state, days: { ...state.days, [d.date]: patch(d) } }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'commitMit':
      return withToday(state, (d) => (d.mit ? d : { ...d, mit: { text: action.text, committedAt: Date.now() } }))
    case 'completeMit':
      return withToday(state, (d) =>
        d.mit && !d.mit.doneAt ? { ...d, mit: { ...d.mit, doneAt: Date.now() } } : d,
      )
    case 'addSideTask':
      return withToday(state, (d) =>
        d.sideTasks.length >= 3 ? d : { ...d, sideTasks: [...d.sideTasks, { id: uid(), text: action.text }] },
      )
    case 'toggleSideTask':
      return withToday(state, (d) => ({
        ...d,
        sideTasks: d.sideTasks.map((t) =>
          t.id === action.id ? { ...t, doneAt: t.doneAt ? undefined : Date.now() } : t,
        ),
      }))
    case 'removeSideTask':
      return withToday(state, (d) => ({ ...d, sideTasks: d.sideTasks.filter((t) => t.id !== action.id) }))
    case 'closeDay':
      return withToday(state, (d) => ({
        ...d,
        closed: {
          at: Date.now(),
          rating: Math.max(1, Math.min(10, action.rating)),
          note: action.note?.trim() || undefined,
          habitsDone: action.habitsDone,
          habitsTotal: action.habitsTotal,
        },
      }))
    case 'reopenDay':
      return withToday(state, (d) => ({ ...d, closed: undefined }))
    case 'addHabit':
      return { ...state, habits: [...state.habits, { id: uid(), name: action.name, doneDates: [] }] }
    case 'removeHabit':
      return { ...state, habits: state.habits.filter((h) => h.id !== action.id) }
    case 'toggleHabit': {
      const date = dateStr()
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id !== action.id) return h
          const done = h.doneDates.includes(date)
          return { ...h, doneDates: done ? h.doneDates.filter((d) => d !== date) : [...h.doneDates, date] }
        }),
      }
    }
    case 'addExpense': {
      const { ts, id, ...rest } = action.expense
      const expense: Expense = { id: id ?? uid(), ts: ts ?? Date.now(), ...rest }
      return { ...state, expenses: [...state.expenses, expense] }
    }
    case 'updateExpense':
      return {
        ...state,
        expenses: state.expenses.map((e) => (e.id === action.id ? { ...e, ...action.patch } : e)),
      }
    case 'removeExpense':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) }
    case 'addSubscription': {
      const sub: Subscription = { id: uid(), name: action.name, amount: action.amount, active: true }
      return { ...state, subscriptions: [...state.subscriptions, sub] }
    }
    case 'toggleSubscription':
      return {
        ...state,
        subscriptions: state.subscriptions.map((s) => (s.id === action.id ? { ...s, active: !s.active } : s)),
      }
    case 'removeSubscription':
      return { ...state, subscriptions: state.subscriptions.filter((s) => s.id !== action.id) }
    case 'importState':
      return action.state
  }
}

/** Merge an untrusted parsed backup into a valid AppState (same rules as load()). */
export function sanitizeImportedState(parsed: unknown): AppState | null {
  if (typeof parsed !== 'object' || parsed === null) return null
  const p = parsed as Partial<AppState>
  if (!Array.isArray(p.habits ?? []) || !Array.isArray(p.expenses ?? []) || !Array.isArray(p.subscriptions ?? [])) {
    return null
  }
  return { ...initialState, ...p }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    return sanitizeImportedState(JSON.parse(raw)) ?? initialState
  } catch {
    return initialState
  }
}

const StateCtx = createContext<AppState>(initialState)
const DispatchCtx = createContext<Dispatch<Action>>(() => {})

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage full / private mode — keep running in-memory
    }
  }, [state])

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  )
}

export function useAppState(): AppState {
  return useContext(StateCtx)
}

export function useAppDispatch(): Dispatch<Action> {
  return useContext(DispatchCtx)
}

export function useToday(): DayData {
  return today(useAppState())
}

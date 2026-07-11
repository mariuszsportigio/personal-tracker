export interface SideTask {
  id: string
  text: string
  doneAt?: number
}

export interface Mit {
  text: string
  committedAt: number
  doneAt?: number
}

export interface DayClose {
  at: number
  /** self-rating 1-10: how the day went */
  rating: number
  note?: string
  habitsDone: number
  habitsTotal: number
}

export interface DayData {
  date: string // YYYY-MM-DD local
  mit?: Mit
  sideTasks: SideTask[]
  closed?: DayClose
}

export interface Habit {
  id: string
  name: string
  doneDates: string[] // YYYY-MM-DD local
}

export type ExpenseCategory = 'groceries' | 'city' | 'transport' | 'transfer' | 'subscription' | 'other'

/** groceries split, amounts in zł */
export interface GrocerySplit {
  daily?: number
  ready?: number
  chemicals?: number
  longterm?: number
}

export interface Expense {
  id: string
  ts: number
  category: ExpenseCategory
  /** total paid, zł */
  amount: number
  /** reimbursed by others, zł */
  refunded?: number
  /** store / venue / purpose label (Biedronka, Bar, Prezent…) */
  place?: string
  split?: GrocerySplit
  note?: string
  /** trip-related spending */
  trip?: boolean
}

export interface Subscription {
  id: string
  name: string
  /** monthly cost, zł */
  amount: number
  active: boolean
}

export interface Settings {
  _reserved?: never
}

export interface AppState {
  days: Record<string, DayData>
  habits: Habit[]
  expenses: Expense[]
  subscriptions: Subscription[]
}

export const initialState: AppState = {
  days: {},
  habits: [],
  expenses: [],
  subscriptions: [],
}

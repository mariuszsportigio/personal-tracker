import type { Expense, ExpenseCategory, GrocerySplit } from './types'

export const CATEGORIES: {
  id: ExpenseCategory
  name: string
  emoji: string
  color: string
  places: string[]
  hint?: string
}[] = [
  {
    id: 'groceries',
    name: 'Zakupy',
    emoji: '🛒',
    color: '#34D399',
    places: ['Biedronka', 'Lidl', 'Żabka', 'Inny sklep'],
    hint: 'spożywka i dom',
  },
  {
    id: 'city',
    name: 'Miasto',
    emoji: '🍽️',
    color: '#F5A524',
    places: ['Restauracja', 'Bar', 'Kawiarnia', 'Fastfood'],
    hint: 'jedzenie na mieście',
  },
  {
    id: 'transport',
    name: 'Transport',
    emoji: '🚌',
    color: '#7DD3FC',
    places: ['Bilety', 'Paliwo', 'Taxi', 'Parking'],
  },
  {
    id: 'transfer',
    name: 'Przelew / Zrzutka',
    emoji: '🎁',
    color: '#A78BFA',
    places: ['Prezent', 'Wyjazd', 'Hotel', 'Inne'],
    hint: 'zrzutki, prezenty, opłaty',
  },
  {
    id: 'other',
    name: 'Inne',
    emoji: '📦',
    color: '#8B9490',
    places: [],
  },
]

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  ExpenseCategory,
  (typeof CATEGORIES)[number]
>

export const SUBSCRIPTION_COLOR = '#F472B6'

export const SPLIT_META: { key: keyof GrocerySplit; name: string; short: string }[] = [
  { key: 'daily', name: 'Żywność daily', short: 'daily' },
  { key: 'ready', name: 'Gotowce', short: 'gotowce' },
  { key: 'chemicals', name: 'Środki czystości', short: 'chemia' },
  { key: 'longterm', name: 'Long-term (kawa, mąka, olej…)', short: 'long-term' },
]

/** places that automatically get the trip tag */
export const TRIP_PLACES = new Set(['Wyjazd', 'Hotel'])

export function netAmount(e: Expense): number {
  return Math.max(0, e.amount - (e.refunded ?? 0))
}

export function formatZl(v: number): string {
  const rounded = Math.round(v * 100) / 100
  return `${rounded.toLocaleString('pl-PL', { minimumFractionDigits: rounded % 1 ? 2 : 0, maximumFractionDigits: 2 })} zł`
}

export function splitAssigned(split: GrocerySplit | undefined): number {
  if (!split) return 0
  return (split.daily ?? 0) + (split.ready ?? 0) + (split.chemicals ?? 0) + (split.longterm ?? 0)
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function expensesInMonth(expenses: Expense[], key: string): Expense[] {
  return expenses.filter((e) => monthKey(new Date(e.ts)) === key)
}

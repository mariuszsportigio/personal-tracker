import { useState } from 'react'
import { AppProvider } from './state/store'
import { TabBar, type Tab } from './components/TabBar'
import { TodayScreen } from './screens/TodayScreen'
import { HabitsScreen } from './screens/HabitsScreen'
import { ExpensesScreen } from './screens/ExpensesScreen'
import { StatsScreen } from './screens/StatsScreen'

export default function App() {
  const [tab, setTab] = useState<Tab>('today')
  return (
    <AppProvider>
      <div className="mx-auto max-w-md min-h-dvh pt-[env(safe-area-inset-top)]">
        <div key={tab} className="screen-in">
          {tab === 'today' && <TodayScreen />}
          {tab === 'habits' && <HabitsScreen />}
          {tab === 'expenses' && <ExpensesScreen />}
          {tab === 'stats' && <StatsScreen />}
        </div>
        <TabBar tab={tab} onChange={setTab} />
      </div>
    </AppProvider>
  )
}

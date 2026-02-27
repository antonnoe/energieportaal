import './index.css'
import { ToolStateProvider, useToolState } from './context/ToolStateContext'
import { Navigation } from './components/Navigation'
import { SnelAdvies } from './pages/SnelAdvies'
import { Expertmodus } from './pages/Expertmodus'
import { SubsidieFinance } from './pages/SubsidieFinance'

function AppShell() {
  const { toolState } = useToolState()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO meta is in index.html */}
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {toolState.activeTab === 'snel' && <SnelAdvies />}
        {toolState.activeTab === 'expert' && <Expertmodus />}
        {toolState.activeTab === 'subsidie' && <SubsidieFinance />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ToolStateProvider>
      <AppShell />
    </ToolStateProvider>
  )
}

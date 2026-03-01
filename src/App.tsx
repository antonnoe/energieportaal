import './index.css'
import { ToolStateProvider, useToolState } from './context/ToolStateContext'
import { Navigation } from './components/Navigation'
import { SnelAdvies } from './pages/SnelAdvies'
import { Expertmodus } from './pages/Expertmodus'
import { SubsidieFinance } from './pages/SubsidieFinance'

import { Step1Locatie } from './steps/Step1Locatie'
import { Step2Woningtype } from './steps/Step2Woningtype'
import { Step3Isolatie } from './steps/Step3Isolatie'
import { Step4Energie } from './steps/Step4Energie'
import { Step5Financieel } from './steps/Step5Financieel'

import { Woningprofiel } from './report/Woningprofiel'
import { Energieprofiel } from './report/Energieprofiel'
import { DPESchatting } from './report/DPESchatting'
import { Besparingsadvies } from './report/Besparingsadvies'
import { SubsidieCheck } from './report/SubsidieCheck'
import { Grondslagen } from './report/Grondslagen'
import { FloatingEuro } from './report/FloatingEuro'

const STEP_LABELS = [
  { nr: 1, label: 'Locatie' },
  { nr: 2, label: 'Woning' },
  { nr: 3, label: 'Isolatie' },
  { nr: 4, label: 'Energie' },
  { nr: 5, label: 'Financieel' },
]

function StepIndicator() {
  const { toolState, setCurrentStep } = useToolState()
  const current = toolState.currentStep

  return (
    <div className="flex items-center gap-1">
      {STEP_LABELS.map((s, i) => (
        <div key={s.nr} className="flex items-center">
          <button
            type="button"
            onClick={() => setCurrentStep(s.nr)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              current === s.nr
                ? 'bg-primary text-white shadow-sm'
                : current > s.nr
                  ? 'bg-primary/10 text-primary'
                  : 'bg-gray-100 text-gray-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">
              {current > s.nr ? '✓' : s.nr}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
          {i < STEP_LABELS.length - 1 && (
            <div className={`w-4 h-px mx-0.5 ${current > s.nr ? 'bg-primary/30' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function CurrentStep() {
  const { toolState } = useToolState()
  switch (toolState.currentStep) {
    case 1: return <Step1Locatie />
    case 2: return <Step2Woningtype />
    case 3: return <Step3Isolatie />
    case 4: return <Step4Energie />
    case 5: return <Step5Financieel />
    default: return <Step1Locatie />
  }
}

function StepNavButtons() {
  const { toolState, setCurrentStep } = useToolState()
  const current = toolState.currentStep

  return (
    <div className="flex justify-between pt-4">
      <button
        type="button"
        disabled={current <= 1}
        onClick={() => setCurrentStep(current - 1)}
        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ← Vorige
      </button>
      <button
        type="button"
        disabled={current >= 5}
        onClick={() => setCurrentStep(current + 1)}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Volgende →
      </button>
    </div>
  )
}

function Rapport() {
  return (
    <div className="space-y-6">
      <Woningprofiel />
      <hr className="border-gray-200" />
      <Energieprofiel />
      <hr className="border-gray-200" />
      <DPESchatting />
      <hr className="border-gray-200" />
      <Besparingsadvies />
      <hr className="border-gray-200" />
      <SubsidieCheck />
      <hr className="border-gray-200" />
      <Grondslagen />
    </div>
  )
}

function StappenFlow() {
  return (
    <div className="pb-20">
      {/* Desktop: split layout. Mobile: stacked */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        {/* Linker paneel: Invoer */}
        <div>
          <div className="sticky top-0 z-10 bg-gray-50 pt-4 pb-3">
            <StepIndicator />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <CurrentStep />
            <StepNavButtons />
          </div>
        </div>

        {/* Rechter paneel: Rapport */}
        <div className="mt-8 lg:mt-0">
          <div className="sticky top-0 z-10 bg-gray-50 pt-4 pb-3">
            <h2 className="font-heading text-sm font-bold text-gray-400 uppercase tracking-widest">Rapport</h2>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <Rapport />
          </div>
        </div>
      </div>

      <FloatingEuro />
    </div>
  )
}

function AppShell() {
  const { toolState, setActiveTab } = useToolState()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-lg font-bold tracking-tight">EnergiePortaal</h1>
            <p className="text-xs text-white/70">Energieadvies voor Nederlandse huiseigenaren in Frankrijk</p>
          </div>
          <div className="flex gap-1">
            {[
              { id: 'stappen' as const, label: 'Portaal' },
              { id: 'snel' as const, label: 'Snel' },
              { id: 'expert' as const, label: 'Expert' },
              { id: 'subsidie' as const, label: 'Subsidie' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  toolState.activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white/90 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Oude navigatie alleen voor oude tabs */}
      {(toolState.activeTab === 'snel' || toolState.activeTab === 'expert' || toolState.activeTab === 'subsidie') && (
        <Navigation />
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {toolState.activeTab === 'stappen' && <StappenFlow />}
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

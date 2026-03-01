import './index.css'
import { ToolStateProvider, useToolState } from './context/ToolStateContext'

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
              {current > s.nr ? '\u2713' : s.nr}
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
        &larr; Vorige
      </button>
      <button
        type="button"
        disabled={current >= 5}
        onClick={() => setCurrentStep(current + 1)}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Volgende &rarr;
      </button>
    </div>
  )
}

function Rapport() {
  const { toolState, result } = useToolState()

  // Rapport is leeg tot er een geldige postcode is (5 cijfers)
  const hasPostcode = toolState.postcode.length === 5
  // Na stap 3: er is een geldige warmteverliesberekening
  const hasHeatCalc = hasPostcode && result.verwarmingTotaal > 0
  // Na stap 5: subsidie-parameters zijn beschikbaar
  const hasFinancieel = hasHeatCalc && toolState.currentStep >= 5

  if (!hasPostcode) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        <p className="text-lg mb-1">Hier wordt uw rapportage gebouwd</p>
        <p>Vul een postcode in bij Stap 1 om te beginnen.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Woningprofiel />
      {hasHeatCalc && (
        <>
          <hr className="border-gray-200" />
          <Energieprofiel />
          <hr className="border-gray-200" />
          <DPESchatting />
          <hr className="border-gray-200" />
          <Besparingsadvies />
        </>
      )}
      {hasFinancieel && (
        <>
          <hr className="border-gray-200" />
          <SubsidieCheck />
        </>
      )}
      {hasHeatCalc && (
        <>
          <hr className="border-gray-200" />
          <Grondslagen />
        </>
      )}
    </div>
  )
}

/** U2: Mobile toggle — twee knoppen onderin voor schermen < 768px */
function MobileToggle() {
  const { toolState, setMobilePanel } = useToolState()
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] md:hidden bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex">
        <button
          type="button"
          onClick={() => setMobilePanel('invoer')}
          className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
            toolState.mobilePanel === 'invoer'
              ? 'text-primary border-t-2 border-primary bg-primary/5'
              : 'text-gray-500'
          }`}
        >
          Invoer
        </button>
        <button
          type="button"
          onClick={() => setMobilePanel('rapport')}
          className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
            toolState.mobilePanel === 'rapport'
              ? 'text-primary border-t-2 border-primary bg-primary/5'
              : 'text-gray-500'
          }`}
        >
          Rapport
        </button>
      </div>
    </div>
  )
}

function StappenFlow() {
  const { toolState } = useToolState()

  return (
    <div className="pb-20 md:pb-20">
      {/* Desktop: split layout */}
      <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
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
        <div>
          <div className="sticky top-0 z-10 bg-gray-50 pt-4 pb-3">
            <h2 className="font-heading text-sm font-bold text-gray-400 uppercase tracking-widest">Rapport</h2>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <Rapport />
          </div>
        </div>
      </div>

      {/* Mobile: toggle between invoer and rapport */}
      <div className="md:hidden">
        {toolState.mobilePanel === 'invoer' ? (
          <div>
            <div className="sticky top-0 z-10 bg-gray-50 pt-4 pb-3">
              <StepIndicator />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <CurrentStep />
              <StepNavButtons />
            </div>
          </div>
        ) : (
          <div>
            <div className="sticky top-0 z-10 bg-gray-50 pt-4 pb-3">
              <h2 className="font-heading text-sm font-bold text-gray-400 uppercase tracking-widest">Rapport</h2>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <Rapport />
            </div>
          </div>
        )}
      </div>

      <FloatingEuro />
      <MobileToggle />
    </div>
  )
}

function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header — tabs verwijderd (C1) */}
      <header className="bg-primary text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="font-heading text-lg font-bold tracking-tight">EnergiePortaal</h1>
          <p className="text-xs text-white/70">Energieadvies voor Nederlandse huiseigenaren in Frankrijk</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <StappenFlow />
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

import { useState, useRef, useCallback, useEffect } from 'react'
import './index.css'
import { ToolStateProvider, useToolState } from './context/ToolStateContext'

import { Step1Locatie } from './steps/Step1Locatie'
import { Step3Isolatie } from './steps/Step3Isolatie'
import { Step4Energie } from './steps/Step4Energie'
import { Step5Financieel } from './steps/Step5Financieel'

import { Woningprofiel } from './report/Woningprofiel'
import { Energieprofiel } from './report/Energieprofiel'
import { DPESchatting } from './report/DPESchatting'
import { Besparingsadvies } from './report/Besparingsadvies'
import { SubsidieCheck } from './report/SubsidieCheck'
import { Grondslagen } from './report/Grondslagen'
import { Disclaimer } from './report/Disclaimer'
import { PdfExport } from './report/PdfExport'
import { DossierKnop } from './report/DossierKnop'
import { getZoneById } from './engine/constants'
import { getRapportNiveau } from './engine/rapport-niveau'

// ─── RapportSectie ───────────────────────────────────────────────────────────

function RapportSectie({ niveau, minimumNiveau, children, placeholder }: {
  niveau: number; minimumNiveau: number; children: React.ReactNode; placeholder?: string;
}) {
  if (niveau >= minimumNiveau) return <div className="transition-all duration-300 opacity-100">{children}</div>
  if (placeholder) return (
    <div className="opacity-40 grayscale">
      <div className="bg-gray-50 rounded-lg p-3 text-center text-sm text-gray-400">{placeholder}</div>
    </div>
  )
  return null
}

// ─── Collapsible wrapper ─────────────────────────────────────────────────────

function CollapsibleSection({ title, icon, children }: {
  title: string; icon: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span>{icon}</span>{title}
        </span>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  )
}

// ─── Step indicator (4 stappen) ──────────────────────────────────────────────

const STEP_LABELS = [
  { nr: 1, label: 'Woning' },
  { nr: 2, label: 'Isolatie' },
  { nr: 3, label: 'Energie' },
  { nr: 4, label: 'Kosten' },
]

function StepIndicator() {
  const { toolState, setCurrentStep } = useToolState()
  const current = toolState.currentStep
  return (
    <div className="flex items-center justify-center gap-0.5">
      {STEP_LABELS.map((s, i) => (
        <div key={s.nr} className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setCurrentStep(s.nr)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
              current === s.nr
                ? 'bg-primary text-white shadow-sm'
                : current > s.nr
                  ? 'bg-primary/10 text-primary'
                  : 'bg-gray-100 text-gray-400'
            }`}
          >
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border border-current">
              {current > s.nr ? '\u2713' : s.nr}
            </span>
            <span className="text-[11px]">{s.label}</span>
          </button>
          {i < STEP_LABELS.length - 1 && (
            <div className={`w-3 h-px mx-0.5 ${current > s.nr ? 'bg-primary/30' : 'bg-gray-200'}`} />
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
    case 2: return <Step3Isolatie />
    case 3: return <Step4Energie />
    case 4: return <Step5Financieel />
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
        className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ← Vorige
      </button>
      <button
        type="button"
        disabled={current >= 4}
        onClick={() => setCurrentStep(current + 1)}
        className="px-3 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Volgende →
      </button>
    </div>
  )
}

// ─── Rapport ─────────────────────────────────────────────────────────────────

function Rapport() {
  const { toolState } = useToolState()
  const rapportNiveau = getRapportNiveau(toolState)
  const zone = getZoneById(toolState.zoneId)

  if (rapportNiveau === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        <p className="text-base mb-1">Vul uw postcode in om de rapportage te starten</p>
      </div>
    )
  }

  const hasFinancieel = rapportNiveau === 3 && toolState.currentStep >= 4
  const grijsPlaceholder = rapportNiveau === 1
    ? 'Kies uw woningtype om verder te gaan'
    : 'Vul de isolatiewaarden in voor een DPE-indicatie'

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-1">
        <p className="font-semibold text-green-800">
          Zone: {zone.name} ({zone.hdd} graaddagen)
        </p>
        <p className="text-green-700 text-xs">
          Département {toolState.departement} · PV-opbrengst {zone.pv} kWh/kWp/jaar · Ref. buitentemp {zone.Tref} °C
        </p>
      </div>

      <RapportSectie niveau={rapportNiveau} minimumNiveau={2} placeholder={grijsPlaceholder}>
        <Woningprofiel />
      </RapportSectie>

      <RapportSectie niveau={rapportNiveau} minimumNiveau={3} placeholder={grijsPlaceholder}>
        <Energieprofiel />
      </RapportSectie>

      <RapportSectie niveau={rapportNiveau} minimumNiveau={3} placeholder={grijsPlaceholder}>
        <DPESchatting />
      </RapportSectie>

      <RapportSectie niveau={rapportNiveau} minimumNiveau={3}>
        <CollapsibleSection title="Wat kunt u doen? — Besparingsadvies" icon="💡">
          <Besparingsadvies />
        </CollapsibleSection>
      </RapportSectie>

      {hasFinancieel && (
        <CollapsibleSection title="Subsidie-check" icon="🏦">
          <SubsidieCheck />
        </CollapsibleSection>
      )}

      <RapportSectie niveau={rapportNiveau} minimumNiveau={3}>
        <CollapsibleSection title="Grondslagen — Volledige berekening" icon="📐">
          <Grondslagen />
        </CollapsibleSection>
      </RapportSectie>

      {rapportNiveau === 3 && <Disclaimer />}
    </div>
  )
}

// ─── Swipe container with touch ──────────────────────────────────────────────

function SwipePanel({ activePanel, setActivePanel }: {
  activePanel: 'invoer' | 'rapport'
  setActivePanel: (p: 'invoer' | 'rapport') => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchDeltaX = useRef(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current
  }, [])

  const handleTouchEnd = useCallback(() => {
    const threshold = 60
    if (touchDeltaX.current < -threshold && activePanel === 'invoer') {
      setActivePanel('rapport')
    } else if (touchDeltaX.current > threshold && activePanel === 'rapport') {
      setActivePanel('invoer')
    }
  }, [activePanel, setActivePanel])

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto"
      style={{ height: 'calc(100vh - 100px)' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="px-3 py-3 pb-6">
        {activePanel === 'invoer' ? (
          <>
            <div className="pb-2">
              <StepIndicator />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <CurrentStep />
              <StepNavButtons />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <Rapport />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Floating toolbar (fixed at bottom of iframe viewport) ───────────────────

function FloatingToolbar({ activePanel, setActivePanel }: {
  activePanel: 'invoer' | 'rapport'
  setActivePanel: (p: 'invoer' | 'rapport') => void
}) {
  const { toolState, result } = useToolState()
  const rapportNiveau = getRapportNiveau(toolState)
  const isComplete = rapportNiveau === 3 && toolState.currentStep >= 4

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      <div className="max-w-7xl mx-auto px-3 py-1.5">
        {/* KPI row — alleen bij rapportNiveau 3 */}
        {rapportNiveau === 3 && (
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <div
                className="w-7 h-7 rounded flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: result.dpe.kleur }}
              >
                {result.dpe.letter}
              </div>
              <span className="text-[10px] text-gray-500">{Math.round(result.dpe.kwhPerM2)} kWh/m²</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-primary">
                € {result.nettoKosten.toLocaleString('nl-NL')}<span className="text-[10px] font-normal text-gray-400">/jaar</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500">{result.co2Kg.toLocaleString('nl-NL')} kg CO₂</p>
            </div>
          </div>
        )}

        {/* Controls row */}
        <div className="flex items-center justify-between">
          {/* Panel switcher */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setActivePanel('invoer')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activePanel === 'invoer'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ✏️ Invoer
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('rapport')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activePanel === 'rapport'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 Rapport
            </button>
          </div>

          {/* Action buttons — greyed out until step 4 */}
          <div className="flex items-center gap-2">
            <div className={isComplete ? '' : 'opacity-30 pointer-events-none'}>
              <PdfExport />
            </div>
            <div className={isComplete ? '' : 'opacity-30 pointer-events-none'}>
              <DossierKnop />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main app ────────────────────────────────────────────────────────────────

function AppContent() {
  const { toolState, setMobilePanel } = useToolState()
  const activePanel = toolState.mobilePanel

  // Force html/body to act as viewport for fixed positioning
  useEffect(() => {
    document.documentElement.style.height = '100%'
    document.documentElement.style.overflow = 'hidden'
    document.body.style.height = '100%'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.height = ''
      document.documentElement.style.overflow = ''
      document.body.style.height = ''
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex-1 overflow-hidden">
        <SwipePanel activePanel={activePanel} setActivePanel={setMobilePanel} />
      </div>
      <FloatingToolbar activePanel={activePanel} setActivePanel={setMobilePanel} />
    </div>
  )
}

export default function App() {
  return (
    <ToolStateProvider>
      <AppContent />
    </ToolStateProvider>
  )
}

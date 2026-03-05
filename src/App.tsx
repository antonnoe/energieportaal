import { useState, useRef, useCallback, useEffect } from 'react'
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
import { Disclaimer } from './report/Disclaimer'
import { PdfExport } from './report/PdfExport'
import { DossierKnop } from './report/DossierKnop'
import { getZoneById } from './engine/constants'
import { getRapportNiveau } from './engine/rapport-niveau'

// ─── Iframe detection & auto-height ──────────────────────────────────────────


function useIframeAutoHeight() {
  useEffect(() => {
    let inIframe = false
    try { inIframe = window.self !== window.top } catch { inIframe = true }
    if (!inIframe) return

    const sendHeight = () => {
      const h = document.documentElement.scrollHeight
      window.parent.postMessage({ type: 'ep-resize', height: h }, '*')
    }

    // Send initial + on resize/mutation
    sendHeight()
    const observer = new MutationObserver(sendHeight)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true })
    window.addEventListener('resize', sendHeight)
    const interval = setInterval(sendHeight, 1000)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', sendHeight)
      clearInterval(interval)
    }
  }, [])
}

// ─── RapportSectie ───────────────────────────────────────────────────────────

function RapportSectie({ niveau, minimumNiveau, children, placeholder }: {
  niveau: number; minimumNiveau: number; children: React.ReactNode; placeholder?: string;
}) {
  if (niveau >= minimumNiveau) return <div className="transition-all duration-300 opacity-100">{children}</div>
  if (placeholder) return (
    <div className="opacity-40 grayscale">
      <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-400">{placeholder}</div>
    </div>
  )
  return null
}

// ─── Collapsible wrapper ─────────────────────────────────────────────────────

function CollapsibleSection({ title, icon, children, defaultOpen = false }: {
  title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span>{icon}</span>
          {title}
        </span>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  )
}

// ─── Step indicator ──────────────────────────────────────────────────────────

const STEP_LABELS = [
  { nr: 1, label: 'Locatie' },
  { nr: 2, label: 'Woning' },
  { nr: 3, label: 'Isolatie' },
  { nr: 4, label: 'Energie' },
  { nr: 5, label: 'Kosten' },
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
            <span className="hidden sm:inline text-[11px]">{s.label}</span>
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
        className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ← Vorige
      </button>
      <button
        type="button"
        disabled={current >= 5}
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

  const hasFinancieel = rapportNiveau === 3 && toolState.currentStep >= 5
  const grijsPlaceholder = rapportNiveau === 1
    ? 'Kies uw woningtype om verder te gaan'
    : 'Vul de isolatiewaarden in voor een DPE-indicatie'

  return (
    <div className="space-y-4">
      {/* Klimaatblok */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-1">
        <p className="font-semibold text-green-800">
          Zone: {zone.name} ({zone.hdd} graaddagen)
        </p>
        <p className="text-green-700 text-xs">
          Département {toolState.departement} · PV-opbrengst {zone.pv} kWh/kWp/jaar · Ref. buitentemp {zone.Tref} °C
        </p>
      </div>

      {/* Woningprofiel */}
      <RapportSectie niveau={rapportNiveau} minimumNiveau={2} placeholder={grijsPlaceholder}>
        <Woningprofiel />
      </RapportSectie>

      {/* Energieprofiel */}
      <RapportSectie niveau={rapportNiveau} minimumNiveau={3} placeholder={grijsPlaceholder}>
        <Energieprofiel />
      </RapportSectie>

      {/* DPE-indicatie */}
      <RapportSectie niveau={rapportNiveau} minimumNiveau={3} placeholder={grijsPlaceholder}>
        <DPESchatting />
      </RapportSectie>

      {/* Besparingsadvies — ingeklapt */}
      <RapportSectie niveau={rapportNiveau} minimumNiveau={3}>
        <CollapsibleSection title="Wat kunt u doen? — Besparingsadvies" icon="💡">
          <Besparingsadvies />
        </CollapsibleSection>
      </RapportSectie>

      {/* Subsidie */}
      {hasFinancieel && (
        <CollapsibleSection title="Subsidie-check" icon="🏦">
          <SubsidieCheck />
        </CollapsibleSection>
      )}

      {/* Grondslagen — ingeklapt */}
      <RapportSectie niveau={rapportNiveau} minimumNiveau={3}>
        <CollapsibleSection title="Grondslagen — Volledige berekening" icon="📐">
          <Grondslagen />
        </CollapsibleSection>
      </RapportSectie>

      {/* Disclaimer */}
      {rapportNiveau === 3 && <Disclaimer />}
    </div>
  )
}

// ─── Swipe container ─────────────────────────────────────────────────────────

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
      className="overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex transition-transform duration-300 ease-in-out"
        style={{ transform: activePanel === 'invoer' ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        {/* Panel 1: Invoer */}
        <div className="w-full shrink-0 px-3 pb-4">
          <div className="py-2">
            <StepIndicator />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <CurrentStep />
            <StepNavButtons />
          </div>
        </div>

        {/* Panel 2: Rapport */}
        <div className="w-full shrink-0 px-3 pb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <Rapport />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sticky toolbar ──────────────────────────────────────────────────────────

function StickyToolbar({ activePanel, setActivePanel }: {
  activePanel: 'invoer' | 'rapport'
  setActivePanel: (p: 'invoer' | 'rapport') => void
}) {
  const { toolState } = useToolState()
  const rapportNiveau = getRapportNiveau(toolState)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-3 py-2">
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

        {/* Swipe hint */}
        <span className="text-[10px] text-gray-300 hidden sm:inline">
          ← swipe →
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {rapportNiveau === 3 && (
            <>
              <PdfExport />
              <DossierKnop />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Header (compact, for iframe) ────────────────────────────────────────────

function CompactHeader() {
  return (
    <header className="relative overflow-hidden" style={{ backgroundColor: 'rgba(128, 0, 0, 0.88)' }}>
      <div className="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/infofrankrijk-logo.png" alt="Infofrankrijk.com" className="h-6 brightness-0 invert" />
          <span className="text-white/30">|</span>
          <span className="font-heading font-semibold text-xs text-white tracking-wide">EnergiePortaal</span>
        </div>
        <a
          href="https://infofrankrijk.com/?s=energie&et_pb_searchform_submit=et_search_proccess&et_pb_include_posts=yes&et_pb_include_pages=yes"
          target="_top"
          className="text-white/60 hover:text-white text-xs transition-colors"
        >
          ← Infofrankrijk
        </a>
      </div>
    </header>
  )
}

// ─── Main app ────────────────────────────────────────────────────────────────

function AppContent() {
  const { toolState, setMobilePanel } = useToolState()
  const activePanel = toolState.mobilePanel

  useIframeAutoHeight()

  return (
    <div className="min-h-screen bg-gray-50 pb-14">
      <CompactHeader />
      <SwipePanel activePanel={activePanel} setActivePanel={setMobilePanel} />
      <FloatingEuro />
      <StickyToolbar activePanel={activePanel} setActivePanel={setMobilePanel} />
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

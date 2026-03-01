import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { PortaalInput, PortaalResult, SubsidieIntake } from '../engine/types.ts';
import { compute, createDefaultInput } from '../engine/compute.ts';
import { getZoneIdFromPostcode, getDepartementFromPostcode } from '../data/dept-zone-map.ts';
import { getHuisTypeById } from '../data/huizen-matrix.ts';
import { DEFAULTS } from '../engine/constants.ts';

// ─── Globale state ───────────────────────────────────────────────────────────

/**
 * ToolState bevat alle invoer als strings (voor formulier-binding)
 * plus afgeleide waarden voor de rekenmotor.
 *
 * Ondersteunt zowel de nieuwe 5-stappen flow als de oude 3-tab UI.
 */
export interface ToolState {
  // ── Stap 1: Locatie ──
  postcode: string;
  departement: string;
  zoneId: string;

  // ── Stap 2: Woningtype ──
  huisTypeId: string;
  woonoppervlak: string;
  verdiepingen: string;

  // ── Stap 3: Verfijning ──
  uMuur: string;
  uDak: string;
  uVloer: string;
  uRaam: string;
  muurOppervlak: string;
  dakOppervlak: string;
  vloerOppervlak: string;
  raamOppervlak: string;
  ach: string;
  plafondHoogte: string;

  // ── Stap 4: Energie ──
  mainHeating: string;
  mainEfficiency: string;
  auxHeating: string;
  auxFraction: string;
  auxEfficiency: string;
  hasHRV: string;              // 'ja' | 'nee'
  hrvEfficiency: string;       // %
  personen: string;
  douchesPerDag: string;
  literPerDouche: string;
  dhwSystem: string;
  dhwEfficiency: string;
  basisElektriciteit: string;
  hasEV: string;               // 'ja' | 'nee'
  evKmPerJaar: string;
  evVerbruik: string;
  hasPV: string;               // 'ja' | 'nee'
  pvVermogen: string;
  pvZelfverbruik: string;      // %
  hasZwembad: string;          // 'ja' | 'nee'
  zwembadOppervlak: string;
  zwembadMaanden: string;
  hasKoeling: string;          // 'ja' | 'nee'
  koelingEER: string;

  // ── Stap 5: Financieel ──
  setpoint: string;
  awaySetpoint: string;
  daysPresent: string;
  daysAway: string;
  prijsGas: string;
  prijsStookolie: string;
  prijsElektriciteit: string;
  prijsHout: string;
  exportTarief: string;

  // ── Subsidie ──
  subsidieUsage: string;
  subsidieAgeGt2: string;
  subsidieStage: string;
  subsidieWorkType: string;
  subsidieMprPath: string;
  subsidieHeatlossDone: string;

  // ── UI ──
  currentStep: number;
  activeTab: 'snel' | 'expert' | 'subsidie' | 'stappen';

  // ── Backward compatible (oude UI) ──
  oppervlakte: string;
  bouwjaar: string;
  isolatie: string;
  verwarming: string;
  tegemoetkomingen: string;
  muurIsolatie: string;
  dakIsolatie: string;
  vloerIsolatie: string;
  raamType: string;
  ventilatieType: string;
  hrvEfficientie: string;
  verwarmingScop: string;
  stookgrens: string;
  klimaatzone: string;
  dhwPersonen: string;
  heeftEV: string;
  heeftPV: string;
}

const DEFAULT_STATE: ToolState = {
  // Stap 1
  postcode: '',
  departement: '',
  zoneId: 'paris',

  // Stap 2
  huisTypeId: 'pavillon',
  woonoppervlak: '100',
  verdiepingen: '1',

  // Stap 3
  uMuur: '2.8',
  uDak: '3.0',
  uVloer: '1.2',
  uRaam: '4.0',
  muurOppervlak: '120',
  dakOppervlak: '80',
  vloerOppervlak: '80',
  raamOppervlak: '15',
  ach: '0.8',
  plafondHoogte: '2.5',

  // Stap 4
  mainHeating: 'gas',
  mainEfficiency: '0',
  auxHeating: 'geen',
  auxFraction: '0',
  auxEfficiency: '0',
  hasHRV: 'nee',
  hrvEfficiency: '75',
  personen: '2',
  douchesPerDag: '1',
  literPerDouche: '50',
  dhwSystem: 'gas',
  dhwEfficiency: '0',
  basisElektriciteit: '2500',
  hasEV: 'nee',
  evKmPerJaar: '15000',
  evVerbruik: '0.20',
  hasPV: 'nee',
  pvVermogen: '3',
  pvZelfverbruik: '30',
  hasZwembad: 'nee',
  zwembadOppervlak: '32',
  zwembadMaanden: '5',
  hasKoeling: 'nee',
  koelingEER: '3.0',

  // Stap 5
  setpoint: '20',
  awaySetpoint: '16',
  daysPresent: '300',
  daysAway: '65',
  prijsGas: '0.12',
  prijsStookolie: '0.14',
  prijsElektriciteit: '0.25',
  prijsHout: '0.06',
  exportTarief: '0.06',

  // Subsidie
  subsidieUsage: 'rp',
  subsidieAgeGt2: 'ja',
  subsidieStage: 'voor',
  subsidieWorkType: 'onbekend',
  subsidieMprPath: 'onbekend',
  subsidieHeatlossDone: 'nee',

  // UI
  currentStep: 1,
  activeTab: 'stappen',

  // Backward compatible
  oppervlakte: '100',
  bouwjaar: '1980',
  isolatie: 'matig',
  verwarming: 'gas',
  tegemoetkomingen: 'onbekend',
  muurIsolatie: 'geen',
  dakIsolatie: 'geen',
  vloerIsolatie: 'geen',
  raamType: 'enkel',
  ventilatieType: 'naturel',
  hrvEfficientie: '75',
  verwarmingScop: '0',
  stookgrens: '18',
  klimaatzone: 'H1b',
  dhwPersonen: '2',
  heeftEV: 'nee',
  heeftPV: 'nee',
};

// ─── State → PortaalInput converter ──────────────────────────────────────────

export function stateToPortaalInput(state: ToolState): PortaalInput {
  const defaults = createDefaultInput();

  const subsidieIntake: SubsidieIntake = {
    usage: (state.subsidieUsage as SubsidieIntake['usage']) || 'rp',
    ageGt2: (state.subsidieAgeGt2 as SubsidieIntake['ageGt2']) || 'ja',
    stage: (state.subsidieStage as SubsidieIntake['stage']) || 'voor',
    workType: (state.subsidieWorkType as SubsidieIntake['workType']) || 'onbekend',
    mprPath: (state.subsidieMprPath as SubsidieIntake['mprPath']) || 'onbekend',
    heatlossDone: state.subsidieHeatlossDone === 'ja',
  };

  return {
    postcode: state.postcode || defaults.postcode,
    departement: state.departement || getDepartementFromPostcode(state.postcode),
    zoneId: state.zoneId || defaults.zoneId,

    huisTypeId: state.huisTypeId || defaults.huisTypeId,
    woonoppervlak: Number(state.woonoppervlak) || defaults.woonoppervlak,
    verdiepingen: Number(state.verdiepingen) || defaults.verdiepingen,
    plafondHoogte: Number(state.plafondHoogte) || DEFAULTS.plafondHoogte,

    uMuur: Number(state.uMuur) || defaults.uMuur,
    uDak: Number(state.uDak) || defaults.uDak,
    uVloer: Number(state.uVloer) || defaults.uVloer,
    uRaam: Number(state.uRaam) || defaults.uRaam,

    oppervlakMuur: Number(state.muurOppervlak) || defaults.oppervlakMuur,
    oppervlakDak: Number(state.dakOppervlak) || defaults.oppervlakDak,
    oppervlakVloer: Number(state.vloerOppervlak) || defaults.oppervlakVloer,
    oppervlakRaam: Number(state.raamOppervlak) || defaults.oppervlakRaam,

    ach: Number(state.ach) || defaults.ach,

    mainHeating: (state.mainHeating as PortaalInput['mainHeating']) || defaults.mainHeating,
    mainEfficiency: Number(state.mainEfficiency) || 0,
    auxHeating: (state.auxHeating as PortaalInput['auxHeating']) || 'geen',
    auxFraction: (Number(state.auxFraction) || 0) / 100,
    auxEfficiency: Number(state.auxEfficiency) || 0,

    hasHRV: state.hasHRV === 'ja',
    hrvEfficiency: (Number(state.hrvEfficiency) || 75) / 100,

    personen: Number(state.personen) || DEFAULTS.personen,
    douchesPerDag: Number(state.douchesPerDag) || DEFAULTS.douchesPerDag,
    literPerDouche: Number(state.literPerDouche) || DEFAULTS.literPerDouche,
    dhwSystem: (state.dhwSystem as PortaalInput['dhwSystem']) || defaults.dhwSystem,
    dhwEfficiency: Number(state.dhwEfficiency) || 0,

    basisElektriciteit: Number(state.basisElektriciteit) || DEFAULTS.basisElektriciteit,

    hasEV: state.hasEV === 'ja',
    evKmPerJaar: Number(state.evKmPerJaar) || DEFAULTS.evKmPerJaar,
    evVerbruik: Number(state.evVerbruik) || DEFAULTS.evVerbruik,

    hasPV: state.hasPV === 'ja',
    pvVermogen: Number(state.pvVermogen) || DEFAULTS.pvVermogen,
    pvZelfverbruik: (Number(state.pvZelfverbruik) || 30) / 100,

    hasZwembad: state.hasZwembad === 'ja',
    zwembadOppervlak: Number(state.zwembadOppervlak) || 32,
    zwembadMaanden: Number(state.zwembadMaanden) || DEFAULTS.zwembadMaanden,

    hasKoeling: state.hasKoeling === 'ja',
    koelingEER: Number(state.koelingEER) || DEFAULTS.koelingEER,

    setpoint: Number(state.setpoint) || DEFAULTS.setpoint,
    awaySetpoint: Number(state.awaySetpoint) || DEFAULTS.awaySetpoint,
    daysPresent: Number(state.daysPresent) || DEFAULTS.daysPresent,
    daysAway: Number(state.daysAway) || DEFAULTS.daysAway,

    prijsGas: Number(state.prijsGas) || 0.12,
    prijsStookolie: Number(state.prijsStookolie) || 0.14,
    prijsElektriciteit: Number(state.prijsElektriciteit) || 0.25,
    prijsHout: Number(state.prijsHout) || 0.06,
    exportTarief: Number(state.exportTarief) || 0.06,

    subsidieIntake,
  };
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface ToolStateContextValue {
  toolState: ToolState;
  setField: (key: keyof ToolState, value: string) => void;
  setActiveTab: (tab: ToolState['activeTab']) => void;
  setCurrentStep: (step: number) => void;
  setPostcode: (postcode: string) => void;
  setHuisType: (huisTypeId: string) => void;
  result: PortaalResult;
  portaalInput: PortaalInput;
}

const ToolStateContext = createContext<ToolStateContextValue | null>(null);

export function ToolStateProvider({ children }: { children: React.ReactNode }) {
  const [toolState, setToolState] = useState<ToolState>(DEFAULT_STATE);

  const setField = useCallback((key: keyof ToolState, value: string) => {
    setToolState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setActiveTab = useCallback((tab: ToolState['activeTab']) => {
    setToolState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setToolState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const setPostcode = useCallback((postcode: string) => {
    const zoneId = getZoneIdFromPostcode(postcode);
    const departement = getDepartementFromPostcode(postcode);
    setToolState((prev) => ({ ...prev, postcode, zoneId, departement }));
  }, []);

  const setHuisType = useCallback((huisTypeId: string) => {
    setToolState((prev) => {
      const huisType = getHuisTypeById(huisTypeId);
      if (!huisType) return { ...prev, huisTypeId };

      const opp = Number(prev.woonoppervlak) || 100;
      return {
        ...prev,
        huisTypeId,
        uMuur: String(huisType.uMuur),
        uDak: String(huisType.uDak),
        uVloer: String(huisType.uVloer),
        uRaam: String(huisType.uRaam),
        ach: String(huisType.ach),
        muurOppervlak: String(Math.round(opp * huisType.oppervlakteRatios.muurPerM2)),
        dakOppervlak: String(Math.round(opp * huisType.oppervlakteRatios.dakPerM2)),
        vloerOppervlak: String(Math.round(opp * huisType.oppervlakteRatios.vloerPerM2)),
        raamOppervlak: String(Math.round(opp * huisType.oppervlakteRatios.raamPerM2)),
      };
    });
  }, []);

  const portaalInput = useMemo(() => stateToPortaalInput(toolState), [toolState]);
  const result = useMemo(() => compute(portaalInput), [portaalInput]);

  return (
    <ToolStateContext.Provider
      value={{
        toolState,
        setField,
        setActiveTab,
        setCurrentStep,
        setPostcode,
        setHuisType,
        result,
        portaalInput,
      }}
    >
      {children}
    </ToolStateContext.Provider>
  );
}

export function useToolState() {
  const ctx = useContext(ToolStateContext);
  if (!ctx) throw new Error('useToolState must be used inside ToolStateProvider');
  return ctx;
}

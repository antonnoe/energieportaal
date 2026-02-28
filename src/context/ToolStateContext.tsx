import React, { createContext, useContext, useState } from 'react';

/** Global shared state for all tool flows */
export interface ToolState {
  // Snel advies fields
  oppervlakte: string;
  bouwjaar: string;
  isolatie: string;
  verwarming: string;

  // Allowances
  tegemoetkomingen: string;

  // Expert mode — envelope
  muurIsolatie: string;
  dakIsolatie: string;
  vloerIsolatie: string;
  raamType: string;
  muurOppervlak: string;
  dakOppervlak: string;
  vloerOppervlak: string;
  raamOppervlak: string;

  // Expert mode — ventilation
  ventilatieType: string;
  hrvEfficientie: string;  // %

  // Expert mode — heating system
  verwarmingScop: string;
  stookgrens: string;      // °C

  // Expert mode — climate
  klimaatzone: string;

  // Expert mode — DHW
  dhwPersonen: string;

  // Expert mode — electricity
  basisElektriciteit: string;  // kWh/y

  // Expert mode — EV
  heeftEV: string;             // 'ja' | 'nee'
  evKmPerJaar: string;

  // Expert mode — PV
  heeftPV: string;             // 'ja' | 'nee'
  pvVermogen: string;          // kWp
  pvZelfverbruik: string;      // %
  exportTarief: string;        // €/kWh

  // Active tab
  activeTab: 'snel' | 'expert' | 'subsidie';
}

const DEFAULT_STATE: ToolState = {
  oppervlakte: '100',
  bouwjaar: '1980',
  isolatie: 'matig',
  verwarming: 'gas',
  tegemoetkomingen: 'onbekend',

  muurIsolatie: 'geen',
  dakIsolatie: 'geen',
  vloerIsolatie: 'geen',
  raamType: 'enkel',
  muurOppervlak: '',
  dakOppervlak: '',
  vloerOppervlak: '',
  raamOppervlak: '',

  ventilatieType: 'naturel',
  hrvEfficientie: '75',

  verwarmingScop: '0',
  stookgrens: '18',

  klimaatzone: 'H1b',

  dhwPersonen: '2',
  basisElektriciteit: '2500',

  heeftEV: 'nee',
  evKmPerJaar: '15000',

  heeftPV: 'nee',
  pvVermogen: '3',
  pvZelfverbruik: '30',
  exportTarief: '0.06',

  activeTab: 'snel',
};

interface ToolStateContextValue {
  toolState: ToolState;
  setField: (key: keyof ToolState, value: string) => void;
  setActiveTab: (tab: ToolState['activeTab']) => void;
}

const ToolStateContext = createContext<ToolStateContextValue | null>(null);

export function ToolStateProvider({ children }: { children: React.ReactNode }) {
  const [toolState, setToolState] = useState<ToolState>(DEFAULT_STATE);

  function setField(key: keyof ToolState, value: string) {
    setToolState((prev) => ({ ...prev, [key]: value }));
  }

  function setActiveTab(tab: ToolState['activeTab']) {
    setToolState((prev) => ({ ...prev, activeTab: tab }));
  }

  return (
    <ToolStateContext.Provider value={{ toolState, setField, setActiveTab }}>
      {children}
    </ToolStateContext.Provider>
  );
}

export function useToolState() {
  const ctx = useContext(ToolStateContext);
  if (!ctx) throw new Error('useToolState must be used inside ToolStateProvider');
  return ctx;
}

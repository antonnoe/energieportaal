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

  // Expert mode extras
  muurIsolatie: string;
  dakIsolatie: string;
  raamType: string;

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
  raamType: 'enkel',
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

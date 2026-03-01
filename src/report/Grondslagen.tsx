import { useState } from 'react';
import { useToolState } from '../context/ToolStateContext';
import { getHuisTypeById } from '../data/huizen-matrix';
import { BRONNEN } from '../data/sources';

export function Grondslagen() {
  const [open, setOpen] = useState(false);
  const { result, toolState } = useToolState();
  const { debug } = result;
  const huisType = getHuisTypeById(toolState.huisTypeId);

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 text-left"
      >
        <h2 className="font-heading text-lg font-bold text-primary">Grondslagen</h2>
        <span className="text-gray-400 text-lg">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="bg-gray-50 rounded-lg p-4 text-xs font-mono leading-relaxed space-y-4 mt-1 overflow-x-auto">
          {/* Woning */}
          <div>
            <p className="font-bold text-gray-700 mb-1">WONING</p>
            <p>Type: {huisType?.naam ?? toolState.huisTypeId} ({huisType?.periode})</p>
            <p>Zone: {debug.zone.name} ({debug.zone.hdd} graaddagen)</p>
            <p>Oppervlak: {toolState.woonoppervlak} m² x {toolState.verdiepingen} verdieping(en) x {toolState.plafondHoogte} m = {debug.volume} m³</p>
          </div>

          {/* U-waarden */}
          <div>
            <p className="font-bold text-gray-700 mb-1">U-WAARDEN (W/m²·K)</p>
            <p>Ramen: {toolState.uRaam} ({toolState.raamOppervlak} m²)  → UA = {debug.uaRaam.toFixed(1)} W/K</p>
            <p>Dak:   {toolState.uDak} ({toolState.dakOppervlak} m²)    → UA = {debug.uaDak.toFixed(1)} W/K</p>
            <p>Muren: {toolState.uMuur} ({toolState.muurOppervlak} m²)  → UA = {debug.uaMuur.toFixed(1)} W/K</p>
            <p>Vloer: {toolState.uVloer} ({toolState.vloerOppervlak} m²) → UA = {debug.uaVloer.toFixed(1)} W/K</p>
          </div>

          {/* Warmteverlies */}
          <div>
            <p className="font-bold text-gray-700 mb-1">WARMTEVERLIES</p>
            <p>Htr:   UA = {result.uaWK} W/K</p>
            <p>Hvent: 0.34 × {debug.volume} × {debug.achGebruikt} = {debug.hventVoorHRV.toFixed(1)} W/K</p>
            {toolState.hasHRV === 'ja' && (
              <p>HventEff: {debug.hventVoorHRV.toFixed(1)} × (1 - {(Number(toolState.hrvEfficiency) / 100).toFixed(2)}) = {result.hventEffWK} W/K</p>
            )}
            <p>Htot:  {result.hTotaalWK} W/K</p>
          </div>

          {/* HDD */}
          <div>
            <p className="font-bold text-gray-700 mb-1">GRAADDAGEN (HDD)</p>
            <p>Basis HDD: {debug.hddBasis}</p>
            <p>Setpoint aanwezig: {debug.setpoint}°C → HDD_corr = {debug.hddCorrPresent.toFixed(0)} ({(debug.fracPresent * 100).toFixed(0)}% van jaar)</p>
            <p>Setpoint afwezig:  {debug.awaySetpoint}°C → HDD_corr = {debug.hddCorrAway.toFixed(0)} ({(debug.fracAway * 100).toFixed(0)}% van jaar)</p>
          </div>

          {/* Energie */}
          <div>
            <p className="font-bold text-gray-700 mb-1">ENERGIE</p>
            <p>Warmtevraag thermisch: {result.warmtevraagThermisch.toLocaleString('nl-NL')} kWh/jaar</p>
            <p>Hoofdverwarming ({toolState.mainHeating}, η={debug.mainEff}): {result.verwarmingHoofd.toLocaleString('nl-NL')} kWh ({(debug.mainFrac * 100).toFixed(0)}%)</p>
            {result.verwarmingBij > 0 && (
              <p>Bijverwarming ({toolState.auxHeating}, η={debug.auxEff}): {result.verwarmingBij.toLocaleString('nl-NL')} kWh ({(debug.auxFrac * 100).toFixed(0)}%)</p>
            )}
            <p>DHW: {debug.dhwLitersPerDag} L/dag × 365 × ΔT={debug.dhwDeltaT}°C → {result.dhwThermisch.toLocaleString('nl-NL')} kWh therm → {result.dhwInput.toLocaleString('nl-NL')} kWh (η={debug.dhwEff})</p>
            <p>DPE: {result.totaalVerbruikKwh.toLocaleString('nl-NL')} / {toolState.woonoppervlak} = {Math.round(result.dpe.kwhPerM2)} kWh/m²/jaar → {result.dpe.letter}</p>
            {result.dpe.kwhTotVolgendeKlasse > 0 && result.dpe.letter !== 'A' && (
              <p className="text-green-700">  Tot volgende klasse: nog {Math.round(result.dpe.kwhTotVolgendeKlasse)} kWh/m² besparen</p>
            )}
          </div>

          {/* PV */}
          {result.pvProductieKwh > 0 && (
            <div>
              <p className="font-bold text-gray-700 mb-1">ZONNEPANELEN</p>
              <p>Vermogen: {toolState.pvVermogen} kWp × {debug.pvYieldZone} kWh/kWp = {result.pvProductieKwh} kWh/jaar</p>
              <p>Zelfverbruik: {result.pvZelfverbruikKwh} kWh ({(Number(toolState.pvZelfverbruik))}%)</p>
              <p>Export: {result.pvExportKwh} kWh</p>
            </div>
          )}

          {/* Bronnen */}
          <div>
            <p className="font-bold text-gray-700 mb-1">BRONNEN</p>
            {BRONNEN.map((bron) => (
              <p key={bron.id}>
                <a href={bron.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  {bron.titel}
                </a>
              </p>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

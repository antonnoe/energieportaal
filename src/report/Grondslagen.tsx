import { useState } from 'react';
import { useToolState } from '../context/ToolStateContext';
import { getHuisTypeById } from '../data/huizen-matrix';
import { BRONNEN } from '../data/sources';

export function Grondslagen() {
  const [open, setOpen] = useState(false);
  const { result, toolState, portaalInput } = useToolState();
  const { debug } = result;
  const huisType = getHuisTypeById(toolState.huisTypeId);

  const prijsLabel = (type: string): string => {
    const labels: Record<string, string> = {
      gas: 'gas', stookolie: 'stookolie', warmtepomp: 'elektriciteit',
      elektrisch: 'elektriciteit', hout: 'hout',
    };
    return labels[type] ?? type;
  };

  const prijsPerKwh = (type: string): number => {
    switch (type) {
      case 'gas': return debug.prijzen.gas;
      case 'stookolie': return debug.prijzen.stookolie;
      case 'warmtepomp': case 'elektrisch': return debug.prijzen.elektriciteit;
      case 'hout': return debug.prijzen.hout;
      default: return 0;
    }
  };

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
            <p>Zone: {debug.zone.name} ({debug.zone.hdd} graaddagen basis)</p>
            <p>Oppervlak: {toolState.woonoppervlak} m² × {toolState.verdiepingen} verdieping(en) × {toolState.plafondHoogte} m = {debug.volume} m³</p>
          </div>

          {/* U-waarden */}
          <div>
            <p className="font-bold text-gray-700 mb-1">U-WAARDEN (W/m²·K)</p>
            <p>Ramen: {toolState.uRaam} × {toolState.raamOppervlak} m² = UA {debug.uaRaam.toFixed(1)} W/K</p>
            <p>Dak:   {toolState.uDak} × {toolState.dakOppervlak} m² = UA {debug.uaDak.toFixed(1)} W/K</p>
            <p>Muren: {toolState.uMuur} × {toolState.muurOppervlak} m² = UA {debug.uaMuur.toFixed(1)} W/K</p>
            <p>Vloer: {toolState.uVloer} × {toolState.vloerOppervlak} m² = UA {debug.uaVloer.toFixed(1)} W/K</p>
            <p className="font-semibold">UA totaal: {result.uaWK} W/K</p>
          </div>

          {/* Warmteverlies */}
          <div>
            <p className="font-bold text-gray-700 mb-1">WARMTEVERLIES</p>
            <p>Htr (transmissie): UA = {result.uaWK} W/K</p>
            <p>Hvent (ventilatie): 0.34 × {debug.volume} m³ × {debug.achGebruikt} ACH = {debug.hventVoorHRV.toFixed(1)} W/K</p>
            {toolState.hasHRV === 'ja' && (
              <p>HventEff (na WTW): {debug.hventVoorHRV.toFixed(1)} × (1 - {(Number(toolState.hrvEfficiency) / 100).toFixed(2)}) = {result.hventEffWK} W/K</p>
            )}
            <p className="font-semibold">Htot = UA + Hvent{toolState.hasHRV === 'ja' ? 'Eff' : ''} = {result.uaWK} + {result.hventEffWK} = {result.hTotaalWK} W/K</p>
          </div>

          {/* HDD — C7: gewogen HDD_eff */}
          <div>
            <p className="font-bold text-gray-700 mb-1">GRAADDAGEN (HDD)</p>
            <p>Basis HDD zone: {debug.hddBasis} (Tref = {debug.Tref}°C)</p>
            <p>HDD_aanwezig: {debug.hddBasis} × max(0, ({debug.setpoint} - {debug.Tref}) / (18 - {debug.Tref})) = {debug.hddCorrPresent.toFixed(0)}</p>
            <p>HDD_afwezig:  {debug.hddBasis} × max(0, ({debug.awaySetpoint} - {debug.Tref}) / (18 - {debug.Tref})) = {debug.hddCorrAway.toFixed(0)}</p>
            <p className="font-semibold">
              HDD_eff (gewogen): {debug.hddCorrPresent.toFixed(0)} × {(debug.fracPresent * 100).toFixed(0)}% + {debug.hddCorrAway.toFixed(0)} × {(debug.fracAway * 100).toFixed(0)}% = {debug.hddEff.toFixed(0)}
            </p>
          </div>

          {/* Warmtevraag */}
          <div>
            <p className="font-bold text-gray-700 mb-1">WARMTEVRAAG</p>
            <p>Thermisch: Htot × HDD_eff × 24 / 1000 = {result.hTotaalWK} × {debug.hddEff.toFixed(0)} × 24 / 1000 = {result.warmtevraagThermisch.toLocaleString('nl-NL')} kWh/jaar</p>
          </div>

          {/* Energie */}
          <div>
            <p className="font-bold text-gray-700 mb-1">ENERGIEVERBRUIK</p>
            <p>Hoofdverwarming ({toolState.mainHeating}, η={debug.mainEff}): {result.warmtevraagThermisch.toLocaleString('nl-NL')} × {(debug.mainFrac * 100).toFixed(0)}% / {debug.mainEff} = {result.verwarmingHoofd.toLocaleString('nl-NL')} kWh</p>
            {result.verwarmingBij > 0 && (
              <p>Bijverwarming ({toolState.auxHeating}, η={debug.auxEff}): {result.warmtevraagThermisch.toLocaleString('nl-NL')} × {(debug.auxFrac * 100).toFixed(0)}% / {debug.auxEff} = {result.verwarmingBij.toLocaleString('nl-NL')} kWh</p>
            )}
            <p>DHW: {debug.dhwLitersPerDag} L/dag × 365 × ΔT={debug.dhwDeltaT}°C → {result.dhwThermisch.toLocaleString('nl-NL')} kWh therm / η={debug.dhwEff} = {result.dhwInput.toLocaleString('nl-NL')} kWh</p>
            <p>Basiselektriciteit: {result.elektriciteitBasis.toLocaleString('nl-NL')} kWh</p>
            {result.evKwh > 0 && (
              <p>Elektrische auto: {portaalInput.evKmPerJaar.toLocaleString('nl-NL')} km × {portaalInput.evVerbruik} kWh/km = {result.evKwh.toLocaleString('nl-NL')} kWh</p>
            )}
            {result.zwembadKwh > 0 && (
              <p>Zwembad: {result.zwembadKwh.toLocaleString('nl-NL')} kWh</p>
            )}
            {result.koelingKwh > 0 && (
              <p>Koeling: {result.koelingKwh.toLocaleString('nl-NL')} kWh</p>
            )}
            <p className="font-semibold mt-1">
              Totaal verbruik: {result.verwarmingTotaal.toLocaleString('nl-NL')} + {result.dhwInput.toLocaleString('nl-NL')} + {result.elektriciteitBasis.toLocaleString('nl-NL')}
              {result.evKwh > 0 ? ` + ${result.evKwh.toLocaleString('nl-NL')}` : ''}
              {result.zwembadKwh > 0 ? ` + ${result.zwembadKwh.toLocaleString('nl-NL')}` : ''}
              {result.koelingKwh > 0 ? ` + ${result.koelingKwh.toLocaleString('nl-NL')}` : ''}
              {' = '}{result.totaalVerbruikKwh.toLocaleString('nl-NL')} kWh/jaar
            </p>
          </div>

          {/* DPE-indicatie — C8 */}
          <div>
            <p className="font-bold text-gray-700 mb-1">DPE-INDICATIE</p>
            <p>{result.totaalVerbruikKwh.toLocaleString('nl-NL')} kWh / {toolState.woonoppervlak} m² = {Math.round(result.dpe.kwhPerM2)} kWh/m²/jaar → {result.dpe.letter}</p>
            {result.dpe.kwhTotVolgendeKlasse > 0 && result.dpe.letter !== 'A' && (
              <p className="text-green-700">  Tot volgende klasse: nog {Math.round(result.dpe.kwhTotVolgendeKlasse)} kWh/m² besparen</p>
            )}
            <p className="text-gray-500 italic">NB: Dit is een indicatieve schatting, geen officieel DPE-rapport.</p>
          </div>

          {/* Energieprijzen — C9 */}
          <div>
            <p className="font-bold text-gray-700 mb-1">ENERGIEPRIJZEN (feb 2026)</p>
            <p>Gas:          {debug.prijzen.gas} €/kWh (PCI)</p>
            <p>Elektriciteit: {debug.prijzen.elektriciteit} €/kWh (TRV)</p>
            <p>Stookolie:    {debug.prijzen.stookolie} €/kWh (= 1,18 €/L ÷ 10 kWh/L)</p>
            <p>Hout:         {debug.prijzen.hout} €/kWh (= 85 €/stère ÷ 1500 kWh)</p>
            {portaalInput.exportTarief > 0 && (
              <p>PV-export:    {portaalInput.exportTarief} €/kWh</p>
            )}
          </div>

          {/* Kosten per categorie — C6/C9 */}
          <div>
            <p className="font-bold text-gray-700 mb-1">KOSTEN PER CATEGORIE</p>
            <p>Hoofdverwarming ({toolState.mainHeating}): {result.verwarmingHoofd.toLocaleString('nl-NL')} kWh × {prijsPerKwh(toolState.mainHeating)} €/kWh ({prijsLabel(toolState.mainHeating)}) = € {Math.round(debug.kostenVerwarmingHoofd).toLocaleString('nl-NL')}</p>
            {result.verwarmingBij > 0 && (
              <p>Bijverwarming ({toolState.auxHeating}): {result.verwarmingBij.toLocaleString('nl-NL')} kWh × {prijsPerKwh(toolState.auxHeating)} €/kWh ({prijsLabel(toolState.auxHeating)}) = € {Math.round(debug.kostenVerwarmingBij).toLocaleString('nl-NL')}</p>
            )}
            <p>Tapwater ({toolState.dhwSystem}): {result.dhwInput.toLocaleString('nl-NL')} kWh × {prijsPerKwh(toolState.dhwSystem)} €/kWh ({prijsLabel(toolState.dhwSystem)}) = € {Math.round(debug.kostenDhw).toLocaleString('nl-NL')}</p>
            <p>Basiselektriciteit: {result.elektriciteitBasis.toLocaleString('nl-NL')} kWh × {debug.prijzen.elektriciteit} €/kWh = € {Math.round(debug.kostenElektriciteit).toLocaleString('nl-NL')}</p>
            {result.evKwh > 0 && (
              <p>Elektrische auto: {result.evKwh.toLocaleString('nl-NL')} kWh × {debug.prijzen.elektriciteit} €/kWh = € {Math.round(debug.kostenEV).toLocaleString('nl-NL')}</p>
            )}
            {result.zwembadKwh > 0 && (
              <p>Zwembad: {result.zwembadKwh.toLocaleString('nl-NL')} kWh × {debug.prijzen.elektriciteit} €/kWh = € {Math.round(debug.kostenZwembad).toLocaleString('nl-NL')}</p>
            )}
            {result.koelingKwh > 0 && (
              <p>Koeling: {result.koelingKwh.toLocaleString('nl-NL')} kWh × {debug.prijzen.elektriciteit} €/kWh = € {Math.round(debug.kostenKoeling).toLocaleString('nl-NL')}</p>
            )}
            <p className="font-semibold mt-1">
              Totaal kosten: € {Math.round(debug.kostenVerwarmingHoofd + debug.kostenVerwarmingBij).toLocaleString('nl-NL')} (verwarming) + € {Math.round(debug.kostenDhw).toLocaleString('nl-NL')} (DHW) + € {Math.round(debug.kostenElektriciteit + debug.kostenEV + debug.kostenZwembad + debug.kostenKoeling).toLocaleString('nl-NL')} (elektriciteit) = € {result.kostenTotaal.toLocaleString('nl-NL')}/jaar
            </p>
            {result.pvBesparing > 0 && (
              <>
                <p className="text-green-700">PV-besparing: € {result.pvBesparing.toLocaleString('nl-NL')}/jaar</p>
                <p className="font-semibold text-green-700">Netto kosten: € {result.nettoKosten.toLocaleString('nl-NL')}/jaar</p>
              </>
            )}
          </div>

          {/* PV */}
          {result.pvProductieKwh > 0 && (
            <div>
              <p className="font-bold text-gray-700 mb-1">ZONNEPANELEN</p>
              <p>Vermogen: {toolState.pvVermogen} kWp × {debug.pvYieldZone} kWh/kWp = {result.pvProductieKwh} kWh/jaar</p>
              <p>Zelfverbruik: {result.pvZelfverbruikKwh} kWh ({(Number(toolState.pvZelfverbruik))}%) → besparing {result.pvZelfverbruikKwh} × {debug.prijzen.elektriciteit} = € {Math.round(result.pvZelfverbruikKwh * debug.prijzen.elektriciteit)}</p>
              <p>Export: {result.pvExportKwh} kWh × {portaalInput.exportTarief} €/kWh = € {Math.round(result.pvExportKwh * portaalInput.exportTarief)}</p>
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

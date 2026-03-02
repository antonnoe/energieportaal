import { useState } from 'react';
import { useToolState } from '../context/ToolStateContext';
import { getHuisTypeById } from '../data/huizen-matrix';
import { BRONNEN } from '../data/sources';
import { PRIJS_BRONNEN } from '../engine/constants';
import { AIAdviseur } from '../components/AIAdviseur';

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
        <h2 className="font-heading text-lg font-bold text-primary flex items-center">Grondslagen <AIAdviseur veld="Grondslagen" /></h2>
        <span className="text-gray-400 text-lg">{open ? '\u25B2' : '\u25BC'}</span>
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
            <p>Ramen: {toolState.uRaam} ({toolState.raamOppervlak} m²)  &rarr; UA = {debug.uaRaam.toFixed(1)} W/K</p>
            <p>Dak:   {toolState.uDak} ({toolState.dakOppervlak} m²)    &rarr; UA = {debug.uaDak.toFixed(1)} W/K</p>
            <p>Muren: {toolState.uMuur} ({toolState.muurOppervlak} m²)  &rarr; UA = {debug.uaMuur.toFixed(1)} W/K</p>
            <p>Vloer: {toolState.uVloer} ({toolState.vloerOppervlak} m²) &rarr; UA = {debug.uaVloer.toFixed(1)} W/K</p>
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

          {/* HDD — C7: gewogen berekening */}
          <div>
            <p className="font-bold text-gray-700 mb-1">GRAADDAGEN</p>
            <p>Basis HDD zone: {debug.hddBasis} K·d</p>
            <p>Setpoint aanwezig: {debug.setpoint}°C ({(debug.fracPresent * 100).toFixed(0)}% van jaar) &rarr; HDD_corr = {Math.round(debug.hddCorrPresent)}</p>
            <p>Setpoint afwezig:  {debug.awaySetpoint}°C ({(debug.fracAway * 100).toFixed(0)}% van jaar) &rarr; HDD_corr = {Math.round(debug.hddCorrAway)}</p>
            <p className="font-semibold">Gewogen HDD_eff = {Math.round(debug.hddCorrPresent)} × {debug.fracPresent.toFixed(2)} + {Math.round(debug.hddCorrAway)} × {debug.fracAway.toFixed(2)} = {Math.round(debug.hddEffGewogen)} K·d</p>
            {debug.fracPresent + debug.fracAway < 0.999 && (
              <p className="text-amber-700">Aanwezig: {(debug.fracPresent * 100).toFixed(0)}% | Afwezig: {(debug.fracAway * 100).toFixed(0)}% | Leegstand: {((1 - debug.fracPresent - debug.fracAway) * 100).toFixed(0)}% (geen verwarming)</p>
            )}
          </div>

          {/* F7: Transparante energieberekening */}
          <div>
            <p className="font-bold text-gray-700 mb-1">ENERGIEVERBRUIK (kWh/jaar)</p>
            <p>  Warmtevraag thermisch:         {result.warmtevraagThermisch.toLocaleString('nl-NL')} kWh</p>
            <p>  Hoofdverwarming ({toolState.mainHeating}, &eta;={debug.mainEff}): {result.verwarmingHoofd.toLocaleString('nl-NL')} kWh ({(debug.mainFrac * 100).toFixed(0)}%)</p>
            {result.verwarmingBij > 0 && (
              <p>  Bijverwarming ({toolState.auxHeating}, &eta;={debug.auxEff}): {result.verwarmingBij.toLocaleString('nl-NL')} kWh ({(debug.auxFrac * 100).toFixed(0)}%)</p>
            )}
            <p>  Verwarming totaal (final):     {result.verwarmingTotaal.toLocaleString('nl-NL')} kWh</p>
            <p>  DHW ({debug.dhwLitersPerDag} L/dag, &eta;={debug.dhwEff}): {result.dhwInput.toLocaleString('nl-NL')} kWh (therm: {result.dhwThermisch.toLocaleString('nl-NL')}){toolState.dhwSystem === 'hout' ? ' ⚠️ (ongebruikelijk — bevestigd door gebruiker)' : ''}</p>
            <p>  Basiselektriciteit:            {result.elektriciteitBasis.toLocaleString('nl-NL')} kWh</p>
            {result.evKwh > 0 && <p>  EV laden:                      {result.evKwh.toLocaleString('nl-NL')} kWh</p>}
            {result.zwembadKwh > 0 && <p>  Zwembad:                       {result.zwembadKwh.toLocaleString('nl-NL')} kWh</p>}
            {result.koelingKwh > 0 && <p>  Koeling:                       {result.koelingKwh.toLocaleString('nl-NL')} kWh</p>}
            <p className="border-t border-gray-300 pt-1 font-semibold">
              TOTAAL: {result.verwarmingTotaal.toLocaleString('nl-NL')} + {result.dhwInput.toLocaleString('nl-NL')} + {result.elektriciteitBasis.toLocaleString('nl-NL')}
              {result.evKwh > 0 ? ` + ${result.evKwh.toLocaleString('nl-NL')}` : ''}
              {result.zwembadKwh > 0 ? ` + ${result.zwembadKwh.toLocaleString('nl-NL')}` : ''}
              {result.koelingKwh > 0 ? ` + ${result.koelingKwh.toLocaleString('nl-NL')}` : ''}
              {' '}= {result.totaalVerbruikKwh.toLocaleString('nl-NL')} kWh
            </p>
          </div>

          {/* DPE-indicatie */}
          <div>
            <p className="font-bold text-gray-700 mb-1">DPE-INDICATIE</p>
            <p>DPE-verbruik (zonder EV/zwembad/koeling): {result.dpeVerbruikKwh.toLocaleString('nl-NL')} kWh</p>
            <p>{result.dpeVerbruikKwh.toLocaleString('nl-NL')} / {toolState.woonoppervlak} m² = {Math.round(result.dpe.kwhPerM2)} kWh/m²/jaar &rarr; {result.dpe.letter}</p>
            {result.dpe.kwhTotVolgendeKlasse > 0 && result.dpe.letter !== 'A' && (
              <p className="text-green-700">  Tot volgende klasse: nog {Math.round(result.dpe.kwhTotVolgendeKlasse)} kWh/m² besparen</p>
            )}
            <p className="text-gray-500 mt-1 italic">Indicatieve berekening op basis van finale energie en uw invoer. Geen offici&euml;le DPE.</p>
          </div>

          {/* F8: Energieprijzen met bronnen */}
          <div>
            <p className="font-bold text-gray-700 mb-1">ENERGIEPRIJZEN</p>
            {Object.entries(PRIJS_BRONNEN).map(([key, pb]) => (
              <p key={key}>{pb.label}: {pb.prijsPerKwh} &mdash; {pb.bron}</p>
            ))}
            <p className="text-gray-500 mt-1 italic">Prijzen per feb 2026. Gebruiker kan handmatig aanpassen in Stap 5.</p>
          </div>

          {/* Kostenberekening transparant */}
          <div>
            <p className="font-bold text-gray-700 mb-1">KOSTEN (&euro;/jaar)</p>
            <p>  Verwarming:    {result.verwarmingTotaal.toLocaleString('nl-NL')} kWh × prijs = &euro; {result.kostenVerwarming.toLocaleString('nl-NL')}</p>
            <p>  Tapwater:      {result.dhwInput.toLocaleString('nl-NL')} kWh × prijs = &euro; {result.kostenDhw.toLocaleString('nl-NL')}</p>
            <p>  Elektriciteit: {(result.elektriciteitBasis + result.evKwh + result.zwembadKwh + result.koelingKwh).toLocaleString('nl-NL')} kWh × {debug.prijzen.elektriciteit} = &euro; {result.kostenElektriciteit.toLocaleString('nl-NL')}</p>
            <p className="border-t border-gray-300 pt-1 font-semibold">
              TOTAAL: &euro; {result.kostenVerwarming.toLocaleString('nl-NL')} + &euro; {result.kostenDhw.toLocaleString('nl-NL')} + &euro; {result.kostenElektriciteit.toLocaleString('nl-NL')} = &euro; {result.kostenTotaal.toLocaleString('nl-NL')}/jaar (&euro; {Math.round(result.kostenTotaal / 12).toLocaleString('nl-NL')}/maand)
            </p>
            {result.pvBesparing > 0 && (
              <>
                <p className="text-green-700">  PV-besparing: -&euro; {result.pvBesparing.toLocaleString('nl-NL')}</p>
                <p className="font-semibold">  Netto kosten: &euro; {result.nettoKosten.toLocaleString('nl-NL')}/jaar (&euro; {Math.round(result.nettoKosten / 12).toLocaleString('nl-NL')}/maand)</p>
              </>
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

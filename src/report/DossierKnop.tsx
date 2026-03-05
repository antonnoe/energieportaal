import { useMemo } from 'react';
import { useToolState } from '../context/ToolStateContext';
import { getHuisTypeById } from '../data/huizen-matrix';
import { getZoneById } from '../engine/constants';
import { berekenSavings } from '../engine/savings';
import { evaluateSubsidie } from '../engine/subsidie-rules';

export function DossierKnop() {
  const { toolState, result, portaalInput } = useToolState();
  const zone = getZoneById(toolState.zoneId);
  const huisType = getHuisTypeById(toolState.huisTypeId);
  const savings = useMemo(() => berekenSavings(portaalInput, result), [portaalInput, result]);
  const subsidie = useMemo(() => evaluateSubsidie({ ...portaalInput.subsidieIntake, dpeLetter: result.dpe.letter }), [portaalInput.subsidieIntake, result.dpe.letter]);

  const handleClick = () => {
    const datum = new Date().toLocaleDateString('nl-NL');
    const dpe = result.dpe;

    const title = `EnergiePortaal: ${huisType?.naam ?? toolState.huisTypeId} ${toolState.woonoppervlak}m² | DPE ${dpe.letter} | €${result.kostenTotaal.toLocaleString('nl-NL')}/jaar`;

    const lijn = '─'.repeat(44);
    const lines: string[] = [];

    const kv = (label: string, value: string | number) =>
      lines.push(`  ${label.padEnd(26)} ${value}`);
    const sectie = (titel: string) => {
      lines.push('');
      lines.push(titel.toUpperCase());
      lines.push('─'.repeat(titel.length));
    };

    // Header
    lines.push(lijn);
    lines.push('ENERGIEPORTAAL — RAPPORTAGE');
    lines.push(`Datum: ${datum}`);
    lines.push(lijn);

    // Woninggegevens
    sectie('Woninggegevens');
    kv('Type:', `${huisType?.naam ?? toolState.huisTypeId} (${huisType?.periode ?? ''})`);
    kv('Postcode:', `${toolState.postcode} (dept. ${toolState.departement})`);
    kv('Klimaatzone:', `${zone.name} — ${zone.hdd} graaddagen`);
    kv('PV-opbrengst zone:', `${zone.pv} kWh/kWp/jaar`);
    kv('Oppervlak:', `${toolState.woonoppervlak} m2`);
    kv('Verdiepingen:', toolState.verdiepingen);
    kv('Plafondhoogte:', `${toolState.plafondHoogte} m`);
    kv('Volume:', `${result.debug.volume.toLocaleString('nl-NL')} m3`);

    // Isolatiewaarden
    sectie('Isolatiewaarden (U-waarden)');
    kv('Muur:', `U=${toolState.uMuur} W/m2K — ${toolState.muurOppervlak} m2`);
    kv('Dak:', `U=${toolState.uDak} W/m2K — ${toolState.dakOppervlak} m2`);
    kv('Vloer:', `U=${toolState.uVloer} W/m2K — ${toolState.vloerOppervlak} m2`);
    kv('Ramen:', `U=${toolState.uRaam} W/m2K — ${toolState.raamOppervlak} m2`);
    kv('Luchtwisseling (ACH):', `${result.debug.achGebruikt} /uur`);
    if (toolState.hasHRV === 'ja') {
      kv('WTW-installatie:', `${toolState.hrvEfficiency}% rendement`);
    }

    // Warmteverlies
    sectie('Warmteverlies');
    kv('Transmissie (Htr):', `${result.uaWK} W/K`);
    kv('Ventilatie (Hvent):', `${result.hventEffWK} W/K`);
    kv('Totaal (H):', `${result.hTotaalWK} W/K`);
    kv('Warmtevraag:', `${result.warmtevraagThermisch.toLocaleString('nl-NL')} kWh/jaar`);

    // Verwarmingssystemen
    sectie('Verwarmingssystemen');
    kv('Hoofdverwarming:', `${toolState.mainHeating} — ${result.verwarmingHoofd.toLocaleString('nl-NL')} kWh/jaar`);
    if (result.verwarmingBij > 0 && toolState.auxHeating) {
      kv('Bijverwarming:', `${toolState.auxHeating} — ${result.verwarmingBij.toLocaleString('nl-NL')} kWh/jaar`);
    }
    kv('Tapwater (DHW):', `${toolState.dhwSystem} — ${result.dhwInput.toLocaleString('nl-NL')} kWh/jaar`);
    kv('Basiselektriciteit:', `${result.elektriciteitBasis.toLocaleString('nl-NL')} kWh/jaar`);
    if (result.evKwh > 0) kv('Elektrische auto:', `${result.evKwh.toLocaleString('nl-NL')} kWh/jaar`);
    if (result.zwembadKwh > 0) kv('Zwembad:', `${result.zwembadKwh.toLocaleString('nl-NL')} kWh/jaar`);
    if (result.koelingKwh > 0) kv('Koeling:', `${result.koelingKwh.toLocaleString('nl-NL')} kWh/jaar`);
    kv('Totaal verbruik:', `${result.totaalVerbruikKwh.toLocaleString('nl-NL')} kWh/jaar`);

    // Energiekosten
    sectie('Energiekosten');
    kv('Totale kosten:', `EUR ${result.kostenTotaal.toLocaleString('nl-NL')}/jaar`);
    kv('Verwarming:', `EUR ${Math.round(result.kostenVerwarming).toLocaleString('nl-NL')}/jaar`);
    kv('Tapwater:', `EUR ${Math.round(result.kostenDhw).toLocaleString('nl-NL')}/jaar`);
    kv('Netto kosten (incl. PV):', `EUR ${result.nettoKosten.toLocaleString('nl-NL')}/jaar`);
    kv('CO2-uitstoot:', `${result.co2Kg.toLocaleString('nl-NL')} kg/jaar`);

    // DPE
    sectie('DPE-indicatie');
    kv('Klasse:', `${dpe.letter} — ${Math.round(dpe.kwhPerM2)} kWh/m2/jaar`);
    if (dpe.verhuurverbod) {
      lines.push(`  !! ${dpe.verhuurverbod.beschrijving}`);
    }
    if (dpe.kwhTotVolgendeKlasse > 0) {
      kv('Naar betere klasse:', `nog ${Math.round(dpe.kwhTotVolgendeKlasse)} kWh/m2 besparen`);
    }

    // Zonnepanelen
    if (toolState.hasPV === 'ja') {
      sectie('Zonnepanelen');
      kv('Vermogen:', `${toolState.pvVermogen} kWp`);
      kv('Jaarproductie:', `${result.pvProductieKwh.toLocaleString('nl-NL')} kWh/jaar`);
      kv('Zelfverbruik:', `${result.pvZelfverbruikKwh.toLocaleString('nl-NL')} kWh (${toolState.pvZelfverbruik}%)`);
    }

    // Subsidies
    sectie('Subsidie-check');
    if (subsidie.cards.length === 0) {
      lines.push('  Geen subsidies van toepassing op basis van opgegeven gegevens.');
    } else {
      for (const card of subsidie.cards) {
        lines.push(`  • ${card.naam}: ${card.bedrag ? 'EUR ' + card.bedrag.toLocaleString('nl-NL') : card.omschrijving}`);
      }
    }

    // Besparingsadvies
    sectie('Besparingsadvies');
    if (savings.maatregelen.length === 0) {
      lines.push('  Geen besparingsmaatregelen beschikbaar.');
    } else {
      for (const m of savings.maatregelen.slice(0, 5)) {
        lines.push(`  • ${m.naam}`);
        lines.push(`    Besparing: EUR ${Math.round(m.besparingEur).toLocaleString('nl-NL')}/jaar | Investering: EUR ${Math.round(m.investering).toLocaleString('nl-NL')} | Terugverdien: ${m.terugverdienJaar.toFixed(1)} jaar`);
      }
    }

    // Footer
    lines.push('');
    lines.push(lijn);
    lines.push('Indicatieve berekening — geen officieel DPE-rapport.');
    lines.push('EnergiePortaal — InfoFrankrijk.com');
    lines.push(lijn);

    const summary = lines.join('\n');

    const data = {
      type: 'saveToDossier',
      title: title,
      summary: summary,
      source: 'energieportaal',
    };

    if (window.parent !== window) {
      window.parent.postMessage(data, '*');
    } else {
      alert('Deze functie werkt alleen binnen InfoFrankrijk.com\n\nGa naar infofrankrijk.com om deze tool te gebruiken.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
    >
      📁 Opslaan in Dossier
    </button>
  );
}

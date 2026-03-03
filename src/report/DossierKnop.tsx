import { useToolState } from '../context/ToolStateContext';
import { getHuisTypeById } from '../data/huizen-matrix';
import { getZoneById } from '../engine/constants';

export function DossierKnop() {
  const { toolState, result } = useToolState();
  const zone = getZoneById(toolState.zoneId);
  const huisType = getHuisTypeById(toolState.huisTypeId);

  const handleClick = () => {
    const datum = new Date().toLocaleDateString('nl-NL');
    const dpe = result.dpe;

    const title = `EnergiePortaal: ${huisType?.naam ?? toolState.huisTypeId} ${toolState.woonoppervlak}m² | DPE ${dpe.letter} | €${result.kostenTotaal.toLocaleString('nl-NL')}/jaar`;

    const summary = [
      '-------------------------------------------',
      'ENERGIEPORTAAL - RAPPORTAGE',
      `Datum: ${datum}`,
      '-------------------------------------------',
      '',
      'WONINGGEGEVENS',
      `• Type: ${huisType?.naam ?? toolState.huisTypeId} (${huisType?.periode ?? ''})`,
      `• Locatie: ${toolState.postcode} (dept. ${toolState.departement})`,
      `• Zone: ${zone.name} (${zone.hdd} HDD)`,
      `• Oppervlak: ${toolState.woonoppervlak} m²`,
      '',
      'WARMTEVERLIES',
      `• Transmissie: ${result.uaWK} W/K`,
      `• Ventilatie: ${result.hventEffWK} W/K`,
      `• Totaal: ${result.hTotaalWK} W/K`,
      '',
      'DPE-INDICATIE',
      `• ${dpe.letter}: ${Math.round(dpe.kwhPerM2)} kWh/m²/jaar`,
      '',
      'ENERGIEKOSTEN',
      `• Totaal: €${result.kostenTotaal.toLocaleString('nl-NL')}/jaar`,
      '',
      '-------------------------------------------',
      'Indicatieve berekening — geen officieel DPE.',
      'EnergiePortaal — InfoFrankrijk.com',
      '-------------------------------------------',
    ].join('\n');

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

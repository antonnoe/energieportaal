import { useToolState } from '../context/ToolStateContext';
import { getHuisTypeById } from '../data/huizen-matrix';
import { getZoneById } from '../engine/constants';

export function Woningprofiel() {
  const { toolState, result } = useToolState();
  const huisType = getHuisTypeById(toolState.huisTypeId);
  const zone = getZoneById(toolState.zoneId);

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-bold text-primary">Woningprofiel</h2>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
        <span className="text-gray-500">Woningtype</span>
        <span className="font-medium">{huisType?.naam ?? toolState.huisTypeId} ({huisType?.periode})</span>

        <span className="text-gray-500">Locatie</span>
        <span className="font-medium">
          {toolState.postcode ? `${toolState.postcode} (dept. ${toolState.departement})` : 'Niet ingevuld'}
        </span>

        <span className="text-gray-500">Klimaatzone</span>
        <span className="font-medium">{zone.name}</span>

        <span className="text-gray-500">Woonoppervlak</span>
        <span className="font-medium">{toolState.woonoppervlak} m²</span>

        <span className="text-gray-500">Verdiepingen</span>
        <span className="font-medium">{toolState.verdiepingen}</span>

        <span className="text-gray-500">Volume</span>
        <span className="font-medium">{result.debug.volume.toLocaleString('nl-NL')} m³</span>

        <span className="text-gray-500">Graaddagen (HDD)</span>
        <span className="font-medium">{zone.hdd}</span>
      </div>

      {/* U-waarden overzicht */}
      <div className="mt-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">U-waarden</p>
        <div className="flex gap-2">
          {[
            { label: 'Muur', u: Number(toolState.uMuur), opp: toolState.muurOppervlak },
            { label: 'Dak', u: Number(toolState.uDak), opp: toolState.dakOppervlak },
            { label: 'Vloer', u: Number(toolState.uVloer), opp: toolState.vloerOppervlak },
            { label: 'Raam', u: Number(toolState.uRaam), opp: toolState.raamOppervlak },
          ].map((item) => (
            <div key={item.label} className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-sm font-bold">{item.u}</p>
              <p className="text-xs text-gray-400">{item.opp} m²</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

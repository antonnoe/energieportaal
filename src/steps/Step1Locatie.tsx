import { useToolState } from '../context/ToolStateContext';
import { ZONES } from '../engine/constants';
import { CoachWidget } from '../components/CoachWidget';

export function Step1Locatie() {
  const { toolState, setPostcode } = useToolState();

  const zone = ZONES.find((z) => z.id === toolState.zoneId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-primary mb-1">Stap 1: Locatie</h2>
        <p className="text-sm text-gray-500">Uw postcode bepaalt automatisch de klimaatzone.</p>
      </div>

      {/* Postcode */}
      <div>
        <label htmlFor="postcode" className="text-sm font-semibold mb-1 flex items-center">
          Postcode <span className="text-red-500 ml-0.5">*</span><CoachWidget fieldId="postcode" />
        </label>
        <input
          id="postcode"
          type="text"
          inputMode="numeric"
          maxLength={5}
          placeholder="bv. 34000"
          value={toolState.postcode}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 5);
            setPostcode(val);
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {toolState.postcode.length === 5 && (
          <p className="text-sm text-green-700 mt-1">
            Département {toolState.departement} — zone: {zone?.name ?? toolState.zoneId}
          </p>
        )}
      </div>

      {/* Zone info kaart — alleen zichtbaar bij geldige postcode */}
      {toolState.postcode.length === 5 && zone && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm space-y-1">
          <p className="font-semibold">{zone.name}</p>
          <div className="grid grid-cols-2 gap-x-4 text-gray-600">
            <span>Verwarmingsgraaddagen:</span><span className="font-medium">{zone.hdd}</span>
            <span>Koelingsgraaddagen:</span><span className="font-medium">{zone.cdd}</span>
            <span>PV-opbrengst:</span><span className="font-medium">{zone.pv} kWh/kWp</span>
            <span>Ref. buitentemp:</span><span className="font-medium">{zone.Tref} °C</span>
          </div>
        </div>
      )}
    </div>
  );
}

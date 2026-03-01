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
        <label htmlFor="postcode" className="flex items-center text-sm font-semibold mb-1">
          Postcode <span className="text-red-500">*</span>
          <CoachWidget veld="Postcode" waarde={toolState.postcode} />
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
      </div>

      {/* Zone bevestiging — alleen na geldige postcode */}
      {toolState.postcode.length === 5 && zone && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm space-y-1">
          <p className="font-semibold text-green-800">
            Zone: {zone.name} ({zone.hdd} graaddagen)
          </p>
          <p className="text-green-700 text-xs">
            Département {toolState.departement} &middot; PV-opbrengst {zone.pv} kWh/kWp/jaar &middot; Ref. buitentemp {zone.Tref} °C
          </p>
        </div>
      )}
    </div>
  );
}

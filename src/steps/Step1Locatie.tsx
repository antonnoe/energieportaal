import { useToolState } from '../context/ToolStateContext';
import { ZONES } from '../engine/constants';

export function Step1Locatie() {
  const { toolState, setField, setPostcode } = useToolState();

  const zone = ZONES.find((z) => z.id === toolState.zoneId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-primary mb-1">Stap 1: Locatie</h2>
        <p className="text-sm text-gray-500">Uw postcode bepaalt automatisch de klimaatzone.</p>
      </div>

      {/* Postcode */}
      <div>
        <label htmlFor="postcode" className="block text-sm font-semibold mb-1">
          Postcode <span className="text-red-500">*</span>
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

      {/* Klimaatzone */}
      <div>
        <label htmlFor="zoneId" className="block text-sm font-semibold mb-1">
          Klimaatzone
        </label>
        <select
          id="zoneId"
          value={toolState.zoneId}
          onChange={(e) => setField('zoneId', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          {ZONES.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
        {zone && (
          <p className="text-xs text-gray-400 mt-1">
            {zone.hdd} graaddagen · PV-opbrengst {zone.pv} kWh/kWp/jaar
          </p>
        )}
      </div>

      {/* Snelle postcode hints */}
      <div className="bg-primary/5 border border-primary/15 rounded-lg p-3">
        <p className="text-sm font-semibold text-primary mb-2">Voorbeelden</p>
        <div className="flex flex-wrap gap-2">
          {[
            { pc: '13001', label: 'Marseille' },
            { pc: '33000', label: 'Bordeaux' },
            { pc: '75001', label: 'Parijs' },
            { pc: '69001', label: 'Lyon' },
            { pc: '67000', label: 'Strasbourg' },
            { pc: '73000', label: 'Chambéry' },
          ].map((ex) => (
            <button
              key={ex.pc}
              type="button"
              onClick={() => setPostcode(ex.pc)}
              className="text-xs px-2.5 py-1 rounded-full border border-primary/20 text-primary hover:bg-primary/10 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Zone info kaart */}
      {zone && (
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

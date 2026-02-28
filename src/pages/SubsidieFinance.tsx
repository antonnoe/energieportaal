import { useState, useCallback } from 'react';
import { CoachPanel } from '../components/CoachPanel';
import {
  evaluateSubsidie,
  type SubsidieIntake,
  type SubsidieCard,
  type UsageType,
  type AgeType,
  type StageType,
  type WorkType,
  type MprPath,
  type StoplightStatus,
} from '../engine/subsidie/rules';

// ─── Geo API types ────────────────────────────────────────────────────────────

interface Commune {
  nom: string;
  code: string;
  departement?: { code: string; nom: string };
  region?: { code: string; nom: string };
}

// ─── Stoplight badge ──────────────────────────────────────────────────────────

function StoplightBadge({ status }: { status: StoplightStatus }) {
  const cfg = {
    green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', icon: '✅', label: 'In aanmerking' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', icon: '⚠️', label: 'Controleer' },
    red:   { bg: 'bg-red-100',   text: 'text-red-800',   border: 'border-red-300',   icon: '❌', label: 'Niet van toepassing' },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Subsidy card ──────────────────────────────────────────────────────────────

function SubsidyCard({ card }: { card: SubsidieCard }) {
  const borderColor = { green: 'border-l-green-400', amber: 'border-l-amber-400', red: 'border-l-red-300' }[card.status];
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${borderColor} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-gray-900">{card.title}</h3>
          <p className="text-xs text-gray-500 mt-1">{card.reason}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          <StoplightBadge status={card.status} />
          <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: '#800000' }}
          >
            {card.amount}
          </span>
        </div>
      </div>
      <a
        href={card.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#800000] hover:underline"
      >
        Meer info →
      </a>
    </div>
  );
}

// ─── Select helper ────────────────────────────────────────────────────────────

function IntakeSelect<T extends string>({
  id, label, value, options, helpText, onChange,
}: {
  id: string; label: string; value: T;
  options: { value: T; label: string }[];
  helpText?: string;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {helpText && <p className="text-xs text-gray-400 mb-1">{helpText}</p>}
      <select
        id={id} value={value} onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Default intake ────────────────────────────────────────────────────────────

const DEFAULT_INTAKE: SubsidieIntake = {
  usage: 'onbekend',
  ageGt2: 'onbekend',
  stage: 'voor',
  workType: 'onbekend',
  mprPath: 'onbekend',
  heatlossDone: false,
};

// ─── Main page ─────────────────────────────────────────────────────────────────

export function SubsidieFinance() {
  const [postcode, setPostcode] = useState('');
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null);
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [intake, setIntake] = useState<SubsidieIntake>(DEFAULT_INTAKE);
  const [showResults, setShowResults] = useState(false);

  const result = showResults ? evaluateSubsidie(intake) : null;

  const setIn = <K extends keyof SubsidieIntake>(k: K, v: SubsidieIntake[K]) =>
    setIntake((prev) => ({ ...prev, [k]: v }));

  const lookupPostcode = useCallback(async () => {
    const pc = postcode.trim();
    if (!/^\d{5}$/.test(pc)) {
      setGeoError('Voer een geldig Frans postcode in (5 cijfers).');
      return;
    }
    setLoading(true);
    setGeoError(null);
    setCommunes([]);
    setSelectedCommune(null);
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?codePostal=${pc}&fields=nom,code,departement,region&format=json`
      );
      if (!res.ok) throw new Error('API fout');
      const data: Commune[] = await res.json();
      if (data.length === 0) {
        setGeoError('Geen gemeente gevonden voor dit postcode.');
      } else if (data.length === 1) {
        setSelectedCommune(data[0]);
      } else {
        setCommunes(data);
      }
    } catch {
      setGeoError('Kon de gemeente niet ophalen. Controleer uw verbinding.');
    } finally {
      setLoading(false);
    }
  }, [postcode]);

  const copyActionPlan = () => {
    if (!result) return;
    const text = result.actionPlan.join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-heading text-xl font-bold" style={{ color: '#800000' }}>
          💶 Subsidie & Finance Routeplanner
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Beantwoord de vragen en ontdek welke subsidies en financieringsregelingen op u van
          toepassing zijn.
        </p>
      </div>

      {/* Step 1 – Postcode */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <h3 className="font-heading font-semibold text-sm text-gray-700 border-b border-gray-100 pb-1">
          📍 Stap 1 — Locatie (optioneel)
        </h3>
        <p className="text-xs text-gray-500">
          Voer uw Frans postcode in voor aanvullende regionale informatie.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="75001"
            maxLength={5}
            onKeyDown={(e) => e.key === 'Enter' && lookupPostcode()}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]"
          />
          <button
            onClick={lookupPostcode}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: '#800000' }}
          >
            {loading ? '…' : 'Zoeken'}
          </button>
        </div>

        {geoError && (
          <p className="text-xs text-red-600">⚠️ {geoError}</p>
        )}

        {communes.length > 1 && !selectedCommune && (
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Meerdere gemeenten gevonden — kies er één:</p>
            {communes.map((c) => (
              <button
                key={c.code}
                onClick={() => { setSelectedCommune(c); setCommunes([]); }}
                className="block w-full text-left px-3 py-2 rounded-lg border border-gray-200 text-sm hover:border-[#800000] hover:bg-gray-50"
              >
                {c.nom} {c.departement ? `(${c.departement.code} – ${c.departement.nom})` : ''}
              </button>
            ))}
          </div>
        )}

        {selectedCommune && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800">
            ✅ <strong>{selectedCommune.nom}</strong>
            {selectedCommune.departement && ` — ${selectedCommune.departement.nom}`}
            {selectedCommune.region && ` (${selectedCommune.region.nom})`}
          </div>
        )}
      </div>

      {/* Step 2 – Intake */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <h3 className="font-heading font-semibold text-sm text-gray-700 border-b border-gray-100 pb-1">
          📋 Stap 2 — Uw situatie
        </h3>

        <IntakeSelect<UsageType>
          id="usage" label="Gebruik van de woning" value={intake.usage}
          options={[
            { value: 'onbekend', label: 'Weet ik niet' },
            { value: 'rp', label: 'Hoofdverblijfplaats (résidence principale)' },
            { value: 'secondaire', label: 'Tweede verblijf' },
            { value: 'verhuur', label: 'Verhuurwoning' },
          ]}
          onChange={(v) => setIn('usage', v)}
        />

        <IntakeSelect<AgeType>
          id="ageGt2" label="Is de woning ouder dan 2 jaar?" value={intake.ageGt2}
          options={[
            { value: 'onbekend', label: 'Weet ik niet' },
            { value: 'ja', label: 'Ja' },
            { value: 'nee', label: 'Nee (nieuwbouw)' },
          ]}
          onChange={(v) => setIn('ageGt2', v)}
        />

        <IntakeSelect<StageType>
          id="stage" label="Fase van de renovatiewerken" value={intake.stage}
          options={[
            { value: 'voor', label: 'Nog geen beslissing genomen' },
            { value: 'offertes', label: 'Offertes aangevraagd' },
            { value: 'getekend', label: 'Contract ondertekend' },
            { value: 'gestart', label: 'Werken al gestart' },
          ]}
          helpText="Subsidies moeten vrijwel altijd VOOR aanvang van de werken worden aangevraagd."
          onChange={(v) => setIn('stage', v)}
        />

        <IntakeSelect<WorkType>
          id="workType" label="Type renovatiewerken" value={intake.workType}
          options={[
            { value: 'onbekend', label: 'Nog niet bepaald' },
            { value: 'envelop', label: 'Isolatie / Gebouwschil' },
            { value: 'ventilatie', label: 'Ventilatie' },
            { value: 'verwarming', label: 'Verwarmingssysteem' },
            { value: 'combo', label: 'Combinatie (meerdere types)' },
          ]}
          onChange={(v) => setIn('workType', v)}
        />

        <IntakeSelect<MprPath>
          id="mprPath" label="MaPrimeRénov' traject" value={intake.mprPath}
          options={[
            { value: 'onbekend', label: 'Weet ik niet' },
            { value: 'geste', label: 'Geste (enkelvoudige actie)' },
            { value: 'ampleur', label: 'Ampleur (grootschalige renovatie)' },
          ]}
          helpText="Raadpleeg uw energieadviseur (Mon Accompagnateur Rénov') voor het juiste traject."
          onChange={(v) => setIn('mprPath', v)}
        />

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="heatlossDone"
            checked={intake.heatlossDone}
            onChange={(e) => setIn('heatlossDone', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 accent-[#800000]"
          />
          <label htmlFor="heatlossDone" className="text-sm text-gray-700">
            Warmteverliesberekening (audit énergétique) al uitgevoerd?
          </label>
        </div>
      </div>

      {/* Evaluate button */}
      <button
        onClick={() => setShowResults(true)}
        className="w-full py-3 rounded-xl text-white font-heading font-semibold text-sm shadow-sm"
        style={{ backgroundColor: '#800000' }}
      >
        🔍 Bereken mijn subsidie-mogelijkheden
      </button>

      {/* Results */}
      {result && (
        <>
          <div className="space-y-3">
            <h3 className="font-heading font-semibold text-gray-800">Uw subsidie-overzicht</h3>
            {result.cards.map((card) => (
              <SubsidyCard key={card.id} card={card} />
            ))}
          </div>

          {/* Action plan */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-sm text-gray-700">📋 Actieplan</h3>
              <button
                onClick={copyActionPlan}
                className="text-xs text-[#800000] hover:underline"
              >
                📋 Kopieer
              </button>
            </div>
            <ol className="space-y-2">
              {result.actionPlan.map((step, i) => (
                <li key={i} className="text-sm text-gray-700">{step}</li>
              ))}
            </ol>
          </div>

          {/* Combinations notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
            <strong>💡 Cumulering:</strong> MPR', CEE en Éco-PTZ zijn in principe cumuleerbaar.
            Vraag alle subsidies tegelijk aan vóór aanvang van de werken. Uw{' '}
            <em>Mon Accompagnateur Rénov'</em> begeleid u hierbij.
          </div>
        </>
      )}

      {/* Footer links */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <strong className="text-gray-700 block">Nuttige links:</strong>
        <a href="https://france-renov.gouv.fr/espaces-conseil-fr/recherche"
          target="_blank" rel="noopener noreferrer" className="text-[#800000] underline block">
          France Rénov' — Zoek een gecertificeerde adviseur
        </a>
        <a href="https://www.maprimerenov.gouv.fr"
          target="_blank" rel="noopener noreferrer" className="text-[#800000] underline block">
          MaPrimeRénov' — officiële site
        </a>
        <a href="https://www.service-public.fr/particuliers/vosdroits/F19905"
          target="_blank" rel="noopener noreferrer" className="text-[#800000] underline block">
          Éco-PTZ — service-public.fr
        </a>
      </div>

      <CoachPanel errors={[]} />
    </div>
  );
}

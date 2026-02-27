import { useMemo } from 'react';
import { useToolState } from '../context/ToolStateContext';
import { calculate } from '../engine/calculations';
import { CoachPanel } from '../components/CoachPanel';

interface SubsidieItem {
  title: string;
  description: string;
  amount: string;
  url: string;
  conditions: string[];
  /** DPE labels for which this subsidy is most relevant (empty = always relevant) */
  relevantDpe?: string[];
}

const SUBSIDIES: SubsidieItem[] = [
  {
    title: 'MaPrimeRénov\'',
    description: 'Staatspremie voor energierenovatiewerken in Frankrijk.',
    amount: 'Tot € 20.000',
    url: 'https://www.maprimerenov.gouv.fr',
    conditions: ['Eigenaar-bewoner of verhuurder', 'Woning ouder dan 15 jaar', 'Gecertificeerde aannemer (RGE)'],
    relevantDpe: ['D', 'E', 'F', 'G'],
  },
  {
    title: 'CEE (Certificats d\'Économies d\'Énergie)',
    description: 'Premies via energieleveranciers voor isolatie en verwarming.',
    amount: 'Variabel',
    url: 'https://www.ecologie.gouv.fr/dispositif-des-certificats-deconomies-denergie',
    conditions: ['Via energieleverancier aanvragen', 'Erkend installateur vereist'],
  },
  {
    title: 'Éco-prêt à taux zéro (Éco-PTZ)',
    description: 'Rentevrije lening voor energierenovatie.',
    amount: 'Tot € 50.000',
    url: 'https://www.service-public.fr/particuliers/vosdroits/F19905',
    conditions: ['Hoofdverblijfplaats', 'Ouder dan 2 jaar', 'Via deelnemende bank'],
  },
  {
    title: 'TVA réduite 5,5%',
    description: 'Verlaagd btw-tarief voor energierenovatiewerken.',
    amount: '5,5% i.p.v. 20% BTW',
    url: 'https://www.impots.gouv.fr/particulier/les-travaux-de-renovation-energetique',
    conditions: ['Erkend installateur', 'Hoofdverblijfplaats of huurwoning'],
  },
];

const DPE_COLORS: Record<string, string> = {
  A: '#009900',
  B: '#33cc00',
  C: '#99cc00',
  D: '#ffcc00',
  E: '#ff9900',
  F: '#ff6600',
  G: '#ff0000',
};

export function SubsidieFinance() {
  const { toolState } = useToolState();

  const result = useMemo(
    () =>
      calculate({
        oppervlakte: toolState.oppervlakte,
        isolatie: toolState.isolatie,
        verwarming: toolState.verwarming,
        muurIsolatie: toolState.muurIsolatie,
        dakIsolatie: toolState.dakIsolatie,
        raamType: toolState.raamType,
      }),
    [toolState]
  );

  const dpe = result.dpeLabel;
  const isPoorPerformer = ['E', 'F', 'G'].includes(dpe);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold" style={{ color: '#800000' }}>
          💶 Subsidie & Finance
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Overzicht van beschikbare subsidies en financieringsregelingen voor energierenovatie in
          Frankrijk.
        </p>
      </div>

      {/* Personalised summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold font-heading shadow-md shrink-0"
          style={{ backgroundColor: DPE_COLORS[dpe] ?? '#888' }}
          title="Uw geschatte DPE label"
        >
          {dpe}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700">
            Uw woning heeft een geschat DPE-label <strong>{dpe}</strong>.
          </p>
          {isPoorPerformer ? (
            <p className="text-xs text-amber-700 mt-0.5">
              ⚠️ Label {dpe} — u komt in aanmerking voor prioritaire subsidies. Zie de
              aanbevolen regelingen hieronder.
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5">
              Goed presterende woning — hieronder vindt u alle beschikbare regelingen.
            </p>
          )}
        </div>
      </div>

      {isPoorPerformer && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          <strong>Aanbevolen:</strong> Bij label {dpe} is renovatie urgent. MaPrimeRénov' dekt
          tot 90% van de kosten voor lage inkomens. Start altijd met een energieaudit via een
          gecertificeerde RGE-aannemer.
        </div>
      )}

      <div className="space-y-4">
        {SUBSIDIES.map((item) => {
          const isRelevant =
            !item.relevantDpe || item.relevantDpe.includes(dpe);
          return (
            <div
              key={item.title}
              className={[
                'bg-white rounded-xl shadow-sm border p-4',
                isRelevant && item.relevantDpe
                  ? 'border-[#800000] ring-1 ring-[#800000]/20'
                  : 'border-gray-200',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-semibold text-gray-900">{item.title}</h3>
                    {isRelevant && item.relevantDpe && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                        ✓ Relevant voor u
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>

                  <ul className="mt-2 space-y-1">
                    {item.conditions.map((c) => (
                      <li key={c} className="flex items-start gap-1.5 text-xs text-gray-500">
                        <span className="mt-0.5 shrink-0">✓</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className="inline-block px-2 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: '#800000' }}
                  >
                    {item.amount}
                  </span>
                </div>
              </div>

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#800000] hover:underline"
              >
                Meer info →
              </a>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500">
        <strong className="text-gray-700">Vind een gecertificeerd adviseur:</strong>
        <br />
        <a
          href="https://france-renov.gouv.fr/espaces-conseil-fr/recherche"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#800000] underline"
        >
          france-renov.gouv.fr/espaces-conseil-fr/recherche
        </a>
      </div>

      <CoachPanel errors={[]} />
    </div>
  );
}

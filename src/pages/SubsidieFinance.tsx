import { CoachPanel } from '../components/CoachPanel';

interface SubsidieItem {
  title: string;
  description: string;
  amount: string;
  url: string;
  conditions: string[];
}

const SUBSIDIES: SubsidieItem[] = [
  {
    title: 'MaPrimeRénov\'',
    description: 'Staatspremie voor energierenovatiewerken in Frankrijk.',
    amount: 'Tot € 20.000',
    url: 'https://www.maprimerenov.gouv.fr',
    conditions: ['Eigenaar-bewoner of verhuurder', 'Woning ouder dan 15 jaar', 'Gecertificeerde aannemer (RGE)'],
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

export function SubsidieFinance() {
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

      <div className="space-y-4">
        {SUBSIDIES.map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-gray-900">{item.title}</h3>
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
        ))}
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

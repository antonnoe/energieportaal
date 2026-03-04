export function Disclaimer() {
  const jaar = new Date().getFullYear();

  return (
    <div className="border-t border-gray-200 pt-4 mt-6">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Disclaimer — Simulatietool
      </p>
      <div className="text-[11px] text-gray-400 leading-relaxed space-y-2">
        <p>
          Dit rapport is gegenereerd door EnergiePortaal, een simulatietool van InfoFrankrijk.com.
          Het is GEEN officieel DPE-rapport en vervangt geen advies van een gecertificeerde energieadviseur.
        </p>
        <p className="font-medium text-gray-500">Belangrijke kanttekeningen:</p>
        <ul className="list-disc list-inside space-y-1 ml-1">
          <li>
            De DPE-indicatie werkt met finale energie en uw invoer, niet met de officiële
            3CL-DPE 2021 methode (primaire energie, gestandaardiseerde conventies, dubbele
            drempel energie + broeikasgassen).
          </li>
          <li>
            Tapwaterverbruik is geschat op basis van uw invoer. Het werkelijke verbruik hangt
            af van de gewenste watertemperatuur (ΔT). Bij een hogere instelling (55°C i.p.v. 40°C)
            kan het verbruik tot 60% hoger uitvallen.
          </li>
          <li>
            Energieprijzen zijn momentopnamen (maart 2026) en kunnen afwijken van uw werkelijke tarief.
          </li>
          <li>
            Investeringsbedragen en terugverdientijden zijn indicatief (bron: ADEME).
          </li>
          <li>
            Subsidie-informatie is indicatief en zonder inkomensvraag. Gebruik{' '}
            <a
              href="https://mesaides.france-renov.gouv.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              mesaides.france-renov.gouv.fr
            </a>{' '}
            voor een exacte berekening.
          </li>
        </ul>
        <p className="pt-1 text-gray-400">
          © {jaar} InfoFrankrijk.com — EnergiePortaal v2
        </p>
      </div>
    </div>
  );
}

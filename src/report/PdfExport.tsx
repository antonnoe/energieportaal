import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToolState } from '../context/ToolStateContext';
import { getHuisTypeById } from '../data/huizen-matrix';
import { getZoneById, DPE_KLASSEN } from '../engine/constants';
import { berekenSavings } from '../engine/savings';
import { evaluateSubsidie } from '../engine/subsidie-rules';
import { useMemo } from 'react';

const BRAND = '#800000';
const GRAY = '#666666';

function fmt(n: number): string {
  return n.toLocaleString('nl-NL');
}

function fmtEur(n: number): string {
  return `EUR ${fmt(n)}`;
}

export function PdfExport() {
  const { toolState, result, portaalInput } = useToolState();
  const zone = getZoneById(toolState.zoneId);
  const huisType = getHuisTypeById(toolState.huisTypeId);
  const savings = useMemo(() => berekenSavings(portaalInput, result), [portaalInput, result]);
  const subsidie = useMemo(() => evaluateSubsidie({ ...portaalInput.subsidieIntake, dpeLetter: result.dpe.letter }), [portaalInput.subsidieIntake, result.dpe.letter]);

  const handleExport = () => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      encryption: {
        userPermissions: ['print'] as ('print' | 'copy' | 'modify' | 'annot-forms')[],
      },
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const datum = new Date().toLocaleDateString('nl-NL');

    // PDF-safe text: vervang Unicode die jsPDF niet aankan
    function safe(text: string): string {
      return text
        .replace(/€/g, 'EUR ')
        .replace(/\u20ac/g, 'EUR ')
        .replace(/≥/g, '>=')
        .replace(/\u2265/g, '>=')
        .replace(/≤/g, '<=')
        .replace(/\u2264/g, '<=')
        .replace(/²/g, '2')
        .replace(/\u00b2/g, '2')
        .replace(/·/g, '.')
        .replace(/\u00b7/g, '.')
        .replace(/°/g, ' ')
        .replace(/\u00b0/g, ' ')
        .replace(/–/g, '-')
        .replace(/\u2013/g, '-')
        .replace(/—/g, '-')
        .replace(/\u2014/g, '-')
        .replace(/\u2019/g, "'")
        .replace(/'/g, "'")
        .replace(/→/g, '->')
        .replace(/\u2192/g, '->')
        .replace(/é/g, 'e')
        .replace(/\u00e9/g, 'e')
        .replace(/è/g, 'e')
        .replace(/\u00e8/g, 'e')
        .replace(/ê/g, 'e')
        .replace(/\u00ea/g, 'e')
        .replace(/à/g, 'a')
        .replace(/\u00e0/g, 'a')
        .replace(/ï/g, 'i')
        .replace(/\u00ef/g, 'i')
        .replace(/ë/g, 'e')
        .replace(/\u00eb/g, 'e')
        .replace(/ô/g, 'o')
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u')
        .replace(/ç/g, 'c');
    }

    // Wrapper: autoTable met automatische Unicode-sanitatie
    function safeAutoTable(opts: any) {
      if (opts.head) {
        opts.head = opts.head.map((row: any[]) => row.map((cell: any) => safe(String(cell))));
      }
      if (opts.body) {
        opts.body = opts.body.map((row: any[]) => row.map((cell: any) => safe(String(cell))));
      }
      autoTable(doc, opts);
    }

    // Helper: add header/footer to each page
    function addHeaderFooter() {
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        // Header
        doc.setFontSize(8);
        doc.setTextColor(BRAND);
        doc.text('EnergiePortaal - Energierapport', margin, 10);
        doc.setTextColor(GRAY);
        doc.text(datum, pageWidth - margin, 10, { align: 'right' });
        // Footer
        doc.setFontSize(7);
        doc.setTextColor(GRAY);
        doc.text(`Pagina ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        doc.text('InfoFrankrijk.com', pageWidth - margin, pageHeight - 8, { align: 'right' });
      }
    }

    // Helper: check if we need a new page
    function checkPage(needed: number) {
      if (y + needed > pageHeight - 25) {
        doc.addPage();
        y = margin;
      }
    }

    // Helper: chapter title
    function chapterTitle(nr: number, title: string) {
      // Als we niet bovenaan de pagina staan, ruime witruimte toevoegen
      if (y > margin + 10) {
        y += 14;
      }
      checkPage(30);
      doc.setFontSize(14);
      doc.setTextColor(BRAND);
      doc.setFont('helvetica', 'bold');
      doc.text(`${nr}. ${safe(title)}`, margin, y);
      y += 3;
      doc.setDrawColor(BRAND);
      doc.setLineWidth(0.5);
      doc.line(margin, y, margin + contentWidth, y);
      y += 10;
      doc.setTextColor('#333333');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
    }

    // Helper: section subtitle
    function subtitle(text: string) {
      checkPage(12);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#444444');
      doc.text(safe(text), margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor('#333333');
    }

    // Helper: text line
    function textLine(text: string, indent = 0) {
      checkPage(6);
      const lines = doc.splitTextToSize(safe(text), contentWidth - indent);
      doc.text(lines, margin + indent, y);
      y += lines.length * 4.5;
    }

    // Helper: key-value line
    function kvLine(key: string, value: string, indent = 0) {
      checkPage(6);
      const sk = safe(key);
      const sv = safe(value);
      doc.setFont('helvetica', 'bold');
      doc.text(sk, margin + indent, y);
      doc.setFont('helvetica', 'normal');
      const keyWidth = doc.getTextWidth(sk + ' ');
      doc.text(sv, margin + indent + keyWidth + 1, y);
      y += 5;
    }

    // ===================================================================
    // TITELBLAD
    // ===================================================================
    doc.setFontSize(24);
    doc.setTextColor(BRAND);
    doc.setFont('helvetica', 'bold');
    doc.text('EnergiePortaal', pageWidth / 2, 70, { align: 'center' });
    doc.setFontSize(16);
    doc.setTextColor('#444444');
    doc.text('Energierapport', pageWidth / 2, 84, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`${huisType?.naam ?? toolState.huisTypeId} - ${toolState.woonoppervlak} m2`, pageWidth / 2, 100, { align: 'center' });
    doc.text(`${toolState.postcode} (dept. ${toolState.departement}) - ${zone.name}`, pageWidth / 2, 108, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#333333');
    doc.text(`DPE-indicatie: ${result.dpe.letter} (${Math.round(result.dpe.kwhPerM2)} kWh/m2/jaar)`, pageWidth / 2, 128, { align: 'center' });
    doc.setTextColor('#333333');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Energiekosten: ${fmtEur(result.kostenTotaal)}/jaar`, pageWidth / 2, 140, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(GRAY);
    doc.text(`Gegenereerd op ${datum}`, pageWidth / 2, 160, { align: 'center' });
    doc.text('InfoFrankrijk.com - EnergiePortaal v2', pageWidth / 2, 168, { align: 'center' });

    // ===================================================================
    // HOOFDSTUK 1: WONINGPROFIEL
    // ===================================================================
    doc.addPage();
    y = margin;
    chapterTitle(1, 'WONINGPROFIEL');

    kvLine('Type:', `${huisType?.naam ?? toolState.huisTypeId} (${huisType?.periode ?? ''})`);
    kvLine('Locatie:', `${toolState.postcode} (dept. ${toolState.departement})`);
    kvLine('Klimaatzone:', zone.name);
    kvLine('Oppervlak:', `${toolState.woonoppervlak} m2`);
    kvLine('Verdiepingen:', toolState.verdiepingen);
    kvLine('Volume:', `${result.debug.volume.toLocaleString('nl-NL')} m3`);
    y += 5;

    if (huisType?.beschrijving) {
      textLine(huisType.beschrijving);
      y += 2;
    }

    if (huisType?.waarschuwingen && huisType.waarschuwingen.length > 0) {
      subtitle('Aandachtspunten');
      for (const w of huisType.waarschuwingen) {
        textLine(`- ${w}`, 2);
      }
      y += 2;
    }

    subtitle('U-waarden per bouwdeel');
    safeAutoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Bouwdeel', 'U-waarde (W/m2.K)', 'Oppervlak (m2)', 'UA (W/K)']],
      body: [
        ['Muur', toolState.uMuur, toolState.muurOppervlak, result.debug.uaMuur.toFixed(1)],
        ['Dak', toolState.uDak, toolState.dakOppervlak, result.debug.uaDak.toFixed(1)],
        ['Vloer', toolState.uVloer, toolState.vloerOppervlak, result.debug.uaVloer.toFixed(1)],
        ['Raam', toolState.uRaam, toolState.raamOppervlak, result.debug.uaRaam.toFixed(1)],
      ],
      headStyles: { fillColor: BRAND, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: '#f9f5f5' },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 12;

    // ===================================================================
    // HOOFDSTUK 2: LOCATIE & KLIMAAT
    // ===================================================================
    chapterTitle(2, 'LOCATIE & KLIMAAT');

    kvLine('Zone:', zone.name);
    kvLine('Graaddagen (HDD):', `${zone.hdd} K.d`);
    kvLine('Koeldagen (CDD):', `${zone.cdd}`);
    kvLine('PV-opbrengst:', `${zone.pv} kWh/kWp/jaar`);
    kvLine('Ref. buitentemperatuur:', `${zone.Tref} \xB0C`);
    kvLine('Zwembadtemperatuur:', `${zone.pool_temp} \xB0C`);
    y += 5;

    textLine(
      'De klimaatzone bepaalt het aantal graaddagen (HDD), dat direct de warmtevraag beinvloedt. ' +
      'Meer graaddagen betekent een koeler klimaat en dus meer verwarmingsenergie. ' +
      'De PV-opbrengst varieert van 1100 kWh/kWp in de bergen tot 1450 kWh/kWp aan de Middellandse Zee.'
    );

    // ===================================================================
    // HOOFDSTUK 3: ISOLATIE & WARMTEVERLIES
    // ===================================================================
    checkPage(40);
    chapterTitle(3, 'ISOLATIE & WARMTEVERLIES');

    subtitle('Transmissieverlies (Htr)');
    safeAutoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Bouwdeel', 'U (W/m2.K)', 'A (m2)', 'UA = U x A (W/K)']],
      body: [
        ['Muur', toolState.uMuur, toolState.muurOppervlak, result.debug.uaMuur.toFixed(1)],
        ['Dak', toolState.uDak, toolState.dakOppervlak, result.debug.uaDak.toFixed(1)],
        ['Vloer', toolState.uVloer, toolState.vloerOppervlak, result.debug.uaVloer.toFixed(1)],
        ['Raam', toolState.uRaam, toolState.raamOppervlak, result.debug.uaRaam.toFixed(1)],
        ['Totaal', '', '', String(result.uaWK)],
      ],
      headStyles: { fillColor: BRAND, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: '#f9f5f5' },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    subtitle('Ventilatieverlies (Hvent)');
    kvLine('Formule:', `0.34 x ${result.debug.volume} m3 x ${result.debug.achGebruikt} ACH = ${result.debug.hventVoorHRV.toFixed(1)} W/K`);
    if (toolState.hasHRV === 'ja') {
      kvLine('WTW-correctie:', `${result.debug.hventVoorHRV.toFixed(1)} x (1 - ${(Number(toolState.hrvEfficiency) / 100).toFixed(2)}) = ${result.hventEffWK} W/K`);
    }
    kvLine('Totaal H (Htr + Hvent):', `${result.uaWK} + ${result.hventEffWK} = ${result.hTotaalWK} W/K`);
    y += 5;

    subtitle('Gewogen HDD');
    kvLine('Basis HDD zone:', `${zone.hdd} K.d`);
    kvLine('Aanwezig:', `${result.debug.setpoint}\xB0C (${(result.debug.fracPresent * 100).toFixed(0)}%) - HDD = ${Math.round(result.debug.hddCorrPresent)}`);
    kvLine('Afwezig:', `${result.debug.awaySetpoint}\xB0C (${(result.debug.fracAway * 100).toFixed(0)}%) - HDD = ${Math.round(result.debug.hddCorrAway)}`);
    kvLine('HDD_eff gewogen:', `${Math.round(result.debug.hddEffGewogen)} K.d`);

    // ===================================================================
    // HOOFDSTUK 4: DPE-INDICATIE
    // ===================================================================
    checkPage(60);
    chapterTitle(4, 'DPE-INDICATIE');

    // DPE letter groot
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#333333');
    doc.text(result.dpe.letter, margin, y + 2);
    doc.setFontSize(12);
    doc.setTextColor('#333333');
    doc.text(`${Math.round(result.dpe.kwhPerM2)} kWh/m2/jaar`, margin + 15, y + 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    y += 12;

    // DPE balk
    for (const klasse of DPE_KLASSEN) {
      const isHuidig = klasse.letter === result.dpe.letter;
      const barWidth = 30 + DPE_KLASSEN.indexOf(klasse) * 8;
      doc.setFillColor(klasse.kleur);
      doc.roundedRect(margin, y, barWidth, 5, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setTextColor('#ffffff');
      doc.text(klasse.letter, margin + 2, y + 3.7);
      if (klasse.maxKwhM2 !== Infinity) {
        doc.setFontSize(6);
        doc.text(`<= ${klasse.maxKwhM2}`, margin + barWidth - 12, y + 3.7);
      }
      if (isHuidig) {
        doc.setTextColor('#333333');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`<< ${Math.round(result.dpe.kwhPerM2)} kWh/m2`, margin + barWidth + 3, y + 3.7);
        doc.setFont('helvetica', 'normal');
      }
      y += 6.5;
    }
    y += 4;

    if (result.dpe.kwhTotVolgendeKlasse > 0 && result.dpe.letter !== 'A') {
      doc.setTextColor('#333333');
      textLine(`Naar betere klasse: nog ${Math.round(result.dpe.kwhTotVolgendeKlasse)} kWh/m2 besparen`);
    }
    if (result.dpe.kwhTotLagereKlasse > 0 && result.dpe.letter !== 'G') {
      doc.setTextColor(GRAY);
      textLine(`Marge tot lagere klasse: ${Math.round(result.dpe.kwhTotLagereKlasse)} kWh/m2`);
    }
    doc.setTextColor('#333333');
    y += 2;

    if (result.dpe.verhuurverbod) {
      doc.setTextColor('#666666');
      textLine(result.dpe.verhuurverbod.beschrijving);
      doc.setTextColor('#333333');
      y += 2;
    }

    doc.setFontSize(8);
    doc.setTextColor(GRAY);
    textLine(
      'Disclaimer: De DPE-indicatie is een gebouwkenmerk, berekend met gestandaardiseerde bewoning ' +
      '(365 dagen, 19 graden C setpoint). Dit is GEEN officiele DPE-audit. Een gecertificeerde DPE ' +
      'classificeert op dubbele drempels (energie en broeikasgassen), gebruikt conventies, en rekent in primaire energie.'
    );
    doc.setTextColor('#333333');
    doc.setFontSize(9);

    // ===================================================================
    // HOOFDSTUK 5: ENERGIEVERBRUIK & KOSTEN
    // ===================================================================
    checkPage(50);
    chapterTitle(5, 'ENERGIEVERBRUIK & KOSTEN');

    subtitle('Verbruik per categorie');
    const verbruikBody: (string | number)[][] = [
      ['Verwarming', fmt(result.verwarmingTotaal), 'Ja'],
      ['Tapwater (DHW)', fmt(result.dhwInput), 'Ja'],
      ['Basiselektriciteit', fmt(result.elektriciteitBasis), 'Ja'],
    ];
    if (result.evKwh > 0) verbruikBody.push(['Elektrische auto', fmt(result.evKwh), 'Nee']);
    if (result.zwembadKwh > 0) verbruikBody.push(['Zwembad', fmt(result.zwembadKwh), 'Nee']);
    if (result.koelingKwh > 0) verbruikBody.push(['Koeling', fmt(result.koelingKwh), 'Nee']);
    verbruikBody.push(['Totaal', fmt(result.totaalVerbruikKwh), '']);

    safeAutoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Categorie', 'kWh/jaar', 'In DPE']],
      body: verbruikBody,
      headStyles: { fillColor: BRAND, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: '#f9f5f5' },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    subtitle('Kosten per categorie');
    const prijsElek = portaalInput.prijsElektriciteit;
    const kostenBody: (string | number)[][] = [
      ['Verwarming', fmtEur(result.kostenVerwarming)],
      ['Tapwater', fmtEur(result.kostenDhw)],
      ['Elektriciteit (basis)', fmtEur(Math.round(result.elektriciteitBasis * prijsElek))],
    ];
    if (result.zwembadKwh > 0) kostenBody.push(['Zwembad', fmtEur(Math.round(result.zwembadKwh * prijsElek))]);
    if (result.koelingKwh > 0) kostenBody.push(['Koeling', fmtEur(Math.round(result.koelingKwh * prijsElek))]);
    if (result.evKwh > 0) kostenBody.push(['EV laden', fmtEur(Math.round(result.evKwh * prijsElek))]);
    kostenBody.push(['Totaal', fmtEur(result.kostenTotaal)]);

    safeAutoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Categorie', 'EUR/jaar']],
      body: kostenBody,
      headStyles: { fillColor: BRAND, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: '#f9f5f5' },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    kvLine('CO2-uitstoot:', `${fmt(result.co2Kg)} kg/jaar`);

    // ===================================================================
    // HOOFDSTUK 6: STOOKGEDRAG
    // ===================================================================
    checkPage(40);
    chapterTitle(6, 'STOOKGEDRAG');

    kvLine('Setpoint aanwezig:', `${toolState.setpoint} \xB0C`);
    kvLine('Setpoint afwezig:', `${toolState.awaySetpoint} \xB0C`);
    kvLine('Dagen aanwezig:', `${toolState.daysPresent} dagen/jaar (${(result.debug.fracPresent * 100).toFixed(0)}%)`);
    kvLine('Dagen afwezig:', `${toolState.daysAway} dagen/jaar (${(result.debug.fracAway * 100).toFixed(0)}%)`);

    y += 5;

    textLine(
      'De gewogen HDD houdt rekening met uw stookgedrag: bij lagere setpoints tijdens afwezigheid ' +
      'worden minder graaddagen meegeteld, waardoor de energiekosten dalen. ' +
      'De DPE-indicatie is een gebouwkenmerk en wordt berekend met gestandaardiseerde bewoning (365 dagen, 19\xB0C).'
    );

    // ===================================================================
    // HOOFDSTUK 7: ZONNEPANELEN
    // ===================================================================
    checkPage(40);
    chapterTitle(7, 'ZONNEPANELEN');

    if (toolState.hasPV === 'ja') {
      kvLine('Vermogen:', `${toolState.pvVermogen} kWp`);
      kvLine('Jaarproductie:', `${fmt(result.pvProductieKwh)} kWh/jaar`);
      kvLine('Zelfverbruik:', `${fmt(result.pvZelfverbruikKwh)} kWh (${toolState.pvZelfverbruik}%)`);
      kvLine('Export:', `${fmt(result.pvExportKwh)} kWh`);
      kvLine('PV-besparing:', `${fmtEur(result.pvBesparing)}/jaar`);
      kvLine('Netto kosten:', `${fmtEur(result.nettoKosten)}/jaar`);
      y += 5;
      textLine(
        'PV-panelen verlagen uw elektriciteitsrekening maar beinvloeden NIET de DPE-indicatie. ' +
        'De DPE classificeert op basis van verbruik, niet productie.'
      );
    } else {
      textLine('Geen zonnepanelen opgegeven.');
      y += 2;
      textLine(
        'Overweeg zonnepanelen voor een lagere elektriciteitsrekening. ' +
        `In uw zone (${zone.name}) is de verwachte opbrengst circa ${zone.pv} kWh per geinstalleerde kWp.`
      );
    }

    // ===================================================================
    // HOOFDSTUK 8: SUBSIDIES
    // ===================================================================
    checkPage(50);
    chapterTitle(8, 'SUBSIDIES');

    const statusLabel: Record<string, string> = { green: 'Mogelijk', amber: 'Voorwaardelijk', red: 'Niet beschikbaar' };
    const subsidieBody = subsidie.cards.map((c) => [
      c.shortTitle,
      statusLabel[c.status] ?? c.status,
      c.amount,
      c.reason.substring(0, 120),
    ]);

    safeAutoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Subsidie', 'Status', 'Bedrag', 'Toelichting']],
      body: subsidieBody,
      headStyles: { fillColor: BRAND, fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: '#f9f5f5' },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 'auto' },
      },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    if (subsidie.actionPlan.length > 0) {
      subtitle('Stappenplan');
      for (const stap of subsidie.actionPlan) {
        textLine(stap, 2);
      }
      y += 5;
    }

    doc.setFontSize(8);
    doc.setTextColor(GRAY);
    textLine('Meer info: infofrankrijk.com/maprimerenov-2026-bezint-eer-ge-begint/');
    textLine('Exacte berekening: mesaides.france-renov.gouv.fr');
    textLine('france-renov.gouv.fr/preparer-projet/trouver-conseiller (zoek een gratis adviseur bij u in de buurt)');
    textLine('france-renov.gouv.fr/annuaire-rge (zoek een RGE-gecertificeerde aannemer)');
    doc.setTextColor('#333333');
    doc.setFontSize(9);

    // ===================================================================
    // HOOFDSTUK 9: AANBEVELINGEN
    // ===================================================================
    checkPage(50);
    chapterTitle(9, 'AANBEVELINGEN');

    if (savings.maatregelen.length === 0) {
      textLine('Uw woning is al goed geisoleerd en uitgerust. Er zijn geen significante besparingsmaatregelen meer beschikbaar.');
    } else {
      textLine(`${savings.maatregelen.length} maatregelen beschikbaar, gesorteerd op terugverdientijd (kortste eerst).`);
      y += 3;

      const aanbBody = savings.maatregelen.map((m, i) => [
        i < 3 ? `* ${m.naam}` : m.naam,
        `${fmtEur(m.besparingEurJaar)}/jr`,
        `${fmtEur(m.kostenSchatting.min)}-${fmtEur(m.kostenSchatting.max)}`,
        m.terugverdientijdJaar < 50 ? `${m.terugverdientijdJaar} jr` : '>50 jr',
        `${result.dpe.letter} -> ${m.dpeNaLetter}`,
      ]);

      safeAutoTable({
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Maatregel', 'Besparing', 'Investering', 'Terugverdientijd', 'DPE-effect']],
        body: aanbBody,
        headStyles: { fillColor: BRAND, fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        alternateRowStyles: { fillColor: '#f9f5f5' },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
        },
        theme: 'grid',
      });
      y = (doc as any).lastAutoTable.finalY + 12;

      if (savings.maatregelen.length >= 3) {
        subtitle('Top-3 aanbevolen');
        for (let i = 0; i < Math.min(3, savings.maatregelen.length); i++) {
          const m = savings.maatregelen[i];
          textLine(`${i + 1}. ${m.naam}: ${m.beschrijving}`, 4);
          textLine(`Besparing: ${fmtEur(m.besparingEurJaar)}/jaar | Terugverdientijd: ${m.terugverdientijdJaar < 50 ? m.terugverdientijdJaar + ' jaar' : '>50 jaar'}`, 8);
          y += 3;
        }
      }
    }

    // ===================================================================
    // ===================================================================
    // BIJLAGE: BEGRIPPEN & AFKORTINGEN
    // ===================================================================
    chapterTitle(10, 'BEGRIPPEN & AFKORTINGEN');

    const glossary: [string, string][] = [
      ['U-waarde (W/m2.K)', 'Warmtedoorlating van een bouwdeel. Lager = beter geisoleerd.'],
      ['UA (W/K)', 'U-waarde x oppervlak. Totaal warmteverlies via een bouwdeel per graad temperatuurverschil.'],
      ['R-waarde (m2.K/W)', 'Warmteweerstand van isolatie. Hoger = beter geisoleerd. R = 1/U.'],
      ['HDD (graaddagen)', 'Heating Degree Days. Meet hoe koud het klimaat is. Meer graaddagen = meer stookbehoefte.'],
      ['ACH (luchtwisselingen/uur)', 'Air Changes per Hour. Hoeveel keer per uur de lucht in huis volledig wordt ververst.'],
      ['Htr (W/K)', 'Transmissieverlies. Warmteverlies via muren, dak, vloer en ramen.'],
      ['Hvent (W/K)', 'Ventilatieverlies. Warmteverlies via luchtverversing en lekken.'],
      ['Htot (W/K)', 'Totaal warmteverlies (Htr + Hvent).'],
      ['DPE', 'Diagnostic de Performance Energetique. Frans energielabel (A t/m G).'],
      ['kWh', 'Kilowattuur. Eenheid voor energieverbruik. 1 kWh = 3.600 kilojoule.'],
      ['kWp', 'Kilowattpiek. Nominaal vermogen van zonnepanelen onder standaardcondities.'],
      ['SCOP', 'Seasonal Coefficient of Performance. Gemiddeld jaarrendement van een warmtepomp.'],
      ['COP', 'Coefficient of Performance. Momentaan rendement van een warmtepomp.'],
      ['eta (rendement)', 'Efficientie van een verwarmingssysteem (0-1 voor ketels, >1 voor warmtepompen).'],
      ['EER', 'Energy Efficiency Ratio. Rendement van een koelsysteem.'],
      ['WTW / HRV', 'Warmteterugwinning. Mechanisch ventilatiesysteem dat warmte uit afgevoerde lucht terugwint.'],
      ['DHW', 'Domestic Hot Water. Sanitair warm water (douche, bad, keuken).'],
      ["MPR (MaPrimeRenov')", 'Franse subsidie voor energetische renovatie. Inkomensafhankelijk.'],
      ['CEE', "Certificats d'Economies d'Energie. Energiebesparingscertificaten via energieleveranciers."],
      ['Eco-PTZ', "Eco-Pret a Taux Zero. Rentevrije lening tot EUR 50.000 voor energierenovatie."],
      ['RGE', 'Reconnu Garant de l\'Environnement. Keurmerk voor gecertificeerde aannemers (vereist voor subsidies).'],
      ['TVA 5,5%', 'Verlaagd BTW-tarief op energetische renovatie (i.p.v. 20%).'],
      ['PV', 'Photovoltaique. Zonnepanelen voor elektriciteitsproductie.'],
    ];

    safeAutoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Begrip', 'Betekenis']],
      body: glossary,
      headStyles: { fillColor: BRAND, fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' } },
      theme: 'striped',
    });
    y = (doc as any).lastAutoTable.finalY + 5;

    // DISCLAIMER
    // ===================================================================
    checkPage(40);
    y += 6;
    doc.setDrawColor('#cccccc');
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentWidth, y);
    y += 5;
    doc.setFontSize(7);
    doc.setTextColor(GRAY);
    const disclaimerText = [
      'DISCLAIMER - Dit rapport is gegenereerd door EnergiePortaal, een simulatietool van InfoFrankrijk.com.',
      'Het is GEEN officieel DPE-rapport en vervangt geen advies van een gecertificeerde energieadviseur.',
      'De DPE-indicatie is een gebouwkenmerk, berekend met gestandaardiseerde bewoning (365 dagen, 19 graden C). Geen officiele 3CL-DPE.',
      'Energieprijzen zijn momentopnamen (maart 2026). Investeringsbedragen zijn indicatief (bron: ADEME).',
      'Subsidie-informatie is indicatief en zonder inkomensvraag.',
      `\xA9 ${new Date().getFullYear()} InfoFrankrijk.com - EnergiePortaal v2`,
    ];
    for (const line of disclaimerText) {
      checkPage(5);
      doc.text(line, margin, y);
      y += 3.5;
    }

    // Add headers/footers to all pages
    addHeaderFooter();

    // Save PDF
    const postcode = toolState.postcode || 'onbekend';
    const woningtype = huisType?.naam?.replace(/[^a-zA-Z0-9]/g, '-') ?? toolState.huisTypeId;
    const datumFile = new Date().toISOString().slice(0, 10);
    doc.save(`EnergiePortaal_${woningtype}_${postcode}_${datumFile}.pdf`);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
    >
      Download PDF-rapport
    </button>
  );
}

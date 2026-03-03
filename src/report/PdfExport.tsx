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
  return `€ ${fmt(n)}`;
}

export function PdfExport() {
  const { toolState, result, portaalInput } = useToolState();
  const zone = getZoneById(toolState.zoneId);
  const huisType = getHuisTypeById(toolState.huisTypeId);
  const savings = useMemo(() => berekenSavings(portaalInput, result), [portaalInput, result]);
  const subsidie = useMemo(() => evaluateSubsidie(portaalInput.subsidieIntake), [portaalInput.subsidieIntake]);

  const handleExport = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const datum = new Date().toLocaleDateString('nl-NL');

    // Helper: add header/footer to each page
    function addHeaderFooter() {
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        // Header
        doc.setFontSize(8);
        doc.setTextColor(BRAND);
        doc.text('EnergiePortaal — Energierapport', margin, 10);
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
      checkPage(20);
      doc.setFontSize(14);
      doc.setTextColor(BRAND);
      doc.setFont('helvetica', 'bold');
      doc.text(`${nr}. ${title}`, margin, y);
      y += 3;
      doc.setDrawColor(BRAND);
      doc.setLineWidth(0.5);
      doc.line(margin, y, margin + contentWidth, y);
      y += 8;
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
      doc.text(text, margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor('#333333');
    }

    // Helper: text line
    function textLine(text: string, indent = 0) {
      checkPage(6);
      const lines = doc.splitTextToSize(text, contentWidth - indent);
      doc.text(lines, margin + indent, y);
      y += lines.length * 4.5;
    }

    // Helper: key-value line
    function kvLine(key: string, value: string, indent = 0) {
      checkPage(6);
      doc.setFont('helvetica', 'bold');
      doc.text(key, margin + indent, y);
      doc.setFont('helvetica', 'normal');
      const keyWidth = doc.getTextWidth(key + ' ');
      doc.text(value, margin + indent + keyWidth, y);
      y += 5;
    }

    // ═══════════════════════════════════════════════════════════════
    // TITELBLAD
    // ═══════════════════════════════════════════════════════════════
    doc.setFontSize(24);
    doc.setTextColor(BRAND);
    doc.setFont('helvetica', 'bold');
    doc.text('EnergiePortaal', pageWidth / 2, 60, { align: 'center' });
    doc.setFontSize(16);
    doc.setTextColor('#444444');
    doc.text('Energierapport', pageWidth / 2, 72, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`${huisType?.naam ?? toolState.huisTypeId} — ${toolState.woonoppervlak} m²`, pageWidth / 2, 85, { align: 'center' });
    doc.text(`${toolState.postcode} (dept. ${toolState.departement}) — ${zone.name}`, pageWidth / 2, 92, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(result.dpe.kleur);
    doc.text(`DPE-indicatie: ${result.dpe.letter} (${Math.round(result.dpe.kwhPerM2)} kWh/m²/jaar)`, pageWidth / 2, 108, { align: 'center' });
    doc.setTextColor('#333333');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Energiekosten: ${fmtEur(result.kostenTotaal)}/jaar`, pageWidth / 2, 118, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(GRAY);
    doc.text(`Gegenereerd op ${datum}`, pageWidth / 2, 135, { align: 'center' });
    doc.text('InfoFrankrijk.com — EnergiePortaal v2', pageWidth / 2, 142, { align: 'center' });

    // ═══════════════════════════════════════════════════════════════
    // HOOFDSTUK 1: WONINGPROFIEL
    // ═══════════════════════════════════════════════════════════════
    doc.addPage();
    y = margin;
    chapterTitle(1, 'WONINGPROFIEL');

    kvLine('Type:', `${huisType?.naam ?? toolState.huisTypeId} (${huisType?.periode ?? ''})`);
    kvLine('Locatie:', `${toolState.postcode} (dept. ${toolState.departement})`);
    kvLine('Klimaatzone:', zone.name);
    kvLine('Oppervlak:', `${toolState.woonoppervlak} m²`);
    kvLine('Verdiepingen:', toolState.verdiepingen);
    kvLine('Volume:', `${result.debug.volume.toLocaleString('nl-NL')} m³`);
    y += 3;

    if (huisType?.beschrijving) {
      textLine(huisType.beschrijving);
      y += 2;
    }

    if (huisType?.waarschuwingen && huisType.waarschuwingen.length > 0) {
      subtitle('Aandachtspunten');
      for (const w of huisType.waarschuwingen) {
        textLine(`• ${w}`, 2);
      }
      y += 2;
    }

    subtitle('U-waarden per bouwdeel');
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Bouwdeel', 'U-waarde (W/m²·K)', 'Oppervlak (m²)', 'UA (W/K)']],
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
    y = (doc as any).lastAutoTable.finalY + 8;

    // ═══════════════════════════════════════════════════════════════
    // HOOFDSTUK 2: LOCATIE & KLIMAAT
    // ═══════════════════════════════════════════════════════════════
    chapterTitle(2, 'LOCATIE & KLIMAAT');

    kvLine('Zone:', zone.name);
    kvLine('Graaddagen (HDD):', `${zone.hdd} K·d`);
    kvLine('Koeldagen (CDD):', `${zone.cdd}`);
    kvLine('PV-opbrengst:', `${zone.pv} kWh/kWp/jaar`);
    kvLine('Ref. buitentemperatuur:', `${zone.Tref} °C`);
    kvLine('Zwembadtemperatuur:', `${zone.pool_temp} °C`);
    y += 3;

    textLine(
      'De klimaatzone bepaalt het aantal graaddagen (HDD), dat direct de warmtevraag beïnvloedt. ' +
      'Meer graaddagen betekent een koeler klimaat en dus meer verwarmingsenergie. ' +
      'De PV-opbrengst varieert van 1100 kWh/kWp in de bergen tot 1450 kWh/kWp aan de Middellandse Zee.'
    );

    // ═══════════════════════════════════════════════════════════════
    // HOOFDSTUK 3: ISOLATIE & WARMTEVERLIES
    // ═══════════════════════════════════════════════════════════════
    checkPage(40);
    chapterTitle(3, 'ISOLATIE & WARMTEVERLIES');

    subtitle('Transmissieverlies (Htr)');
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Bouwdeel', 'U (W/m²·K)', 'A (m²)', 'UA = U × A (W/K)']],
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
    y = (doc as any).lastAutoTable.finalY + 6;

    subtitle('Ventilatieverlies (Hvent)');
    kvLine('Formule:', `0.34 × ${result.debug.volume} m³ × ${result.debug.achGebruikt} ACH = ${result.debug.hventVoorHRV.toFixed(1)} W/K`);
    if (toolState.hasHRV === 'ja') {
      kvLine('WTW-correctie:', `${result.debug.hventVoorHRV.toFixed(1)} × (1 - ${(Number(toolState.hrvEfficiency) / 100).toFixed(2)}) = ${result.hventEffWK} W/K`);
    }
    kvLine('Totaal H (Htr + Hvent):', `${result.uaWK} + ${result.hventEffWK} = ${result.hTotaalWK} W/K`);
    y += 3;

    subtitle('Gewogen HDD');
    kvLine('Basis HDD zone:', `${zone.hdd} K·d`);
    kvLine('Aanwezig:', `${result.debug.setpoint}°C (${(result.debug.fracPresent * 100).toFixed(0)}%) → HDD = ${Math.round(result.debug.hddCorrPresent)}`);
    kvLine('Afwezig:', `${result.debug.awaySetpoint}°C (${(result.debug.fracAway * 100).toFixed(0)}%) → HDD = ${Math.round(result.debug.hddCorrAway)}`);
    kvLine('HDD_eff gewogen:', `${Math.round(result.debug.hddEffGewogen)} K·d`);

    // ═══════════════════════════════════════════════════════════════
    // HOOFDSTUK 4: DPE-INDICATIE
    // ═══════════════════════════════════════════════════════════════
    checkPage(60);
    chapterTitle(4, 'DPE-INDICATIE');

    // DPE letter groot
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(result.dpe.kleur);
    doc.text(result.dpe.letter, margin, y + 2);
    doc.setFontSize(12);
    doc.setTextColor('#333333');
    doc.text(`${Math.round(result.dpe.kwhPerM2)} kWh/m²/jaar`, margin + 15, y + 2);
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
        doc.text(`≤ ${klasse.maxKwhM2}`, margin + barWidth - 12, y + 3.7);
      }
      if (isHuidig) {
        doc.setTextColor('#333333');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`◄ ${Math.round(result.dpe.kwhPerM2)} kWh/m²`, margin + barWidth + 3, y + 3.7);
        doc.setFont('helvetica', 'normal');
      }
      y += 6.5;
    }
    y += 4;

    if (result.dpe.kwhTotVolgendeKlasse > 0 && result.dpe.letter !== 'A') {
      doc.setTextColor('#16a34a');
      textLine(`↑ Naar betere klasse: nog ${Math.round(result.dpe.kwhTotVolgendeKlasse)} kWh/m² besparen`);
    }
    if (result.dpe.kwhTotLagereKlasse > 0 && result.dpe.letter !== 'G') {
      doc.setTextColor('#ef4444');
      textLine(`↓ Marge tot lagere klasse: ${Math.round(result.dpe.kwhTotLagereKlasse)} kWh/m²`);
    }
    doc.setTextColor('#333333');
    y += 2;

    if (result.dpe.verhuurverbod) {
      doc.setTextColor('#dc2626');
      textLine(result.dpe.verhuurverbod.beschrijving);
      doc.setTextColor('#333333');
      y += 2;
    }

    doc.setFontSize(8);
    doc.setTextColor(GRAY);
    textLine(
      'Disclaimer: Indicatieve berekening op basis van uw invoer en finale energie. ' +
      'Geen officiële DPE-audit. Een gecertificeerde DPE classificeert op dubbele drempels ' +
      '(energie én broeikasgassen), gebruikt conventies, en rekent in primaire energie.'
    );
    doc.setTextColor('#333333');
    doc.setFontSize(9);

    // ═══════════════════════════════════════════════════════════════
    // HOOFDSTUK 5: ENERGIEVERBRUIK & KOSTEN
    // ═══════════════════════════════════════════════════════════════
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

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Categorie', 'kWh/jaar', 'In DPE']],
      body: verbruikBody,
      headStyles: { fillColor: BRAND, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: '#f9f5f5' },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 6;

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

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Categorie', '€/jaar']],
      body: kostenBody,
      headStyles: { fillColor: BRAND, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: '#f9f5f5' },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    kvLine('CO₂-uitstoot:', `${fmt(result.co2Kg)} kg/jaar`);

    // ═══════════════════════════════════════════════════════════════
    // HOOFDSTUK 6: STOOKGEDRAG
    // ═══════════════════════════════════════════════════════════════
    checkPage(40);
    chapterTitle(6, 'STOOKGEDRAG');

    kvLine('Setpoint aanwezig:', `${toolState.setpoint} °C`);
    kvLine('Setpoint afwezig:', `${toolState.awaySetpoint} °C`);
    kvLine('Dagen aanwezig:', `${toolState.daysPresent} dagen/jaar (${(result.debug.fracPresent * 100).toFixed(0)}%)`);
    kvLine('Dagen afwezig:', `${toolState.daysAway} dagen/jaar (${(result.debug.fracAway * 100).toFixed(0)}%)`);

    const leegstand = 1 - result.debug.fracPresent - result.debug.fracAway;
    if (leegstand > 0.001) {
      kvLine('Leegstand:', `${(leegstand * 100).toFixed(0)}% (geen verwarming)`);
    }
    y += 3;

    textLine(
      'De gewogen HDD houdt rekening met uw stookgedrag: bij lagere setpoints tijdens afwezigheid ' +
      'worden minder graaddagen meegeteld, waardoor de warmtevraag daalt. ' +
      'Leegstandsdagen (noch aanwezig noch afwezig) worden niet verwarmd.'
    );

    // ═══════════════════════════════════════════════════════════════
    // HOOFDSTUK 7: ZONNEPANELEN
    // ═══════════════════════════════════════════════════════════════
    checkPage(40);
    chapterTitle(7, 'ZONNEPANELEN');

    if (toolState.hasPV === 'ja') {
      kvLine('Vermogen:', `${toolState.pvVermogen} kWp`);
      kvLine('Jaarproductie:', `${fmt(result.pvProductieKwh)} kWh/jaar`);
      kvLine('Zelfverbruik:', `${fmt(result.pvZelfverbruikKwh)} kWh (${toolState.pvZelfverbruik}%)`);
      kvLine('Export:', `${fmt(result.pvExportKwh)} kWh`);
      kvLine('PV-besparing:', `${fmtEur(result.pvBesparing)}/jaar`);
      kvLine('Netto kosten:', `${fmtEur(result.nettoKosten)}/jaar`);
      y += 3;
      textLine(
        'PV-panelen verlagen uw elektriciteitsrekening maar beïnvloeden NIET de DPE-indicatie. ' +
        'De DPE classificeert op basis van verbruik, niet productie.'
      );
    } else {
      textLine('Geen zonnepanelen opgegeven.');
      y += 2;
      textLine(
        'Overweeg zonnepanelen voor een lagere elektriciteitsrekening. ' +
        `In uw zone (${zone.name}) is de verwachte opbrengst circa ${zone.pv} kWh per geïnstalleerde kWp.`
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // HOOFDSTUK 8: SUBSIDIES
    // ═══════════════════════════════════════════════════════════════
    checkPage(50);
    chapterTitle(8, 'SUBSIDIES');

    const statusLabel: Record<string, string> = { green: 'Mogelijk', amber: 'Voorwaardelijk', red: 'Niet beschikbaar' };
    const subsidieBody = subsidie.cards.map((c) => [
      c.shortTitle,
      statusLabel[c.status] ?? c.status,
      c.amount,
      c.reason.substring(0, 80),
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Subsidie', 'Status', 'Bedrag', 'Toelichting']],
      body: subsidieBody,
      headStyles: { fillColor: BRAND, fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: '#f9f5f5' },
      columnStyles: { 3: { cellWidth: 60 } },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    if (subsidie.actionPlan.length > 0) {
      subtitle('Stappenplan');
      for (const stap of subsidie.actionPlan) {
        textLine(stap, 2);
      }
      y += 3;
    }

    doc.setFontSize(8);
    doc.setTextColor(GRAY);
    textLine('Meer info: infofrankrijk.com/maprimerenov-2026-bezint-eer-ge-begint/');
    textLine('Exacte berekening: mesaides.france-renov.gouv.fr');
    doc.setTextColor('#333333');
    doc.setFontSize(9);

    // ═══════════════════════════════════════════════════════════════
    // HOOFDSTUK 9: AANBEVELINGEN
    // ═══════════════════════════════════════════════════════════════
    checkPage(50);
    chapterTitle(9, 'AANBEVELINGEN');

    if (savings.maatregelen.length === 0) {
      textLine('Uw woning is al goed geïsoleerd en uitgerust. Er zijn geen significante besparingsmaatregelen meer beschikbaar.');
    } else {
      textLine(`${savings.maatregelen.length} maatregelen beschikbaar, gesorteerd op terugverdientijd (kortste eerst).`);
      y += 3;

      const aanbBody = savings.maatregelen.map((m, i) => [
        i < 3 ? `★ ${m.naam}` : m.naam,
        `${fmtEur(m.besparingEurJaar)}/jr`,
        `${fmtEur(m.kostenSchatting.min)}–${fmtEur(m.kostenSchatting.max)}`,
        m.terugverdientijdJaar < 50 ? `${m.terugverdientijdJaar} jr` : '>50 jr',
        `${result.dpe.letter} → ${m.dpeNaLetter}`,
      ]);

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Maatregel', 'Besparing', 'Investering', 'Terugverdientijd', 'DPE-effect']],
        body: aanbBody,
        headStyles: { fillColor: BRAND, fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        alternateRowStyles: { fillColor: '#f9f5f5' },
        theme: 'grid',
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      if (savings.maatregelen.length >= 3) {
        subtitle('Top-3 aanbevolen');
        for (let i = 0; i < Math.min(3, savings.maatregelen.length); i++) {
          const m = savings.maatregelen[i];
          textLine(`${i + 1}. ${m.naam}: ${m.beschrijving} (besparing: ${fmtEur(m.besparingEurJaar)}/jaar, terugverdientijd: ${m.terugverdientijdJaar < 50 ? m.terugverdientijdJaar + ' jaar' : '>50 jaar'})`, 2);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // DISCLAIMER
    // ═══════════════════════════════════════════════════════════════
    checkPage(40);
    y += 6;
    doc.setDrawColor('#cccccc');
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentWidth, y);
    y += 5;
    doc.setFontSize(7);
    doc.setTextColor(GRAY);
    const disclaimerText = [
      'DISCLAIMER — Dit rapport is gegenereerd door EnergiePortaal, een simulatietool van InfoFrankrijk.com.',
      'Het is GEEN officieel DPE-rapport en vervangt geen advies van een gecertificeerde energieadviseur.',
      'De DPE-indicatie werkt met finale energie en uw invoer, niet met de officiële 3CL-DPE 2021 methode.',
      'Energieprijzen zijn momentopnamen (feb 2026). Investeringsbedragen zijn indicatief (bron: ADEME).',
      'Subsidie-informatie is indicatief en zonder inkomensvraag.',
      `© ${new Date().getFullYear()} InfoFrankrijk.com — EnergiePortaal v2`,
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
      📄 Download PDF-rapport
    </button>
  );
}

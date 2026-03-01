import jsPDF from 'jspdf';
import type { PortaalResult } from '../engine/types';
import type { ToolState } from '../context/ToolStateContext';
import { getHuisTypeById } from '../data/huizen-matrix';

const DISCLAIMER =
  'Dit is een indicatieve schatting, geen officieel DPE-rapport. Een officieel DPE kan alleen worden opgesteld door een gecertificeerd diagnostiqueur. Vind een adviseur via https://france-renov.gouv.fr/preparer-projet/trouver-conseiller';

export function generatePdf(toolState: ToolState, result: PortaalResult): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const PRIMARY = [128, 0, 0] as [number, number, number];
  const pageW = doc.internal.pageSize.getWidth();
  const huisType = getHuisTypeById(toolState.huisTypeId);

  // Header bar
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('EnergiePortaal', 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Energierapport — indicatief', 14, 23);

  const dateStr = new Date().toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(dateStr, pageW - 14, 23, { align: 'right' });

  doc.setTextColor(30, 30, 30);

  let y = 40;

  // Section: Woningprofiel
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...PRIMARY);
  doc.text('Woningprofiel', 14, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);

  const inputRows: [string, string][] = [
    ['Woningtype', `${huisType?.naam ?? toolState.huisTypeId} (${huisType?.periode ?? ''})`],
    ['Postcode', toolState.postcode || 'Niet ingevuld'],
    ['Woonoppervlak', `${toolState.woonoppervlak} m²`],
    ['Volume', `${result.debug.volume} m³`],
  ];

  for (const [label, value] of inputRows) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, y);
    y += 7;
  }

  y += 5;

  // Section: Resultaten
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...PRIMARY);
  doc.text('Resultaten', 14, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);

  const resultRows: [string, string][] = [
    ['DPE-indicatie', `${result.dpe.letter} (${Math.round(result.dpe.kwhPerM2)} kWh/m²/jaar)`],
    ['Totaal verbruik', `${result.totaalVerbruikKwh.toLocaleString('nl-NL')} kWh/jaar`],
    ['CO₂-uitstoot', `${result.co2Kg.toLocaleString('nl-NL')} kg/jaar`],
    ['Energiekosten', `€ ${result.kostenTotaal.toLocaleString('nl-NL')}/jaar`],
    ['Netto kosten', `€ ${result.nettoKosten.toLocaleString('nl-NL')}/jaar`],
  ];

  for (const [label, value] of resultRows) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, y);
    y += 7;
  }

  // Disclaimer box
  y += 10;
  doc.setFillColor(255, 248, 240);
  doc.setDrawColor(200, 100, 0);
  doc.roundedRect(14, y, pageW - 28, 26, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 80, 0);
  doc.text('Disclaimer', 20, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const disclaimerLines = doc.splitTextToSize(DISCLAIMER, pageW - 36);
  doc.text(disclaimerLines, 20, y + 13);

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...PRIMARY);
  doc.rect(0, pageH - 12, pageW, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('EnergiePortaal · energieportaal.vercel.app', 14, pageH - 5);

  doc.save('energierapport.pdf');
}

interface PdfExportButtonProps {
  toolState: ToolState;
  result: PortaalResult;
}

export function PdfExportButton({ toolState, result }: PdfExportButtonProps) {
  return (
    <button
      onClick={() => generatePdf(toolState, result)}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000]"
      style={{ backgroundColor: '#800000' }}
    >
      Download rapport (PDF)
    </button>
  );
}

/**
 * pdfCharts.js — visualisations du rapport PDF (jauge de score,
 * barre de conformité empilée, matrice de statuts par module).
 */
import { COLOR, statusStyle } from './pdfTheme.js';

const RISK_COLOR = {
  success: { ring: COLOR.successStrong, text: COLOR.success, bg: COLOR.successBg },
  primary: { ring: COLOR.primary, text: COLOR.primaryDark, bg: COLOR.primaryTint },
  warning: { ring: COLOR.warningStrong, text: COLOR.warning, bg: COLOR.warningBg },
  danger: { ring: COLOR.dangerStrong, text: COLOR.danger, bg: COLOR.dangerBg },
};

/** Jauge circulaire de score avec libellé de niveau de risque sous le nombre. */
export function drawScoreGauge(doc, cx, cy, radius, score, riskLabel, riskColorKey) {
  const risk = RISK_COLOR[riskColorKey] ?? RISK_COLOR.primary;
  const strokeW = radius * 0.24;
  const segments = 90;
  const startAngle = -90;
  const sweep = (Math.max(0, Math.min(100, score)) / 100) * 360;

  doc.setDrawColor(...COLOR.line);
  doc.setLineWidth(strokeW);
  doc.circle(cx, cy, radius, 'S');

  doc.setDrawColor(...risk.ring);
  doc.setLineWidth(strokeW);
  const steps = Math.round(segments * (sweep / 360));
  for (let i = 0; i < steps; i++) {
    const a1 = ((startAngle + (i / segments) * 360) * Math.PI) / 180;
    const a2 = ((startAngle + ((i + 1) / segments) * 360) * Math.PI) / 180;
    doc.line(cx + radius * Math.cos(a1), cy + radius * Math.sin(a1), cx + radius * Math.cos(a2), cy + radius * Math.sin(a2));
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(radius * 0.62);
  doc.setTextColor(...COLOR.ink);
  doc.text(`${Math.round(score)}`, cx, cy + radius * 0.12, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(radius * 0.2);
  doc.setTextColor(...COLOR.inkFaint);
  doc.text('/ 100', cx, cy + radius * 0.34, { align: 'center' });

  const chipW = radius * 1.15;
  const chipH = radius * 0.36;
  doc.setFillColor(...risk.bg);
  doc.roundedRect(cx - chipW / 2, cy + radius * 0.5, chipW, chipH, chipH / 2, chipH / 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(radius * 0.22);
  doc.setTextColor(...risk.text);
  doc.text(riskLabel.toUpperCase(), cx, cy + radius * 0.5 + chipH / 2 + radius * 0.08, { align: 'center' });
}

/** Barre de conformité empilée (conforme / à surveiller / critique) + légende. */
export function drawComplianceBar(doc, x, y, width, counts) {
  const { ok = 0, warning = 0, danger = 0 } = counts;
  const total = Math.max(1, ok + warning + danger);
  const h = 6;
  const segs = [
    { n: ok, color: COLOR.successStrong },
    { n: warning, color: COLOR.warningStrong },
    { n: danger, color: COLOR.dangerStrong },
  ];

  doc.setDrawColor(...COLOR.line);
  doc.setLineWidth(0.25);
  doc.setFillColor(...COLOR.neutralBg);
  doc.rect(x, y, width, h, 'FD');

  let cursor = x;
  segs.forEach((s) => {
    const w = (s.n / total) * width;
    if (w <= 0) return;
    doc.setFillColor(...s.color);
    doc.rect(cursor, y, w, h, 'F');
    cursor += w;
  });

  const legendY = y + h + 6;
  const items = [
    { label: `Conforme (${ok})`, color: COLOR.successStrong },
    { label: `À surveiller (${warning})`, color: COLOR.warningStrong },
    { label: `Critique (${danger})`, color: COLOR.dangerStrong },
  ];
  let lx = x;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  items.forEach((it) => {
    doc.setFillColor(...it.color);
    doc.circle(lx + 1.2, legendY - 1, 1.2, 'F');
    doc.setTextColor(...COLOR.inkSoft);
    doc.text(it.label, lx + 4.2, legendY);
    lx += doc.getTextWidth(it.label) + 12;
  });
  return legendY - y + 4;
}

/** Petite matrice de statuts : une puce colorée par module avec son libellé. */
export function drawModuleMatrix(doc, x, y, width, modules) {
  const cols = 5;
  const cellW = width / cols;
  const cellH = 16;
  modules.forEach((m, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = x + col * cellW + cellW / 2;
    const cy = y + row * cellH;
    const s = statusStyle(m.status);
    doc.setFillColor(...s.bg);
    doc.circle(cx, cy, 3.6, 'F');
    doc.setDrawColor(...s.strong);
    doc.setLineWidth(0.5);
    doc.circle(cx, cy, 3.6, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...s.text);
    doc.text(m.short, cx, cy + 1.1, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    doc.setTextColor(...COLOR.inkFaint);
    doc.text(m.label, cx, cy + 7, { align: 'center' });
  });
  const rows = Math.ceil(modules.length / cols);
  return rows * cellH + 4;
}

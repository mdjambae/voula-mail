/**
 * pdfReport.js
 * ------------------------------------------------------------------
 * Génère le rapport PDF VOULA Mail au format d'un rapport d'audit
 * cybersécurité professionnel : couverture avec jauge de score et
 * niveau de risque, résumé exécutif avec graphique de conformité,
 * résultats détaillés en cartes (icônes + couleurs d'état), feuille
 * de route des corrections priorisée, et page finale méthodologie /
 * informations / signature / QR code de vérification.
 *
 * Toutes les hauteurs de bloc sont calculées dynamiquement à partir
 * du texte réellement mesuré (measureText) avant d'être dessinées :
 * aucun texte ne doit déborder, et les sauts de page sont posés
 * automatiquement dès qu'un bloc ne tient plus dans l'espace restant.
 * ------------------------------------------------------------------
 */
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { AUDIT_MODULES } from '../audit/index.js';
import { scoreLabel } from '../audit/scoring.js';
import { detectProviders, buildTailoredStep } from '../audit/providerDetection.js';
import { LOGO_BADGE_PNG_BASE64 } from '../../assets/logoBadge.js';
import {
  PAGE_W,
  PAGE_H,
  MARGIN,
  CONTENT_X,
  CONTENT_W,
  COLOR,
  statusStyle,
  measureText,
  drawText,
  drawStatusIcon,
  drawBadge,
  drawArrowIcon,
  filledCircle,
} from './pdfTheme.js';
import { PdfFlow, MAX_Y } from './pdfLayout.js';
import { drawScoreGauge, drawComplianceBar, drawModuleMatrix } from './pdfCharts.js';

const MODULE_SHORT = {
  mx: 'MX',
  spf: 'SPF',
  dkim: 'DK',
  dmarc: 'DM',
  dnssec: 'DS',
  'mta-sts': 'MS',
  'tls-rpt': 'TR',
  bimi: 'BI',
  'reverse-dns': 'RD',
  smtp: 'SM',
};

function uid() {
  return `VOULA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function orderedModules(report) {
  return AUDIT_MODULES.map((m) => report.results[m.id]).filter(Boolean);
}

function countByStatus(modules) {
  return modules.reduce(
    (acc, m) => {
      if (m.status === 'ok') acc.ok += 1;
      else if (m.status === 'warning') acc.warning += 1;
      else acc.danger += 1;
      return acc;
    },
    { ok: 0, warning: 0, danger: 0 }
  );
}

async function buildQrDataUrl(text) {
  try {
    return await QRCode.toDataURL(text, { margin: 1, width: 320, color: { dark: '#151520', light: '#FFFFFF' } });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------
// Page 1 — Couverture
// ---------------------------------------------------------------------
function drawCoverPage(doc, report, reportId, riskInfo, qrDataUrl, verifyUrl) {
  doc.setFillColor(...COLOR.paper);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Bandeau supérieur teinté
  doc.setFillColor(...COLOR.primaryTint);
  doc.rect(0, 0, PAGE_W, 64, 'F');

  try {
    doc.addImage(LOGO_BADGE_PNG_BASE64, 'PNG', MARGIN, 16, 13, 13);
  } catch {
    /* dégradation silencieuse si l'image ne charge pas */
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...COLOR.ink);
  doc.text('VOULA', MARGIN + 17, 22.5);
  doc.setTextColor(...COLOR.primaryDark);
  doc.text('Mail', MARGIN + 17 + doc.getTextWidth('VOULA '), 22.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR.inkSoft);
  doc.text('AUDIT DE SÉCURITÉ E-MAIL', MARGIN + 17, 27.4);

  // Tag confidentiel
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const tag = 'CONFIDENTIEL';
  const tagW = doc.getTextWidth(tag) + 6;
  doc.setFillColor(...COLOR.paper);
  doc.roundedRect(PAGE_W - MARGIN - tagW, 16, tagW, 6.5, 3.2, 3.2, 'F');
  doc.setTextColor(...COLOR.primaryDark);
  doc.text(tag, PAGE_W - MARGIN - tagW / 2, 20.4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR.inkSoft);
  doc.text('RAPPORT D\'AUDIT DE SÉCURITÉ E-MAIL', MARGIN, 42);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...COLOR.ink);
  const domainLines = doc.splitTextToSize(report.domain, CONTENT_W - 20);
  doc.text(domainLines, MARGIN, 54);
  const domainExtraLines = Math.max(0, domainLines.length - 1);

  let y = 84 + domainExtraLines * 10.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.inkSoft);
  const genDate = new Date(report.scannedAt).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  doc.text(`Généré le ${genDate}`, MARGIN, y);
  doc.text(`Identifiant : ${reportId}`, PAGE_W - MARGIN, y, { align: 'right' });

  // Carte score
  y += 10;
  const cardH = 78;
  doc.setFillColor(...COLOR.surface);
  doc.setDrawColor(...COLOR.line);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, cardH, 4, 4, 'FD');

  drawScoreGauge(doc, MARGIN + 38, y + 40, 26, report.score.score, riskInfo.label, riskInfo.color);

  const textX = MARGIN + 82;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(...COLOR.ink);
  doc.text('Score de sécurité global', textX, y + 20);

  const modules = orderedModules(report);
  const counts = countByStatus(modules);
  const summary = `Ce score reflète la conformité de ${report.domain} aux principaux standards d'authentification et de chiffrement des e-mails (SPF, DKIM, DMARC, DNSSEC, MTA-STS, TLS-RPT, BIMI). ${counts.ok} module(s) conforme(s), ${counts.warning} à surveiller, ${counts.danger} critique(s) sur ${modules.length} testés.`;
  drawText(doc, summary, textX, y + 27, { maxWidth: CONTENT_W - (textX - MARGIN) - 4, size: 9, color: COLOR.inkSoft });

  drawComplianceBar(doc, textX, y + 58, CONTENT_W - (textX - MARGIN) - 4, counts);

  // Bloc QR + mention de vérification
  const qrY = y + cardH + 16;
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', PAGE_W - MARGIN - 26, qrY, 26, 26);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR.ink);
  doc.text('Vérifier ce rapport', PAGE_W - MARGIN, qrY + 30, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...COLOR.inkFaint);
  const idLines = doc.splitTextToSize(reportId, 60);
  idLines.forEach((line, i) => doc.text(line, PAGE_W - MARGIN, qrY + 34 + i * 3, { align: 'right' }));

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.3);
  doc.setTextColor(...COLOR.inkSoft);
  const disclaimer =
    "Ce rapport a été généré automatiquement par le moteur d'audit VOULA Mail à partir des enregistrements DNS publics du domaine, au moment indiqué ci-dessus. Il constitue un instantané et ne remplace pas un audit de sécurité complet.";
  drawText(doc, disclaimer, MARGIN, qrY + 6, { maxWidth: CONTENT_W - 46, size: 8.3, color: COLOR.inkSoft });

  // Pied de couverture
  doc.setDrawColor(...COLOR.line);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
  doc.setFontSize(7.3);
  doc.setTextColor(...COLOR.inkFaint);
  doc.text('VOULA Mail — Rapport d\'audit de sécurité e-mail', MARGIN, PAGE_H - 9);
  doc.text('Page 1', PAGE_W - MARGIN, PAGE_H - 9, { align: 'right' });
}

// ---------------------------------------------------------------------
// Page(s) — Résumé exécutif
// ---------------------------------------------------------------------
function drawExecutiveSummary(flow, report, detection) {
  const { doc } = flow;
  flow.addContentPage('Résumé exécutif');
  flow.sectionTitle('Résumé exécutif');

  const modules = orderedModules(report);
  const counts = countByStatus(modules);
  const execText = `L'audit du domaine ${report.domain} a passé en revue ${modules.length} protocoles de sécurité et d'authentification e-mail. ${counts.ok} protocole(s) sont pleinement conformes, ${counts.warning} nécessitent une attention particulière, et ${counts.danger} présentent un risque critique nécessitant une correction prioritaire. Le score global obtenu est de ${report.score.score}/100, soit un niveau de risque « ${scoreLabel(report.score.score).label} ». Les sections suivantes détaillent chaque critère ainsi qu'une feuille de route de corrections classées par priorité.`;

  const { height } = measureText(doc, execText, CONTENT_W, { size: 9.5 });
  flow.ensure(height + 4);
  flow.y += drawText(doc, execText, CONTENT_X, flow.y, { maxWidth: CONTENT_W, size: 9.5, color: COLOR.inkSoft });
  flow.y += 10;

  drawInfrastructureBlock(flow, detection);

  // Graphique de conformité
  flow.ensure(28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR.ink);
  doc.text('Vue d\'ensemble de la conformité', CONTENT_X, flow.y);
  flow.y += 7;
  const barLegendH = drawComplianceBar(doc, CONTENT_X, flow.y, CONTENT_W, counts);
  flow.y += barLegendH + 10;

  // Matrice des modules
  const matrixModules = modules.map((m) => ({ short: MODULE_SHORT[m.id] ?? m.label.slice(0, 2).toUpperCase(), label: m.label, status: m.status }));
  const matrixRows = Math.ceil(matrixModules.length / 5);
  flow.ensure(matrixRows * 16 + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR.ink);
  doc.text('Statut par protocole', CONTENT_X, flow.y);
  flow.y += 7;
  const matrixH = drawModuleMatrix(doc, CONTENT_X, flow.y, CONTENT_W, matrixModules);
  flow.y += matrixH + 8;

  // Table du barème de score
  flow.ensure(16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR.ink);
  doc.text('Détail du barème de score', CONTENT_X, flow.y);
  flow.y += 3;
  drawScoreTable(flow, report.score.breakdown);
}

function drawInfrastructureBlock(flow, detection) {
  const { doc } = flow;
  if (!detection) return;

  const dns = detection.primaryDns;
  const email = detection.primaryEmail;

  const dnsNote = dns?.guide ? `${dns.guide.login} ${dns.guide.navigate}` : '';
  const dnsMeasure = measureText(doc, dnsNote, CONTENT_W - 58, { size: 8.4 });
  const emailNote = email
    ? "Les recommandations de ce rapport incluent, lorsqu'elles existent, les étapes propres à ce fournisseur."
    : 'Aucun fournisseur de messagerie reconnu dans notre base — les recommandations restent génériques et applicables chez tout hébergeur.';
  const emailMeasure = measureText(doc, emailNote, CONTENT_W - 58, { size: 8.4 });

  const rowH1 = Math.max(16, dnsMeasure.height + 10);
  const rowH2 = Math.max(14, emailMeasure.height + 10);
  const cardH = rowH1 + rowH2;

  flow.ensure(cardH + 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR.ink);
  doc.text('Infrastructure détectée', CONTENT_X, flow.y);
  flow.y += 7;

  const cardY = flow.y;
  doc.setFillColor(...COLOR.surface);
  doc.roundedRect(CONTENT_X, cardY, CONTENT_W, cardH, 3, 3, 'F');

  // Ligne hébergement DNS
  filledCircle(doc, CONTENT_X + 12, cardY + rowH1 / 2, 4.6, COLOR.primaryTint);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.primaryDark);
  doc.text('DNS', CONTENT_X + 12, cardY + rowH1 / 2 + 1, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.ink);
  doc.text(`Hébergement DNS — ${dns?.label ?? 'non identifié'}`, CONTENT_X + 24, cardY + 6.5);
  drawText(doc, dnsNote, CONTENT_X + 24, cardY + 11, { maxWidth: CONTENT_W - 30, size: 8.4, color: COLOR.inkSoft });

  // Ligne fournisseur e-mail
  const rowY = cardY + rowH1;
  doc.setDrawColor(...COLOR.line);
  doc.setLineWidth(0.2);
  doc.line(CONTENT_X + 6, rowY, CONTENT_X + CONTENT_W - 6, rowY);

  filledCircle(doc, CONTENT_X + 12, rowY + rowH2 / 2, 4.6, COLOR.primaryTint);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.primaryDark);
  doc.text('MX', CONTENT_X + 12, rowY + rowH2 / 2 + 1, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.ink);
  doc.text(`Service e-mail — ${email?.label ?? 'non identifié'}`, CONTENT_X + 24, rowY + 6.5);
  drawText(doc, emailNote, CONTENT_X + 24, rowY + 11, { maxWidth: CONTENT_W - 30, size: 8.4, color: COLOR.inkSoft });

  flow.y = cardY + cardH + 10;
}

function drawScoreTable(flow, breakdown) {
  const { doc } = flow;
  const colLabelW = CONTENT_W - 46;
  const rowPaddingY = 3.4;
  const headerH = 8;

  const drawHeader = () => {
    flow.ensure(headerH + 2);
    doc.setFillColor(...COLOR.surfaceStrong);
    doc.rect(CONTENT_X, flow.y, CONTENT_W, headerH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(...COLOR.inkSoft);
    doc.text('CRITÈRE', CONTENT_X + 8, flow.y + headerH / 2 + 1.2);
    doc.text('POINTS', CONTENT_X + colLabelW + 22, flow.y + headerH / 2 + 1.2, { align: 'right' });
    flow.y += headerH;
  };

  drawHeader();

  breakdown.forEach((b, i) => {
    const { lines, lineHeight } = measureText(doc, b.label, colLabelW - 12, { size: 8.6 });
    const rowH = Math.max(8.5, lines.length * lineHeight + rowPaddingY * 2 - 2);

    if (flow.y + rowH > MAX_Y) {
      flow.addContentPage(flow.section);
      drawHeader();
    }

    if (i % 2 === 1) {
      doc.setFillColor(...COLOR.surface);
      doc.rect(CONTENT_X, flow.y, CONTENT_W, rowH, 'F');
    }

    const earned = b.earned > 0;
    const dotColor = earned ? COLOR.successStrong : COLOR.line;
    doc.setFillColor(...dotColor);
    doc.circle(CONTENT_X + 4, flow.y + rowH / 2, 1.3, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.6);
    doc.setTextColor(earned ? COLOR.ink[0] : COLOR.inkFaint[0], earned ? COLOR.ink[1] : COLOR.inkFaint[1], earned ? COLOR.ink[2] : COLOR.inkFaint[2]);
    lines.forEach((line, li) => {
      doc.text(line, CONTENT_X + 8, flow.y + rowPaddingY + li * lineHeight + lineHeight * 0.72);
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.6);
    doc.setTextColor(...(earned ? COLOR.successStrong : COLOR.inkFaint));
    doc.text(`${b.earned}/${b.weight}`, CONTENT_X + colLabelW + 22, flow.y + rowH / 2 + 1, { align: 'right' });

    flow.y += rowH;
    doc.setDrawColor(...COLOR.line);
    doc.setLineWidth(0.15);
    doc.line(CONTENT_X, flow.y, CONTENT_X + CONTENT_W, flow.y);
  });

  flow.y += 8;
}

// ---------------------------------------------------------------------
// Résultats détaillés — une carte par module, hauteur calculée dynamiquement
// ---------------------------------------------------------------------
function measureModuleCard(doc, mod, tailoredStep) {
  const innerW = CONTENT_W - 16;
  const subtitle = measureText(doc, mod.fullName, CONTENT_W - 22, { size: 7.8 });
  let h = 9 + 6 + subtitle.height + 3; // icône/titre (+9), sous-titre (+6), espace avant contenu (+3)
  if (mod.record) {
    const rec = measureText(doc, mod.record, innerW - 4, { size: 7.6, font: 'courier' });
    h += rec.height + 6;
  }
  (mod.issues ?? []).forEach((issue) => {
    const m = measureText(doc, issue, innerW - 6, { size: 8.3 });
    h += m.height + 1.6;
  });
  (mod.recommendations ?? []).forEach((rec) => {
    const m = measureText(doc, rec, innerW - 6, { size: 8.3 });
    h += m.height + 1.6;
  });
  if (tailoredStep) {
    const m = measureText(doc, tailoredStep, innerW - 10, { size: 8.2 });
    h += m.height + 8;
  }
  if (!mod.issues?.length && !mod.recommendations?.length && !tailoredStep) {
    h += 8;
  }
  return h + 8;
}

function drawModuleCard(flow, mod, detection) {
  const { doc } = flow;
  const tailoredStep = buildTailoredStep(detection, mod.id);
  const cardH = measureModuleCard(doc, mod, tailoredStep);
  flow.ensure(cardH + 6);
  const y0 = flow.y;
  const s = statusStyle(mod.status);

  doc.setFillColor(...COLOR.surface);
  doc.roundedRect(CONTENT_X, y0, CONTENT_W, cardH, 3, 3, 'F');
  doc.setFillColor(...s.strong);
  doc.roundedRect(CONTENT_X, y0, 2.4, cardH, 1.2, 1.2, 'F');

  let cy = y0 + 9;
  drawStatusIcon(doc, CONTENT_X + 13, cy, 5, mod.status);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR.ink);
  doc.text(mod.label, CONTENT_X + 22, cy + 1.2);

  drawBadge(doc, s.label, CONTENT_X + CONTENT_W - 8, y0 + 5.4, { status: mod.status, size: 7.6, align: 'right' });

  const subtitleY = cy + 6;
  const subtitle = measureText(doc, mod.fullName, CONTENT_W - 22, { size: 7.8 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...COLOR.inkFaint);
  subtitle.lines.forEach((line, i) => doc.text(line, CONTENT_X + 22, subtitleY + i * subtitle.lineHeight));

  cy = subtitleY + subtitle.height + 3;
  const innerX = CONTENT_X + 8;
  const innerW = CONTENT_W - 16;

  if (mod.record) {
    const rec = measureText(doc, mod.record, innerW - 4, { size: 7.6, font: 'courier' });
    doc.setFillColor(...COLOR.paper);
    doc.setDrawColor(...COLOR.line);
    doc.setLineWidth(0.25);
    doc.roundedRect(innerX, cy, innerW, rec.height + 3.4, 1.5, 1.5, 'FD');
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(...COLOR.primaryDark);
    rec.lines.forEach((line, i) => doc.text(line, innerX + 2, cy + 3.6 + i * rec.lineHeight));
    cy += rec.height + 3.4 + 4;
  }

  (mod.issues ?? []).forEach((issue) => {
    const m = measureText(doc, issue, innerW - 6, { size: 8.3 });
    doc.setFillColor(...s.strong);
    doc.circle(innerX + 1.1, cy + 2, 1, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.3);
    doc.setTextColor(...COLOR.inkSoft);
    m.lines.forEach((line, i) => doc.text(line, innerX + 4.5, cy + 2.8 + i * m.lineHeight));
    cy += m.height + 1.6;
  });

  (mod.recommendations ?? []).forEach((rec) => {
    const m = measureText(doc, rec, innerW - 6, { size: 8.3 });
    drawArrowIcon(doc, innerX, cy + 2.8, COLOR.primaryDark);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.3);
    doc.setTextColor(...COLOR.primaryDark);
    m.lines.forEach((line, i) => doc.text(line, innerX + 4.5, cy + 2.8 + i * m.lineHeight));
    cy += m.height + 1.6;
  });

  if (tailoredStep) {
    const m = measureText(doc, tailoredStep, innerW - 10, { size: 8.2 });
    const boxH = m.height + 7;
    doc.setFillColor(...COLOR.primaryTint);
    doc.roundedRect(innerX, cy + 2, innerW, boxH, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    doc.setTextColor(...COLOR.primaryDark);
    doc.text(`ÉTAPE CHEZ ${(detection.primaryEmail?.label ?? '').toUpperCase()}`, innerX + 3, cy + 6.2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(...COLOR.ink);
    m.lines.forEach((line, i) => doc.text(line, innerX + 3, cy + 10.6 + i * m.lineHeight));
    cy += boxH + 6;
  }

  if (!mod.issues?.length && !mod.recommendations?.length && !tailoredStep) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.3);
    doc.setTextColor(...COLOR.inkFaint);
    doc.text('Aucune anomalie détectée — configuration conforme aux bonnes pratiques.', innerX, cy + 3);
  }

  flow.y = y0 + cardH + 5;
}

function drawDetailedResults(flow, report, detection) {
  flow.addContentPage('Résultats détaillés');
  flow.sectionTitle('Résultats détaillés par protocole');
  const modules = orderedModules(report);
  modules.forEach((mod) => drawModuleCard(flow, mod, detection));
}

// ---------------------------------------------------------------------
// Feuille de route des corrections, priorisée
// ---------------------------------------------------------------------
function buildRoadmap(report, detection) {
  const modules = orderedModules(report);
  const items = [];
  const addItems = (priority, statusFilter) => {
    modules.forEach((mod) => {
      if (!statusFilter(mod.status)) return;
      const actions = mod.recommendations?.length ? mod.recommendations : mod.issues;
      const tailored = buildTailoredStep(detection, mod.id);
      actions?.forEach((a, i) => {
        const action = i === 0 && tailored ? `${a} ${tailored}` : a;
        items.push({ priority, module: mod.label, action });
      });
    });
  };
  addItems(1, (s) => s === 'danger');
  addItems(2, (s) => s === 'warning');
  const erroredModules = modules.filter((m) => m.status === 'error').map((m) => m.label);
  return { items, erroredModules };
}

const PRIORITY_STYLE = {
  1: { label: 'P1 · Urgent', color: COLOR.dangerStrong, bg: COLOR.dangerBg, text: COLOR.danger },
  2: { label: 'P2 · Recommandé', color: COLOR.warningStrong, bg: COLOR.warningBg, text: COLOR.warning },
};

function drawRoadmap(flow, report, detection) {
  const { doc } = flow;
  const { items, erroredModules } = buildRoadmap(report, detection);
  flow.addContentPage('Feuille de route');
  flow.sectionTitle('Feuille de route des corrections');

  if (erroredModules.length) {
    const noticeText = `${erroredModules.join(', ')} n'ont pas pu être vérifiés lors de ce scan (erreur de résolution DNS temporaire, indépendante de la configuration du domaine). Relancez un scan pour obtenir un résultat complet sur ces protocoles avant d'agir.`;
    const m = measureText(doc, noticeText, CONTENT_W - 12, { size: 8.6 });
    const noticeH = m.height + 10;
    flow.ensure(noticeH + 8);
    const ny = flow.y;
    doc.setFillColor(...COLOR.neutralBg);
    doc.roundedRect(CONTENT_X, ny, CONTENT_W, noticeH, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(...COLOR.inkSoft);
    doc.text('Scan incomplet sur certains modules', CONTENT_X + 6, ny + 6);
    drawText(doc, noticeText, CONTENT_X + 6, ny + 10.5, { maxWidth: CONTENT_W - 12, size: 8.6, color: COLOR.inkSoft });
    flow.y = ny + noticeH + 8;
  }

  const dns = detection?.primaryDns;
  if (dns?.guide) {
    const steps = [dns.guide.login, dns.guide.navigate, dns.guide.addRecord];
    const stepMeasures = steps.map((s) => measureText(doc, s, CONTENT_W - 34, { size: 8.4 }));
    const cardH = 12 + stepMeasures.reduce((sum, m) => sum + m.height + 4, 0);
    flow.ensure(cardH + 10);
    const cardY = flow.y;
    doc.setFillColor(...COLOR.primaryTint);
    doc.roundedRect(CONTENT_X, cardY, CONTENT_W, cardH, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR.primaryDark);
    doc.text(`Où effectuer ces corrections — ${dns.label}`, CONTENT_X + 6, cardY + 8);
    let stepY = cardY + 14;
    steps.forEach((s, i) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.4);
      doc.setTextColor(...COLOR.primaryDark);
      doc.text(`${i + 1}.`, CONTENT_X + 6, stepY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLOR.ink);
      const lines = doc.splitTextToSize(s, CONTENT_W - 34);
      lines.forEach((line, li) => doc.text(line, CONTENT_X + 13, stepY + li * stepMeasures[i].lineHeight));
      stepY += stepMeasures[i].height + 4;
    });
    flow.y = cardY + cardH + 10;
  }

  if (items.length === 0) {
    flow.ensure(20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR.inkSoft);
    doc.text('Aucune action corrective prioritaire : tous les protocoles testés sont conformes.', CONTENT_X, flow.y);
    flow.y += 10;
    return;
  }

  const { height: introH } = measureText(
    doc,
    "Les actions ci-dessous sont classées par priorité : P1 (urgent) concerne les protocoles en statut critique, P2 (recommandé) les points à surveiller.",
    CONTENT_W,
    { size: 9 }
  );
  flow.ensure(introH + 6);
  flow.y += drawText(
    doc,
    "Les actions ci-dessous sont classées par priorité : P1 (urgent) concerne les protocoles en statut critique, P2 (recommandé) les points à surveiller.",
    CONTENT_X,
    flow.y,
    { maxWidth: CONTENT_W, size: 9, color: COLOR.inkSoft }
  );
  flow.y += 6;

  const chipW = 34;
  const moduleW = 26;
  const actionW = CONTENT_W - chipW - moduleW - 12;

  items.forEach((item, idx) => {
    const style = PRIORITY_STYLE[item.priority];
    const m = measureText(doc, item.action, actionW, { size: 8.4 });
    const rowH = Math.max(11, m.height + 6);
    flow.ensure(rowH + 3);

    if (idx % 2 === 1) {
      doc.setFillColor(...COLOR.surface);
      doc.rect(CONTENT_X, flow.y, CONTENT_W, rowH, 'F');
    }

    doc.setFillColor(...style.bg);
    doc.roundedRect(CONTENT_X + 3, flow.y + rowH / 2 - 3.6, chipW - 6, 7.2, 3.6, 3.6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...style.text);
    doc.text(style.label, CONTENT_X + 3 + (chipW - 6) / 2, flow.y + rowH / 2 + 0.9, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(...COLOR.ink);
    const modLines = doc.splitTextToSize(item.module, moduleW - 4);
    doc.text(modLines, CONTENT_X + chipW + 2, flow.y + rowH / 2 - (modLines.length - 1) * 2 + 1);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.4);
    doc.setTextColor(...COLOR.inkSoft);
    m.lines.forEach((line, li) => doc.text(line, CONTENT_X + chipW + moduleW + 8, flow.y + 4 + li * m.lineHeight));

    flow.y += rowH;
    doc.setDrawColor(...COLOR.line);
    doc.setLineWidth(0.15);
    doc.line(CONTENT_X, flow.y, CONTENT_X + CONTENT_W, flow.y);
  });

  flow.y += 6;
}

// ---------------------------------------------------------------------
// Page finale — méthodologie, informations, signature, QR
// ---------------------------------------------------------------------
function drawMethodologyPage(flow, report, reportId, qrDataUrl, verifyUrl) {
  const { doc } = flow;
  flow.addContentPage('Méthodologie & vérification');
  flow.sectionTitle('Méthodologie');

  const methodology = [
    "Ce rapport a été généré par le moteur d'audit VOULA Mail à partir de requêtes DNS-over-HTTPS effectuées en temps réel sur les résolveurs publics Cloudflare (primaire) et Google (secours automatique).",
    "Dix modules indépendants ont été exécutés : MX, SPF, DKIM (plus de 60 sélecteurs testés), DMARC, DNSSEC, MTA-STS, TLS-RPT, BIMI, Reverse DNS et SMTP. Chaque module analyse les enregistrements publiés et applique les recommandations des RFC correspondantes.",
    "Le module SMTP évalue la résolution des hôtes MX ; un test de bannière SMTP / STARTTLS en direct nécessite un composant serveur dédié, non exécutable depuis un navigateur.",
    "Le score global (sur 100) pondère chaque critère selon son impact sur la sécurité de la messagerie ; le barème complet figure en page « Résumé exécutif ».",
    "Ce rapport reflète un instantané à la date et l'heure indiquées en couverture. Les enregistrements DNS pouvant évoluer, il est recommandé de renouveler l'audit périodiquement.",
  ];

  methodology.forEach((p) => {
    const { height } = measureText(doc, p, CONTENT_W, { size: 9 });
    flow.ensure(height + 5);
    flow.y += drawText(doc, p, CONTENT_X, flow.y, { maxWidth: CONTENT_W, size: 9, color: COLOR.inkSoft });
    flow.y += 5;
  });

  flow.y += 4;
  flow.sectionTitle('Informations du rapport', { size: 13 });

  const infoRows = [
    ['Domaine audité', report.domain],
    ['Date et heure du scan', new Date(report.scannedAt).toLocaleString('fr-FR')],
    ['Identifiant unique', reportId],
    ['Score global', `${report.score.score} / 100 (${scoreLabel(report.score.score).label})`],
    ['Modules exécutés', String(orderedModules(report).length)],
    ['Résolveurs DNS', 'Cloudflare DNS (primaire), Google DNS (secours)'],
    ['Moteur d\'audit', 'VOULA Audit Engine v1.0'],
  ];

  const labelW = 52;
  infoRows.forEach(([label, value], i) => {
    const { lines, lineHeight } = measureText(doc, value, CONTENT_W - labelW - 4, { size: 9 });
    const rowH = Math.max(8, lines.length * lineHeight + 3);
    flow.ensure(rowH);
    if (i % 2 === 1) {
      doc.setFillColor(...COLOR.surface);
      doc.rect(CONTENT_X, flow.y, CONTENT_W, rowH, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.inkSoft);
    doc.text(label, CONTENT_X + 4, flow.y + rowH / 2 + 1.4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR.ink);
    lines.forEach((line, li) => doc.text(line, CONTENT_X + labelW, flow.y + 4 + li * lineHeight));
    flow.y += rowH;
  });

  flow.y += 12;

  // Bloc signature + sceau
  flow.ensure(48);
  const sigY = flow.y;
  doc.setDrawColor(...COLOR.line);
  doc.setLineWidth(0.3);
  doc.roundedRect(CONTENT_X, sigY, CONTENT_W, 42, 3, 3, 'S');

  const sealCx = CONTENT_X + 24;
  const sealCy = sigY + 21;
  doc.setDrawColor(...COLOR.primary);
  doc.setLineWidth(1.1);
  doc.circle(sealCx, sealCy, 14, 'S');
  doc.setDrawColor(...COLOR.primaryTint);
  doc.setLineWidth(0.5);
  doc.circle(sealCx, sealCy, 11.4, 'S');
  try {
    doc.addImage(LOGO_BADGE_PNG_BASE64, 'PNG', sealCx - 6, sealCy - 6, 12, 12);
  } catch {
    /* dégradation silencieuse */
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR.ink);
  doc.text('Rapport vérifié automatiquement', CONTENT_X + 46, sigY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.3);
  doc.setTextColor(...COLOR.inkSoft);
  drawText(
    doc,
    "Ce document a été généré et signé numériquement par la plateforme VOULA Mail. Son authenticité peut être vérifiée à tout moment via le QR code ci-contre ou l'identifiant unique du rapport.",
    CONTENT_X + 46,
    sigY + 19,
    { maxWidth: CONTENT_W - 46 - 34, size: 8.3, color: COLOR.inkSoft }
  );

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', CONTENT_X + CONTENT_W - 30, sigY + 6, 24, 24);
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.4);
  doc.setTextColor(...COLOR.inkFaint);
  const sigIdLines = doc.splitTextToSize(reportId, 30);
  sigIdLines.forEach((line, i) => doc.text(line, CONTENT_X + CONTENT_W - 4, sigY + 33 + i * 3, { align: 'right' }));

  flow.y = sigY + 42 + 6;
}

// ---------------------------------------------------------------------
// Orchestrateur principal
// ---------------------------------------------------------------------
export async function generatePdfReport(report) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const reportId = uid();
  const riskInfo = scoreLabel(report.score.score);
  const verifyUrl = `https://voula.tech/verify/${reportId}`;
  const qrDataUrl = await buildQrDataUrl(verifyUrl);
  const detection = detectProviders(report);

  drawCoverPage(doc, report, reportId, riskInfo, qrDataUrl, verifyUrl);

  const flow = new PdfFlow(doc, { domain: report.domain, reportId });
  drawExecutiveSummary(flow, report, detection);
  drawDetailedResults(flow, report, detection);
  drawRoadmap(flow, report, detection);
  drawMethodologyPage(flow, report, reportId, qrDataUrl, verifyUrl);

  flow.finalizeFooters(2);

  return { doc, reportId };
}

export async function downloadPdfReport(report) {
  const { doc, reportId } = await generatePdfReport(report);
  doc.save(`voula-mail-audit-${report.domain}-${reportId}.pdf`);
  return reportId;
}

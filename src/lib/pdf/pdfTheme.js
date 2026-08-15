/**
 * pdfTheme.js
 * ------------------------------------------------------------------
 * Jetons visuels et primitives de dessin partagés par le générateur
 * de rapport PDF. Palette claire et imprimable (fond blanc, texte
 * sombre) afin de garantir un contraste correct en toutes
 * circonstances — contrairement à un thème sombre où un texte foncé
 * peut se retrouver invisible sur fond foncé.
 * ------------------------------------------------------------------
 */

export const PAGE_W = 210;
export const PAGE_H = 297;
export const MARGIN = 16;
export const CONTENT_X = MARGIN;
export const CONTENT_W = PAGE_W - MARGIN * 2;
export const HEADER_H = 24;
export const FOOTER_ZONE = 16;
export const MAX_Y = PAGE_H - FOOTER_ZONE;

export const COLOR = {
  paper: [255, 255, 255],
  surface: [247, 247, 251],
  surfaceStrong: [238, 238, 248],
  line: [227, 227, 235],
  lineStrong: [208, 208, 220],
  ink: [21, 21, 32],
  inkSoft: [96, 96, 112],
  inkFaint: [150, 150, 165],
  primary: [99, 102, 241],
  primaryDark: [79, 70, 229],
  primaryTint: [237, 237, 253],
  brandBlue: [0, 5, 230],
  success: [21, 128, 61],
  successBg: [220, 248, 231],
  successStrong: [22, 163, 74],
  warning: [180, 95, 6],
  warningBg: [254, 243, 199],
  warningStrong: [217, 119, 6],
  danger: [185, 28, 28],
  dangerBg: [254, 226, 226],
  dangerStrong: [220, 38, 38],
  neutral: [100, 100, 116],
  neutralBg: [237, 237, 242],
};

export const STATUS_STYLE = {
  ok: { label: 'Conforme', text: COLOR.success, bg: COLOR.successBg, strong: COLOR.successStrong },
  warning: { label: 'À surveiller', text: COLOR.warning, bg: COLOR.warningBg, strong: COLOR.warningStrong },
  danger: { label: 'Critique', text: COLOR.danger, bg: COLOR.dangerBg, strong: COLOR.dangerStrong },
  error: { label: 'Scan incomplet', text: COLOR.neutral, bg: COLOR.neutralBg, strong: COLOR.inkFaint },
  unknown: { label: 'Non évalué', text: COLOR.neutral, bg: COLOR.neutralBg, strong: COLOR.inkFaint },
};

export function statusStyle(status) {
  return STATUS_STYLE[status] ?? STATUS_STYLE.unknown;
}

const MM_PER_PT = 0.3527;

/** Hauteur de ligne (mm) pour une taille de police (pt) donnée. */
export function lineHeightMm(fontSize, factor = 1.38) {
  return fontSize * MM_PER_PT * factor;
}

/**
 * Découpe un texte en lignes selon une largeur max et applique la
 * police demandée sur le doc courant. Ne dessine rien : sert à
 * mesurer la hauteur nécessaire AVANT de décider d'un saut de page.
 */
export function measureText(doc, text, maxWidth, { size = 9.5, font = 'helvetica', style = 'normal' } = {}) {
  doc.setFont(font, style);
  doc.setFontSize(size);
  const lines = maxWidth ? doc.splitTextToSize(String(text ?? ''), maxWidth) : [String(text ?? '')];
  const lh = lineHeightMm(size);
  return { lines, lineHeight: lh, height: lines.length * lh };
}

/** Dessine un bloc de texte multi-lignes et retourne la hauteur consommée (mm). */
export function drawText(
  doc,
  text,
  x,
  y,
  { maxWidth, size = 9.5, font = 'helvetica', style = 'normal', color = COLOR.ink, align = 'left', lineHeightFactor = 1.38 } = {}
) {
  doc.setFont(font, style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
  const lines = maxWidth ? doc.splitTextToSize(String(text ?? ''), maxWidth) : [String(text ?? '')];
  const lh = lineHeightMm(size, lineHeightFactor);
  lines.forEach((line, i) => doc.text(line, x, y + i * lh, { align }));
  return lines.length * lh;
}

export function hexToRgbArray(hex) {
  const clean = hex.replace('#', '');
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
}

/** Cercle rempli — wrapper pour lisibilité au call-site. */
export function filledCircle(doc, x, y, r, color) {
  doc.setFillColor(...color);
  doc.circle(x, y, r, 'F');
}

/** Icône de statut : pastille colorée + glyphe vectoriel (coche / alerte / croix / point). */
export function drawStatusIcon(doc, cx, cy, r, status) {
  const s = statusStyle(status);
  filledCircle(doc, cx, cy, r, s.bg);
  doc.setDrawColor(...s.strong);
  doc.setLineWidth(r * 0.22);
  doc.setLineCap?.('round');

  if (status === 'ok') {
    doc.lines(
      [
        [r * 0.45, r * 0.4],
        [r * 0.75, -r * 0.85],
      ],
      cx - r * 0.5,
      cy + r * 0.05,
      [1, 1],
      'S',
      false
    );
  } else if (status === 'warning') {
    doc.line(cx, cy - r * 0.5, cx, cy + r * 0.12);
    doc.setFillColor(...s.strong);
    doc.circle(cx, cy + r * 0.5, r * 0.09, 'F');
  } else if (status === 'danger') {
    doc.line(cx - r * 0.42, cy - r * 0.42, cx + r * 0.42, cy + r * 0.42);
    doc.line(cx + r * 0.42, cy - r * 0.42, cx - r * 0.42, cy + r * 0.42);
  } else if (status === 'error') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(r * 1.1);
    doc.setTextColor(...s.strong);
    doc.text('?', cx, cy + r * 0.32, { align: 'center' });
  } else {
    doc.setFillColor(...s.strong);
    doc.circle(cx, cy, r * 0.12, 'F');
  }
}

/** Icône vectorielle de flèche (utilisée pour les recommandations) — évite tout glyphe hors police standard. */
export function drawArrowIcon(doc, x, yBaseline, color, size = 2.6) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.45);
  const y = yBaseline - size * 0.32;
  doc.line(x, y, x + size, y);
  doc.line(x + size - size * 0.4, y - size * 0.4, x + size, y);
  doc.line(x + size - size * 0.4, y + size * 0.4, x + size, y);
}

/** Badge pilule coloré (ex: statut de module). Retourne sa largeur en mm. */
export function drawBadge(doc, text, x, y, { status = 'unknown', size = 8, align = 'left' } = {}) {
  const s = statusStyle(status);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size);
  const textWidth = doc.getTextWidth(text);
  const paddingX = 3;
  const height = size * MM_PER_PT * 1.9;
  const width = textWidth + paddingX * 2;
  const drawX = align === 'right' ? x - width : x;

  doc.setFillColor(...s.bg);
  doc.roundedRect(drawX, y, width, height, height / 2, height / 2, 'F');
  doc.setTextColor(...s.text);
  doc.text(text, drawX + width / 2, y + height / 2 + size * MM_PER_PT * 0.36, { align: 'center' });
  return { width, height };
}

/** Icône vectorielle minimale à côté d'un label (protocoles) — cercle + lettre-glyphe stylisé. */
export function drawGlyphChip(doc, cx, cy, r, letter, color) {
  filledCircle(doc, cx, cy, r, [color[0], color[1], color[2]]);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(r * 1.15);
  doc.text(letter, cx, cy + r * 0.36, { align: 'center' });
}

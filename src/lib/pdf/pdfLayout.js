/**
 * pdfLayout.js
 * ------------------------------------------------------------------
 * Contrôleur de mise en page : gère le curseur vertical, les sauts
 * de page automatiques dès qu'un bloc ne tient plus, l'en-tête
 * courant répété sur les pages de contenu, et la pagination finale
 * (numérotée une fois le nombre total de pages connu).
 * ------------------------------------------------------------------
 */
import { PAGE_W, PAGE_H, MARGIN, CONTENT_X, CONTENT_W, HEADER_H, MAX_Y, COLOR } from './pdfTheme.js';
import { LOGO_BADGE_PNG_BASE64 } from '../../assets/logoBadge.js';

export class PdfFlow {
  constructor(doc, { domain, reportId }) {
    this.doc = doc;
    this.domain = domain;
    this.reportId = reportId;
    this.section = '';
    this.y = 0;
  }

  /** Ajoute une page de contenu (fond blanc + en-tête courant), positionne le curseur. */
  addContentPage(section = this.section) {
    this.section = section;
    this.doc.addPage();
    this.doc.setFillColor(...COLOR.paper);
    this.doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
    this.drawRunningHeader();
    this.y = HEADER_H + 8;
    return this.y;
  }

  drawRunningHeader() {
    const { doc } = this;
    try {
      doc.addImage(LOGO_BADGE_PNG_BASE64, 'PNG', MARGIN, 7, 8, 8);
    } catch {
      /* si l'image ne charge pas, l'en-tête reste lisible sans logo */
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...COLOR.ink);
    doc.text('VOULA', MARGIN + 11, 12.3);
    doc.setTextColor(...COLOR.primaryDark);
    doc.text('Mail', MARGIN + 11 + doc.getTextWidth('VOULA '), 12.3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR.inkFaint);
    doc.text(this.section.toUpperCase(), PAGE_W - MARGIN, 9.5, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR.ink);
    doc.text(this.domain, PAGE_W - MARGIN, 14.2, { align: 'right' });

    doc.setDrawColor(...COLOR.line);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, HEADER_H - 5, PAGE_W - MARGIN, HEADER_H - 5);
  }

  /** Garantit `needed` mm d'espace disponible ; saute de page sinon. Retourne le Y courant. */
  ensure(needed, section = this.section) {
    if (this.y + needed > MAX_Y) {
      this.addContentPage(section);
    }
    return this.y;
  }

  advance(delta) {
    this.y += delta;
    return this.y;
  }

  /** Titre de section avec espacement standard. */
  sectionTitle(text, { size = 15 } = {}) {
    this.ensure(14);
    const { doc } = this;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(...COLOR.ink);
    doc.text(text, CONTENT_X, this.y);
    doc.setDrawColor(...COLOR.primary);
    doc.setLineWidth(0.8);
    const w = doc.getTextWidth(text);
    doc.line(CONTENT_X, this.y + 1.6, CONTENT_X + Math.min(w, 26), this.y + 1.6);
    this.y += 10;
    return this.y;
  }

  /** Passe finale : dessine pied de page + pagination sur toutes les pages de contenu. */
  finalizeFooters(startPage = 2) {
    const { doc } = this;
    const total = doc.internal.getNumberOfPages();
    for (let i = startPage; i <= total; i++) {
      doc.setPage(i);
      doc.setDrawColor(...COLOR.line);
      doc.setLineWidth(0.25);
      doc.line(MARGIN, PAGE_H - 12, PAGE_W - MARGIN, PAGE_H - 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.3);
      doc.setTextColor(...COLOR.inkFaint);
      doc.text('VOULA Mail — Rapport d\'audit de sécurité e-mail', MARGIN, PAGE_H - 7.5);
      doc.text(`ID ${this.reportId}`, PAGE_W / 2, PAGE_H - 7.5, { align: 'center' });
      doc.text(`Page ${i - startPage + 2} / ${total - startPage + 2}`, PAGE_W - MARGIN, PAGE_H - 7.5, { align: 'right' });
    }
  }
}

export { PAGE_W, PAGE_H, MARGIN, CONTENT_X, CONTENT_W, HEADER_H, MAX_Y };

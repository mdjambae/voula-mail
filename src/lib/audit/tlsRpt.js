/**
 * tlsRpt.js — Vérification indépendante de TLS-RPT (RFC 8460)
 */
import { queryTXT } from '../../services/dohClient.js';

export async function auditTlsRpt(domain) {
  const result = {
    id: 'tls-rpt',
    label: 'TLS-RPT',
    fullName: 'SMTP TLS Reporting',
    status: 'unknown',
    present: false,
    record: null,
    reportUris: [],
    issues: [],
    recommendations: [],
  };

  try {
    const txt = await queryTXT(`_smtp._tls.${domain}`);
    const rptRecord = txt.find((t) => /^v=tlsrptv1/i.test(t.trim()));

    if (!rptRecord) {
      result.status = 'warning';
      result.issues.push('Aucun enregistrement TLS-RPT trouvé : aucune visibilité sur les échecs de chiffrement TLS entrants.');
      result.recommendations.push('Publier un enregistrement _smtp._tls avec une adresse rua pour recevoir les rapports d\'échec TLS.');
      return result;
    }

    result.present = true;
    result.record = rptRecord;
    const ruaMatch = rptRecord.match(/rua=([^;]+)/i);
    result.reportUris = ruaMatch ? ruaMatch[1].split(',').map((s) => s.trim()) : [];

    result.status = result.reportUris.length ? 'ok' : 'warning';
    if (!result.reportUris.length) {
      result.issues.push('Enregistrement présent mais aucune adresse de rapport (rua) définie.');
    }

    return result;
  } catch (err) {
    result.status = 'error';
    result.issues.push(`Erreur lors de la vérification TLS-RPT : ${err.message}`);
    return result;
  }
}

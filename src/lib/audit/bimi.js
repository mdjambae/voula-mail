/**
 * bimi.js — Vérification indépendante de BIMI (Brand Indicators for Message Identification)
 */
import { queryTXT } from '../../services/dohClient.js';

export async function auditBIMI(domain) {
  const result = {
    id: 'bimi',
    label: 'BIMI',
    fullName: 'Brand Indicators for Message Identification',
    status: 'unknown',
    present: false,
    record: null,
    logoUrl: null,
    vmcUrl: null,
    issues: [],
    recommendations: [],
  };

  try {
    const txt = await queryTXT(`default._bimi.${domain}`);
    const bimiRecord = txt.find((t) => /^v=bimi1/i.test(t.trim()));

    if (!bimiRecord) {
      result.status = 'warning';
      result.issues.push("Aucun enregistrement BIMI trouvé : le logo de marque ne s'affiche pas dans les clients mail compatibles.");
      result.recommendations.push('BIMI nécessite une politique DMARC en quarantine ou reject avant de pouvoir être activé.');
      return result;
    }

    result.present = true;
    result.record = bimiRecord;
    const logoMatch = bimiRecord.match(/l=([^;]+)/i);
    const vmcMatch = bimiRecord.match(/a=([^;]+)/i);
    result.logoUrl = logoMatch ? logoMatch[1].trim() : null;
    result.vmcUrl = vmcMatch ? vmcMatch[1].trim() : null;

    if (!result.logoUrl) {
      result.status = 'warning';
      result.issues.push('Enregistrement BIMI présent mais aucune URL de logo (l=) définie.');
    } else if (!result.vmcUrl) {
      result.status = 'warning';
      result.recommendations.push('Ajouter un certificat VMC (Verified Mark Certificate) pour un affichage garanti chez Gmail.');
    } else {
      result.status = 'ok';
    }

    return result;
  } catch (err) {
    result.status = 'error';
    result.issues.push(`Erreur lors de la vérification BIMI : ${err.message}`);
    return result;
  }
}

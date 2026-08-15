/**
 * dnssec.js — Vérification indépendante de DNSSEC
 */
import { dohQuery } from '../../services/dohClient.js';

export async function auditDNSSEC(domain) {
  const result = {
    id: 'dnssec',
    label: 'DNSSEC',
    fullName: 'Domain Name System Security Extensions',
    status: 'unknown',
    signed: false,
    authenticatedData: false,
    dsRecords: [],
    dnskeyRecords: [],
    issues: [],
    recommendations: [],
  };

  try {
    const [dsRes, dnskeyRes] = await Promise.all([
      dohQuery(domain, 'DS', { dnssec: true }),
      dohQuery(domain, 'DNSKEY', { dnssec: true }),
    ]);

    result.authenticatedData = dsRes.authenticatedData || dnskeyRes.authenticatedData;
    result.dsRecords = dsRes.answers;
    result.dnskeyRecords = dnskeyRes.answers;
    result.signed = result.dsRecords.length > 0 && result.dnskeyRecords.length > 0;

    if (!result.signed) {
      result.status = 'warning';
      result.issues.push('DNSSEC n\'est pas activé sur ce domaine : les réponses DNS ne sont pas signées cryptographiquement.');
      result.recommendations.push('Activer DNSSEC chez votre registrar pour empêcher le cache poisoning et le spoofing DNS.');
    } else if (!result.authenticatedData) {
      result.status = 'warning';
      result.issues.push('Des enregistrements DS/DNSKEY existent mais la chaîne de confiance n\'est pas pleinement validée (AD=0).');
    } else {
      result.status = 'ok';
    }

    return result;
  } catch (err) {
    result.status = 'error';
    result.issues.push(`Erreur lors de la vérification DNSSEC : ${err.message}`);
    return result;
  }
}

/**
 * mx.js — Vérification indépendante des enregistrements MX
 */
import { queryMX, queryA } from '../../services/dohClient.js';

export async function auditMX(domain) {
  const result = {
    id: 'mx',
    label: 'MX',
    fullName: 'Mail Exchange Records',
    status: 'unknown',
    records: [],
    issues: [],
    recommendations: [],
  };

  try {
    const mxRecords = await queryMX(domain);
    result.records = mxRecords;

    if (mxRecords.length === 0) {
      result.status = 'danger';
      result.issues.push('Aucun enregistrement MX trouvé : ce domaine ne peut pas recevoir d\'e-mails.');
      return result;
    }

    if (mxRecords.length === 1) {
      result.issues.push('Un seul serveur MX configuré : aucune redondance en cas de panne.');
      result.recommendations.push('Ajouter un second enregistrement MX avec une priorité différente pour la haute disponibilité.');
    }

    const resolvable = await Promise.all(
      mxRecords.map(async (mx) => {
        try {
          const a = await queryA(mx.host);
          return a.length > 0;
        } catch {
          return false;
        }
      })
    );
    const unresolvable = mxRecords.filter((_, i) => !resolvable[i]);
    if (unresolvable.length) {
      result.issues.push(`${unresolvable.length} hôte(s) MX ne résolvent vers aucune adresse IP.`);
    }

    result.status = unresolvable.length ? 'danger' : mxRecords.length === 1 ? 'warning' : 'ok';
    return result;
  } catch (err) {
    result.status = 'error';
    result.issues.push(`Erreur lors de la vérification MX : ${err.message}`);
    return result;
  }
}

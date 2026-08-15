/**
 * smtp.js — Vérification indépendante de la connectivité SMTP
 *
 * Les navigateurs ne permettent pas d'ouvrir de socket TCP brut vers
 * le port 25 : ce module évalue donc les signaux indirects
 * disponibles côté client (résolution des hôtes MX, cohérence des
 * enregistrements) et expose un point d'extension clair pour un
 * futur worker backend qui effectuera un test STARTTLS réel.
 */
import { queryMX, queryA } from '../../services/dohClient.js';

export async function auditSMTP(domain) {
  const result = {
    id: 'smtp',
    label: 'SMTP',
    fullName: 'Connectivité et bannière SMTP',
    status: 'unknown',
    hostsChecked: [],
    backendRequired: true,
    issues: [],
    recommendations: [],
  };

  try {
    const mxRecords = await queryMX(domain);
    if (mxRecords.length === 0) {
      result.status = 'danger';
      result.issues.push('Aucun hôte MX à interroger en SMTP.');
      return result;
    }

    const hosts = await Promise.all(
      mxRecords.slice(0, 5).map(async (mx) => {
        const ips = await queryA(mx.host).catch(() => []);
        return { host: mx.host, priority: mx.priority, resolvable: ips.length > 0, ips };
      })
    );
    result.hostsChecked = hosts;

    const allResolvable = hosts.every((h) => h.resolvable);
    result.status = allResolvable ? 'warning' : 'danger';
    result.issues.push(
      "Le test de bannière SMTP et STARTTLS en direct nécessite un composant serveur (les navigateurs ne permettent pas les sockets TCP bruts)."
    );
    if (!allResolvable) {
      result.issues.push("Un ou plusieurs hôtes MX ne résolvent vers aucune IP joignable.");
    }
    result.recommendations.push(
      'Activer la vérification SMTP approfondie (bannière, STARTTLS, cipher suite) via le worker backend VOULA prévu à cet effet.'
    );

    return result;
  } catch (err) {
    result.status = 'error';
    result.issues.push(`Erreur lors de la vérification SMTP : ${err.message}`);
    return result;
  }
}

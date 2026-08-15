/**
 * reverseDns.js — Vérification indépendante du reverse DNS (PTR) des serveurs MX
 */
import { queryMX, queryA, queryPTR } from '../../services/dohClient.js';

export async function auditReverseDNS(domain) {
  const result = {
    id: 'reverse-dns',
    label: 'Reverse DNS',
    fullName: 'PTR Records des serveurs MX',
    status: 'unknown',
    entries: [],
    issues: [],
    recommendations: [],
  };

  try {
    const mxRecords = await queryMX(domain);
    if (mxRecords.length === 0) {
      result.status = 'warning';
      result.issues.push('Impossible de vérifier le reverse DNS : aucun enregistrement MX trouvé.');
      return result;
    }

    const entries = [];
    for (const mx of mxRecords.slice(0, 5)) {
      const ips = await queryA(mx.host).catch(() => []);
      for (const ip of ips) {
        const ptr = await queryPTR(ip).catch(() => []);
        entries.push({
          host: mx.host,
          ip,
          ptrRecords: ptr,
          matches: ptr.some((p) => p.toLowerCase().includes(mx.host.toLowerCase().split('.')[0])),
        });
      }
    }

    result.entries = entries;
    const missing = entries.filter((e) => e.ptrRecords.length === 0);

    if (missing.length) {
      result.status = 'warning';
      result.issues.push(`${missing.length} adresse(s) IP sans enregistrement PTR : risque accru de classement en spam.`);
      result.recommendations.push('Configurer un enregistrement PTR cohérent avec le nom d\'hôte MX auprès de votre hébergeur.');
    } else {
      result.status = 'ok';
    }

    return result;
  } catch (err) {
    result.status = 'error';
    result.issues.push(`Erreur lors de la vérification du reverse DNS : ${err.message}`);
    return result;
  }
}

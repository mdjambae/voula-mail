/**
 * dmarc.js — Vérification indépendante de DMARC (RFC 7489)
 */
import { queryTXT } from '../../services/dohClient.js';

function parseDmarcTags(record) {
  const tags = {};
  record.split(';').forEach((part) => {
    const [key, ...rest] = part.trim().split('=');
    if (key && rest.length) tags[key.trim().toLowerCase()] = rest.join('=').trim();
  });
  return tags;
}

const POLICY_LABELS = {
  none: { label: 'none (surveillance uniquement)', severity: 'warning' },
  quarantine: { label: 'quarantine', severity: 'ok' },
  reject: { label: 'reject', severity: 'ok' },
};

export async function auditDMARC(domain) {
  const result = {
    id: 'dmarc',
    label: 'DMARC',
    fullName: 'Domain-based Message Authentication, Reporting & Conformance',
    status: 'unknown',
    present: false,
    record: null,
    tags: {},
    policy: null,
    subdomainPolicy: null,
    percentage: 100,
    aggregateReports: [],
    forensicReports: [],
    alignment: { spf: 'r', dkim: 'r' },
    issues: [],
    recommendations: [],
  };

  try {
    const txtRecords = await queryTXT(`_dmarc.${domain}`);
    const dmarcRecords = txtRecords.filter((t) => /^v=dmarc1/i.test(t.trim()));

    if (dmarcRecords.length === 0) {
      result.status = 'danger';
      result.issues.push('Aucun enregistrement DMARC trouvé sur _dmarc.' + domain + '.');
      result.recommendations.push(
        'Publier un enregistrement DMARC, même en politique "none", pour commencer à recevoir des rapports agrégés.'
      );
      return result;
    }

    result.present = true;
    const record = dmarcRecords[0];
    result.record = record;
    const tags = parseDmarcTags(record);
    result.tags = tags;

    const policy = tags.p?.toLowerCase();
    result.policy = policy ? { value: policy, ...POLICY_LABELS[policy] } : null;
    result.subdomainPolicy = tags.sp ? { value: tags.sp.toLowerCase(), ...POLICY_LABELS[tags.sp.toLowerCase()] } : null;
    result.percentage = tags.pct ? Number(tags.pct) : 100;
    result.alignment = {
      spf: tags.aspf?.toLowerCase() === 's' ? 'strict' : 'relaxed',
      dkim: tags.adkim?.toLowerCase() === 's' ? 'strict' : 'relaxed',
    };
    result.aggregateReports = tags.rua ? tags.rua.split(',').map((s) => s.trim()) : [];
    result.forensicReports = tags.ruf ? tags.ruf.split(',').map((s) => s.trim()) : [];

    if (!policy) {
      result.status = 'danger';
      result.issues.push("Le tag obligatoire p= est absent ou invalide.");
    } else if (policy === 'none') {
      result.status = 'warning';
      result.issues.push('Politique en mode "none" : aucun e-mail frauduleux n\'est bloqué, seule la remontée de rapports est active.');
      result.recommendations.push('Passer progressivement à quarantine puis reject après analyse des rapports agrégés.');
    } else if (policy === 'quarantine') {
      result.status = 'ok';
      result.recommendations.push('Envisager reject pour une protection maximale une fois la conformité validée.');
    } else if (policy === 'reject') {
      result.status = 'ok';
    }

    if (result.percentage < 100) {
      result.issues.push(`La politique ne s'applique qu'à ${result.percentage}% des messages (pct=${result.percentage}).`);
    }

    if (result.aggregateReports.length === 0) {
      result.issues.push('Aucune adresse de rapport agrégé (rua) définie : aucune visibilité sur les abus.');
      result.recommendations.push('Ajouter un tag rua=mailto:... pour recevoir les rapports agrégés quotidiens.');
    }

    return result;
  } catch (err) {
    result.status = 'error';
    result.issues.push(`Erreur lors de la résolution DMARC : ${err.message}`);
    return result;
  }
}

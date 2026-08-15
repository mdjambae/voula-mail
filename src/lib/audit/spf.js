/**
 * spf.js — Vérification indépendante du Sender Policy Framework (RFC 7208)
 */
import { queryTXT } from '../../services/dohClient.js';

const QUALIFIERS = {
  '+': { label: 'pass (explicite)', severity: 'ok' },
  '-': { label: 'fail strict (-all)', severity: 'ok' },
  '~': { label: 'softfail (~all)', severity: 'warning' },
  '?': { label: 'neutral (?all)', severity: 'danger' },
};

function parseMechanisms(record) {
  return record
    .split(/\s+/)
    .filter((token) => token && token.toLowerCase() !== 'v=spf1');
}

function findAllMechanism(mechanisms) {
  const allToken = mechanisms.find((m) => /^[+\-~?]?all$/i.test(m));
  if (!allToken) return null;
  const qualifierChar = /^[+\-~?]/.test(allToken) ? allToken[0] : '+';
  return { token: allToken, qualifier: qualifierChar, ...QUALIFIERS[qualifierChar] };
}

function countDnsLookupMechanisms(mechanisms) {
  // RFC 7208 §4.6.4 : include, a, mx, ptr, exists et redirect comptent
  // dans la limite des 10 lookups DNS autorisés.
  const lookupPrefixes = ['include:', 'a', 'mx', 'ptr', 'exists:', 'redirect='];
  return mechanisms.filter((m) =>
    lookupPrefixes.some((p) => m.toLowerCase() === p || m.toLowerCase().startsWith(p))
  ).length;
}

export async function auditSPF(domain) {
  const result = {
    id: 'spf',
    label: 'SPF',
    fullName: 'Sender Policy Framework',
    status: 'unknown',
    present: false,
    record: null,
    mechanisms: [],
    allQualifier: null,
    dnsLookupCount: 0,
    multipleRecords: false,
    issues: [],
    recommendations: [],
  };

  try {
    const txtRecords = await queryTXT(domain);
    const spfRecords = txtRecords.filter((t) => /^v=spf1/i.test(t.trim()));

    if (spfRecords.length === 0) {
      result.status = 'danger';
      result.issues.push("Aucun enregistrement SPF (v=spf1) trouvé sur ce domaine.");
      result.recommendations.push(
        "Publier un enregistrement TXT SPF à la racine du domaine pour autoriser explicitement vos serveurs d'envoi."
      );
      return result;
    }

    result.present = true;
    result.multipleRecords = spfRecords.length > 1;
    if (result.multipleRecords) {
      result.issues.push(
        `${spfRecords.length} enregistrements SPF détectés : la RFC 7208 exige un enregistrement unique, ce qui invalide la politique.`
      );
    }

    const record = spfRecords[0];
    result.record = record;

    const mechanisms = parseMechanisms(record);
    result.mechanisms = mechanisms;
    result.dnsLookupCount = countDnsLookupMechanisms(mechanisms);

    if (result.dnsLookupCount > 10) {
      result.issues.push(
        `${result.dnsLookupCount} mécanismes déclenchant une résolution DNS (limite RFC 7208 : 10). Risque de "permerror".`
      );
    }

    const allMechanism = findAllMechanism(mechanisms);
    result.allQualifier = allMechanism;

    if (!allMechanism) {
      result.issues.push('Aucun mécanisme "all" trouvé : la politique SPF est incomplète.');
      result.status = 'warning';
    } else if (allMechanism.qualifier === '-') {
      result.status = result.issues.length ? 'warning' : 'ok';
    } else if (allMechanism.qualifier === '~') {
      result.status = 'warning';
      result.recommendations.push(
        'Passer de ~all (softfail) à -all (fail strict) une fois la migration des expéditeurs légitimes terminée.'
      );
    } else {
      result.status = 'danger';
      result.recommendations.push(
        'Éviter ?all (neutral) qui n\'apporte aucune protection réelle contre l\'usurpation.'
      );
    }

    if (result.multipleRecords) result.status = 'danger';

    return result;
  } catch (err) {
    result.status = 'error';
    result.issues.push(`Erreur lors de la résolution SPF : ${err.message}`);
    return result;
  }
}

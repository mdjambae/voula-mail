/**
 * scoring.js — Moteur de score sur 100 points.
 *
 * Chaque critère est défini avec un poids explicite : le barème peut
 * être ajusté ici sans toucher aux modules d'audit eux-mêmes.
 */

export const SCORE_WEIGHTS = {
  spfPresent: 10,
  spfStrict: 8,
  dmarcPresent: 12,
  dmarcPolicyReject: 12,
  dkimPresent: 14,
  dkimMultipleSelectors: 4,
  dkimStrongKeys: 6,
  dnssecEnabled: 10,
  mtaStsEnabled: 8,
  tlsRptEnabled: 6,
  bimiEnabled: 4,
  mxRedundancy: 4,
  reverseDnsClean: 6,
};

// Crédit partiel pour une politique DMARC en quarantine : c'est un repli plus
// faible sur la même ligne de barème que dmarcPolicyReject, jamais un gain
// cumulable en plus — il ne doit donc pas entrer dans TOTAL_POSSIBLE, sinon
// un domaine parfait (p=reject) ne peut jamais atteindre 100/100.
const DMARC_QUARANTINE_PARTIAL_CREDIT = 6;

const TOTAL_POSSIBLE = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);

function clampScore(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * @param {object} results - résultats agrégés de tous les modules d'audit (par id)
 * @returns {{ score:number, maxScore:number, breakdown:Array }}
 */
export function computeGlobalScore(results) {
  const breakdown = [];
  let earned = 0;

  const push = (key, earnedPoints, label) => {
    const weight = SCORE_WEIGHTS[key];
    breakdown.push({ key, label, weight, earned: earnedPoints });
    earned += earnedPoints;
  };

  const spf = results.spf;
  if (spf?.present) {
    push('spfPresent', SCORE_WEIGHTS.spfPresent, 'SPF publié');
    const strict = spf.allQualifier?.qualifier === '-';
    push('spfStrict', strict ? SCORE_WEIGHTS.spfStrict : 0, 'SPF en mode strict (-all)');
  } else {
    push('spfPresent', 0, 'SPF publié');
    push('spfStrict', 0, 'SPF en mode strict (-all)');
  }

  const dmarc = results.dmarc;
  if (dmarc?.present) {
    push('dmarcPresent', SCORE_WEIGHTS.dmarcPresent, 'DMARC publié');
    const policy = dmarc.policy?.value;
    push(
      'dmarcPolicyReject',
      policy === 'reject' ? SCORE_WEIGHTS.dmarcPolicyReject : policy === 'quarantine' ? DMARC_QUARANTINE_PARTIAL_CREDIT : 0,
      'Politique DMARC restrictive (quarantine/reject)'
    );
  } else {
    push('dmarcPresent', 0, 'DMARC publié');
    push('dmarcPolicyReject', 0, 'Politique DMARC restrictive (quarantine/reject)');
  }

  const dkim = results.dkim;
  const dkimFound = dkim?.selectorsFound?.length ?? 0;
  push('dkimPresent', dkimFound > 0 ? SCORE_WEIGHTS.dkimPresent : 0, 'DKIM actif (au moins un sélecteur)');
  push('dkimMultipleSelectors', dkimFound > 1 ? SCORE_WEIGHTS.dkimMultipleSelectors : 0, 'Plusieurs sélecteurs DKIM actifs');
  const strongKeys = dkim?.selectorsFound?.filter((s) => (s.keyLength ?? 0) >= 2048).length ?? 0;
  push('dkimStrongKeys', dkimFound > 0 && strongKeys === dkimFound ? SCORE_WEIGHTS.dkimStrongKeys : 0, 'Clés DKIM 2048 bits ou plus');

  push('dnssecEnabled', results.dnssec?.signed ? SCORE_WEIGHTS.dnssecEnabled : 0, 'DNSSEC activé');
  push(
    'mtaStsEnabled',
    results['mta-sts']?.policyMode === 'enforce' ? SCORE_WEIGHTS.mtaStsEnabled : results['mta-sts']?.dnsRecordPresent ? SCORE_WEIGHTS.mtaStsEnabled / 2 : 0,
    'MTA-STS en mode enforce'
  );
  push('tlsRptEnabled', results['tls-rpt']?.present ? SCORE_WEIGHTS.tlsRptEnabled : 0, 'TLS-RPT configuré');
  push('bimiEnabled', results.bimi?.present ? SCORE_WEIGHTS.bimiEnabled : 0, 'BIMI configuré');
  push('mxRedundancy', (results.mx?.records?.length ?? 0) > 1 ? SCORE_WEIGHTS.mxRedundancy : 0, 'Redondance MX');

  const reverseEntries = results['reverse-dns']?.entries ?? [];
  const reverseClean = reverseEntries.length > 0 && reverseEntries.every((e) => e.ptrRecords.length > 0);
  push('reverseDnsClean', reverseClean ? SCORE_WEIGHTS.reverseDnsClean : 0, 'Reverse DNS (PTR) cohérent');

  const score = clampScore((earned / TOTAL_POSSIBLE) * 100);

  return { score, maxScore: 100, earnedPoints: earned, totalPoints: TOTAL_POSSIBLE, breakdown };
}

export function scoreLabel(score) {
  if (score >= 90) return { label: 'Excellent', color: 'success' };
  if (score >= 70) return { label: 'Bon', color: 'primary' };
  if (score >= 45) return { label: 'Moyen', color: 'warning' };
  return { label: 'Faible', color: 'danger' };
}

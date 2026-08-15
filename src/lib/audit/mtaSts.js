/**
 * mtaSts.js — Vérification indépendante de MTA-STS (RFC 8461)
 */
import { queryTXT } from '../../services/dohClient.js';

export async function auditMtaSts(domain) {
  const result = {
    id: 'mta-sts',
    label: 'MTA-STS',
    fullName: 'SMTP MTA Strict Transport Security',
    status: 'unknown',
    dnsRecordPresent: false,
    policyReachable: false,
    policyMode: null,
    mxEntries: [],
    issues: [],
    recommendations: [],
  };

  try {
    const txt = await queryTXT(`_mta-sts.${domain}`);
    const stsRecord = txt.find((t) => /^v=stsv1/i.test(t.trim()));
    result.dnsRecordPresent = Boolean(stsRecord);

    if (!stsRecord) {
      result.status = 'warning';
      result.issues.push('Aucun enregistrement TXT _mta-sts trouvé : le chiffrement TLS SMTP n\'est pas forcé.');
      result.recommendations.push(
        'Publier un enregistrement _mta-sts et héberger une politique sur https://mta-sts.' + domain + '/.well-known/mta-sts.txt'
      );
      return result;
    }

    try {
      const policyRes = await fetch(`https://mta-sts.${domain}/.well-known/mta-sts.txt`, {
        mode: 'cors',
      });
      if (policyRes.ok) {
        const text = await policyRes.text();
        result.policyReachable = true;
        const modeMatch = text.match(/mode:\s*(enforce|testing|none)/i);
        result.policyMode = modeMatch ? modeMatch[1].toLowerCase() : null;
        const mxMatches = [...text.matchAll(/mx:\s*(.+)/gi)];
        result.mxEntries = mxMatches.map((m) => m[1].trim());
      }
    } catch {
      // Le fetch cross-origin peut échouer selon la politique CORS du serveur cible :
      // ce n'est pas bloquant, la présence de l'enregistrement DNS suffit à une évaluation partielle.
    }

    if (result.policyMode === 'enforce') {
      result.status = 'ok';
    } else if (result.policyMode === 'testing') {
      result.status = 'warning';
      result.recommendations.push('Passer le mode de "testing" à "enforce" une fois la configuration validée.');
    } else if (!result.policyReachable) {
      result.status = 'warning';
      result.issues.push('Enregistrement DNS présent, mais la politique .well-known/mta-sts.txt n\'a pas pu être vérifiée depuis le navigateur.');
    } else {
      result.status = 'warning';
    }

    return result;
  } catch (err) {
    result.status = 'error';
    result.issues.push(`Erreur lors de la vérification MTA-STS : ${err.message}`);
    return result;
  }
}

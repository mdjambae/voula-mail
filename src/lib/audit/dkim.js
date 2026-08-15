/**
 * dkim.js — Vérification indépendante de DKIM (RFC 6376)
 * Teste l'ensemble de la base de sélecteurs connus en parallèle,
 * ne se limite jamais à "default".
 */
import { queryTXT } from '../../services/dohClient.js';
import { DKIM_SELECTORS, guessProviderFromSelector } from './dkimSelectors.js';

function parseDkimTags(record) {
  const tags = {};
  record.split(';').forEach((part) => {
    const [key, ...rest] = part.trim().split('=');
    if (key && rest.length) tags[key.trim().toLowerCase()] = rest.join('=').trim();
  });
  return tags;
}

function estimateKeyLength(base64Key) {
  if (!base64Key) return null;
  // Estimation approximative de la longueur de clé RSA à partir de la
  // taille du blob DER encodé en base64 (heuristique, pas un parsing ASN.1 complet).
  const byteLength = Math.floor((base64Key.length * 3) / 4);
  if (byteLength <= 140) return 1024;
  if (byteLength <= 270) return 2048;
  return 4096;
}

async function probeSelector(domain, selector) {
  const hostname = `${selector}._domainkey.${domain}`;
  try {
    const txtRecords = await queryTXT(hostname);
    const dkimRecord = txtRecords.find((t) => /v=dkim1|p=/i.test(t));
    if (!dkimRecord) return null;

    const tags = parseDkimTags(dkimRecord);
    const keyLength = estimateKeyLength(tags.p);

    return {
      selector,
      hostname,
      record: dkimRecord,
      keyType: tags.k || 'rsa',
      hashAlgorithms: tags.h ? tags.h.split(':') : ['sha256 (défaut)'],
      keyLength,
      revoked: tags.p === '' || tags.p === undefined,
      serviceType: tags.s || '*',
      likelyProviders: guessProviderFromSelector(selector),
    };
  } catch {
    return null;
  }
}

export async function auditDKIM(domain, { onProgress } = {}) {
  const result = {
    id: 'dkim',
    label: 'DKIM',
    fullName: 'DomainKeys Identified Mail',
    status: 'unknown',
    selectorsFound: [],
    selectorsScanned: DKIM_SELECTORS.length,
    issues: [],
    recommendations: [],
  };

  const batchSize = 12;
  let completed = 0;

  for (let i = 0; i < DKIM_SELECTORS.length; i += batchSize) {
    const batch = DKIM_SELECTORS.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map((s) => probeSelector(domain, s)));
    settled.forEach((s) => {
      if (s.status === 'fulfilled' && s.value) result.selectorsFound.push(s.value);
    });
    completed += batch.length;
    onProgress?.(Math.round((completed / DKIM_SELECTORS.length) * 100));
  }

  if (result.selectorsFound.length === 0) {
    result.status = 'danger';
    result.issues.push(
      `Aucun sélecteur DKIM actif détecté parmi les ${DKIM_SELECTORS.length} sélecteurs testés (fournisseurs courants inclus).`
    );
    result.recommendations.push(
      "Configurer DKIM chez votre fournisseur d'envoi et publier la clé publique sur selector._domainkey." + domain + '.'
    );
    return result;
  }

  const weakKeys = result.selectorsFound.filter((s) => s.keyLength && s.keyLength < 2048);
  const revokedKeys = result.selectorsFound.filter((s) => s.revoked);

  if (revokedKeys.length) {
    result.issues.push(`${revokedKeys.length} sélecteur(s) avec une clé révoquée (p= vide).`);
  }
  if (weakKeys.length) {
    result.issues.push(
      `${weakKeys.length} sélecteur(s) utilisent une clé RSA < 2048 bits, considérée comme faible.`
    );
    result.recommendations.push('Régénérer les clés DKIM en 2048 bits minimum (idéalement 4096 bits).');
  }

  result.status = weakKeys.length || revokedKeys.length ? 'warning' : 'ok';
  return result;
}

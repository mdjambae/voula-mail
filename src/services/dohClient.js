/**
 * dohClient.js
 * ------------------------------------------------------------------
 * Client DNS-over-HTTPS (RFC 8484) utilisé par tous les modules
 * d'audit. Aucune dépendance backend n'est requise pour le MVP :
 * les résolutions DNS sont effectuées directement depuis le
 * navigateur via les résolveurs publics Cloudflare et Google.
 *
 * Cloudflare est utilisé en résolveur primaire (avec support natif
 * du champ `AD` pour DNSSEC), Google en secours automatique.
 * ------------------------------------------------------------------
 */

const RESOLVERS = [
  {
    name: 'cloudflare',
    url: 'https://cloudflare-dns.com/dns-query',
    headers: { accept: 'application/dns-json' },
  },
  {
    name: 'google',
    url: 'https://dns.google/resolve',
    headers: { accept: 'application/dns-json' },
  },
];

/** Codes de type DNS courants (format numérique RFC). */
export const RECORD_TYPE = {
  A: 1,
  NS: 2,
  CNAME: 5,
  SOA: 6,
  PTR: 12,
  MX: 15,
  TXT: 16,
  AAAA: 28,
  SRV: 33,
  DS: 43,
  RRSIG: 46,
  DNSKEY: 48,
  CAA: 257,
};

const cache = new Map();
const CACHE_TTL_MS = 60_000;

function cacheKey(name, type, resolver) {
  return `${resolver}:${type}:${name.toLowerCase()}`;
}

/**
 * Interroge un enregistrement DNS via DNS-over-HTTPS.
 * Bascule automatiquement sur le résolveur secondaire en cas d'échec.
 *
 * @param {string} name - nom de domaine ou d'hôte à résoudre
 * @param {number|string} type - type d'enregistrement (ex: 'TXT', 16)
 * @param {{ dnssec?: boolean, timeoutMs?: number }} [options]
 */
export async function dohQuery(name, type, options = {}) {
  const { dnssec = false, timeoutMs = 6000 } = options;
  const typeParam = typeof type === 'number' ? type : type.toUpperCase();

  let lastError = null;

  for (const resolver of RESOLVERS) {
    const key = cacheKey(name, typeParam, resolver.name);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const params = new URLSearchParams({
      name,
      type: String(typeParam),
    });
    if (dnssec) params.set('do', '1');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${resolver.url}?${params.toString()}`, {
        headers: resolver.headers,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) throw new Error(`Résolveur ${resolver.name} a répondu ${res.status}`);
      const json = await res.json();

      const normalized = normalizeResponse(json, resolver.name);
      cache.set(key, { data: normalized, timestamp: Date.now() });
      return normalized;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      // essaie le résolveur suivant
    }
  }

  throw new Error(
    `Échec de résolution DNS pour ${name} (${typeParam}) : ${lastError?.message ?? 'inconnu'}`
  );
}

function normalizeResponse(json, resolverName) {
  return {
    status: json.Status,
    truncated: Boolean(json.TC),
    recursionAvailable: Boolean(json.RA),
    authenticatedData: Boolean(json.AD), // clé pour DNSSEC
    question: json.Question ?? [],
    answers: (json.Answer ?? []).map((a) => ({
      name: a.name,
      type: a.type,
      ttl: a.TTL,
      data: cleanRecordData(a.data),
    })),
    authority: (json.Authority ?? []).map((a) => ({
      name: a.name,
      type: a.type,
      ttl: a.TTL,
      data: cleanRecordData(a.data),
    })),
    resolver: resolverName,
    raw: json,
  };
}

function cleanRecordData(data) {
  if (typeof data !== 'string') return data;
  // Les enregistrements TXT longs sont renvoyés entre guillemets et parfois
  // fragmentés ("frag1" "frag2") par certains résolveurs : on reconstitue.
  return data.replace(/"\s+"/g, '').replace(/^"|"$/g, '');
}

/** Raccourci pour récupérer uniquement les valeurs textuelles TXT d'un nom. */
export async function queryTXT(name) {
  const res = await dohQuery(name, 'TXT');
  return res.answers.filter((a) => a.type === RECORD_TYPE.TXT).map((a) => a.data);
}

export async function queryMX(name) {
  const res = await dohQuery(name, 'MX');
  return res.answers
    .filter((a) => a.type === RECORD_TYPE.MX)
    .map((a) => {
      const [priority, host] = a.data.split(' ');
      return { priority: Number(priority), host: host?.replace(/\.$/, '') };
    })
    .sort((a, b) => a.priority - b.priority);
}

export async function queryA(name) {
  const res = await dohQuery(name, 'A');
  return res.answers.filter((a) => a.type === RECORD_TYPE.A).map((a) => a.data);
}

export async function queryPTR(ip) {
  const reversed = ip.split('.').reverse().join('.') + '.in-addr.arpa';
  const res = await dohQuery(reversed, 'PTR');
  return res.answers.filter((a) => a.type === RECORD_TYPE.PTR).map((a) => a.data.replace(/\.$/, ''));
}

export async function queryCAA(name) {
  const res = await dohQuery(name, 'CAA');
  return res.answers.filter((a) => a.type === RECORD_TYPE.CAA).map((a) => a.data);
}

export async function queryNS(name) {
  const res = await dohQuery(name, 'NS');
  return res.answers.filter((a) => a.type === RECORD_TYPE.NS).map((a) => a.data.replace(/\.$/, ''));
}

/**
 * Vérifie que le domaine existe réellement dans le DNS (RCODE NXDOMAIN = 3).
 * En cas d'échec du résolveur lui-même, on laisse passer le scan (fail-open)
 * plutôt que de bloquer l'utilisateur sur un problème qui n'est pas le sien.
 */
export async function domainExists(name) {
  try {
    const res = await dohQuery(name, 'NS');
    return res.status !== 3;
  } catch {
    return true;
  }
}

/** Résolution DNSSEC : s'appuie sur le flag AD renvoyé par le résolveur. */
export async function queryDNSSEC(name) {
  const [dnskey, ds] = await Promise.allSettled([
    dohQuery(name, 'DNSKEY', { dnssec: true }),
    dohQuery(name, 'DS', { dnssec: true }),
  ]);

  return {
    dnskey: dnskey.status === 'fulfilled' ? dnskey.value : null,
    ds: ds.status === 'fulfilled' ? ds.value : null,
  };
}

export function clearDohCache() {
  cache.clear();
}

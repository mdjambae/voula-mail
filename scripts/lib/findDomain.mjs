/**
 * findDomain.mjs
 * ------------------------------------------------------------------
 * Devine un nom de domaine probable à partir du nom d'une entreprise,
 * puis VÉRIFIE son existence réelle par une requête DNS avant de le
 * retenir. Ce n'est pas une supposition envoyée à l'aveugle comme le
 * serait un e-mail deviné : soit le domaine résout vraiment (A ou MX
 * présent), soit il est écarté. Fonctionne pour n'importe quel
 * secteur, sans dépendre d'un annuaire tiers.
 *
 * Limite assumée : les entreprises dont le nom commercial diffère
 * nettement de leur raison sociale (SIREN) ne seront pas trouvées par
 * cette heuristique — dans ce cas le domaine reste marqué "à
 * compléter", jamais deviné à tort.
 *
 * Piste écartée pour combler cette limite sur les franchises
 * immobilières (FONCIA, HUMAN IMMOBILIER, C&M GESTION...) : scraper
 * l'annuaire officiel de l'enseigne pour retrouver le site propre de
 * l'agence locale. Investigué et écarté enseigne par enseigne :
 *   - FNAIM, CENTURY 21 : localisateur d'agence disallow dans
 *     robots.txt (FNAIM : /include/ajax/... ; Century 21 :
 *     /trouver_agence/cp-*, /trouver_agence/geolocalisation/,
 *     /trouver_agence/agence_out/, ce dernier étant justement la
 *     redirection vers le site propre de l'agence). Pas de
 *     contournement.
 *   - ORPI, LAFORÊT, FONCIA : localisateur non bloqué par robots.txt,
 *     mais chaque fiche résultat pointe vers une page profil sur le
 *     domaine de l'enseigne (orpi.com / laforet.com / foncia.com),
 *     jamais vers un site propre à l'agence. Scraper n'apporterait
 *     donc rien de plus que ce que cette heuristique DNS trouve déjà.
 *   - GUY HOQUET : localisateur sur un sous-domaine dédié
 *     (agence.guy-hoquet.com, sans robots.txt) — pas encore vérifié
 *     si le site propre de l'agence apparaît en résultat.
 *   - HUMAN IMMOBILIER : robots.txt lui-même renvoie 403 à tout
 *     client non-navigateur (protection anti-bot en périphérie) ;
 *     impossible de statuer sans navigateur complet.
 * Ne pas relancer cette investigation sans nouvel élément (ex. accès
 * à un navigateur complet pour Guy Hoquet / Human Immobilier).
 * ------------------------------------------------------------------
 */
import { queryA, queryMX } from '../../src/services/dohClient.js';

const LEGAL_SUFFIXES = [
  'sarl', 'sas', 'sasu', 'sci', 'eurl', 'sa', 'snc', 'scop', 'earl',
  'entreprise', 'ets', 'etablissements', 'societe', 'groupe', 'compagnie',
];

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .split(/\s+/)
    .filter((word) => word && !LEGAL_SUFFIXES.includes(word))
    .join('')
    .replace(/[^a-z0-9]/g, '');
}

async function domainResolves(domain) {
  try {
    const [a, mx] = await Promise.allSettled([queryA(domain), queryMX(domain)]);
    const aOk = a.status === 'fulfilled' && a.value.length > 0;
    const mxOk = mx.status === 'fulfilled' && mx.value.length > 0;
    return aOk || mxOk;
  } catch {
    return false;
  }
}

/**
 * @param {string} companyName
 * @returns {Promise<{ domain: string|null, statut: 'devine-verifie' | 'a-completer' }>}
 */
export async function guessAndVerifyDomain(companyName) {
  const slug = slugify(companyName);
  if (!slug || slug.length < 3) {
    return { domain: null, statut: 'a-completer' };
  }

  const candidates = [`${slug}.fr`, `${slug}.com`];

  for (const candidate of candidates) {
    if (await domainResolves(candidate)) {
      return { domain: candidate, statut: 'devine-verifie' };
    }
  }

  return { domain: null, statut: 'a-completer' };
}

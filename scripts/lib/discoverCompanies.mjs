/**
 * discoverCompanies.mjs
 * ------------------------------------------------------------------
 * Connecteurs vers deux sources officielles françaises, gratuites et
 * sans clé d'API :
 *
 *  - recherche-entreprises.api.gouv.fr : couvre TOUS les secteurs via
 *    code NAF (base Sirene/INSEE officielle).
 *  - data.ademe.fr (jeu de données "Liste des entreprises RGE") :
 *    spécifique construction / rénovation / plomberie-chauffage,
 *    avec un filtre "domaine de travaux" plus précis qu'un NAF seul.
 *
 * Aucune des deux sources ne fournit de site web ni d'e-mail — c'est
 * volontairement géré séparément par findDomain.mjs (voir ce fichier
 * pour l'explication du choix : deviner puis vérifier par DNS, plutôt
 * que scraper des annuaires tiers non vérifiés).
 * ------------------------------------------------------------------
 */

const GOUV_API = 'https://recherche-entreprises.api.gouv.fr/search';
const ADEME_RGE_API = 'https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines';

/**
 * Recherche d'entreprises par code NAF + département via l'API officielle du gouvernement.
 * @param {{ naf: string, departement: string, limit?: number }} params
 */
export async function searchByNAF({ naf, departement, limit = 25 }) {
  const params = new URLSearchParams({
    activite_principale: naf,
    departement,
    per_page: String(Math.min(limit, 25)),
    page: '1',
  });

  const res = await fetch(`${GOUV_API}?${params.toString()}`);
  if (!res.ok) throw new Error(`API Recherche Entreprises a répondu ${res.status}`);
  const json = await res.json();

  // Le filtre `departement` sélectionne les ENTREPRISES ayant un établissement
  // dans ce département, mais `siege` reste le siège social national (souvent
  // ailleurs). L'adresse pertinente pour la prospection locale est celle du
  // ou des établissements listés dans `matching_etablissements`, pas le siège.
  return (json.results ?? []).map((r) => {
    const local = r.matching_etablissements?.[0] ?? r.siege ?? {};
    return {
      nom: r.nom_complet || r.nom_raison_sociale || 'Nom inconnu',
      siret: local.siret || r.siege?.siret || r.siren,
      adresse: local.adresse || '',
      ville: local.libelle_commune || '',
      codePostal: local.code_postal || '',
      naf: r.activite_principale || naf,
      source: 'gouv',
    };
  });
}

/**
 * Recherche d'entreprises RGE (construction/rénovation/plomberie-chauffage)
 * par domaine de travaux + département, via l'API ouverte ADEME.
 * @param {{ domaine: string, departement: string, limit?: number }} params
 */
export async function searchRGE({ domaine, departement, limit = 25 }) {
  const params = new URLSearchParams({
    q: domaine,
    qs: `code_postal:${departement}*`,
    size: String(Math.min(limit, 50)),
  });

  const res = await fetch(`${ADEME_RGE_API}?${params.toString()}`);
  if (!res.ok) throw new Error(`API RGE (ADEME) a répondu ${res.status}`);
  const json = await res.json();

  return (json.results ?? []).map((r) => ({
    nom: r.nom_entreprise || r.raison_sociale || 'Nom inconnu',
    siret: r.siret || '',
    adresse: r.adresse || '',
    ville: r.commune || '',
    codePostal: r.code_postal || '',
    domaineTravaux: r.domaine || domaine,
    source: 'rge',
  }));
}

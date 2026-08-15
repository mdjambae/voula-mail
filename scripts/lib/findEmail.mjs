/**
 * findEmail.mjs
 * ------------------------------------------------------------------
 * Cherche une adresse e-mail réellement publiée sur le site d'une
 * entreprise (page d'accueil + page contact). Contrairement à une
 * adresse devinée (contact@domaine), une adresse trouvée ici est
 * garantie réelle puisque publiée par l'entreprise elle-même sur une
 * page publique — légitime, à la différence du scraping de moteurs
 * de recherche.
 * ------------------------------------------------------------------
 */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const EXCLUDED_DOMAINS_IN_EMAIL = [
  'sentry.io', 'wixpress.com', 'example.com', 'domain.com', 'godaddy.com',
  'schema.org', 'w3.org', '2x.png', 'yourdomain.com',
];

const CANDIDATE_PATHS = ['/', '/contact', '/contact-us', '/nous-contacter', '/mentions-legales'];

function extractEmails(html) {
  const matches = html.match(EMAIL_RE) ?? [];
  return [...new Set(matches)]
    .map((e) => e.toLowerCase())
    .filter((e) => !EXCLUDED_DOMAINS_IN_EMAIL.some((bad) => e.endsWith(bad)))
    .filter((e) => !/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(e));
}

async function fetchPage(url, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; VoulaMailProspectBot/1.0)' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * @param {string} domain - domaine nu, ex: "exemple.fr"
 * @returns {Promise<{ email: string|null, statut: 'verifie' | 'a-completer', page: string|null }>}
 */
export async function findEmailOnWebsite(domain) {
  for (const path of CANDIDATE_PATHS) {
    for (const scheme of ['https', 'http']) {
      const url = `${scheme}://${domain}${path}`;
      const html = await fetchPage(url);
      if (!html) continue;

      const emails = extractEmails(html).filter((e) => e.endsWith(`@${domain}`) || !e.includes('@' + 'gmail.com'));
      const onDomain = emails.find((e) => e.endsWith(`@${domain}`));
      const any = onDomain ?? emails[0];

      if (any) {
        return { email: any, statut: 'verifie', page: url };
      }
      break; // https a répondu (même sans email trouvé) : inutile de retenter en http
    }
  }
  return { email: null, statut: 'a-completer', page: null };
}

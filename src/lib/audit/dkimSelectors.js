/**
 * dkimSelectors.js
 * ------------------------------------------------------------------
 * Base de sélecteurs DKIM courants, regroupés par fournisseur.
 * Utilisée par le module DKIM pour détecter automatiquement les
 * sélecteurs actifs sur un domaine, sans se limiter à "default".
 * Liste volontairement large et facilement extensible.
 * ------------------------------------------------------------------
 */

export const DKIM_SELECTOR_GROUPS = {
  generic: ['default', 'dkim', 'selector1', 'selector2', 'selector', 'mail', 'smtp', 'key1', 'key2', 's1', 's2'],
  google: ['google', 'googlemail', '20161025', '20230601'],
  microsoft: ['selector1', 'selector2'],
  mailgun: ['mailgun', 'mg', 'k1', 'krs'],
  sendgrid: ['sendgrid', 's1', 's2', 'em'],
  brevo: ['brevo', 'mail', 'sendinblue1', 'sendinblue2'],
  amazonses: ['amazonses', 'zoho1'],
  sparkpost: ['sparkpost', 'scph0122'],
  protonmail: ['protonmail', 'protonmail2', 'protonmail3'],
  zoho: ['zoho', 'zmail'],
  ovh: ['ovh', 'dkim-ovh'],
  plesk: ['default', 'plesk'],
  cpanel: ['default', 'x'],
  postfix: ['mail', 'postfix'],
  exim: ['exim', 'mail'],
  mailchimp: ['k1', 'k2', 'k3'],
  hubspot: ['hs1-2023', 'hs2-2023', 'hs1', 'hs2'],
  klaviyo: ['dkim', 'kl'],
  mandrill: ['mandrill'],
  postmark: ['20150623', '20161025', 'pm'],
  salesforce: ['sfdc', 'sfmc'],
  activecampaign: ['ac'],
  freshdesk: ['freshdesk'],
  intercom: ['intercom'],
  yandex: ['mail', 'yandex'],
  fastmail: ['fm1', 'fm2', 'fm3'],
  outlook365: ['selector1-outlook', 'selector2-outlook'],
};

/** Liste plate dédupliquée, prête à être itérée par le moteur d'audit. */
export const DKIM_SELECTORS = Array.from(
  new Set(Object.values(DKIM_SELECTOR_GROUPS).flat())
).sort();

/** Retrouve le(s) fournisseur(s) probable(s) associés à un sélecteur. */
export function guessProviderFromSelector(selector) {
  const lower = selector.toLowerCase();
  const matches = Object.entries(DKIM_SELECTOR_GROUPS)
    .filter(([, selectors]) => selectors.includes(lower))
    .map(([provider]) => provider);
  return matches.length ? matches : ['inconnu'];
}

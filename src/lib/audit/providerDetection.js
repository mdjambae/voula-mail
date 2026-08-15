/**
 * providerDetection.js
 * ------------------------------------------------------------------
 * Détecte automatiquement, à partir des signaux DNS déjà collectés
 * par l'audit (hôtes MX, contenu de l'enregistrement SPF, sélecteurs
 * DKIM actifs, serveurs de noms), quel hébergeur DNS et quel
 * fournisseur de messagerie gèrent probablement le domaine. Sert à
 * personnaliser les instructions de correction : où se connecter,
 * quel enregistrement créer, avec quelle valeur.
 *
 * La détection est heuristique (basée sur des motifs d'hôtes connus)
 * et présentée comme telle dans le rapport : elle oriente l'utilisateur
 * plutôt que de prétendre à une certitude absolue.
 * ------------------------------------------------------------------
 */
import { DNS_HOST_GUIDES, EMAIL_PROVIDER_NOTES } from './providerGuides.js';

// Alias entre les clés de src/lib/audit/dkimSelectors.js (DKIM_SELECTOR_GROUPS)
// et les identifiants de fournisseur utilisés ici, quand ils diffèrent.
const SELECTOR_GROUP_ALIAS = {
  google: 'google_workspace',
  microsoft: 'microsoft365',
};

const SIGNATURES = [
  { id: 'google_workspace', kind: 'email', mx: /google\.com$|aspmx\.l\.google\.com$/i, spf: /_spf\.google\.com/i },
  { id: 'microsoft365', kind: 'email', mx: /\.protection\.outlook\.com$/i, spf: /spf\.protection\.outlook\.com/i },
  { id: 'zoho', kind: 'email', mx: /zoho\.(com|eu)$/i, spf: /zoho\.(com|eu)/i },
  { id: 'brevo', kind: 'email', mx: /sendinblue\.com$|brevo\.com$/i, spf: /sendinblue\.com|brevo\.com/i },
  { id: 'mailgun', kind: 'email', mx: /mailgun\.org$/i, spf: /mailgun\.org/i },
  { id: 'sendgrid', kind: 'email', mx: /sendgrid\.net$/i, spf: /sendgrid\.net/i },
  { id: 'ovh', kind: 'both', mx: /\.ovh\.(net|com)$/i, spf: /ovh\.(net|com)/i, ns: /ovh\.net$/i },
  { id: 'lws', kind: 'both', mx: /lws-hosting\.com$|\.lws\.fr$/i, spf: /lws-hosting\.com|lws\.fr/i, ns: /lws\.fr$|dns-lws\.(net|com)$/i },
  { id: 'cloudflare', kind: 'dns', mx: /mx\d?\.cloudflare\.net$/i, ns: /\.ns\.cloudflare\.com$/i },
  { id: 'godaddy', kind: 'dns', ns: /domaincontrol\.com$/i, mx: /secureserver\.net$/i },
  { id: 'gandi', kind: 'dns', ns: /gandi\.net$/i },
  { id: 'ionos', kind: 'dns', ns: /ionos\.(com|fr)$|1and1\.(com|fr)$/i },
  { id: 'infomaniak', kind: 'dns', ns: /infomaniak\.(com|ch)$/i, mx: /infomaniak\.(com|ch)$/i },
];

function matchAny(regex, hosts) {
  if (!regex) return null;
  return hosts.find((h) => regex.test(h)) ?? null;
}

/**
 * @param {object} report - rapport complet retourné par runFullAudit
 * @returns {{ emailProviders: Array, dnsProviders: Array, primaryEmail: object|null, primaryDns: object|null }}
 */
export function detectProviders(report) {
  const mxHosts = (report.results?.mx?.records ?? []).map((r) => r.host).filter(Boolean);
  const spfRecord = report.results?.spf?.record ?? '';
  const nsHosts = report.infra?.ns ?? [];
  const dkimSelectorIds = (report.results?.dkim?.selectorsFound ?? [])
    .flatMap((s) => s.likelyProviders ?? [])
    .map((groupKey) => SELECTOR_GROUP_ALIAS[groupKey] ?? groupKey);

  const emailProviders = [];
  const dnsProviders = [];

  SIGNATURES.forEach((sig) => {
    const evidence = [];
    const mxMatch = matchAny(sig.mx, mxHosts);
    if (mxMatch) evidence.push({ type: 'MX', value: mxMatch });
    const spfMatch = sig.spf && sig.spf.test(spfRecord) ? sig.spf.source : null;
    if (spfMatch) evidence.push({ type: 'SPF', value: spfRecord });
    const nsMatch = matchAny(sig.ns, nsHosts);
    if (nsMatch) evidence.push({ type: 'NS', value: nsMatch });
    const selectorMatch = dkimSelectorIds.includes(sig.id) ? sig.id : null;
    if (selectorMatch) evidence.push({ type: 'DKIM', value: `sélecteur associé à ${sig.id}` });

    if (evidence.length === 0) return;

    const dnsGuide = DNS_HOST_GUIDES[sig.id];
    const emailNote = EMAIL_PROVIDER_NOTES[sig.id];
    const entry = { id: sig.id, evidence, confidence: evidence.length > 1 ? 'high' : 'medium' };

    if ((sig.kind === 'email' || sig.kind === 'both') && emailNote) {
      emailProviders.push({ ...entry, label: emailNote.label, notes: emailNote });
    }
    if ((sig.kind === 'dns' || sig.kind === 'both') && dnsGuide) {
      dnsProviders.push({ ...entry, label: dnsGuide.label, guide: dnsGuide });
    }
  });

  emailProviders.sort((a, b) => b.evidence.length - a.evidence.length);
  dnsProviders.sort((a, b) => b.evidence.length - a.evidence.length);

  const fallbackDns = { id: 'generic', label: DNS_HOST_GUIDES.generic.label, guide: DNS_HOST_GUIDES.generic, evidence: [], confidence: 'low' };

  return {
    emailProviders,
    dnsProviders,
    primaryEmail: emailProviders[0] ?? null,
    primaryDns: dnsProviders[0] ?? fallbackDns,
  };
}

/** Renvoie la particularité connue (si elle existe) pour un fournisseur détecté et un protocole donné. */
export function buildTailoredStep(detection, moduleId) {
  return detection?.primaryEmail?.notes?.[moduleId] ?? null;
}

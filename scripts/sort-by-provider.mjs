#!/usr/bin/env node
/**
 * sort-by-provider.mjs
 * ------------------------------------------------------------------
 * Trie une liste d'adresses e-mail en plusieurs fichiers, un par
 * fournisseur de messagerie réellement détecté via l'enregistrement
 * MX du domaine (pas une supposition sur le nom de domaine — le vrai
 * serveur qui reçoit les e-mails).
 *
 * Usage :
 *   node scripts/sort-by-provider.mjs contacts.txt
 *   node scripts/sort-by-provider.mjs contacts.txt --out-dir tri --concurrency 8
 *
 * Format du fichier d'entrée : une adresse e-mail par ligne (export
 * Bloc-notes). Lignes vides et lignes commençant par # ignorées.
 *
 * Fichiers produits, exemple pour le 10/08/2026 :
 *   liste_10_08_2026_office365.txt
 *   liste_10_08_2026_google_workspace.txt
 *   liste_10_08_2026_ovh.txt
 *   liste_10_08_2026_inconnu.txt        (domaine non résolu ou fournisseur non reconnu)
 * ------------------------------------------------------------------
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { queryMX } from '../src/services/dohClient.js';

/**
 * Fournisseurs de messagerie grand public : à exclure AVANT toute
 * détection par MX, pas après. Vérifié par requête DNS réelle
 * (2026-08-10) : gmail.com sort sur gmail-smtp-in.l.google.com, un
 * hostname distinct des vrais tenants Google Workspace (aspmx.l.google.com
 * / smtp.google.com) — donc séparable par motif. Mais outlook.com et
 * hotmail.com sortent sur *.olc.protection.outlook.com, exactement le
 * même hostname que les tenants Microsoft 365 pro (Microsoft fait
 * transiter le grand public par la même infra de filtrage) — PAS
 * séparable par MX, seule cette liste peut les écarter. Même logique
 * que CONSUMER_EMAIL_DOMAINS dans bulk-scan.mjs / prospect.mjs.
 */
const CONSUMER_EMAIL_DOMAINS = new Set([
  // Fournisseurs d'accès français
  'orange.fr', 'wanadoo.fr', 'free.fr', 'laposte.net', 'sfr.fr', 'sfr.net',
  'neuf.fr', 'aliceadsl.fr', 'numericable.fr', 'bbox.fr', 'cegetel.net',
  'club-internet.fr', 'voila.fr', 'noos.fr', 'tele2.fr',
  // Grands webmails internationaux
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.fr', 'yahoo.co.uk', 'ymail.com', 'rocketmail.com',
  'hotmail.com', 'hotmail.fr', 'hotmail.co.uk', 'outlook.com', 'outlook.fr',
  'live.com', 'live.fr', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'gmx.fr', 'gmx.com', 'gmx.net', 'mail.com',
  'protonmail.com', 'proton.me', 'pm.me',
  'yandex.com', 'yandex.ru',
  'zoho.com', 'fastmail.com', 'tutanota.com',
]);

/**
 * Motifs de détection de fournisseur à partir du nom d'hôte MX.
 * Ajouter une entrée ici suffit à reconnaître un nouveau fournisseur —
 * aucune autre partie du script à modifier.
 */
const PROVIDER_PATTERNS = [
  { id: 'office365', pattern: /\.protection\.outlook\.com$/i },
  { id: 'google_workspace', pattern: /aspmx\.l\.google\.com$|googlemail\.com$|smtp\.google\.com$/i },
  { id: 'zoho', pattern: /zoho\.(com|eu)$/i },
  { id: 'brevo', pattern: /sendinblue\.com$|brevo\.com$/i },
  { id: 'mailgun', pattern: /mailgun\.org$/i },
  { id: 'sendgrid', pattern: /sendgrid\.net$/i },
  { id: 'amazon_ses', pattern: /amazonaws\.com$/i },
  { id: 'ovh', pattern: /\.ovh\.(net|com)$/i },
  { id: 'lws', pattern: /lws-hosting\.com$|\.lws\.fr$/i },
  { id: 'ionos', pattern: /ionos\.(com|fr)$|1and1\.(com|fr)$/i },
  { id: 'infomaniak', pattern: /infomaniak\.(com|ch)$/i },
  { id: 'gandi', pattern: /gandi\.net$/i },
  { id: 'cloudflare', pattern: /mx\d?\.cloudflare\.net$/i },
  { id: 'yandex', pattern: /yandex\.(com|ru|net)$/i },
  { id: 'proton', pattern: /protonmail\.ch$|proton\.me$/i },
];

function parseArgs(argv) {
  const args = { input: null, outDir: '.', concurrency: 8 };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out-dir') args.outDir = argv[++i];
    else if (argv[i] === '--concurrency') args.concurrency = Number(argv[++i]) || 8;
    else rest.push(argv[i]);
  }
  args.input = rest[0];
  return args;
}

function todayLabel() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}_${p(d.getMonth() + 1)}_${d.getFullYear()}`;
}

async function loadEmails(path) {
  const text = await readFile(path, 'utf-8');
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+)$/;
  const valid = [];
  const invalid = [];
  for (const line of lines) {
    const match = line.match(EMAIL_RE);
    if (match) valid.push({ email: line.toLowerCase(), domain: match[1].toLowerCase() });
    else invalid.push(line);
  }
  return { valid, invalid, totalLines: lines.length };
}

async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
  return results;
}

function detectProvider(mxHost) {
  for (const { id, pattern } of PROVIDER_PATTERNS) {
    if (pattern.test(mxHost)) return id;
  }
  return null;
}

/** Résout le fournisseur d'un domaine, avec repli sur le domaine de l'hôte MX si non reconnu. */
async function resolveDomainProvider(domain) {
  if (CONSUMER_EMAIL_DOMAINS.has(domain)) {
    return { provider: 'grand_public', detail: 'domaine grand public exclu (voir CONSUMER_EMAIL_DOMAINS)' };
  }

  try {
    const mxRecords = await queryMX(domain);
    if (mxRecords.length === 0) return { provider: 'inconnu', detail: 'aucun MX trouvé' };

    const primaryMx = mxRecords[0].host;
    const known = detectProvider(primaryMx);
    if (known) return { provider: known, detail: primaryMx };

    // Repli : pas dans la liste connue, on regroupe par le domaine racine de l'hôte MX
    // (ex: mail.hebergeur-x.fr -> "hebergeur-x.fr") plutôt que de tout jeter en "inconnu".
    const parts = primaryMx.split('.');
    const fallbackLabel = parts.length >= 2 ? parts.slice(-2).join('_') : primaryMx;
    return { provider: sanitizeLabel(fallbackLabel), detail: primaryMx };
  } catch {
    return { provider: 'inconnu', detail: 'résolution DNS échouée' };
  }
}

function sanitizeLabel(s) {
  return s.toLowerCase().replace(/[^a-z0-9._-]/g, '');
}

async function main() {
  const { input, outDir, concurrency } = parseArgs(process.argv.slice(2));
  if (!input) {
    console.error('Usage: node scripts/sort-by-provider.mjs <fichier-emails.txt> [--out-dir dossier] [--concurrency 8]');
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });

  const { valid, invalid, totalLines } = await loadEmails(input);
  console.log(`${totalLines} ligne(s) lue(s) → ${valid.length} adresse(s) e-mail valide(s)${invalid.length ? `, ${invalid.length} ligne(s) ignorée(s)` : ''}.\n`);

  // On ne résout chaque domaine qu'une seule fois, même si plusieurs adresses le partagent.
  const uniqueDomains = [...new Set(valid.map((v) => v.domain))];
  console.log(`Résolution MX de ${uniqueDomains.length} domaine(s) unique(s)...`);

  let done = 0;
  const domainResults = await runWithConcurrency(uniqueDomains, concurrency, async (domain) => {
    const result = await resolveDomainProvider(domain);
    done++;
    process.stdout.write(`\r[${done}/${uniqueDomains.length}] ${domain} → ${result.provider}          `);
    return [domain, result];
  });
  console.log('\n');

  const domainToProvider = new Map(domainResults);

  // Regroupe les adresses par fournisseur détecté.
  const groups = new Map();
  for (const { email, domain } of valid) {
    const { provider } = domainToProvider.get(domain);
    if (!groups.has(provider)) groups.set(provider, []);
    groups.get(provider).push(email);
  }

  const date = todayLabel();
  const writtenFiles = [];
  for (const [provider, emails] of groups) {
    const filename = `${outDir}/liste_${date}_${provider}.txt`;
    await writeFile(filename, emails.sort().join('\n') + '\n', 'utf-8');
    writtenFiles.push({ filename, count: emails.length });
  }

  console.log(`${writtenFiles.length} fichier(s) écrit(s) dans "${outDir}" :\n`);
  writtenFiles
    .sort((a, b) => b.count - a.count)
    .forEach((f) => console.log(`  ${f.filename}  (${f.count} adresse${f.count > 1 ? 's' : ''})`));

  if (invalid.length) {
    const invalidFile = `${outDir}/liste_${date}_lignes_invalides.txt`;
    await writeFile(invalidFile, invalid.join('\n') + '\n', 'utf-8');
    console.log(`\n${invalidFile}  (${invalid.length} ligne(s) non reconnue(s) comme e-mail)`);
  }
}

main().catch((err) => {
  console.error('Erreur fatale :', err);
  process.exit(1);
});

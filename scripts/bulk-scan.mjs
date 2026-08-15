#!/usr/bin/env node
/**
 * bulk-scan.mjs
 * ------------------------------------------------------------------
 * Scanne une liste de domaines avec le même moteur d'audit que
 * l'application web (aucune duplication de logique : import direct
 * de src/lib/audit/) et exporte un CSV trié par score croissant —
 * les pires scores (donc les meilleurs prospects) en premier.
 *
 * Usage :
 *   node scripts/bulk-scan.mjs contacts.txt
 *   node scripts/bulk-scan.mjs contacts.txt --out resultats.csv --concurrency 8 --threshold 45
 *
 * Format du fichier d'entrée : une entrée par ligne — adresse e-mail
 * (contact@exemple.fr) OU domaine nu (exemple.fr), les deux formats
 * peuvent être mélangés dans le même fichier. Le script extrait
 * automatiquement le domaine de chaque adresse e-mail et déduplique
 * (plusieurs adresses du même domaine ne sont scannées qu'une fois).
 * Lignes vides et lignes commençant par # ignorées.
 *
 * IMPORTANT — usage responsable :
 *   - Ce script n'interroge que des enregistrements DNS PUBLICS
 *     (comme n'importe quel outil MXToolbox/EasyDMARC). Il ne se
 *     connecte à aucun serveur du domaine cible, n'envoie aucun
 *     e-mail, ne teste aucune authentification.
 *   - Respectez la limite de concurrence par défaut (8) pour ne pas
 *     solliciter excessivement les résolveurs publics Cloudflare/
 *     Google — ce sont des services gratuits partagés.
 *   - Utilisez les résultats pour proposer une correction utile, pas
 *     pour du démarchage agressif ou non sollicité en violation du
 *     RGPD / de la réglementation anti-spam de votre pays.
 * ------------------------------------------------------------------
 */
import { readFile, writeFile } from 'node:fs/promises';
import { runFullAudit } from '../src/lib/audit/index.js';
import { detectProviders } from '../src/lib/audit/providerDetection.js';

/**
 * Fournisseurs de messagerie grand public : ce sont des infrastructures
 * partagées gérées par leur opérateur, pas des domaines d'entreprise
 * qu'on peut "démarcher" pour corriger leur configuration. Filtrés
 * automatiquement. Complétez cette liste si vous en croisez d'autres.
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

function parseArgs(argv) {
  const args = { input: null, out: 'resultats-scan.csv', concurrency: 8, filterConsumer: true, threshold: 45 };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') args.out = argv[++i];
    else if (argv[i] === '--concurrency') args.concurrency = Number(argv[++i]) || 8;
    else if (argv[i] === '--no-filter-consumer') args.filterConsumer = false;
    else if (argv[i] === '--threshold') args.threshold = Number(argv[++i]);
    else rest.push(argv[i]);
  }
  args.input = rest[0];
  return args;
}

async function loadDomains(path, { filterConsumer = true } = {}) {
  const text = await readFile(path, 'utf-8');
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  const domains = new Set();
  const invalid = [];
  const consumerFiltered = [];

  for (const line of lines) {
    // Accepte aussi bien "contact@exemple.fr" que "exemple.fr" sur la même ligne,
    // et ignore tout ce qui suit un séparateur courant (virgule, point-virgule, tabulation)
    // au cas où le fichier exporté contient plusieurs colonnes.
    const firstToken = line.split(/[,;\t]/)[0].trim();
    const atIndex = firstToken.lastIndexOf('@');
    const raw = atIndex !== -1 ? firstToken.slice(atIndex + 1) : firstToken;
    const domain = raw
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .trim();

    const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/;
    if (!DOMAIN_RE.test(domain)) {
      invalid.push(line);
      continue;
    }
    if (filterConsumer && CONSUMER_EMAIL_DOMAINS.has(domain)) {
      consumerFiltered.push(domain);
      continue;
    }
    domains.add(domain);
  }

  return { domains: [...domains], totalLines: lines.length, invalid, consumerFiltered };
}

/** Limite le nombre de scans exécutés en parallèle pour ne pas surcharger les résolveurs DNS publics. */
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

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function summarizeCriticalIssues(report) {
  const critical = [];
  for (const mod of Object.values(report.results)) {
    if (mod.status === 'danger' || mod.status === 'error') {
      critical.push(mod.label);
    }
  }
  return critical.join(' + ');
}

async function main() {
  const { input, out, concurrency, filterConsumer, threshold } = parseArgs(process.argv.slice(2));
  if (!input) {
    console.error('Usage: node scripts/bulk-scan.mjs <fichier-contacts.txt> [--out resultats.csv] [--concurrency 8] [--threshold 45] [--no-filter-consumer]');
    console.error('Le fichier accepte des adresses e-mail (contact@exemple.fr) et/ou des domaines nus (exemple.fr), un par ligne.');
    process.exit(1);
  }

  const { domains, totalLines, invalid, consumerFiltered } = await loadDomains(input, { filterConsumer });
  console.log(`${totalLines} ligne(s) lue(s) → ${domains.length} domaine(s) unique(s) à scanner (concurrence: ${concurrency})`);
  if (consumerFiltered.length) {
    console.log(`${consumerFiltered.length} domaine(s) grand public exclu(s) automatiquement (gmail, orange.fr, hotmail...) : ${[...new Set(consumerFiltered)].slice(0, 5).join(', ')}${consumerFiltered.length > 5 ? '…' : ''}`);
  }
  if (invalid.length) {
    console.log(`${invalid.length} ligne(s) ignorée(s) (format non reconnu) : ${invalid.slice(0, 5).join(', ')}${invalid.length > 5 ? '…' : ''}`);
  }
  console.log('');

  let done = 0;
  const rows = await runWithConcurrency(domains, concurrency, async (domain) => {
    try {
      const report = await runFullAudit(domain);
      const detection = detectProviders(report);
      done++;
      process.stdout.write(`\r[${done}/${domains.length}] ${domain} → ${report.score.score}/100          `);
      return {
        domain,
        score: report.score.score,
        risk: report.score.score >= 90 ? 'Excellent' : report.score.score >= 70 ? 'Bon' : report.score.score >= 45 ? 'Moyen' : 'Faible',
        protocolesCritiques: summarizeCriticalIssues(report),
        dnsHost: detection.primaryDns?.label ?? '',
        emailProvider: detection.primaryEmail?.label ?? '',
        error: '',
      };
    } catch (err) {
      done++;
      process.stdout.write(`\r[${done}/${domains.length}] ${domain} → erreur          `);
      return { domain, score: -1, risk: '', protocolesCritiques: '', dnsHost: '', emailProvider: '', error: err.message };
    }
  });

  console.log('\n');

  // Trie par score croissant (les pires en premier = meilleurs prospects),
  // les erreurs de scan (score -1) sont reléguées en fin de liste.
  const sorted = [...rows].sort((a, b) => {
    if (a.score === -1) return 1;
    if (b.score === -1) return -1;
    return a.score - b.score;
  });

  const header = ['Domaine', 'Score', 'Niveau de risque', 'Protocoles critiques', 'Hébergement DNS détecté', 'Fournisseur e-mail détecté', 'Erreur'];
  const lines = [header.join(';')];
  for (const r of sorted) {
    lines.push(
      [r.domain, r.score === -1 ? '' : r.score, r.risk, r.protocolesCritiques, r.dnsHost, r.emailProvider, r.error]
        .map(csvEscape)
        .join(';')
    );
  }

  await writeFile(out, '\uFEFF' + lines.join('\n'), 'utf-8'); // BOM pour un bon affichage des accents dans Excel

  const scanned = sorted.filter((r) => r.score !== -1);
  const failed = sorted.filter((r) => r.score === -1);

  console.log(`Terminé : ${scanned.length} scanné(s), ${failed.length} en erreur.`);
  console.log(`Résultats complets (${scanned.length} domaines) écrits dans : ${out}\n`);

  const prospects = scanned.filter((r) => r.score <= threshold);
  const withProvider = prospects.filter((r) => r.emailProvider);
  const withoutProvider = prospects.filter((r) => !r.emailProvider);

  console.log(`━━━ Prospects sous le seuil de ${threshold}/100 : ${prospects.length} sur ${scanned.length} scannés ━━━\n`);

  if (withProvider.length) {
    console.log(`✓ Fournisseur e-mail identifié — pitch personnalisable (${withProvider.length}) :`);
    withProvider.forEach((r) =>
      console.log(`  ${String(r.score).padStart(3)}/100  ${r.domain.padEnd(32)} ${r.protocolesCritiques.padEnd(20)} → ${r.emailProvider}`)
    );
    console.log('');
  }

  if (withoutProvider.length) {
    console.log(`? Fournisseur non identifié — à vérifier avant contact (${withoutProvider.length}) :`);
    withoutProvider.forEach((r) =>
      console.log(`  ${String(r.score).padStart(3)}/100  ${r.domain.padEnd(32)} ${r.protocolesCritiques}`)
    );
    console.log('');
  }

  if (prospects.length === 0) {
    console.log(`Aucun domaine sous ${threshold}/100 dans ce lot. Ajustez avec --threshold si besoin (ex: --threshold 55).\n`);
  }
}

main().catch((err) => {
  console.error('Erreur fatale :', err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * prospect.mjs
 * ------------------------------------------------------------------
 * Point d'entrée unique de la chaîne de prospection VOULA :
 *
 *   1. Identification des entreprises (API gouvernementale par code
 *      NAF — tous secteurs — ou base RGE de l'ADEME pour le bâtiment)
 *   2. Devine un domaine probable et le VÉRIFIE par DNS avant de le
 *      retenir (jamais un domaine non confirmé)
 *   3. Cherche un e-mail réellement publié sur le site trouvé
 *   4. Scanne la sécurité e-mail du domaine (moteur d'audit VOULA)
 *   5. Écrit un CSV compatible avec generate-emails.mjs / generate-followup.mjs
 *
 * Tous les fichiers générés sont préfixés par la date du jour, pour
 * garder un historique clair de chaque lot de prospection.
 *
 * Usage :
 *   node scripts/prospect.mjs --naf 68.31Z --departement 69
 *   node scripts/prospect.mjs --rge "Isolation" --departement 75
 *   node scripts/prospect.mjs --resume 2026-08-05-entreprises-69.csv
 *
 * Options :
 *   --naf <code>            Code NAF/APE à cibler (couvre tout secteur)
 *   --rge <domaine>         Domaine de travaux RGE (bâtiment/rénovation)
 *   --departement <code>    Département français (ex: 69, 75)
 *   --limit <n>              Nombre d'entreprises à identifier (défaut 25)
 *   --resume <fichier.csv>  Reprend un CSV déjà rempli manuellement
 *                            (colonne Domaine complétée à la main)
 *   --out <prefixe>          Préfixe des fichiers de sortie (défaut: auto)
 *   --skip-scan               N'exécute que l'identification + domaines + emails
 * ------------------------------------------------------------------
 */
import { readFile, writeFile } from 'node:fs/promises';
import { searchByNAF, searchRGE } from './lib/discoverCompanies.mjs';
import { guessAndVerifyDomain } from './lib/findDomain.mjs';
import { findEmailOnWebsite } from './lib/findEmail.mjs';
import { runFullAudit } from '../src/lib/audit/index.js';
import { detectProviders } from '../src/lib/audit/providerDetection.js';

const CONSUMER_EMAIL_DOMAINS = new Set([
  'orange.fr', 'wanadoo.fr', 'free.fr', 'laposte.net', 'sfr.fr', 'sfr.net',
  'neuf.fr', 'aliceadsl.fr', 'numericable.fr', 'bbox.fr', 'cegetel.net',
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.fr', 'hotmail.com',
  'hotmail.fr', 'outlook.com', 'outlook.fr', 'live.com', 'live.fr', 'msn.com',
  'icloud.com', 'me.com', 'mac.com', 'aol.com', 'gmx.fr', 'gmx.com',
]);

function todayPrefix() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseArgs(argv) {
  const args = { limit: 25, concurrency: 5, skipScan: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--naf') args.naf = argv[++i];
    else if (argv[i] === '--rge') args.rge = argv[++i];
    else if (argv[i] === '--departement') args.departement = argv[++i];
    else if (argv[i] === '--limit') args.limit = Number(argv[++i]) || 25;
    else if (argv[i] === '--resume') args.resume = argv[++i];
    else if (argv[i] === '--out') args.out = argv[++i];
    else if (argv[i] === '--skip-scan') args.skipScan = true;
  }
  return args;
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows, header) {
  const lines = [header.join(';')];
  for (const row of rows) {
    lines.push(header.map((h) => csvEscape(row[h])).join(';'));
  }
  return '\uFEFF' + lines.join('\n');
}

function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split('\n').filter((l) => l.trim().length > 0);
  const parseLine = (line) => {
    const cells = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else { cur += c; }
      } else if (c === '"') inQuotes = true;
      else if (c === ';') { cells.push(cur); cur = ''; }
      else cur += c;
    }
    cells.push(cur);
    return cells;
  };
  const [headerLine, ...rows] = lines;
  const header = parseLine(headerLine).map((h) => h.trim());
  return rows.map((line) => {
    const values = parseLine(line);
    const obj = {};
    header.forEach((h, i) => (obj[h] = (values[i] ?? '').replace(/\r$/, '')));
    return obj;
  });
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

// ---------------------------------------------------------------------
// Étape 1 — Identification
// ---------------------------------------------------------------------
async function stepIdentify(args) {
  if (!args.naf && !args.rge) {
    throw new Error('Précisez --naf <code> ou --rge <domaine de travaux> (ou utilisez --resume <fichier>).');
  }
  if (!args.departement) {
    throw new Error('Précisez --departement <code> (ex: 69).');
  }

  console.log(`Identification des entreprises...`);
  const companies = args.naf
    ? await searchByNAF({ naf: args.naf, departement: args.departement, limit: args.limit })
    : await searchRGE({ domaine: args.rge, departement: args.departement, limit: args.limit });

  console.log(`${companies.length} entreprise(s) identifiée(s).`);
  return companies;
}

// ---------------------------------------------------------------------
// Étape 2 — Domaine (deviné + vérifié DNS)
// ---------------------------------------------------------------------
async function stepFindDomains(companies, concurrency) {
  console.log(`Recherche de domaines (deviné + vérifié par DNS)...`);
  let done = 0;
  const withDomains = await runWithConcurrency(companies, concurrency, async (c) => {
    const { domain, statut } = await guessAndVerifyDomain(c.nom);
    done++;
    process.stdout.write(`\r[${done}/${companies.length}] ${c.nom.slice(0, 40).padEnd(40)} → ${domain ?? 'à compléter'}          `);
    return { ...c, domaine: domain, statutDomaine: statut };
  });
  console.log('\n');
  return withDomains;
}

// ---------------------------------------------------------------------
// Étape 3 — E-mail réellement publié
// ---------------------------------------------------------------------
async function stepFindEmails(companies, concurrency) {
  console.log(`Recherche d'e-mails publiés sur chaque site...`);
  let done = 0;
  const withEmails = await runWithConcurrency(companies, concurrency, async (c) => {
    if (!c.domaine) {
      done++;
      return { ...c, email: null, statutEmail: 'a-completer' };
    }
    const { email, statut } = await findEmailOnWebsite(c.domaine);
    done++;
    process.stdout.write(`\r[${done}/${companies.length}] ${c.domaine ?? '—'} → ${email ?? 'aucun email trouvé'}          `);
    return { ...c, email, statutEmail: statut };
  });
  console.log('\n');
  return withEmails;
}

// ---------------------------------------------------------------------
// Étape 4 — Scan de sécurité (même moteur que bulk-scan.mjs)
// ---------------------------------------------------------------------
async function stepScan(companies, concurrency) {
  const domains = [...new Set(companies.map((c) => c.domaine).filter(Boolean).filter((d) => !CONSUMER_EMAIL_DOMAINS.has(d)))];
  console.log(`Scan de sécurité sur ${domains.length} domaine(s)...`);

  let done = 0;
  const results = await runWithConcurrency(domains, concurrency, async (domain) => {
    try {
      const report = await runFullAudit(domain);
      const detection = detectProviders(report);
      const critical = Object.values(report.results)
        .filter((r) => r.status === 'danger' || r.status === 'error')
        .map((r) => r.label)
        .join(' + ');
      done++;
      process.stdout.write(`\r[${done}/${domains.length}] ${domain} → ${report.score.score}/100          `);
      return {
        Domaine: domain,
        Score: report.score.score,
        'Niveau de risque': report.score.score >= 90 ? 'Excellent' : report.score.score >= 70 ? 'Bon' : report.score.score >= 45 ? 'Moyen' : 'Faible',
        'Protocoles critiques': critical,
        'Hébergement DNS détecté': detection.primaryDns?.label ?? '',
        'Fournisseur e-mail détecté': detection.primaryEmail?.label ?? '',
        Erreur: '',
      };
    } catch (err) {
      done++;
      return { Domaine: domain, Score: -1, 'Niveau de risque': '', 'Protocoles critiques': '', 'Hébergement DNS détecté': '', 'Fournisseur e-mail détecté': '', Erreur: err.message };
    }
  });
  console.log('\n');
  return results.sort((a, b) => (a.Score === -1 ? 1 : b.Score === -1 ? -1 : a.Score - b.Score));
}

// ---------------------------------------------------------------------
// Orchestrateur principal
// ---------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const date = todayPrefix();
  const label = args.out || args.naf || args.rge?.replace(/\s+/g, '-').toLowerCase() || 'prospection';

  let companies;

  if (args.resume) {
    console.log(`Reprise depuis ${args.resume}...`);
    companies = parseCsv(await readFile(args.resume, 'utf-8')).map((r) => ({
      nom: r['nom'], siret: r['siret'], adresse: r['adresse'], ville: r['ville'], codePostal: r['codePostal'],
      domaine: r['domaine'] || null, statutDomaine: r['domaine'] ? 'manuel' : 'a-completer',
    }));
  } else {
    companies = await stepIdentify(args);
    companies = await stepFindDomains(companies, args.concurrency);

    const entreprisesFile = `${date}-entreprises-${label}-${args.departement}.csv`;
    await writeFile(entreprisesFile, toCsv(companies, ['nom', 'siret', 'adresse', 'ville', 'codePostal', 'domaine', 'statutDomaine']), 'utf-8');
    console.log(`Fichier entreprises écrit : ${entreprisesFile}`);

    const missing = companies.filter((c) => !c.domaine).length;
    if (missing > 0) {
      console.log(`\n⚠ ${missing} entreprise(s) sans domaine trouvé automatiquement.`);
      console.log(`Complétez la colonne "domaine" dans ${entreprisesFile}, puis relancez avec :`);
      console.log(`  node scripts/prospect.mjs --resume ${entreprisesFile}\n`);
    }
  }

  companies = await stepFindEmails(companies, args.concurrency ?? 5);
  const contactsFile = `${date}-contacts-${label}${args.departement ? '-' + args.departement : ''}.csv`;
  await writeFile(
    contactsFile,
    toCsv(companies, ['nom', 'siret', 'adresse', 'ville', 'codePostal', 'domaine', 'statutDomaine', 'email', 'statutEmail']),
    'utf-8'
  );
  console.log(`Fichier contacts écrit : ${contactsFile}`);

  if (args.skipScan) {
    console.log('\n--skip-scan activé : pipeline arrêté avant le scan de sécurité.');
    return;
  }

  const scanResults = await stepScan(companies, args.concurrency ?? 5);
  const scanFile = `${date}-resultats-scan-${label}${args.departement ? '-' + args.departement : ''}.csv`;
  await writeFile(
    scanFile,
    toCsv(scanResults, ['Domaine', 'Score', 'Niveau de risque', 'Protocoles critiques', 'Hébergement DNS détecté', 'Fournisseur e-mail détecté', 'Erreur']),
    'utf-8'
  );
  console.log(`Fichier résultats de scan écrit : ${scanFile}`);
  console.log(`\nPour générer les brouillons d'e-mails :`);
  console.log(`  node scripts/generate-emails.mjs ${scanFile}\n`);
}

main().catch((err) => {
  console.error('Erreur fatale :', err);
  process.exit(1);
});

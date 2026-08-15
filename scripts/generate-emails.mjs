#!/usr/bin/env node
/**
 * generate-emails.mjs
 * ------------------------------------------------------------------
 * Lit le CSV produit par bulk-scan.mjs et génère, pour chaque
 * prospect sous le seuil de score choisi, un brouillon d'e-mail
 * personnalisé (nombre de défauts de configuration critiques + liste en clair),
 * prêt à copier-coller.
 *
 * Usage :
 *   node scripts/generate-emails.mjs resultats-scan.csv
 *   node scripts/generate-emails.mjs resultats-scan.csv --out emails.txt --threshold 45
 *
 * Le script ignore automatiquement :
 *   - les lignes en erreur de scan (colonne "Erreur" non vide)
 *   - les domaines sans aucun protocole critique (rien de "choc" à annoncer)
 *   - les domaines au-dessus du seuil de score (par défaut 45, voir bulk-scan.mjs)
 * ------------------------------------------------------------------
 */
import { readFile, writeFile } from 'node:fs/promises';

/** Traduit chaque libellé de protocole (tel qu'écrit par bulk-scan.mjs) en phrase lisible pour un non-technicien. */
const PROTOCOL_PHRASES = {
  'MX': 'aucun serveur de réception d\'e-mails correctement configuré',
  'SPF': 'SPF absent ou mal configuré',
  'DKIM': 'DKIM inactif',
  'DMARC': 'DMARC absent',
  'DNSSEC': 'DNSSEC désactivé',
  'MTA-STS': 'chiffrement TLS non forcé (MTA-STS absent)',
  'TLS-RPT': 'aucune visibilité sur les échecs de chiffrement (TLS-RPT absent)',
  'BIMI': 'logo de marque non configuré (BIMI)',
  'Reverse DNS': 'reverse DNS incohérent',
  'SMTP': 'serveur de messagerie injoignable',
};

function parseArgs(argv) {
  const args = { input: null, out: 'emails-personnalises.txt', threshold: 45 };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') args.out = argv[++i];
    else if (argv[i] === '--threshold') args.threshold = Number(argv[++i]);
    else rest.push(argv[i]);
  }
  args.input = rest[0];
  return args;
}

/** Parseur CSV minimal, compatible avec le format écrit par bulk-scan.mjs (séparateur ';', BOM, champs entre guillemets). */
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
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ';') {
        cells.push(cur);
        cur = '';
      } else {
        cur += c;
      }
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

function buildEmail(row) {
  const domain = row['Domaine'];
  const critical = (row['Protocoles critiques'] || '')
    .split('+')
    .map((s) => s.trim())
    .filter(Boolean);

  const count = critical.length;
  const phrases = critical.map((c) => PROTOCOL_PHRASES[c] || `${c} à corriger`);

  const shown = phrases.slice(0, 3);
  const remaining = phrases.length - shown.length;
  let phraseList;
  if (shown.length === 1) phraseList = shown[0];
  else phraseList = shown.slice(0, -1).join(', ') + ' et ' + shown[shown.length - 1];
  if (remaining > 0) phraseList += ` (et ${remaining} autre${remaining > 1 ? 's' : ''})`;

  const subject = `${count} défaut${count > 1 ? 's' : ''} de configuration critique${count > 1 ? 's' : ''} sur vos e-mails ${domain}`;

  const body = `Bonjour,

J'ai passé votre domaine ${domain} dans un outil d'audit de sécurité e-mail que j'ai développé, et il ressort ${count} défaut${count > 1 ? 's' : ''} de configuration critique${count > 1 ? 's' : ''} sur les protocoles de sécurité de votre messagerie — notamment ${phraseList}.

Concrètement, ça veut souvent dire que vos e-mails professionnels (échanges avec vos clients, devis, confirmations de rendez-vous) ont plus de risques de finir en spam, voire d'être usurpés par des tentatives de phishing sous votre nom de domaine.

Je vous mets le rapport complet en pièce jointe, gratuitement, sans engagement — vous y verrez le détail et les corrections à apporter.

Si vous préférez que je m'en occupe directement plutôt que de le faire vous-même, je propose un accompagnement pour corriger ça en une intervention (généralement réglé en 48h).

À votre disposition si besoin,`;

  return { domain, score: row['Score'], count, subject, body };
}

async function main() {
  const { input, out, threshold } = parseArgs(process.argv.slice(2));
  if (!input) {
    console.error('Usage: node scripts/generate-emails.mjs <resultats-scan.csv> [--out emails.txt] [--threshold 45]');
    process.exit(1);
  }

  const text = await readFile(input, 'utf-8');
  const rows = parseCsv(text);

  const eligible = rows.filter((r) => {
    if (r['Erreur']) return false;
    const score = Number(r['Score']);
    if (Number.isNaN(score) || score > threshold) return false;
    const criticalCount = (r['Protocoles critiques'] || '').split('+').filter((s) => s.trim()).length;
    return criticalCount > 0;
  });

  if (eligible.length === 0) {
    console.log(`Aucun domaine éligible (score ≤ ${threshold} avec au moins un défaut de configuration critique) dans ce fichier.`);
    return;
  }

  const emails = eligible.map(buildEmail);

  const blocks = emails.map((e) => (
    `${'='.repeat(70)}\n` +
    `DOMAINE : ${e.domain}  (score ${e.score}/100, ${e.count} défaut${e.count > 1 ? 's' : ''} de configuration critique${e.count > 1 ? 's' : ''})\n` +
    `${'='.repeat(70)}\n\n` +
    `Objet : ${e.subject}\n\n` +
    `${e.body}\n`
  ));

  await writeFile(out, blocks.join('\n\n'), 'utf-8');

  console.log(`${emails.length} brouillon(s) d'e-mail généré(s) à partir de ${rows.length} ligne(s) du CSV.`);
  console.log(`Écrit dans : ${out}\n`);
  console.log('Aperçu du premier brouillon :\n');
  console.log(blocks[0]);
}

main().catch((err) => {
  console.error('Erreur fatale :', err);
  process.exit(1);
});

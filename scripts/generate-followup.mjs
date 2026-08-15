#!/usr/bin/env node
/**
 * generate-followup.mjs
 * ------------------------------------------------------------------
 * Génère une relance courte (pas une répétition du premier e-mail) à
 * partir du même CSV que generate-emails.mjs. La majorité des
 * réponses en prospection à froid viennent de la relance, pas du
 * premier message — ce script sert justement à ne pas sauter cette
 * étape.
 *
 * Usage :
 *   node scripts/generate-followup.mjs resultats-scan.csv
 *   node scripts/generate-followup.mjs resultats-scan.csv --out relances.txt --threshold 45
 *
 * Astuce : gardez une trace de qui a déjà répondu (manuellement, ou
 * dans une colonne ajoutée à votre CSV) et retirez ces lignes avant
 * de lancer ce script, pour ne relancer que les silencieux.
 * ------------------------------------------------------------------
 */
import { readFile, writeFile } from 'node:fs/promises';

function parseArgs(argv) {
  const args = { input: null, out: 'relances.txt', threshold: 45 };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') args.out = argv[++i];
    else if (argv[i] === '--threshold') args.threshold = Number(argv[++i]);
    else rest.push(argv[i]);
  }
  args.input = rest[0];
  return args;
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

function buildFollowup(row) {
  const domain = row['Domaine'];
  const subject = `Relance — audit de sécurité e-mail ${domain}`;

  const body = `Bonjour,

Je me permets de revenir vers vous suite à mon e-mail du ${'[date du premier envoi]'} concernant l'audit de sécurité e-mail de ${domain} et le rapport joint.

Je me doute que ce n'était peut-être pas le bon moment, ou que le message est passé inaperçu — pas de souci. Si le sujet vous intéresse, je reste disponible pour en discuter, ou pour vous laisser simplement le rapport pour référence future.

Si en revanche ce n'est pas d'actualité pour vous, dites-le-moi et je ne vous solliciterai plus à ce sujet.

Bonne journée,`;

  return { domain, score: row['Score'], subject, body };
}

async function main() {
  const { input, out, threshold } = parseArgs(process.argv.slice(2));
  if (!input) {
    console.error('Usage: node scripts/generate-followup.mjs <resultats-scan.csv> [--out relances.txt] [--threshold 45]');
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

  const followups = eligible.map(buildFollowup);

  const blocks = followups.map((e) => (
    `${'='.repeat(70)}\n` +
    `DOMAINE : ${e.domain}  (score ${e.score}/100)\n` +
    `${'='.repeat(70)}\n\n` +
    `Objet : ${e.subject}\n\n` +
    `${e.body}\n`
  ));

  await writeFile(out, blocks.join('\n\n'), 'utf-8');

  console.log(`${followups.length} relance(s) générée(s) à partir de ${rows.length} ligne(s) du CSV.`);
  console.log(`Écrit dans : ${out}\n`);
  console.log('N\'oubliez pas de remplacer [date du premier envoi] dans chaque brouillon, et de retirer les domaines qui ont déjà répondu.\n');
  console.log('Aperçu du premier brouillon :\n');
  console.log(blocks[0]);
}

main().catch((err) => {
  console.error('Erreur fatale :', err);
  process.exit(1);
});

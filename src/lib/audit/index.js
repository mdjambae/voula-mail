/**
 * index.js — Orchestrateur du moteur d'audit.
 *
 * Chaque module est totalement indépendant (voir ./spf.js, ./dkim.js,
 * etc.) : l'orchestrateur se contente de les exécuter en parallèle,
 * de remonter la progression et d'agréger les résultats.
 */
import { auditSPF } from './spf.js';
import { auditDKIM } from './dkim.js';
import { auditDMARC } from './dmarc.js';
import { auditDNSSEC } from './dnssec.js';
import { auditMtaSts } from './mtaSts.js';
import { auditTlsRpt } from './tlsRpt.js';
import { auditBIMI } from './bimi.js';
import { auditMX } from './mx.js';
import { auditReverseDNS } from './reverseDns.js';
import { auditSMTP } from './smtp.js';
import { auditNS } from './ns.js';
import { computeGlobalScore } from './scoring.js';
import { domainExists } from '../../services/dohClient.js';

export const AUDIT_MODULES = [
  { id: 'mx', label: 'MX', weight: 1 },
  { id: 'spf', label: 'SPF', weight: 1 },
  { id: 'dkim', label: 'DKIM', weight: 3 },
  { id: 'dmarc', label: 'DMARC', weight: 1 },
  { id: 'dnssec', label: 'DNSSEC', weight: 1 },
  { id: 'mta-sts', label: 'MTA-STS', weight: 1 },
  { id: 'tls-rpt', label: 'TLS-RPT', weight: 1 },
  { id: 'bimi', label: 'BIMI', weight: 1 },
  { id: 'reverse-dns', label: 'Reverse DNS', weight: 1 },
  { id: 'smtp', label: 'SMTP', weight: 1 },
];

const TOTAL_WEIGHT = AUDIT_MODULES.reduce((a, m) => a + m.weight, 0);

/**
 * Lance l'audit complet d'un domaine.
 * @param {string} domain
 * @param {(progress:{percent:number, moduleId:string, label:string}) => void} onProgress
 */
export async function runFullAudit(domain, onProgress) {
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  onProgress?.({ percent: 0, moduleId: 'exists', label: 'Vérification du domaine' });
  if (!(await domainExists(cleanDomain))) {
    throw new Error(`Le domaine « ${cleanDomain} » n'existe pas ou n'est pas enregistré dans le DNS.`);
  }

  const results = {};
  let doneWeight = 0;

  const report = (moduleId, label) => {
    doneWeight += AUDIT_MODULES.find((m) => m.id === moduleId)?.weight ?? 1;
    onProgress?.({ percent: Math.min(99, Math.round((doneWeight / TOTAL_WEIGHT) * 100)), moduleId, label });
  };

  const infra = {};
  const tasks = [
    auditMX(cleanDomain).then((r) => (results.mx = r, report('mx', 'MX'), r)),
    auditSPF(cleanDomain).then((r) => (results.spf = r, report('spf', 'SPF'), r)),
    auditDKIM(cleanDomain).then((r) => (results.dkim = r, report('dkim', 'DKIM'), r)),
    auditDMARC(cleanDomain).then((r) => (results.dmarc = r, report('dmarc', 'DMARC'), r)),
    auditDNSSEC(cleanDomain).then((r) => (results.dnssec = r, report('dnssec', 'DNSSEC'), r)),
    auditMtaSts(cleanDomain).then((r) => (results['mta-sts'] = r, report('mta-sts', 'MTA-STS'), r)),
    auditTlsRpt(cleanDomain).then((r) => (results['tls-rpt'] = r, report('tls-rpt', 'TLS-RPT'), r)),
    auditBIMI(cleanDomain).then((r) => (results.bimi = r, report('bimi', 'BIMI'), r)),
    auditReverseDNS(cleanDomain).then((r) => (results['reverse-dns'] = r, report('reverse-dns', 'Reverse DNS'), r)),
    auditSMTP(cleanDomain).then((r) => (results.smtp = r, report('smtp', 'SMTP'), r)),
    auditNS(cleanDomain).then((r) => (infra.ns = r.records, r)),
  ];

  await Promise.allSettled(tasks);

  const scoreData = computeGlobalScore(results);
  onProgress?.({ percent: 100, moduleId: 'done', label: 'Terminé' });

  return {
    domain: cleanDomain,
    scannedAt: new Date().toISOString(),
    results,
    infra,
    score: scoreData,
  };
}

export { computeGlobalScore } from './scoring.js';

import { Badge, Alert } from '../ui';
import { statusOf } from './statusConfig';

function RecordBlock({ label, value }) {
  if (!value) return null;
  return (
    <div className="rounded-xl bg-black/30 border border-white/[0.06] p-4">
      <p className="text-xs text-mist-400 mb-1.5">{label}</p>
      <code className="text-[13px] font-mono text-primary-200 break-all leading-relaxed">{value}</code>
    </div>
  );
}

function KeyValueGrid({ rows }) {
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {rows.filter((r) => r.value !== undefined && r.value !== null && r.value !== '').map((r) => (
        <div key={r.label}>
          <dt className="text-xs text-mist-400">{r.label}</dt>
          <dd className="text-sm text-mist-100 font-medium mt-0.5">{String(r.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function moduleSpecificDetails(result) {
  switch (result.id) {
    case 'spf':
      return (
        <>
          <RecordBlock label="Enregistrement SPF" value={result.record} />
          <KeyValueGrid
            rows={[
              { label: 'Mécanismes', value: result.mechanisms?.join('  ') },
              { label: 'Lookups DNS', value: `${result.dnsLookupCount} / 10` },
              { label: 'Qualifieur all', value: result.allQualifier?.label },
              { label: 'Enregistrements multiples', value: result.multipleRecords ? 'Oui (invalide)' : 'Non' },
            ]}
          />
        </>
      );
    case 'dmarc':
      return (
        <>
          <RecordBlock label="Enregistrement DMARC" value={result.record} />
          <KeyValueGrid
            rows={[
              { label: 'Politique (p=)', value: result.policy?.label },
              { label: 'Politique sous-domaines (sp=)', value: result.subdomainPolicy?.label },
              { label: 'Application (pct=)', value: `${result.percentage}%` },
              { label: 'Alignement SPF', value: result.alignment?.spf },
              { label: 'Alignement DKIM', value: result.alignment?.dkim },
              { label: 'Rapports agrégés (rua)', value: result.aggregateReports?.join(', ') || '—' },
            ]}
          />
        </>
      );
    case 'dkim':
      return (
        <div className="space-y-3">
          <p className="text-xs text-mist-400">
            {result.selectorsFound?.length} sélecteur(s) actif(s) sur {result.selectorsScanned} testés
          </p>
          {result.selectorsFound?.map((s) => (
            <div key={s.selector} className="rounded-xl bg-black/30 border border-white/[0.06] p-4">
              <div className="flex items-center justify-between mb-2">
                <code className="text-sm font-mono text-primary-200">{s.selector}._domainkey</code>
                <Badge variant={s.keyLength >= 2048 ? 'ok' : 'warning'}>{s.keyLength ?? '?'} bits</Badge>
              </div>
              <KeyValueGrid
                rows={[
                  { label: 'Type de clé', value: s.keyType },
                  { label: 'Algorithme(s) de hash', value: s.hashAlgorithms?.join(', ') },
                  { label: 'Fournisseur probable', value: s.likelyProviders?.join(', ') },
                  { label: 'Révoquée', value: s.revoked ? 'Oui' : 'Non' },
                ]}
              />
            </div>
          ))}
        </div>
      );
    case 'dnssec':
      return (
        <KeyValueGrid
          rows={[
            { label: 'Signé', value: result.signed ? 'Oui' : 'Non' },
            { label: 'Chaîne authentifiée (AD)', value: result.authenticatedData ? 'Oui' : 'Non' },
            { label: 'Enregistrements DS', value: result.dsRecords?.length },
            { label: 'Enregistrements DNSKEY', value: result.dnskeyRecords?.length },
          ]}
        />
      );
    case 'mta-sts':
      return (
        <>
          <KeyValueGrid
            rows={[
              { label: 'Enregistrement DNS', value: result.dnsRecordPresent ? 'Présent' : 'Absent' },
              { label: 'Politique accessible', value: result.policyReachable ? 'Oui' : 'Non vérifiable' },
              { label: 'Mode', value: result.policyMode },
              { label: 'Hôtes MX autorisés', value: result.mxEntries?.join(', ') },
            ]}
          />
        </>
      );
    case 'tls-rpt':
      return (
        <>
          <RecordBlock label="Enregistrement TLS-RPT" value={result.record} />
          <KeyValueGrid rows={[{ label: 'Adresses de rapport', value: result.reportUris?.join(', ') }]} />
        </>
      );
    case 'bimi':
      return (
        <>
          <RecordBlock label="Enregistrement BIMI" value={result.record} />
          <KeyValueGrid
            rows={[
              { label: 'URL du logo', value: result.logoUrl },
              { label: 'Certificat VMC', value: result.vmcUrl ? 'Présent' : 'Absent' },
            ]}
          />
        </>
      );
    case 'mx':
      return (
        <div className="space-y-2">
          {result.records?.map((mx) => (
            <div key={mx.host} className="flex items-center justify-between rounded-xl bg-black/30 border border-white/[0.06] px-4 py-3">
              <code className="text-sm font-mono text-primary-200">{mx.host}</code>
              <Badge variant="neutral">priorité {mx.priority}</Badge>
            </div>
          ))}
        </div>
      );
    case 'reverse-dns':
      return (
        <div className="space-y-2">
          {result.entries?.map((e, i) => (
            <div key={i} className="rounded-xl bg-black/30 border border-white/[0.06] p-4">
              <KeyValueGrid
                rows={[
                  { label: 'Hôte MX', value: e.host },
                  { label: 'IP', value: e.ip },
                  { label: 'PTR', value: e.ptrRecords?.join(', ') || 'Aucun' },
                ]}
              />
            </div>
          ))}
        </div>
      );
    case 'smtp':
      return (
        <div className="space-y-2">
          {result.hostsChecked?.map((h) => (
            <div key={h.host} className="flex items-center justify-between rounded-xl bg-black/30 border border-white/[0.06] px-4 py-3">
              <code className="text-sm font-mono text-primary-200">{h.host}</code>
              <Badge variant={h.resolvable ? 'ok' : 'danger'}>{h.resolvable ? 'Résolu' : 'Injoignable'}</Badge>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

export function DetailPanel({ result, tailoredStep }) {
  if (!result) return null;
  const { label, variant } = statusOf(result.status);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold text-mist-50">{result.label}</h3>
          <p className="text-sm text-mist-400 mt-1">{result.fullName}</p>
        </div>
        <Badge variant={variant} dot>{label}</Badge>
      </div>

      {moduleSpecificDetails(result)}

      {result.issues?.length > 0 && (
        <div className="space-y-2">
          {result.issues.map((issue, i) => (
            <Alert key={i} variant={result.status === 'danger' ? 'danger' : 'warning'}>
              {issue}
            </Alert>
          ))}
        </div>
      )}

      {result.recommendations?.length > 0 && (
        <div className="space-y-2">
          {result.recommendations.map((rec, i) => (
            <Alert key={i} variant="info" title={i === 0 ? 'Recommandations' : undefined}>
              {rec}
            </Alert>
          ))}
        </div>
      )}

      {tailoredStep && (
        <Alert variant="primary" title="Étape spécifique à votre fournisseur">
          {tailoredStep}
        </Alert>
      )}

      {result.status === 'ok' && !result.issues?.length && (
        <Alert variant="ok" title="Aucune anomalie détectée">
          Ce protocole est correctement configuré selon les bonnes pratiques actuelles.
        </Alert>
      )}
    </div>
  );
}

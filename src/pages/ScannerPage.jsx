import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, RotateCcw, ShieldAlert, Search } from 'lucide-react';
import { useScan } from '../context/ScanContext';
import { Button, Progress, ScoreRing, EmptyState, Spinner, Card, Alert } from '../components/ui';
import { DomainSearch } from '../components/landing/DomainSearch';
import { ModuleCard } from '../components/results/ModuleCard';
import { DetailPanel } from '../components/results/DetailPanel';
import { ScoreBreakdown } from '../components/results/ScoreBreakdown';
import { ProviderInsights } from '../components/results/ProviderInsights';
import { downloadPdfReport } from '../lib/pdf/pdfReport';
import { AUDIT_MODULES } from '../lib/audit/index.js';
import { detectProviders, buildTailoredStep } from '../lib/audit/providerDetection.js';

export default function ScannerPage() {
  const [searchParams] = useSearchParams();
  const { status, progress, report, error, startScan, reset } = useScan();
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const domain = searchParams.get('domaine');
    if (domain && status === 'idle') {
      startScan(domain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (report && !activeModuleId) {
      setActiveModuleId('dmarc');
    }
  }, [report, activeModuleId]);

  const detection = useMemo(() => (report ? detectProviders(report) : null), [report]);
  const tailoredStep = useMemo(
    () => (detection && activeModuleId ? buildTailoredStep(detection, activeModuleId) : null),
    [detection, activeModuleId]
  );

  const handleDownload = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      await downloadPdfReport(report);
    } finally {
      setDownloading(false);
    }
  };

  if (status === 'idle') {
    return (
      <div className="container-page py-24">
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Lancez votre premier audit"
          description="Entrez un nom de domaine pour analyser sa configuration SPF, DKIM, DMARC et plus encore."
          action={<div className="w-full max-w-md"><DomainSearch autoFocus /></div>}
        />
      </div>
    );
  }

  if (status === 'scanning') {
    return (
      <div className="container-page py-24 flex flex-col items-center text-center">
        <div className="relative h-24 w-24 mb-8">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulseGlow" />
          <div className="relative h-24 w-24 rounded-full glass-strong flex items-center justify-center">
            <Spinner size={32} />
          </div>
        </div>
        <h2 className="font-display text-2xl font-semibold text-mist-50">Analyse en cours…</h2>
        <p className="text-sm text-mist-400 mt-2 mb-8">{progress.label || 'Interrogation des enregistrements DNS'}</p>
        <div className="w-full max-w-sm">
          <Progress value={progress.percent} showValue={false} />
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container-page py-24">
        <EmptyState
          icon={<ShieldAlert className="h-6 w-6" />}
          title="L'audit a rencontré un problème"
          description={error}
          action={<Button variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={reset}>Réessayer</Button>}
        />
      </div>
    );
  }

  if (!report) return null;

  const activeResult = activeModuleId ? report.results[activeModuleId] : null;
  const erroredCount = Object.values(report.results).filter((r) => r.status === 'error').length;

  return (
    <div className="container-page py-16">
      {erroredCount > 0 && (
        <Alert variant="warning" className="mb-8" title="Scan incomplet">
          {erroredCount} module{erroredCount > 1 ? 's' : ''} n'{erroredCount > 1 ? "ont" : "a"} pas pu être vérifié{erroredCount > 1 ? 's' : ''} (erreur de résolution DNS temporaire) : le score ci-dessous ne reflète pas encore un audit complet. Relancez un nouveau scan pour un résultat fiable.
        </Alert>
      )}
      {/* En-tête résultats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
        <div className="flex items-center gap-6">
          <ScoreRing score={report.score.score} size={130} strokeWidth={10} />
          <div>
            <p className="text-sm text-mist-400 mb-1">Rapport d'audit pour</p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-mist-50">{report.domain}</h1>
            <p className="text-xs text-mist-400 mt-1.5 font-mono">
              {new Date(report.scannedAt).toLocaleString('fr-FR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={reset}>
            Nouveau scan
          </Button>
          <Button variant="primary" icon={<Download className="h-4 w-4" />} isLoading={downloading} onClick={handleDownload}>
            Rapport PDF
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8">
        {/* Colonne gauche : modules + score */}
        <div className="space-y-8">
          <div className="grid sm:grid-cols-2 gap-3">
            {AUDIT_MODULES.map((m) => (
              <ModuleCard
                key={m.id}
                result={report.results[m.id]}
                onOpen={setActiveModuleId}
                active={activeModuleId === m.id}
              />
            ))}
          </div>

          <Card>
            <h3 className="font-display font-semibold text-mist-50 mb-4">Détail du score</h3>
            <ScoreBreakdown breakdown={report.score.breakdown} />
          </Card>

          <ProviderInsights detection={detection} />
        </div>

        {/* Colonne droite : détail du module sélectionné */}
        <Card className="lg:sticky lg:top-24 h-fit">
          {activeResult ? (
            <DetailPanel result={activeResult} tailoredStep={tailoredStep} />
          ) : (
            <EmptyState title="Sélectionnez un module" description="Cliquez sur un module à gauche pour voir le détail technique." />
          )}
        </Card>
      </div>
    </div>
  );
}

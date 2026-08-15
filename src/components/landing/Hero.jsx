import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { DomainSearch } from './DomainSearch';

const CHECKS = [
  { label: 'SPF', record: 'v=spf1 include:_spf.voula.tech -all' },
  { label: 'DKIM', record: 'selector1._domainkey  →  clé RSA 2048 bits' },
  { label: 'DMARC', record: 'p=reject; rua=mailto:dmarc@voula.tech' },
  { label: 'DNSSEC', record: 'AD=1  →  chaîne de confiance validée' },
  { label: 'MTA-STS', record: 'mode: enforce' },
  { label: 'BIMI', record: 'logo de marque publié' },
];

function ScanTerminal() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= CHECKS.length) {
      const resetTimer = setTimeout(() => setVisibleCount(0), 1800);
      return () => clearTimeout(resetTimer);
    }
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), 480);
    return () => clearTimeout(timer);
  }, [visibleCount]);

  return (
    <div className="relative w-full max-w-md mx-auto rounded-2xl glass-strong shadow-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="ml-2 text-xs font-mono text-mist-400">audit@voula.tech — scan en direct</span>
      </div>
      <div className="p-5 font-mono text-[13px] leading-7 min-h-[240px]">
        {CHECKS.map((check, i) => {
          const shown = i < visibleCount;
          return (
            <div
              key={check.label}
              className="flex items-baseline gap-2 transition-opacity duration-300"
              style={{ opacity: shown ? 1 : 0.15 }}
            >
              <span className={shown ? 'text-success' : 'text-mist-400'}>{shown ? '✓' : '·'}</span>
              <span className="text-mist-200 w-16 shrink-0">{check.label}</span>
              <span className="text-mist-400 truncate">{shown ? check.record : '···········'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32">
      <div className="absolute inset-0 bg-hero-halo pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-full bg-grid-fade pointer-events-none" aria-hidden="true" />

      <div className="container-page relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fadeUp">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs text-mist-300 mb-6">
              <ShieldCheck className="h-3.5 w-3.5 text-primary-400" />
              Utilisé par des équipes qui prennent l'e-mail au sérieux
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold tracking-tight leading-[1.08] text-mist-50">
              Votre domaine est-il vraiment
              <span className="text-gradient"> protégé contre le spoofing</span> ?
            </h1>

            <p className="mt-6 text-lg text-mist-300 max-w-xl leading-relaxed">
              VOULA Mail audite en quelques secondes votre configuration SPF, DKIM, DMARC,
              DNSSEC, MTA-STS, TLS-RPT et BIMI — et vous livre un diagnostic technique complet,
              pas juste un « OK ».
            </p>

            <div className="mt-8 max-w-xl">
              <DomainSearch autoFocus />
              <p className="mt-3 text-xs text-mist-400">
                Aucune inscription requise pour le scan gratuit. Résultats en direct depuis les
                résolveurs DNS publics.
              </p>
            </div>

            <div className="mt-10 flex items-center gap-8 text-sm text-mist-400">
              <div>
                <span className="block font-display text-2xl font-semibold text-mist-50">10 modules</span>
                indépendants
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <span className="block font-display text-2xl font-semibold text-mist-50">60+</span>
                sélecteurs DKIM testés
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <span className="block font-display text-2xl font-semibold text-mist-50">&lt; 10s</span>
                par audit complet
              </div>
            </div>
          </div>

          <div className="animate-fadeUp" style={{ animationDelay: '120ms' }}>
            <ScanTerminal />
          </div>
        </div>
      </div>
    </section>
  );
}

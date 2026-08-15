import { ShieldCheck, EyeOff, Server, Timer } from 'lucide-react';

const POINTS = [
  {
    icon: EyeOff,
    title: 'Aucune donnée sensible collectée',
    description: "Le scan gratuit n'interroge que des enregistrements DNS publics. Aucun accès à votre boîte mail n'est requis.",
  },
  {
    icon: Server,
    title: 'Résolveurs DNS publics et fiables',
    description: 'Cloudflare et Google DNS en résolution primaire et secondaire, avec bascule automatique en cas d\'indisponibilité.',
  },
  {
    icon: Timer,
    title: 'Résultats en direct',
    description: "Chaque audit interroge le DNS en temps réel : jamais de résultat mis en cache au-delà de 60 secondes.",
  },
];

export function SecuritySection() {
  return (
    <section id="securite" className="py-24 sm:py-32 relative overflow-hidden scroll-mt-20">
      <div className="container-page">
        <div className="rounded-3xl glass-strong p-10 sm:p-14 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-pulseGlow" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-primary-400" />
              <span className="text-sm font-medium text-primary-400">Sécurité & confidentialité</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-mist-50 tracking-tight max-w-xl">
              Conçu pour être audité, pas pour être un risque de plus
            </h2>

            <div className="mt-12 grid sm:grid-cols-3 gap-8">
              {POINTS.map((p) => (
                <div key={p.title}>
                  <div className="h-10 w-10 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center mb-4">
                    <p.icon className="h-4.5 w-4.5 text-mist-200" />
                  </div>
                  <h3 className="font-display font-semibold text-mist-50 mb-2 text-sm">{p.title}</h3>
                  <p className="text-sm text-mist-400 leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

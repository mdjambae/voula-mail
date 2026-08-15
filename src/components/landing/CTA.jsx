import { DomainSearch } from './DomainSearch';

export function CTA() {
  return (
    <section id="tarifs" className="py-24 sm:py-32 scroll-mt-20">
      <div className="container-page">
        <div className="relative rounded-3xl overflow-hidden glass-strong p-10 sm:p-16 text-center">
          <div className="absolute inset-0 bg-hero-halo opacity-70 pointer-events-none" aria-hidden="true" />
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-mist-50 tracking-tight max-w-xl mx-auto">
              Auditez votre domaine en moins de 10 secondes
            </h2>
            <p className="mt-4 text-mist-300 max-w-lg mx-auto">
              Gratuit, sans inscription. Le rapport PDF complet et la vérification par e-mail
              réel sont disponibles en offre Premium.
            </p>
            <div className="mt-8 max-w-md mx-auto">
              <DomainSearch />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

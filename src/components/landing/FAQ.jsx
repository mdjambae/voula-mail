import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

const FAQS = [
  {
    q: "Le scan gratuit accède-t-il à ma boîte mail ?",
    a: "Non. Le scan gratuit interroge uniquement les enregistrements DNS publics de votre domaine (SPF, DKIM, DMARC, etc.). Aucune authentification ni accès à votre messagerie n'est requis.",
  },
  {
    q: "Pourquoi tester autant de sélecteurs DKIM ?",
    a: "La plupart des outils se limitent à 2 ou 3 sélecteurs (souvent \"default\"). VOULA Mail interroge plus de 60 sélecteurs issus des principaux fournisseurs d'envoi (Google, Microsoft, Mailgun, SendGrid, Brevo, OVH, etc.) pour ne rien manquer.",
  },
  {
    q: "Quelle est la différence entre softfail et fail strict en SPF ?",
    a: "Un mécanisme ~all (softfail) signale les messages non conformes sans forcément les bloquer, tandis que -all (fail strict) demande explicitement leur rejet. VOULA Mail recommande -all une fois vos expéditeurs légitimes validés.",
  },
  {
    q: "Qu'est-ce que la vérification par e-mail réel (Premium) ?",
    a: "Cette fonctionnalité génère une adresse d'audit jetable. Vous lui envoyez un e-mail depuis votre système d'envoi habituel, et VOULA Mail analyse la signature DKIM réellement produite pour confirmer que votre configuration fonctionne en conditions réelles, pas seulement sur le papier.",
  },
  {
    q: "Le rapport PDF est-il utilisable pour un client ?",
    a: "Oui. Le rapport reprend l'identité visuelle VOULA Mail (logo, couleurs, mise en page) et inclut un score, un résumé exécutif, le détail technique par protocole et des recommandations priorisées.",
  },
];

function FAQItem({ q, a, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.07] py-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left gap-4"
        aria-expanded={open}
      >
        <span className="font-medium text-mist-50 text-sm sm:text-base">{q}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-mist-400 transition-transform duration-300', open && 'rotate-180')} />
      </button>
      <div
        className={cn('grid transition-all duration-300 ease-out', open ? 'grid-rows-[1fr] mt-3' : 'grid-rows-[0fr]')}
        style={{ display: 'grid' }}
      >
        <div className="overflow-hidden">
          <p className="text-sm text-mist-400 leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}

export function FAQ() {
  return (
    <section id="faq" className="py-24 sm:py-32 scroll-mt-20">
      <div className="container-page max-w-3xl">
        <div className="mb-12">
          <span className="text-sm font-medium text-primary-400">Questions fréquentes</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-mist-50 tracking-tight">
            Tout ce qu'il faut savoir
          </h2>
        </div>
        <div>
          {FAQS.map((f, i) => (
            <FAQItem key={f.q} {...f} defaultOpen={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

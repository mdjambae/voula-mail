import { KeyRound, ShieldCheck, FileSignature, Lock, RadioTower, BadgeCheck } from 'lucide-react';
import { Card } from '../ui';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'SPF & DMARC en profondeur',
    description:
      "Détection des politiques strictes, softfail et neutral, alignement DMARC, pourcentage d'application et adresses de rapport.",
  },
  {
    icon: KeyRound,
    title: 'DKIM multi-sélecteurs',
    description:
      'Plus de 60 sélecteurs testés automatiquement (Google, Mailgun, SendGrid, Brevo, OVH...) — jamais limité à "default".',
  },
  {
    icon: Lock,
    title: 'DNSSEC & MTA-STS',
    description: "Vérification de la chaîne de confiance DNS et du chiffrement TLS forcé sur vos échanges SMTP.",
  },
  {
    icon: RadioTower,
    title: 'TLS-RPT & Reverse DNS',
    description: 'Visibilité sur les échecs TLS entrants et cohérence des enregistrements PTR de vos serveurs MX.',
  },
  {
    icon: BadgeCheck,
    title: 'BIMI',
    description: "Affichage du logo de marque dans les boîtes de réception compatibles, avec vérification du certificat VMC.",
  },
  {
    icon: FileSignature,
    title: 'Rapport PDF professionnel',
    description: "Un rapport prêt à envoyer à un client : score circulaire, résumé exécutif, recommandations et QR code.",
  },
];

export function Features() {
  return (
    <section id="fonctionnalites" className="py-24 sm:py-32 scroll-mt-20">
      <div className="container-page">
        <div className="max-w-2xl mb-16">
          <span className="text-sm font-medium text-primary-400">Moteur d'audit</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-mist-50 tracking-tight">
            Un diagnostic technique, pas un feu vert générique
          </h2>
          <p className="mt-4 text-mist-300 leading-relaxed">
            Chaque protocole est vérifié par un module indépendant, avec le détail des
            enregistrements DNS trouvés — pour comprendre exactement ce qui doit être corrigé.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <Card key={f.title} hover className="animate-fadeUp" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary-400/20 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary-400" />
              </div>
              <h3 className="font-display font-semibold text-mist-50 mb-2">{f.title}</h3>
              <p className="text-sm text-mist-400 leading-relaxed">{f.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

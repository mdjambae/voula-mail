import { Link } from 'react-router-dom';
import { Logo } from '../Logo';
import { Github, Twitter, Linkedin } from 'lucide-react';

const COLUMNS = [
  {
    title: 'Produit',
    links: [
      { label: 'Scanner un domaine', to: '/scanner' },
      { label: 'Fonctionnalités', to: '/#fonctionnalites' },
      { label: 'Sécurité', to: '/#securite' },
      { label: 'Tarifs', to: '/#tarifs' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Documentation SPF/DKIM/DMARC', to: '/#faq' },
      { label: 'FAQ', to: '/#faq' },
      { label: 'Statut du service', to: '/#' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'Confidentialité', to: '/confidentialite' },
      { label: 'Conditions d\'utilisation', to: '/conditions' },
      { label: 'Contact', to: '/contact' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] mt-24">
      <div className="container-page py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-mist-400 max-w-xs leading-relaxed">
              Audit professionnel de la sécurité de vos e-mails. SPF, DKIM, DMARC, DNSSEC,
              MTA-STS, TLS-RPT et BIMI, analysés en un seul scan.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="h-9 w-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-mist-400 hover:text-mist-50 hover:border-primary-400/40 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-mist-50 mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-mist-400 hover:text-mist-50 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-mist-400">© {new Date().getFullYear()} VOULA Mail. Tous droits réservés.</p>
          <p className="text-xs text-mist-400">Conçu pour la confiance, la sécurité et la conformité e-mail.</p>
        </div>
      </div>
    </footer>
  );
}

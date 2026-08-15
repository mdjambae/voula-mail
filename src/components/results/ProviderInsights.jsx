import { Server, Mail, MapPin } from 'lucide-react';
import { Card, Badge } from '../ui';

function ConfidenceBadge({ confidence }) {
  if (confidence === 'high') return <Badge variant="ok">Détection fiable</Badge>;
  if (confidence === 'medium') return <Badge variant="primary">Détection probable</Badge>;
  return <Badge variant="neutral">Détection générique</Badge>;
}

export function ProviderInsights({ detection }) {
  if (!detection) return null;
  const { primaryEmail, primaryDns } = detection;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-4 w-4 text-primary-400" />
        <h3 className="font-display font-semibold text-mist-50">Infrastructure détectée</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary-400/20 flex items-center justify-center shrink-0">
            <Server className="h-4 w-4 text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-mist-100">Hébergement DNS</p>
              <ConfidenceBadge confidence={primaryDns.confidence} />
            </div>
            <p className="text-sm text-mist-300 mt-0.5">{primaryDns.label}</p>
            {primaryDns.guide && (
              <p className="text-xs text-mist-400 mt-1.5 leading-relaxed">
                {primaryDns.guide.login} {primaryDns.guide.navigate}
              </p>
            )}
          </div>
        </div>

        {primaryEmail && (
          <div className="flex items-start gap-3 pt-4 border-t border-white/[0.06]">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary-400/20 flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4 text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-mist-100">Service e-mail détecté</p>
                <ConfidenceBadge confidence={primaryEmail.confidence} />
              </div>
              <p className="text-sm text-mist-300 mt-0.5">{primaryEmail.label}</p>
              <p className="text-xs text-mist-400 mt-1.5">
                Les recommandations ci-contre incluent, quand elles existent, les étapes propres à ce fournisseur.
              </p>
            </div>
          </div>
        )}

        {!primaryEmail && (
          <p className="text-xs text-mist-400 pt-4 border-t border-white/[0.06]">
            Aucun fournisseur de messagerie reconnu dans notre base — les recommandations restent génériques mais restent applicables chez n'importe quel hébergeur.
          </p>
        )}
      </div>
    </Card>
  );
}

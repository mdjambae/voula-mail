import { useState } from 'react';
import { Mail, Copy, Check, Sparkles } from 'lucide-react';
import { Button, Card, Badge, Alert, Input } from '../components/ui';
import { requestAuditAddress, pollAuditStatus } from '../services/premiumVerification';

export default function PremiumPage() {
  const [domain, setDomain] = useState('');
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!domain.trim()) return;
    setLoading(true);
    try {
      const s = await requestAuditAddress(domain.trim());
      setSession(s);
      const st = await pollAuditStatus(s.sessionId);
      setStatus(st);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!session) return;
    navigator.clipboard?.writeText(session.auditAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="container-page py-20 max-w-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary-400" />
        <span className="text-sm font-medium text-primary-400">Fonctionnalité Premium</span>
      </div>
      <h1 className="font-display text-3xl font-semibold text-mist-50 tracking-tight mb-3">
        Vérification par e-mail réel
      </h1>
      <p className="text-mist-300 leading-relaxed mb-10">
        Générez une adresse d'audit jetable, envoyez-lui un e-mail depuis votre système
        d'envoi habituel, et VOULA Mail analysera la signature DKIM produite en conditions
        réelles — alignement DMARC, algorithme, longueur de clé et validité cryptographique.
      </p>

      {!session ? (
        <Card>
          <form onSubmit={handleGenerate} className="space-y-4">
            <label className="text-sm text-mist-300">Domaine à vérifier</label>
            <Input
              icon={<Mail className="h-4 w-4" />}
              placeholder="votredomaine.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" isLoading={loading}>
              Générer une adresse d'audit
            </Button>
          </form>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <p className="text-sm text-mist-400 mb-3">Envoyez un e-mail depuis {session.domain} vers :</p>
            <div className="flex items-center gap-3 rounded-xl bg-black/30 border border-white/[0.06] p-4">
              <code className="flex-1 text-primary-200 font-mono text-sm">{session.auditAddress}</code>
              <Button variant="ghost" size="sm" onClick={handleCopy} icon={copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}>
                {copied ? 'Copié' : 'Copier'}
              </Button>
            </div>
            <p className="text-xs text-mist-400 mt-3">
              Cette adresse expire à {new Date(session.expiresAt).toLocaleTimeString('fr-FR')}.
            </p>
          </Card>

          <Card className="flex items-center justify-between">
            <div>
              <p className="text-sm text-mist-200 font-medium">Statut de la vérification</p>
              <p className="text-xs text-mist-400 mt-0.5">{status?.message || 'En attente de réception…'}</p>
            </div>
            <Badge variant={status?.status === 'verified' ? 'ok' : 'neutral'} dot>
              {status?.status === 'verified' ? 'Vérifié' : 'En attente'}
            </Badge>
          </Card>

          {status?.mocked && (
            <Alert variant="info" title="Backend non connecté">
              L'interface est entièrement fonctionnelle. La réception réelle des e-mails et
              l'analyse cryptographique DKIM nécessitent l'activation du service backend
              VOULA (voir <code className="font-mono">src/services/premiumVerification.js</code>).
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}

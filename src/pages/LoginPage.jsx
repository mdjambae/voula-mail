import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button, Input, Card, Alert } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex items-center justify-center py-16 overflow-hidden">
      <div className="absolute inset-0 bg-hero-halo opacity-60 pointer-events-none" aria-hidden="true" />
      <Card className="relative w-full max-w-md p-8" glass>
        <div className="flex justify-center mb-8">
          <Link to="/"><Logo markSize={34} /></Link>
        </div>
        <h1 className="font-display text-xl font-semibold text-mist-50 text-center mb-1">
          {mode === 'login' ? 'Content de vous revoir' : 'Créer votre compte'}
        </h1>
        <p className="text-sm text-mist-400 text-center mb-6">
          {mode === 'login'
            ? "Connectez-vous pour accéder à vos rapports d'audit."
            : 'Créez un compte pour sauvegarder vos audits et accéder aux fonctionnalités Premium.'}
        </p>

        <Alert variant="info" className="mb-6">
          Démonstration : aucun backend d'authentification n'est encore connecté. Toute adresse e-mail est acceptée ; la session reste locale à ce navigateur.
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            icon={<Mail className="h-4 w-4" />}
            placeholder="vous@entreprise.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            icon={<Lock className="h-4 w-4" />}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === 'register' ? 8 : undefined}
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" className="w-full" isLoading={loading} iconRight={<ArrowRight className="h-4 w-4" />}>
            {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </Button>
        </form>

        <p className="text-center text-xs text-mist-400 mt-6">
          {mode === 'login' ? (
            <>Pas encore de compte ? <button onClick={() => setMode('register')} className="text-primary-400 hover:underline">Créer un compte</button></>
          ) : (
            <>Déjà un compte ? <button onClick={() => setMode('login')} className="text-primary-400 hover:underline">Se connecter</button></>
          )}
        </p>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Input, Button, Alert } from '../components/ui';
import { sendContactMessage, CONTACT_EMAIL } from '../services/contact';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState(null);

  const isValid = name.trim() && email.trim() && message.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;

    setStatus('sending');
    setError(null);
    try {
      const result = await sendContactMessage({ name, email, message });
      setStatus('sent');
      if (!result.mocked) {
        setName('');
        setEmail('');
        setMessage('');
        setTouched(false);
      }
    } catch (err) {
      setError(err.message ?? "Une erreur inattendue s'est produite.");
      setStatus('error');
    }
  };

  return (
    <div className="container-page py-20 max-w-xl">
      <h1 className="font-display text-3xl font-semibold text-mist-50 tracking-tight mb-2">Contact</h1>
      <p className="text-sm text-mist-400 mb-10">
        Une question, un retour ? Envoyez-nous un message, il arrivera à{' '}
        <span className="text-mist-200">{CONTACT_EMAIL}</span>.
      </p>

      {status === 'sent' && (
        <Alert variant="ok" title="Message envoyé" className="mb-6">
          Votre messagerie a été ouverte avec le message pré-rempli. Il vous reste à cliquer sur envoyer.
        </Alert>
      )}
      {status === 'error' && (
        <Alert variant="danger" title="Échec de l'envoi" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-mist-300 mb-1.5">Nom</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom"
            error={touched && !name.trim() ? 'Ce champ est requis.' : null}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-mist-300 mb-1.5">E-mail</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            error={touched && !email.trim() ? 'Ce champ est requis.' : null}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-mist-300 mb-1.5">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Votre message..."
            rows={6}
            className="w-full rounded-xl bg-white/[0.04] border border-white/10 text-mist-50 placeholder:text-mist-400 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400/60 transition-colors duration-200 resize-none"
          />
          {touched && !message.trim() && <p className="mt-1.5 text-xs text-danger">Ce champ est requis.</p>}
        </div>

        <Button type="submit" icon={<Send className="h-4 w-4" />} isLoading={status === 'sending'}>
          Envoyer le message
        </Button>
      </form>
    </div>
  );
}

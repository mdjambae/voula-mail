/**
 * contact.js
 * ------------------------------------------------------------------
 * Contrat d'API attendu par le formulaire de contact : POST /v1/contact
 * { name, email, message } -> { received: true }
 *
 * Tant qu'aucun backend n'est connecté (VITE_VOULA_API_URL absente),
 * l'envoi retombe sur mailto: vers contact@voula.tech : le message
 * part réellement via le client mail de l'utilisateur, sans dépendre
 * d'un serveur.
 * ------------------------------------------------------------------
 */

const API_BASE = import.meta.env.VITE_VOULA_API_URL || null;
export const CONTACT_EMAIL = 'contact@voula.tech';

export async function sendContactMessage({ name, email, message }) {
  if (!API_BASE) {
    const subject = `Message de ${name} via VOULA Mail`;
    const body = `${message}\n\n---\nNom : ${name}\nE-mail : ${email}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return { mocked: true, method: 'mailto' };
  }

  const res = await fetch(`${API_BASE}/v1/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, message }),
  });
  if (!res.ok) throw new Error("Impossible d'envoyer le message pour le moment. Réessayez plus tard.");
  return res.json();
}

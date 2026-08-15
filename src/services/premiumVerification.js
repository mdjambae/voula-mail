/**
 * premiumVerification.js
 * ------------------------------------------------------------------
 * Architecture de la fonctionnalité Premium « Vérification par e-mail
 * réel ». Le principe :
 *
 *   1. Le client demande une adresse d'audit jetable au backend
 *      (ex: audit-9f3a@voula.tech), liée à la session de scan en cours.
 *   2. L'utilisateur envoie un e-mail depuis son propre système
 *      d'envoi vers cette adresse.
 *   3. Un service backend (hors périmètre du front MVP) réceptionne
 *      le message, extrait l'en-tête DKIM-Signature, vérifie la
 *      signature cryptographique par rapport à la clé publiée en DNS,
 *      calcule l'alignement DMARC, puis publie le résultat.
 *   4. Le client interroge (ou reçoit en websocket) le statut final.
 *
 * Cette couche définit le contrat d'API attendu par le frontend afin
 * que l'intégration du backend, quand elle sera développée, n'impose
 * aucun changement de composant React. Tant qu'aucun backend n'est
 * connecté, les fonctions renvoient une réponse simulée clairement
 * identifiée comme telle, pour permettre de démontrer et tester le
 * parcours UX de bout en bout.
 * ------------------------------------------------------------------
 */

const API_BASE = import.meta.env.VITE_VOULA_API_URL || null;
const MOCK_LATENCY_MS = 1400;

/**
 * Demande une adresse d'audit jetable pour le domaine en cours de scan.
 * Contrat backend attendu : POST /v1/premium/session { domain } -> { auditAddress, sessionId, expiresAt }
 */
export async function requestAuditAddress(domain) {
  if (!API_BASE) {
    await wait(MOCK_LATENCY_MS);
    const token = Math.random().toString(36).slice(2, 8);
    return {
      mocked: true,
      sessionId: `mock-${token}`,
      auditAddress: `audit-${token}@voula.tech`,
      domain,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  const res = await fetch(`${API_BASE}/v1/premium/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain }),
  });
  if (!res.ok) throw new Error("Impossible de générer une adresse d'audit pour le moment.");
  return res.json();
}

/**
 * Interroge le statut de vérification d'un e-mail reçu sur l'adresse jetable.
 * Contrat backend attendu : GET /v1/premium/session/:sessionId -> {
 *   status: 'waiting' | 'received' | 'verified' | 'failed',
 *   dkim: { selector, domain, algorithm, keyLength, aligned, valid },
 *   dmarcAligned: boolean,
 *   confidence: 'high' | 'medium' | 'low'
 * }
 */
export async function pollAuditStatus(sessionId) {
  if (!API_BASE || sessionId.startsWith('mock-')) {
    await wait(MOCK_LATENCY_MS);
    return {
      mocked: true,
      status: 'waiting',
      message: "Fonctionnalité prête côté interface — connectez le service backend VOULA pour activer la réception réelle.",
    };
  }

  const res = await fetch(`${API_BASE}/v1/premium/session/${sessionId}`);
  if (!res.ok) throw new Error('Impossible de récupérer le statut de vérification.');
  return res.json();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

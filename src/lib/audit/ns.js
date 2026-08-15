/**
 * ns.js — Résolution des serveurs de noms (NS) du domaine.
 *
 * Module d'information complémentaire : il n'entre pas dans le score
 * de conformité (ce n'est pas un critère de sécurité e-mail), mais
 * sert de signal pour la détection automatique de l'hébergeur DNS,
 * utilisée pour personnaliser les instructions de correction.
 */
import { queryNS } from '../../services/dohClient.js';

export async function auditNS(domain) {
  try {
    const records = await queryNS(domain);
    return { id: 'ns', records };
  } catch {
    return { id: 'ns', records: [] };
  }
}

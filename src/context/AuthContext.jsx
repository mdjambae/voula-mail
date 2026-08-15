/**
 * AuthContext.jsx
 * ------------------------------------------------------------------
 * État d'authentification côté client. À ce stade du projet, AUCUN
 * backend d'authentification n'est connecté : ce contexte simule un
 * cycle de connexion complet (connexion, inscription, déconnexion,
 * session persistée) via localStorage, uniquement pour que
 * l'interface et les parcours (route protégée, état de la navbar,
 * etc.) soient déjà en place et testables.
 *
 * CE QUI MANQUE POUR LA PRODUCTION (voir aussi README.md) :
 *  - Un vrai backend d'authentification (API dédiée, ou service tiers
 *    type Supabase Auth / Auth0 / Clerk / Firebase Auth).
 *  - Hachage des mots de passe côté serveur (jamais de mot de passe
 *    en clair, jamais de vérification côté client).
 *  - Sessions via cookies httpOnly + Secure + SameSite (ou JWT signés
 *    côté serveur avec rotation/refresh token), pas de session lisible
 *    en JS comme ici.
 *  - Protection CSRF sur les endpoints de mutation.
 *  - Vérification d'adresse e-mail (lien signé, expirant).
 *  - Flux de récupération de mot de passe (lien signé, expirant).
 *  - Rate limiting / protection anti-bruteforce sur /login.
 *  - Vérification de l'autorisation côté SERVEUR sur chaque endpoint
 *    (une route protégée côté client ne suffit jamais : voir
 *    ProtectedRoute.jsx, qui n'est qu'un confort UX, pas une sécurité).
 * ------------------------------------------------------------------
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'voula_mock_session';
const MOCK_LATENCY_MS = 700;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {
      /* stockage indisponible ou corrompu : session simplement absente */
    }
    setLoading(false);
  }, []);

  const persist = (nextUser) => {
    setUser(nextUser);
    try {
      if (nextUser) localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* stockage indisponible : la session reste valide pour l'onglet en cours uniquement */
    }
  };

  const login = useCallback(async (email, _password) => {
    await wait(MOCK_LATENCY_MS);
    if (!email) throw new Error('Adresse e-mail requise.');
    const mockUser = { email, name: email.split('@')[0], mocked: true };
    persist(mockUser);
    return mockUser;
  }, []);

  const register = useCallback(async (email, _password) => {
    await wait(MOCK_LATENCY_MS);
    if (!email) throw new Error('Adresse e-mail requise.');
    const mockUser = { email, name: email.split('@')[0], mocked: true, emailVerified: false };
    persist(mockUser);
    return mockUser;
  }, []);

  const logout = useCallback(() => {
    persist(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>');
  return ctx;
}

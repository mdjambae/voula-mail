/**
 * ProtectedRoute.jsx
 * ------------------------------------------------------------------
 * Redirige vers /connexion si aucune session (mock) n'est active.
 * IMPORTANT : ceci est un confort de navigation côté client, pas une
 * mesure de sécurité. Tant qu'aucun backend n'impose la vérification
 * de session sur chaque requête, toute donnée sensible reste exposée
 * à quiconque contourne le routeur React (appel direct d'API, etc.).
 * La vérification d'autorisation doit être répétée côté serveur.
 * ------------------------------------------------------------------
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size={28} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import { Logo } from '../Logo';
import { Button } from '../ui';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const NAV_LINKS = [
  { to: '/#fonctionnalites', label: 'Fonctionnalités' },
  { to: '/#securite', label: 'Sécurité' },
  { to: '/#faq', label: 'FAQ' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        scrolled ? 'glass-strong border-b border-white/[0.06]' : 'bg-transparent'
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between">
        <Link to="/" aria-label="VOULA Mail — accueil">
          <Logo />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm text-mist-300 hover:text-mist-50 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="flex items-center gap-1.5 text-sm text-mist-300">
                <User className="h-3.5 w-3.5" />
                {user?.name}
              </span>
              <Button variant="ghost" size="sm" icon={<LogOut className="h-3.5 w-3.5" />} onClick={handleLogout}>
                Déconnexion
              </Button>
            </>
          ) : (
            <NavLink to="/connexion">
              <Button variant="ghost" size="sm">Connexion</Button>
            </NavLink>
          )}
          <NavLink to="/scanner">
            <Button variant="primary" size="sm">Scanner un domaine</Button>
          </NavLink>
        </div>

        <button
          className="md:hidden p-2 text-mist-300"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Ouvrir le menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden glass-strong border-t border-white/[0.06] px-6 py-4 flex flex-col gap-4 animate-fadeUp">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm text-mist-300" onClick={() => setMobileOpen(false)}>
              {l.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
            {isAuthenticated ? (
              <Button variant="secondary" className="w-full" icon={<LogOut className="h-3.5 w-3.5" />} onClick={() => { handleLogout(); setMobileOpen(false); }}>
                Déconnexion ({user?.name})
              </Button>
            ) : (
              <NavLink to="/connexion" onClick={() => setMobileOpen(false)}>
                <Button variant="secondary" className="w-full">Connexion</Button>
              </NavLink>
            )}
            <NavLink to="/scanner" onClick={() => setMobileOpen(false)}>
              <Button variant="primary" className="w-full">Scanner un domaine</Button>
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
}

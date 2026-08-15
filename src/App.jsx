import { Routes, Route } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import ScannerPage from './pages/ScannerPage';
import LoginPage from './pages/LoginPage';
import PremiumPage from './pages/PremiumPage';
import LegalPage from './pages/LegalPage';
import ContactPage from './pages/ContactPage';

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/scanner" element={<ScannerPage />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/premium" element={<PremiumPage />} />
        </Route>
        <Route path="/confidentialite" element={<LegalPage title="Politique de confidentialité" />} />
        <Route path="/conditions" element={<LegalPage title="Conditions d'utilisation" />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route
          path="*"
          element={
            <div className="container-page py-32 text-center">
              <h1 className="font-display text-2xl text-mist-50">Page introuvable</h1>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}

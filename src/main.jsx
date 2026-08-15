import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { ScanProvider } from './context/ScanContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <ScanProvider>
          <App />
        </ScanProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);

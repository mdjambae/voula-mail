import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ScanProvider } from './context/ScanContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ScanProvider>
          <App />
        </ScanProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { runFullAudit } from '../lib/audit/index.js';

const ScanContext = createContext(null);

export function ScanProvider({ children }) {
  const [status, setStatus] = useState('idle'); // idle | scanning | done | error
  const [progress, setProgress] = useState({ percent: 0, label: '' });
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const abortRef = useRef(false);

  const startScan = useCallback(async (domain) => {
    abortRef.current = false;
    setStatus('scanning');
    setError(null);
    setReport(null);
    setProgress({ percent: 0, label: 'Initialisation…' });

    try {
      const result = await runFullAudit(domain, (p) => {
        if (abortRef.current) return;
        setProgress({ percent: p.percent, label: p.label });
      });
      if (abortRef.current) return;
      setReport(result);
      setStatus('done');
      setHistory((h) => [{ domain: result.domain, score: result.score.score, scannedAt: result.scannedAt }, ...h].slice(0, 10));
    } catch (err) {
      if (abortRef.current) return;
      setError(err.message ?? "Une erreur inattendue s'est produite pendant l'audit.");
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setStatus('idle');
    setProgress({ percent: 0, label: '' });
    setReport(null);
    setError(null);
  }, []);

  return (
    <ScanContext.Provider value={{ status, progress, report, error, history, startScan, reset }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan doit être utilisé à l\'intérieur de <ScanProvider>');
  return ctx;
}

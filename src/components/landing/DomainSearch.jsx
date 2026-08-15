import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { Input, Button } from '../ui';
import { useScan } from '../../context/ScanContext';

const DOMAIN_RE = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})+$/;

export function DomainSearch({ size = 'lg', autoFocus = false }) {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const { startScan } = useScan();
  const navigate = useNavigate();

  const cleaned = value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const isValid = DOMAIN_RE.test(cleaned);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    navigate(`/scanner?domaine=${encodeURIComponent(cleaned)}`);
    startScan(cleaned);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          autoFocus={autoFocus}
          icon={<Search className="h-4 w-4" />}
          size={size}
          placeholder="votredomaine.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          error={touched && value && !isValid ? 'Entrez un nom de domaine valide (ex: exemple.com)' : null}
          className="flex-1"
        />
        <Button type="submit" size={size} iconRight={<ArrowRight className="h-4 w-4" />} className="shrink-0">
          Scanner
        </Button>
      </div>
    </form>
  );
}

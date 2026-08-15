/**
 * Logo.jsx
 * ------------------------------------------------------------------
 * Logo officiel VOULA, vectorisé à partir du fichier fourni :
 * pixels supprimés (tracé propre en courbes vectorielles) et anneau
 * extérieur retiré — un seul cercle plein porte désormais le
 * monogramme. Le tracé est intégré en JSX pour un rendu net à
 * n'importe quelle taille, sans requête réseau supplémentaire.
 * ------------------------------------------------------------------
 */
import { cn } from '../utils/cn';

/** Chemin vectoriel du monogramme, normalisé sur une grille 100 x 93.59 */
const MARK_PATH =
  'M100,0.26 L52.82,0 L49.74,5.13 L46.92,0.26 L37.69,0.26 L49.74,22.56 L57.44,8.46 L86.15,8.72 L64.1,49.74 L68.72,58.46 Z ' +
  'M0,0 L49.74,93.59 L63.85,67.69 L54.36,49.23 L71.54,17.69 L62.05,17.95 L45.13,49.49 L54.62,67.44 L49.49,76.15 L13.33,8.72 L23.85,8.97 L40.26,40.26 L44.87,31.54 L28.46,0.26 Z';

const BRAND_BLUE = '#0005E6';

/** Badge : cercle plein + monogramme blanc (favicon, avatar, app icon). */
export function LogoMark({ className, size = 32, circleColor = BRAND_BLUE }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="50" cy="50" r="48" fill={circleColor} />
      <g transform="translate(22, 23.8) scale(0.56)">
        <path d={MARK_PATH} fill="#FFFFFF" />
      </g>
    </svg>
  );
}

/** Monogramme seul, sans cercle, pour usages sur fond clair/foncé (ex: watermark). */
export function LogoGlyph({ className, size = 24, color = BRAND_BLUE }) {
  return (
    <svg width={size} height={(size * 93.59) / 100} viewBox="0 0 100 93.59" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d={MARK_PATH} fill={color} />
    </svg>
  );
}

export function Logo({ className, markSize = 30, showWordmark = true }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={markSize} />
      {showWordmark && (
        <span className="font-display font-semibold tracking-tight text-mist-50 text-lg leading-none">
          VOULA <span className="text-primary-400">Mail</span>
        </span>
      )}
    </div>
  );
}

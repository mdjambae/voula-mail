import clsx from 'clsx';

/** Petit wrapper autour de clsx pour composer les classes Tailwind proprement. */
export function cn(...args) {
  return clsx(...args);
}

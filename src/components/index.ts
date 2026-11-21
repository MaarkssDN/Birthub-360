export const CANONICAL_TYPOGRAPHY_SCALE = {
  displayHero: 'text-4xl md:text-5xl font-extrabold tracking-tight leading-tight',
  headingPage: 'text-2xl md:text-3xl font-bold tracking-tight leading-snug',
  headingSection: 'text-lg md:text-xl font-semibold leading-snug',
  bodyBase: 'text-sm md:text-base font-normal leading-relaxed',
  captionMeta: 'text-xs font-medium tracking-wide uppercase',
} as const;

export const CANONICAL_SEMANTIC_PALETTE = {
  surfacePrimary: 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50',
  surfaceElevated: 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
  brandPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
  statusDanger: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  statusSuccess: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
} as const;

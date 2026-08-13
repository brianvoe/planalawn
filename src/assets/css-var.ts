/** Read a CSS custom property from :root (for D3/canvas that need raw color strings). */
export function cssVar(name: `--${string}`, fallback = ''): string {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

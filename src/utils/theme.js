export const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'monitor' },
];

export function normalizeTheme(value) {
  return value === 'dark' || value === 'system' ? value : 'light';
}

export function resolveTheme(preference) {
  const pref = normalizeTheme(preference);
  if (pref !== 'system') return pref;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyResolvedTheme(preference) {
  if (typeof document === 'undefined') return resolveTheme(preference);
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  return resolved;
}

export function subscribeSystemTheme(preference, onChange) {
  if (typeof window === 'undefined' || preference !== 'system') return () => {};
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => onChange(resolveTheme('system'));
  media.addEventListener('change', handleChange);
  return () => media.removeEventListener('change', handleChange);
}

// Fixed neutral-professional palette — each role gets a consistent slot
export const AVATAR_PALETTE = [
  { bg: '#3B5998', shadow: 'rgba(59,89,152,0.30)' },   // navy
  { bg: '#2E7D5E', shadow: 'rgba(46,125,94,0.30)' },   // forest
  { bg: '#5A4A8A', shadow: 'rgba(90,74,138,0.30)' },   // plum
  { bg: '#7A5230', shadow: 'rgba(122,82,48,0.30)' },   // chestnut
  { bg: '#2C6E8A', shadow: 'rgba(44,110,138,0.30)' },  // steel blue
  { bg: '#6B3A3A', shadow: 'rgba(107,58,58,0.30)' },   // burgundy
  { bg: '#3A6B4A', shadow: 'rgba(58,107,74,0.30)' },   // sage
  { bg: '#4A5568', shadow: 'rgba(74,85,104,0.30)' },   // slate
];

/**
 * Derives avatar initials and color from a user's role and/or name.
 * Uses role for color determination (if available), fallback to name.
 */
export function getAvatarProps(name, role) {
  const textForInitials = (name || role || 'P').trim();
  const textForColor = (role || name || '').trim();
  
  const words = textForInitials.split(/\s+/);
  const initials = words.length >= 2
    ? `${words[0][0]}${words[words.length - 1][0]}`
    : words[0].slice(0, 2);
    
  const idx = [...textForColor].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % AVATAR_PALETTE.length;
  return { initials: initials.toUpperCase(), palette: AVATAR_PALETTE[idx] };
}

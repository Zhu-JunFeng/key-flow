export type Theme = 'light' | 'dark';

const THEME_KEY = 'typerace_theme';

export function getStoredTheme(): Theme {
  return (localStorage.getItem(THEME_KEY) as Theme) || 'light';
}

export function setStoredTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// Initialize theme on load
export function initTheme(): void {
  applyTheme(getStoredTheme());
}

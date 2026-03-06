'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pulse-theme';
type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    if (current === 'light' || current === 'dark') {
      setTheme(current);
    }
    setReady(true);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={ready ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme` : 'Toggle theme'}
    >
      <span className="theme-toggle__track">
        <span className="theme-toggle__label">{ready ? theme : 'dark'}</span>
        <span className="theme-toggle__thumb" aria-hidden="true">
          {theme === 'dark' ? '◐' : '◑'}
        </span>
      </span>
    </button>
  );
}

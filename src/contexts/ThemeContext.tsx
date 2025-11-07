// src/contexts/ThemeContext.tsx
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';

// Tema için daha kapsamlı bir yapı tanımlıyoruz.
export interface Theme {
  name: string;
  displayName: string;
  colors: {
    // Vurgu renkleri
    accent: string;
    primaryButton: string;
    primaryButtonHover: string;
    focusRing: string;
    text: string;
    textHover: string;
    activeBackground: string;
    radioChecked: string;
    border: string;

    // Arayüzün genel renkleri
    bgPrimary: string; // Ana içerik alanı (en açık arka plan)
    bgSecondary: string; // Yan paneller (orta ton arka plan)
    bgTertiary: string; // En dış/koyu katman (en koyu arka plan)
    bgMuted: string; // İnteraktif alanlar (örn: mesaj giriş kutusu)
    borderPrimary: string; // Ana ayırıcılar

    // Metin renkleri
    textPrimary: string; // Ana başlıklar, önemli metinler
    textSecondary: string; // İkincil metinler
    textMuted: string; // İpuçları, placeholder'lar
  };
}

// Tüm kullanılabilir temaları yeni yapıya göre tanımlıyoruz.
export const themes: Record<string, Theme> = {
  'red-sparrow': {
    name: 'red-sparrow',
    displayName: 'Kızıl Serçe',
    colors: {
      accent: 'violet', // Teknik olarak bu kırmızı için 'violet' kullanıyoruz
      primaryButton: 'bg-violet-600',
      primaryButtonHover: 'hover:bg-violet-700',
      focusRing: 'focus:ring-violet-500',
      text: 'text-violet-400',
      textHover: 'hover:text-violet-300',
      activeBackground: 'bg-violet-600',
      radioChecked: 'bg-violet-600/30',
      border: 'border-violet-500',
      bgPrimary: 'bg-slate-700',
      bgSecondary: 'bg-slate-800',
      bgTertiary: 'bg-slate-900',
      bgMuted: 'bg-slate-600',
      borderPrimary: 'border-slate-900',
      textPrimary: 'text-slate-100',
      textSecondary: 'text-slate-300',
      textMuted: 'text-slate-400',
    },
  },
  'oceanic-depths': {
    name: 'oceanic-depths',
    displayName: 'Okyanus Derinlikleri',
    colors: {
      accent: 'blue',
      primaryButton: 'bg-blue-600',
      primaryButtonHover: 'hover:bg-blue-700',
      focusRing: 'focus:ring-blue-500',
      text: 'text-blue-400',
      textHover: 'hover:text-blue-300',
      activeBackground: 'bg-blue-600',
      radioChecked: 'bg-blue-600/30',
      border: 'border-blue-500',
      bgPrimary: 'bg-slate-700', // Mavi temada da slate'i temel alıyoruz
      bgSecondary: 'bg-slate-800',
      bgTertiary: 'bg-slate-900',
      bgMuted: 'bg-slate-600',
      borderPrimary: 'border-slate-900',
      textPrimary: 'text-slate-100',
      textSecondary: 'text-slate-300',
      textMuted: 'text-slate-400',
    },
  },
  'emerald-forest': {
    name: 'emerald-forest',
    displayName: 'Zümrüt Ormanı',
    colors: {
      accent: 'emerald',
      primaryButton: 'bg-emerald-600',
      primaryButtonHover: 'hover:bg-emerald-700',
      focusRing: 'focus:ring-emerald-500',
      text: 'text-emerald-400',
      textHover: 'hover:text-emerald-300',
      activeBackground: 'bg-emerald-600',
      radioChecked: 'bg-emerald-600/30',
      border: 'border-emerald-500',
      bgPrimary: 'bg-slate-700',
      bgSecondary: 'bg-slate-800',
      bgTertiary: 'bg-slate-900',
      bgMuted: 'bg-slate-600',
      borderPrimary: 'border-slate-900',
      textPrimary: 'text-slate-100',
      textSecondary: 'text-slate-300',
      textMuted: 'text-slate-400',
    },
  },
  'royal-amethyst': {
    name: 'royal-amethyst',
    displayName: 'Kraliyet Ametisti',
    colors: {
      accent: 'purple',
      primaryButton: 'bg-purple-600',
      primaryButtonHover: 'hover:bg-purple-700',
      focusRing: 'focus:ring-purple-500',
      text: 'text-purple-400',
      textHover: 'hover:text-purple-300',
      activeBackground: 'bg-purple-600',
      radioChecked: 'bg-purple-600/30',
      border: 'border-purple-500',
      bgPrimary: 'bg-slate-700',
      bgSecondary: 'bg-slate-800',
      bgTertiary: 'bg-slate-900',
      bgMuted: 'bg-slate-600',
      borderPrimary: 'border-slate-900',
      textPrimary: 'text-slate-100',
      textSecondary: 'text-slate-300',
      textMuted: 'text-slate-400',
    },
  },
  'classic-indigo': {
    name: 'classic-indigo',
    displayName: 'Klasik İndigo',
    colors: {
      accent: 'indigo',
      primaryButton: 'bg-indigo-600',
      primaryButtonHover: 'hover:bg-indigo-700',
      focusRing: 'focus:ring-indigo-500',
      text: 'text-indigo-400',
      textHover: 'hover:text-indigo-300',
      activeBackground: 'bg-indigo-600',
      radioChecked: 'bg-indigo-600/30',
      border: 'border-indigo-500',
      bgPrimary: 'bg-slate-700',
      bgSecondary: 'bg-slate-800',
      bgTertiary: 'bg-slate-900',
      bgMuted: 'bg-slate-600',
      borderPrimary: 'border-slate-900',
      textPrimary: 'text-slate-100',
      textSecondary: 'text-slate-300',
      textMuted: 'text-slate-400',
    },
  },
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (themeName: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState<string>(() => {
    return localStorage.getItem('serce-app-theme') || 'red-sparrow';
  });

  useEffect(() => {
    localStorage.setItem('serce-app-theme', themeName);
  }, [themeName]);

  const setTheme = (newThemeName: string) => {
    if (themes[newThemeName]) {
      setThemeName(newThemeName);
    }
  };

  const theme = useMemo(() => themes[themeName], [themeName]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/** @type {import('tailwindcss').Config} */

const themes = ['violet', 'blue', 'emerald', 'purple', 'indigo'];
const shades = ['300', '400', '500', '600', '700'];
const variants = ['bg', 'hover:bg', 'text', 'hover:text', 'focus:ring', 'border'];

const interactiveSafelist = variants.flatMap(variant => 
  themes.flatMap(theme => 
    shades.map(shade => {
      if(variant === 'focus:ring' || variant === 'border') return `${variant}-${theme}-500`;
      return `${variant}-${theme}-${shade}`;
    })
  )
);

const backgroundSafelist = [
    'bg-slate-900', 'bg-slate-800', 'bg-slate-700', 'bg-slate-600',
    'border-slate-900', 'text-slate-100', 'text-slate-300', 'text-slate-400',
];

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [...interactiveSafelist, ...backgroundSafelist],
  theme: {
    extend: {
       colors: {
          'slate': {
              900: '#1e2124',
              800: '#282b30',
              700: '#36393f',
              600: '#424549',
              500: '#72767d',
              400: '#96989d',
              300: '#b9bbbe',
              200: '#dcddde',
              100: '#f6f6f7',
          },
          'violet': { // Kızıl Serçe Teması (Kırmızı)
            300: '#fca5a5', // red-300
            400: '#f87171', // red-400
            500: '#ef4444', // red-500
            600: '#dc2626', // red-600
            700: '#b91c1c', // red-700
          },
          'blue': { // Okyanus Derinlikleri Teması
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
          },
          'emerald': { // Zümrüt Ormanı Teması
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
          },
          'purple': { // Kraliyet Ametisti Teması
            300: '#c084fc',
            400: '#a855f7',
            500: '#9333ea',
            600: '#7e22ce',
            700: '#6b21a8',
          },
          'indigo': { // Klasik İndigo Teması
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#6366f1',
            600: '#4f46e5',
            700: '#4338ca',
          },
      },
      keyframes: {
        'pulse-grow': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
      },
      animation: {
        'pulse-grow': 'pulse-grow 2.5s cubic-bezier(0.4, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

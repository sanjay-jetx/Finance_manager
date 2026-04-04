/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
    },
    extend: {
      colors: {
        background: '#09090b', // Zinc 950 - elegant deep charcoal
        surface: '#121214',    // Elevated card color
        surfaceHover: '#18181b', // Hover state for cards
        border: '#27272a',     // Subtle border
        borderFocus: '#3f3f46',// Focus border
        foreground: '#fafafa', // Pure text
        muted: '#a1a1aa',      // Muted text
        accent: {
          DEFAULT: '#6366f1',  // Electric Indigo
          light: '#818cf8',
          glow: 'rgba(99, 102, 241, 0.15)',
        },
        success: {
          DEFAULT: '#10b981', // Emerald
          glow: 'rgba(16, 185, 129, 0.15)',
        },
        danger: {
          DEFAULT: '#f43f5e', // Rose
          glow: 'rgba(244, 63, 94, 0.15)',
        },
        warning: '#f59e0b',
        info: '#0ea5e9'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-card': 'linear-gradient(145deg, #121214 0%, #09090b 100%)',
        'gradient-primary': 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        'gradient-success': 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      },
      boxShadow: {
        'glow-accent': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glass-inner': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'soft-drop': '0 8px 30px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}

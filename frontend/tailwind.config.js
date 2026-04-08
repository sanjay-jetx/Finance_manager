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
        background: '#0B0F1A', // Base extreme dark blue
        surface: 'rgba(255, 255, 255, 0.08)',    // Glass surface base
        surfaceHover: 'rgba(255, 255, 255, 0.12)', // Glass hover state
        border: 'rgba(255, 255, 255, 0.2)',     // Glass border
        borderFocus: 'rgba(255, 255, 255, 0.3)',// Glass Focus border
        foreground: '#ffffff', // Pure text
        muted: '#9ca3af',      // Muted text
        accent: {
          DEFAULT: '#6366F1',  // Indigo
          light: '#818cf8',
          glow: 'rgba(99, 102, 241, 0.2)',
        },
        success: {
          DEFAULT: '#22C55E', // Green neon
          glow: 'rgba(34, 197, 94, 0.2)',
        },
        danger: {
          DEFAULT: '#EF4444', // Red glow
          glow: 'rgba(239, 68, 68, 0.2)',
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

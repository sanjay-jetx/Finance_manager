/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    extend: {
      colors: {
        background: '#0B0B0D', // Obsidian base
        surface: '#15161A',    // Matte gray panels
        surfaceHover: '#1A1C21',
        border: 'rgba(255, 255, 255, 0.08)',
        borderFocus: 'rgba(0, 255, 163, 0.4)',
        foreground: '#F5F5F7', // Bright text
        muted: '#8A8F98',      // Dimmed text
        accent: {
          DEFAULT: '#00FFA3',  // Obsidian neon green
          light: '#33FFB5',
          glow: 'rgba(0, 255, 163, 0.2)',
        },
        success: {
          DEFAULT: '#00FFA3', // Same as accent in this theme
          glow: 'rgba(0, 255, 163, 0.15)',
        },
        danger: {
          DEFAULT: '#FF3366', // Vibrant crisp red
          glow: 'rgba(255, 51, 102, 0.15)',
        },
        warning: '#FFAD33',
        info: '#33ADFF'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-card': 'linear-gradient(180deg, rgba(21,22,26,1) 0%, rgba(17,18,21,1) 100%)',
        'gradient-primary': 'linear-gradient(135deg, #00FFA3 0%, #00CC82 100%)',
        'gradient-success': 'linear-gradient(135deg, #00FFA3 0%, #00CC82 100%)',
      },
      boxShadow: {
        'glow-accent': '0 0 24px rgba(0, 255, 163, 0.15)',
        'glow-success': '0 0 24px rgba(0, 255, 163, 0.15)',
        'glass-inner': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.02)',
        'soft-drop': '0 12px 40px rgba(0,0,0,0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}

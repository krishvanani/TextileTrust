/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        colors: {
          brand: {
            50: '#F0FDFA', // Teal 50
            100: '#CCFBF1', // Teal 100
            200: '#99F6E4', // Teal 200
            300: '#5EEAD4', // Teal 300
            400: '#2DD4BF', // Teal 400
            500: '#14B8A6', // Teal 500
            600: '#0D9488', // Teal 600 - Primary Brand
            700: '#0F766E', // Teal 700
            800: '#115E59', // Teal 800
            900: '#134E4A', // Teal 900
          },
          // Ocean / Cool Slate Palette
          future: {
            white: '#FFFFFF',
            snow: '#F8FAFC', // Slate 50
            silver: '#F1F5F9', // Slate 100
            mist: '#E2E8F0', // Slate 200
            smoke: '#CBD5E1', // Slate 300
            steel: '#64748B', // Slate 500 - Secondary text
            graphite: '#475569', // Slate 600 - Body text
            carbon: '#1E293B', // Slate 800 - Headers
            midnight: '#0F172A', // Slate 900 - Deep ocean
            accent: '#14B8A6', // Teal 500 - Ocean accent
            success: '#10B981', // Emerald 500
          }
        },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'], // Updated to Outfit
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}

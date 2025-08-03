# Create comprehensive Next.js + Supabase code structure for Kanchen Academy
# Based on EduTap analysis - focusing on core functionality

import os

# Create project structure
project_structure = {
    "package.json": {
        "name": "kanchen-academy",
        "version": "0.1.0",
        "private": True,
        "scripts": {
            "dev": "next dev",
            "build": "next build",
            "start": "next start",
            "lint": "next lint",
            "type-check": "tsc --noEmit",
            "supabase:start": "supabase start",
            "supabase:stop": "supabase stop",
            "supabase:types": "supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts"
        },
        "dependencies": {
            "next": "^14.2.3",
            "react": "^18.3.1",
            "react-dom": "^18.3.1",
            "@supabase/supabase-js": "^2.43.4",
            "@supabase/ssr": "^0.3.0",
            "typescript": "^5.4.5",
            "@types/node": "^20.12.12",
            "@types/react": "^18.3.2",
            "@types/react-dom": "^18.3.0",
            "tailwindcss": "^3.4.3",
            "autoprefixer": "^10.4.19",
            "postcss": "^8.4.38",
            "framer-motion": "^11.2.6",
            "react-hook-form": "^7.51.4",
            "@hookform/resolvers": "^3.3.4",
            "zod": "^3.23.8",
            "lucide-react": "^0.379.0",
            "class-variance-authority": "^0.7.0",
            "clsx": "^2.1.1",
            "tailwind-merge": "^2.3.0",
            "@radix-ui/react-dialog": "^1.0.5",
            "@radix-ui/react-dropdown-menu": "^2.0.6",
            "@radix-ui/react-tabs": "^1.0.4",
            "@radix-ui/react-accordion": "^1.1.2",
            "react-hot-toast": "^2.4.1",
            "date-fns": "^3.6.0",
            "recharts": "^2.12.7"
        },
        "devDependencies": {
            "eslint": "^8.57.0",
            "eslint-config-next": "14.2.3",
            "@tailwindcss/forms": "^0.5.7",
            "@tailwindcss/typography": "^0.5.13"
        }
    },
    
    "next.config.js": '''/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
}

module.exports = nextConfig''',

    "tailwind.config.js": '''/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f7',
          100: '#dbf0ec',
          200: '#b9e1da',
          300: '#8eccc2',
          400: '#61b3a7',
          500: '#7A9A95', // Main brand color
          600: '#3a7c6f',
          700: '#30655a',
          800: '#285349',
          900: '#24453e',
          950: '#112621',
        },
        secondary: {
          50: '#fdf4f3',
          100: '#fce7e4',
          200: '#f9d3ce',
          300: '#f4b5ab',
          400: '#ec8b7a',
          500: '#e36858', // Coral accent
          600: '#d04732',
          700: '#b03828',
          800: '#923326',
          900: '#7a2f25',
          950: '#42160f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}'''
}

# Write the project configuration files
for filename, content in project_structure.items():
    if isinstance(content, dict):
        import json
        with open(filename, 'w') as f:
            json.dump(content, f, indent=2)
    else:
        with open(filename, 'w') as f:
            f.write(content)

print("✅ Project configuration files created successfully!")
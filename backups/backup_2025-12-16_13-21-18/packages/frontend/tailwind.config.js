/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                light: {
                    bg: '#FFFFFF',
                    text: '#000000',
                    border: '#E6E6E6',
                    secondary: '#F3F3F3',
                },
                dark: {
                    bg: '#0A0A0A',
                    text: '#FFFFFF',
                    border: '#333333',
                    secondary: '#1E1E1E',
                },
            },
            fontFamily: {
                sora: ['var(--font-sora)', 'sans-serif'],
                inter: ['var(--font-inter)', 'sans-serif'],
                'plus-jakarta': ['var(--font-plus-jakarta)', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-accent': 'linear-gradient(135deg, #A855F7 0%, #3B82F6 100%)',
            },
        },
    },
    plugins: [],
}

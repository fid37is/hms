export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand)',
          hover:   'var(--brand-hover)',
          subtle:  'var(--brand-subtle)',
        },
        accent: 'var(--accent)',
        page:   'var(--bg-page)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          subtle:  'var(--bg-subtle)',
          muted:   'var(--bg-muted)',
        },
        line: {
          soft:    'var(--border-soft)',
          DEFAULT: 'var(--border-base)',
        },
        ink: {
          DEFAULT: 'var(--text-base)',
          sub:     'var(--text-sub)',
          muted:   'var(--text-muted)',
          inverse: 'var(--text-on-brand)',
        },
        sidebar: {
          bg:           'var(--sidebar-bg)',
          border:       'var(--sidebar-border)',
          text:         'var(--sidebar-text)',
          'text-active':'var(--sidebar-text-active)',
          active:       'var(--sidebar-item-active)',
          hover:        'var(--sidebar-item-hover)',
        },
        status: {
          'green-bg':    'var(--s-green-bg)',
          'green-text':  'var(--s-green-text)',
          'yellow-bg':   'var(--s-yellow-bg)',
          'yellow-text': 'var(--s-yellow-text)',
          'red-bg':      'var(--s-red-bg)',
          'red-text':    'var(--s-red-text)',
          'blue-bg':     'var(--s-blue-bg)',
          'blue-text':   'var(--s-blue-text)',
          'gray-bg':     'var(--s-gray-bg)',
          'gray-text':   'var(--s-gray-text)',
          'purple-bg':   'var(--s-purple-bg)',
          'purple-text': 'var(--s-purple-text)',
        },
      },
      fontFamily: {
        sans: ['Instrument Sans', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
      },
    },
  },
  plugins: [],
};
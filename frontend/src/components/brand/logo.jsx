import { Link } from 'react-router-dom';

const SIZES = {
  xs: { box: 32,  font: 20, gap: 4  },
  sm: { box: 40,  font: 24, gap: 5  },
  md: { box: 52,  font: 30, gap: 6  },
  lg: { box: 64,  font: 38, gap: 7  },
  xl: { box: 80,  font: 48, gap: 8  },
};

const THEME = {
  dark:  { text: '#0D1A13', bg: 'transparent',            padding: 0,          borderRadius: 0 },
  light: { text: '#ffffff', bg: 'transparent',            padding: 0,          borderRadius: 0 },
  white: { text: '#ffffff', bg: 'rgba(13, 26, 19, 0.85)', padding: '6px 14px', borderRadius: 8 },
};

export default function Logo({
  size      = 'md',
  variant   = 'full',
  theme     = 'dark',
  href      = '/',
  noLink    = false,
  style     = {},
  className = '',
}) {
  const s = SIZES[size]  ?? SIZES.md;
  const t = THEME[theme] ?? THEME.dark;

  const IconMark = () => (
    <div style={{ height: s.box, width: s.box, flexShrink: 0, overflow: 'hidden', margin: '-12%' }}>
      <img
        src="/mira-logo.png"
        alt="Miravance"
        style={{ height: '125%', width: '125%', objectFit: 'contain', display: 'block', margin: '-12.5%' }}
      />
    </div>
  );

  const Wordmark = () => (
    <span style={{
      fontFamily: "'Instrument Serif', Georgia, serif",
      fontSize: s.font, color: t.text,
      letterSpacing: '-0.01em', lineHeight: 1, userSelect: 'none',
    }}>
      Miravance
    </span>
  );

  const inner = (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center',
        gap: variant === 'icon' ? 0 : s.gap,
        background: t.bg, padding: t.padding, borderRadius: t.borderRadius,
        backdropFilter: theme === 'white' ? 'blur(4px)' : 'none',
        transition: 'background 0.2s ease',
        ...style,
      }}
      className={className}
    >
      {(variant === 'full' || variant === 'icon') && <IconMark />}
      {(variant === 'full' || variant === 'wordmark') && <Wordmark />}
    </div>
  );

  if (noLink) return inner;
  return (
    <Link to={href} style={{ textDecoration: 'none', display: 'inline-flex', flexShrink: 0 }}>
      {inner}
    </Link>
  );
}
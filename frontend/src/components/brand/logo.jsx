zz// src/components/brand/Logo.jsx

import { Link } from 'react-router-dom';

const SIZES = {
  xs: { box: 32, font: 18, gap: 7  },
  sm: { box: 40, font: 21, gap: 8  },
  md: { box: 48, font: 26, gap: 10 },
  lg: { box: 58, font: 32, gap: 12 },
  xl: { box: 72, font: 42, gap: 16 },
};

function Wordmark({ fontSize }) {
  return (
    <span style={{
      fontFamily: "'DM Sans', system-ui, sans-serif",
      fontSize, lineHeight: 1, letterSpacing: '-0.03em',
      fontWeight: 700, userSelect: 'none', color: '#ffffff',
    }}>
      Cierlo
    </span>
  );
}

export default function Logo({
  size       = 'md',
  variant    = 'full',  // 'full' | 'icon'
  href       = '/',
  noLink     = false,
  style      = {},
  className  = '',
  responsive = false,
  // legacy props — accepted, ignored
  theme, light, darkBg,
}) {
  const s = SIZES[size] ?? SIZES.md;

  const icon = (
    <img
      src="/cierlo_logo.png"
      alt="Cierlo"
      style={{ height: s.box, width: 'auto', display: 'block', flexShrink: 0 }}
    />
  );

  const full = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: s.gap }}>
      {icon}
      <Wordmark fontSize={s.font} />
    </div>
  );

  const inner = responsive ? (
    <div style={{ display: 'inline-flex', alignItems: 'center', ...style }} className={className}>
      <span className="cl-logo-full">{full}</span>
      <span className="cl-logo-icon" style={{ display: 'none' }}>{icon}</span>
      <style>{`
        @media(max-width:640px){
          .cl-logo-full { display: none !important; }
          .cl-logo-icon { display: inline-flex !important; }
        }
      `}</style>
    </div>
  ) : (
    <div style={{ display: 'inline-flex', alignItems: 'center', ...style }} className={className}>
      {variant === 'icon' ? icon : full}
    </div>
  );

  if (noLink) return inner;
  return (
    <Link to={href} style={{ textDecoration: 'none', display: 'inline-flex', flexShrink: 0 }}>
      {inner}
    </Link>
  );
}
// src/modules/superAdmin/components/index.jsx
// Shared primitives for the super-admin module

// ─── Stat Card ────────────────────────────────────────────
export function StatCard({ label, value, sub, delta, deltaDir, accent = false }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-soft)',
      borderRadius: 10,
      padding: '14px 16px',
    }}>
      <p style={{
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '.7px', color: 'var(--text-muted)', marginBottom: 6,
      }}>
        {label}
      </p>
      <p style={{
        fontSize: 26, fontWeight: 700, lineHeight: 1, letterSpacing: '-.5px',
        color: accent ? 'var(--brand)' : 'var(--text-base)',
        marginBottom: 4,
      }}>
        {value ?? '—'}
      </p>
      {(sub || delta) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {delta && (
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: deltaDir === 'up' ? 'var(--s-green-text)' : 'var(--s-red-text)',
            }}>
              {deltaDir === 'up' ? '▲' : '▼'} {delta}
            </span>
          )}
          {sub && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────
export function Card({ title, action, children, noPad = false }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-soft)',
      borderRadius: 10,
    }}>
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px 10px',
          borderBottom: '1px solid var(--border-soft)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-base)' }}>{title}</span>
          {action}
        </div>
      )}
      <div style={noPad ? {} : { padding: '14px 16px' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────
const BADGE_MAP = {
  active:    { bg: 'var(--s-green-bg)',  color: 'var(--s-green-text)'  },
  trial:     { bg: 'var(--s-blue-bg)',   color: 'var(--s-blue-text)'   },
  suspended: { bg: 'var(--s-red-bg)',    color: 'var(--s-red-text)'    },
  inactive:  { bg: 'var(--s-gray-bg)',   color: 'var(--s-gray-text)'   },

  ok:        { bg: 'var(--s-green-bg)',  color: 'var(--s-green-text)'  },
  error:     { bg: 'var(--s-red-bg)',    color: 'var(--s-red-text)'    },
  warning:   { bg: 'var(--s-yellow-bg)', color: 'var(--s-yellow-text)' },
};

export function Badge({ status, label }) {
  const s = BADGE_MAP[status] || BADGE_MAP.inactive;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 99,
      fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {label || status}
    </span>
  );
}

// ─── Simple bar chart (no external deps) ──────────────────
export function BarChart({ data = [], height = 120, color = 'var(--brand)' }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div
            key={i}
            title={`${d.label}: ${d.value}`}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'flex-end', height: '100%',
            }}
          >
            <div style={{
              width: '100%', borderRadius: '2px 2px 0 0',
              height: `${pct > 0 ? Math.max(pct, 4) : 2}%`,
              background: pct > 0 ? color : 'var(--bg-muted)',
              opacity: pct > 0 ? 1 : 0.4,
              transition: 'height .4s ease',
            }} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Loading spinner ──────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48 }}>
      <div style={{
        width: 28, height: 28,
        border: '2px solid var(--border-base)',
        borderTopColor: 'var(--brand)',
        borderRadius: '50%',
        animation: 'spin .7s linear infinite',
      }} />
    </div>
  );
}

// ─── Page header ──────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 20,
    }}>
      <div>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-base)', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────
export function Table({ columns, rows, onRowClick, emptyText = 'No data yet.' }) {
  if (!rows?.length) {
    return <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '20px 16px' }}>{emptyText}</p>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{
                textAlign: 'left', fontSize: 11, fontWeight: 600,
                color: 'var(--text-muted)', textTransform: 'uppercase',
                letterSpacing: '.5px', padding: '8px 12px',
                background: 'var(--bg-subtle)',
                borderBottom: '1px solid var(--border-soft)',
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id || i}
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background = 'rgba(255,235,210,.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {columns.map(col => (
                <td key={col.key} style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border-soft)',
                  fontSize: 13, color: col.bold ? 'var(--text-base)' : 'var(--text-sub)',
                  fontWeight: col.bold ? 500 : 400,
                }}>
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Donut chart (SVG) ────────────────────────────────────
export function DonutChart({ segments = [], size = 120, strokeWidth = 18 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const gap  = circ - dash;
        const el = (
          <circle
            key={i}
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}
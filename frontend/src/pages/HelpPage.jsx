import PublicLayout from '../components/layout/PublicLayout';
import { Link } from 'react-router-dom';
import { BookOpen, MessageCircle, FileText, Activity, Star } from 'lucide-react';

const CARDS = [
  {
    icon: BookOpen,
    color: '#3b82f6',
    title: 'Documentation',
    desc: 'Step-by-step guides for every module — reservations, billing, housekeeping, staff, and more.',
    link: '/help/docs',
    cta: 'Browse docs',
  },
  {
    icon: MessageCircle,
    color: '#10b981',
    title: 'Contact Support',
    desc: 'Can\'t find your answer? Send us a message and we\'ll get back to you within 24 hours.',
    link: '/help/support',
    cta: 'Get help',
  },
  {
    icon: Star,
    color: '#f59e0b',
    title: 'Feature Requests',
    desc: 'Have an idea? Tell us what would make Cierlo work better for your hotel.',
    link: '/help/feedback',
    cta: 'Share feedback',
  },
  {
    icon: Activity,
    color: '#8b5cf6',
    title: 'System Status',
    desc: 'Check the current status of the Cierlo platform and any ongoing incidents.',
    link: '/help/status',
    cta: 'View status',
  },
];

const POPULAR = [
  { q: 'How do I add room types and rooms?',          link: '/help/docs' },
  { q: 'How do I invite staff members?',              link: '/help/docs' },
  { q: 'How does the guest booking website work?',    link: '/help/docs' },
  { q: 'How do I post charges to a guest folio?',     link: '/help/docs' },
  { q: 'How do I assign housekeeping tasks?',         link: '/help/docs' },
  { q: 'How do I set up payment methods?',            link: '/help/docs' },
];

export default function HelpPage() {
  return (
    <PublicLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '100px 24px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>Help Centre</p>
          <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 600, color: 'var(--text-base)', marginBottom: 12 }}>
            How can we help?
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-sub)', maxWidth: 440, margin: '0 auto' }}>
            Find answers, read the docs, or reach out to the support team.
          </p>
        </div>

        {/* Hub cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 56 }}>
          {CARDS.map(({ icon: Icon, color, title, desc, link, cta }) => (
            <Link key={title} to={link} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: 24, height: '100%', transition: 'border-color .15s, transform .15s', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={19} style={{ color }} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-base)', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 16 }}>{desc}</p>
                <span style={{ fontSize: 13, fontWeight: 500, color }}>
                  {cta} →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Popular questions */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-base)', marginBottom: 16 }}>Popular articles</h2>
          <div style={{ border: '1px solid var(--border-soft)', borderRadius: 12, overflow: 'hidden' }}>
            {POPULAR.map(({ q, link }, i) => (
              <Link key={q} to={link} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px', borderBottom: i < POPULAR.length - 1 ? '1px solid var(--border-soft)' : 'none',
                  background: 'var(--bg-surface)', transition: 'background .12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}>
                  <span style={{ fontSize: 14, color: 'var(--text-base)' }}>{q}</span>
                  <FileText size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: 12 }} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Still stuck */}
        <div style={{ textAlign: 'center', marginTop: 56, padding: '32px 24px', border: '1px solid var(--border-soft)', borderRadius: 14, background: 'var(--bg-surface)' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-base)', marginBottom: 6 }}>Still stuck?</p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Our support team is a message away. We respond within 24 hours on business days.</p>
          <Link to="/help/support" className="btn-primary" style={{ display: 'inline-flex', padding: '10px 24px', fontSize: 14 }}>
            Contact support
          </Link>
        </div>

      </div>
    </PublicLayout>
  );
}
import PublicLayout from '../components/layout/PublicLayout';

const sans  = "'DM Sans', system-ui, sans-serif";
const serif = "'Cormorant Garamond', Georgia, serif";


const SECTIONS = [
  { title: 'What data we collect', body: `We collect information you provide directly: hotel and organisation details, staff account information (name, email, role), guest profiles (name, contact, stay history), reservation and billing records, and configuration settings. We also collect usage data such as log files, IP addresses, and feature usage patterns to improve the Service.` },
  { title: 'How we use your data', body: `We use your data solely to provide, maintain, and improve the Cierlo service. This includes: processing reservations and billing, sending transactional emails (booking confirmations, receipts), providing customer support, and generating aggregate analytics to improve product features. We do not use your data for advertising.` },
  { title: 'Data storage & security', body: `All data is stored in encrypted databases hosted on Supabase (PostgreSQL) with servers in secure data centres. We use TLS encryption for all data in transit. Access to production databases is restricted to authorised Cierlo engineers. We perform regular backups and security audits.` },
  { title: 'Data sharing', body: `We do not sell, rent, or share your data with third parties for their own purposes. We may share data with: (a) infrastructure providers (Supabase, Cloudflare) strictly to operate the Service; (b) payment processors (Paystack) only when you enable card payments; (c) law enforcement when legally required. All third-party processors are bound by confidentiality agreements.` },
  { title: 'Guest data', body: `Hotel guest data entered into Cierlo (names, contact details, stay history, payment info) is owned by you — the hotel operator. You are responsible for ensuring guests are informed about how their data is used per your local data protection laws. We process guest data as a data processor on your behalf.` },
  { title: 'Data retention', body: `Active account data is retained for the duration of your subscription. After account cancellation, data is retained for 30 days before permanent deletion. You may request data export at any time through Settings → Export. Billing records may be retained longer as required by applicable tax laws.` },
  { title: 'Your rights', body: `Depending on your jurisdiction, you may have rights to: access your personal data, correct inaccurate data, request deletion, restrict processing, and data portability. To exercise these rights, contact privacy@cierlo.com. We will respond within 30 days.` },
  { title: 'Cookies', body: `We use essential cookies for session management and authentication only. We do not use tracking cookies or third-party advertising cookies. You may disable cookies in your browser, but this will prevent you from logging in.` },
  { title: 'Changes to this policy', body: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or in-app notice at least 14 days before they take effect.` },
  { title: 'Contact', body: `For privacy-related questions or data requests, contact us at privacy@cierlo.com.` },
];

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <div style={{ paddingTop: 64, minHeight: '80vh' }}>
        <div style={{ background:'var(--sidebar-bg)', padding: '64px 24px 56px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color:'var(--text-muted)', marginBottom: 16, fontFamily: sans }}>Legal</p>
            <h1 style={{ fontFamily: serif, fontSize: 'clamp(36px,5vw,52px)', fontWeight: 600, color:'var(--text-base)', lineHeight: 1.15, margin: '0 0 12px' }}>Privacy Policy</h1>
            <p style={{ fontSize: 14, color:'var(--text-muted)', fontFamily: sans }}>Last updated: March 2026</p>
          </div>
        </div>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 80px' }}>
          {SECTIONS.map((s, i) => (
            <div key={s.title} style={{ paddingBottom: 32, marginBottom: 32, borderBottom: i < SECTIONS.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
              <h2 style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color:'var(--text-base)', marginBottom: 10 }}>{s.title}</h2>
              <p style={{ fontSize: 14, color:'var(--text-sub)', lineHeight: 1.85, fontFamily: sans }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
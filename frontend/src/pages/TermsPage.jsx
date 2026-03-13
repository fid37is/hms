import PublicLayout from '../components/layout/PublicLayout';


const SECTIONS = [
  { title: '1. Acceptance of Terms', body: `By accessing or using Cierlo ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. These terms apply to all users, including hotel administrators, staff members, and any third parties who access the platform.` },
  { title: '2. Description of Service', body: `Cierlo is a cloud-based hotel management system (HMS) that provides tools for managing reservations, billing, housekeeping, staff, inventory, food & beverage, and related hotel operations. We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice.` },
  { title: '3. Account Registration', body: `You must provide accurate, complete, and current information when registering. You are responsible for maintaining the confidentiality of your credentials and for all activities under your account. You must notify us immediately of any unauthorised use.` },
  { title: '4. Data & Privacy', body: `Your use of the Service is also governed by our Privacy Policy. All guest data, reservation records, financial data, and organisational data you enter into Cierlo remains your property. We process this data solely to provide the Service. We do not sell your data to third parties.` },
  { title: '5. Acceptable Use', body: `You agree not to: (a) violate any applicable laws; (b) transmit malicious code or attempt unauthorised access to our systems; (c) interfere with other users; (d) reproduce or resell access to the Service without permission; (e) use the Service for any purpose other than hotel management operations.` },
  { title: '6. Payment & Billing', body: `Paid plans are billed in advance monthly or annually. All fees are non-refundable except as required by law. We reserve the right to change pricing with 30 days' notice. Failure to pay may result in suspension of your account.` },
  { title: '7. Free Trial', body: `New accounts receive a 14-day free trial with full access. No credit card required during trial. At the end of the trial you must subscribe to continue using the Service. Trial data is retained for 30 days after expiry.` },
  { title: '8. Termination', body: `Either party may terminate at any time. Upon termination your access ceases immediately. You may export your data during your active subscription. After termination we retain your data for 30 days before permanent deletion.` },
  { title: '9. Limitation of Liability', body: `To the maximum extent permitted by law, Cierlo shall not be liable for indirect, incidental, or consequential damages. Our total liability shall not exceed amounts paid in the 12 months preceding the claim.` },
  { title: '10. Changes to Terms', body: `We may update these Terms at any time with 14 days' notice for significant changes. Continued use constitutes acceptance of new terms.` },
  { title: '11. Contact', body: `Questions about these Terms? Contact us at legal@cierlo.com.` },
];

export default function TermsPage() {
  return (
    <PublicLayout>
      <div style={{ paddingTop: 64, minHeight: '80vh' }}>
        <div style={{ background:'var(--sidebar-bg)', padding: '64px 24px 56px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 16, fontFamily: sans }}>Legal</p>
            <h1 style={{ fontFamily: serif, fontSize: 'clamp(36px,5vw,52px)', fontWeight: 600, color:'var(--text-on-brand)', lineHeight: 1.15, margin: '0 0 12px' }}>Terms of Service</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.4)', fontFamily: sans }}>Last updated: March 2026</p>
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
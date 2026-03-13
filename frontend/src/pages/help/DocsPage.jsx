import PublicLayout from '../../components/layout/PublicLayout';
import { useState } from 'react';
import { ChevronRight, ChevronDown, Search, BookOpen } from 'lucide-react';

const DOCS = [
  {
    section: 'Getting Started',
    articles: [
      { title: 'Setting up your hotel', content: `After registering, fill in your Hotel Config under Settings. Add your hotel name, address, contact details, check-in/check-out times, and tax rates.\n\nNext, create your room types (e.g. Standard, Deluxe, Suite) under Rooms → Room Types, then add individual rooms with their type, floor, and status.` },
      { title: 'Inviting staff', content: `Go to Settings → Users and click "Add User". Enter their name, email, and assign a role. They'll receive a temporary password and be prompted to change it on first login.\n\nRoles control what each user can see and do. Configure roles under Settings → Roles.` },
      { title: 'Understanding roles & permissions', content: `Every user has a role. Each role has a set of permissions (e.g. reservations:read, billing:charge). Permissions control which sidebar items and actions are visible.\n\nAdmin users have full access. Other roles are limited to their assigned permissions. You can edit role permissions under Settings → Roles at any time.` },
    ],
  },
  {
    section: 'Reservations',
    articles: [
      { title: 'Creating a reservation', content: `Go to Reservations → New Reservation. Select the guest (or create a new one), choose the room, set check-in and check-out dates, and confirm the rate.\n\nThe system will auto-calculate the total based on nights × room rate plus applicable taxes and service charges from your Hotel Config.` },
      { title: 'Check-in & check-out', content: `Find the reservation in the list. Click into it and use the Check In button when the guest arrives — this changes the room status to Occupied.\n\nAt check-out, ensure the folio is settled. Click Check Out to release the room and mark the reservation as completed.` },
      { title: 'Extending a stay', content: `Open the reservation and click Extend Stay. Select the new check-out date. The system will add the additional nights to the folio automatically.` },
    ],
  },
  {
    section: 'Billing & Folios',
    articles: [
      { title: 'How folios work', content: `Every reservation has a folio — a running tab of all charges. Room charges are posted automatically each night. Additional charges (F&B, laundry, etc.) can be posted manually or from the F&B module.\n\nYou can view the folio from inside the reservation or from the Billing page.` },
      { title: 'Posting charges', content: `Open the folio and click Add Charge. Select the charge type, enter the amount, and optionally add a description. Charges are posted immediately and reflected in the folio total.` },
      { title: 'Processing payments', content: `On the folio, click Add Payment. Select the payment method (cash, card, bank transfer), enter the amount, and confirm. Once the total paid equals total charges, the folio status changes to Settled.` },
    ],
  },
  {
    section: 'Housekeeping',
    articles: [
      { title: 'Assigning tasks', content: `Go to Housekeeping → Tasks. Click New Task, select the room, type (clean, turndown, deep clean), and assign it to a housekeeper. The assigned staff member will see it in their dashboard.` },
      { title: 'Updating room status', content: `Housekeepers can update room status (Clean, Dirty, Out of Order) from the Housekeeping page. This feeds directly into the Rooms module so front desk always knows the current state.` },
    ],
  },
  {
    section: 'F&B',
    articles: [
      { title: 'Setting up outlets', content: `Go to F&B → Outlets to create your restaurant, bar, or room service outlet. Each outlet has its own menu and order queue.` },
      { title: 'Taking orders', content: `Select the outlet, choose the table or room, and add items from the menu. Orders go to the kitchen queue. Once fulfilled, bill directly to a guest folio or collect payment separately.` },
    ],
  },
  {
    section: 'Settings',
    articles: [
      { title: 'Hotel Config', content: `Hotel Config (Settings → Hotel Config) is the central place for your property details: name, address, contact, social media, payment methods, tax rates, check-in times, and policies. Changes here reflect across the entire system and your booking website.` },
      { title: 'Connecting your booking website', content: `Go to Settings → Website. Your guest website is hosted at your org slug subdomain. Generate an API key under API Keys and add it to your website's environment as VITE_HMS_API_KEY. The website will use this key to fetch availability and accept bookings.` },
    ],
  },
];

export default function DocsPage() {
  const [openSection, setOpenSection] = useState('Getting Started');
  const [openArticle, setOpenArticle] = useState(DOCS[0].articles[0].title);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? DOCS.map(s => ({
        ...s,
        articles: s.articles.filter(a =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.content.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(s => s.articles.length)
    : DOCS;

  const current = DOCS.flatMap(s => s.articles).find(a => a.title === openArticle);

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto pb-8 pt-20" style={{ padding: '80px 24px 48px' }}>
        <div className="relative mb-6">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input pl-9 w-full" placeholder="Search documentation…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="flex gap-5 items-start">
          {/* Sidebar nav */}
          <div className="w-52 flex-shrink-0 sticky top-20 space-y-0.5">
            {filtered.map(({ section, articles }) => (
              <div key={section}>
                <button onClick={() => setOpenSection(s => s === section ? '' : section)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-left"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {section}
                  {openSection === section ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                {openSection === section && articles.map(a => (
                  <button key={a.title} onClick={() => setOpenArticle(a.title)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{
                      background: openArticle === a.title ? 'var(--brand-subtle)' : 'none',
                      color: openArticle === a.title ? 'var(--brand)' : 'var(--text-base)',
                      border: 'none', cursor: 'pointer', fontWeight: openArticle === a.title ? 600 : 400,
                    }}
                    onMouseEnter={e => openArticle !== a.title && (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                    onMouseLeave={e => openArticle !== a.title && (e.currentTarget.style.backgroundColor = 'transparent')}>
                    {a.title}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Article */}
          <div className="flex-1 card p-6 min-h-96">
            {current ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={14} style={{ color: 'var(--brand)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {DOCS.find(s => s.articles.some(a => a.title === current.title))?.section}
                  </span>
                </div>
                <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-base)' }}>{current.title}</h2>
                <div className="space-y-3">
                  {current.content.split('\n\n').map((para, i) => (
                    <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{para}</p>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No results found for "{search}".</p>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
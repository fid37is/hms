import { useState, useRef, useEffect } from 'react';
import { Search, Plus, User } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as guestApi from '../../../lib/api/guestApi';
import toast from 'react-hot-toast';

export default function GuestSearch({ selected, onSelect }) {
  const [q,        setQ]        = useState('');
  const [open,     setOpen]     = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGuest, setNewGuest] = useState(() => ({ full_name: '', phone: '', email: '' }));
  const ref = useRef(null);

  const { data } = useQuery({
    queryKey: ['guest-search', q],
    queryFn:  () => guestApi.searchGuests(q).then(r => r.data.data),
    enabled:  q.length >= 2,
  });

  const create = useMutation({
    mutationFn: (d) => guestApi.createGuest(d),
    onSuccess: (res) => {
      onSelect(res.data.data);
      setCreating(false); setOpen(false); setQ('');
      toast.success('Guest created');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create guest'),
  });

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Stable handler — no inline arrow functions
  const handleGuestChange = (e) => {
    const { name, value } = e.target;
    setNewGuest(prev => ({ ...prev, [name]: value }));
  };

  if (selected) return (
    <div className="flex items-center justify-between px-3 py-2 rounded-md border"
      style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-soft)' }}>
      <div className="flex items-center gap-2">
        <User size={14} style={{ color: 'var(--text-muted)' }} />
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{selected.full_name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selected.phone || selected.email}</p>
        </div>
      </div>
      <button type="button" onClick={() => onSelect(null)}
        className="text-xs" style={{ color: 'var(--text-muted)' }}>Change</button>
    </div>
  );

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }} />
        <input
          className="input pl-8"
          placeholder="Search by name or phone…"
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && (q.length >= 2 || creating) && (
        <div className="absolute z-20 w-full mt-1 rounded-lg border overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor:     'var(--border-soft)',
            boxShadow:       'var(--shadow-md)',
          }}>
          {!creating ? (
            <>
              {(data || []).map(g => (
                <button type="button" key={g.id}
                  onClick={() => { onSelect(g); setOpen(false); setQ(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase flex-shrink-0"
                    style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
                    {g.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{g.full_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.phone || g.email || '—'}</p>
                  </div>
                </button>
              ))}
              {!data?.length && q.length >= 2 && (
                <p className="px-3 py-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>No guests found</p>
              )}
              <div style={{ borderTop: '1px solid var(--border-soft)' }}>
                <button type="button"
                  onClick={() => { setCreating(true); setNewGuest({ full_name: q, phone: '', email: '' }); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors"
                  style={{ color: 'var(--brand)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Plus size={14} /> Create new guest
                </button>
              </div>
            </>
          ) : (
            <div className="p-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}>New Guest</p>

              <div className="form-group">
                <label className="label" htmlFor="gs-full_name">Full Name *</label>
                <input id="gs-full_name" name="full_name" className="input" required
                  value={newGuest.full_name} onChange={handleGuestChange} />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="gs-phone">Phone *</label>
                <input id="gs-phone" name="phone" type="tel" className="input" required
                  value={newGuest.phone} onChange={handleGuestChange} />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="gs-email">Email</label>
                <input id="gs-email" name="email" type="email" className="input"
                  value={newGuest.email} onChange={handleGuestChange} />
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => create.mutate(newGuest)}
                  disabled={create.isPending} className="btn-primary text-xs px-3 py-1.5">
                  {create.isPending ? 'Saving…' : 'Create Guest'}
                </button>
                <button type="button" onClick={() => setCreating(false)}
                  className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

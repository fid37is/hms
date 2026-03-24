import { useState, useRef, useEffect } from 'react';
import { useQueryClient }   from '@tanstack/react-query';
import { useNavigate }      from 'react-router-dom';
import { ChevronDown, Check, Building2, Plus, X } from 'lucide-react';
import { useAuthStore }     from '../../store/authStore';
import * as authApi         from '../../lib/api/authApi';
import toast                from 'react-hot-toast';

export default function OrgSwitcher() {
  const { org, orgs, switchOrg, setOrgs } = useAuthStore();
  const qc       = useQueryClient();
  const navigate = useNavigate();
  const [open,     setOpen]    = useState(false);
  const [adding,   setAdding]  = useState(false);
  const [newName,  setNewName] = useState('');
  const [loading,  setLoading] = useState(null);
  const [creating, setCreating] = useState(false);
  const ref = useRef(null);

  // Hydrate orgs from server if store is empty (old session)
  useEffect(() => {
    if (org && (!orgs || orgs.length === 0)) {
      authApi.getUserOrgs()
        .then(res => { if (setOrgs && res.data.data?.length) setOrgs(res.data.data); })
        .catch(() => {});
    }
  }, [org]);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false); setAdding(false); setNewName('');
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (!org) return null;

  const handleSwitch = async (targetOrgId) => {
    if (targetOrgId === org?.id) { setOpen(false); return; }
    setLoading(targetOrgId);
    try {
      const res = await authApi.switchOrg(targetOrgId);
      const { access_token, user, org: newOrg, orgs: freshOrgs } = res.data.data;
      switchOrg({ user, token: access_token, org: newOrg, orgs: freshOrgs });
      qc.clear();
      setOpen(false);
      navigate('/dashboard');
      toast.success(`Switched to ${newOrg.name}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to switch property');
    } finally {
      setLoading(null);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await authApi.createOrg(newName.trim());
      const newOrg = res.data.data;
      const orgsRes = await authApi.getUserOrgs();
      const freshOrgs = orgsRes.data.data || [];
      if (setOrgs) setOrgs(freshOrgs);
      setAdding(false);
      setNewName('');
      setOpen(false);
      toast.success(`${newOrg.name} created — switching now…`);
      await handleSwitch(newOrg.org_id);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create property');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button — always visible */}
      <button
        onClick={() => { setOpen(v => !v); setAdding(false); }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          color: 'var(--text-base)',
          background: open ? 'var(--bg-subtle)' : 'transparent',
          border: '1px solid var(--border-soft)',
          cursor: 'pointer', maxWidth: 200,
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
        onMouseLeave={e => { if (!open) e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        <Building2 size={13} style={{ color: 'var(--brand)', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {org?.name}
        </span>
        <ChevronDown size={12} style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 200,
          background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
          borderRadius: 12, padding: 6, minWidth: 230,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }}>
          {/* Properties list — only if 2+ orgs */}
          {orgs && orgs.length > 1 && (
            <>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-muted)', padding: '6px 10px 8px' }}>
                Your properties
              </p>
              {orgs.map(o => (
                <button key={o.org_id} onClick={() => handleSwitch(o.org_id)}
                  disabled={!!loading}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '9px 10px', borderRadius: 8, border: 'none',
                    cursor: loading ? 'wait' : 'pointer', textAlign: 'left',
                    background: o.org_id === org?.id ? 'var(--brand-subtle)' : 'transparent',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => { if (o.org_id !== org?.id) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                  onMouseLeave={e => { if (o.org_id !== org?.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Building2 size={13} style={{ color: o.org_id === org?.id ? 'var(--brand)' : 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: o.org_id === org?.id ? 'var(--brand)' : 'var(--text-base)', fontWeight: o.org_id === org?.id ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.name}
                  </span>
                  {loading === o.org_id && (
                    <div style={{ width: 13, height: 13, border: '2px solid var(--brand)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .6s linear infinite', flexShrink: 0 }} />
                  )}
                  {o.org_id === org?.id && !loading && (
                    <Check size={13} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                  )}
                </button>
              ))}
              <div style={{ height: 1, background: 'var(--border-soft)', margin: '6px 4px' }} />
            </>
          )}

          {/* Add property section */}
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 10px', borderRadius: 8, fontSize: 13,
                color: 'var(--text-muted)', background: 'none', border: 'none',
                cursor: 'pointer', transition: 'background .12s', textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-base)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Plus size={14} />
              Add another property
            </button>
          ) : (
            <div style={{ padding: '8px 6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-base)' }}>New property name</span>
                <button onClick={() => { setAdding(false); setNewName(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                  <X size={13} />
                </button>
              </div>
              <input
                autoFocus
                className="input"
                style={{ fontSize: 12, padding: '7px 10px', marginBottom: 6 }}
                placeholder="e.g. Grand View Hotel Abuja"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setAdding(false); setNewName(''); } }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>14-day free trial</span> included. Each property has its own separate subscription.
              </div>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="btn-primary"
                style={{ width: '100%', fontSize: 12, padding: '8px', justifyContent: 'center' }}
              >
                {creating ? 'Creating…' : 'Create property'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
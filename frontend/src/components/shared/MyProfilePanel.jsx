// src/components/shared/MyProfilePanel.jsx
// Staff/admin personal profile — shown as a SlidePanel from the sidebar popup.

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Briefcase, Shield, Clock, KeyRound, Save, Camera, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import SlidePanel from './SlidePanel';
import ChangePasswordModal from './ChangePasswordModal';
import * as authApi from '../../lib/api/authApi';
import { useAuthStore } from '../../store/authStore';

export default function MyProfilePanel({ open, onClose }) {
  const qc                      = useQueryClient();
  const { user: storeUser }     = useAuthStore();
  const [changePw, setChangePw] = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [form,     setForm]     = useState(null);
  const fileInputRef            = useRef(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn:  () => authApi.getProfile().then(r => r.data?.data || r.data),
    enabled:  open,
  });

  const save = useMutation({
    mutationFn: (d) => authApi.updateProfile(d),
    onSuccess:  () => { toast.success('Profile updated'); setEditing(false); qc.invalidateQueries({ queryKey: ['my-profile'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed to update profile'),
  });

  const avatarUpload = useMutation({
    mutationFn: (file) => authApi.uploadAvatar(file),
    onSuccess:  () => { toast.success('Avatar updated'); qc.invalidateQueries({ queryKey: ['my-profile'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed to upload avatar'),
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    avatarUpload.mutate(file);
  };

  const p = profile || storeUser;

  return (
    <>
      <SlidePanel open={open} onClose={onClose} title="My Profile">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="space-y-5 p-1">

            {/* Avatar + name */}
            <div className="flex items-center gap-4 pb-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold uppercase"
                  style={{ backgroundColor: 'var(--sidebar-item-active)', color: 'var(--accent)' }}>
                  {p?.avatar_url
                    ? <img src={p.avatar_url} alt={p?.full_name} className="w-full h-full object-cover" />
                    : (p?.full_name?.charAt(0) || 'U')}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUpload.isPending}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--brand)', color: '#fff', border: '2px solid var(--bg-surface)' }}>
                  {avatarUpload.isPending
                    ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    : <Camera size={11} />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-base)' }}>{p?.full_name}</p>
                <p className="text-sm capitalize" style={{ color: 'var(--text-muted)' }}>{p?.role?.name || storeUser?.role}</p>
              </div>
            </div>

            {/* Fields */}
            {editing && form ? (
              <div className="space-y-4">
                <div className="form-group">
                  <label className="label">Full Name</label>
                  <input className="input" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Department</label>
                  <input className="input" value={form.department} placeholder="e.g. Front Desk" onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone} placeholder="+234..." onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                  <button onClick={() => save.mutate(form)} disabled={save.isPending} className="btn-primary flex-1 justify-center flex items-center gap-1.5">
                    <Save size={13} /> {save.isPending ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  {[
                    { icon: Mail,      label: 'Email',       value: p?.email },
                    { icon: Briefcase, label: 'Department',  value: p?.department || '—' },
                    { icon: Phone,     label: 'Phone',       value: p?.phone || '—' },
                    { icon: Shield,    label: 'Role',        value: p?.role?.name || storeUser?.role },
                    { icon: Clock,     label: 'Last Login',  value: p?.last_login ? new Date(p.last_login).toLocaleString() : '—' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                      <Icon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span className="text-xs w-24 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--text-base)' }}>{value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { setEditing(true); setForm({ full_name: p?.full_name || '', department: p?.department || '', phone: p?.phone || '' }); }}
                    className="btn-secondary flex-1 justify-center text-sm">
                    Edit Profile
                  </button>
                  <button onClick={() => setChangePw(true)} className="btn-secondary flex-1 justify-center text-sm flex items-center gap-1.5">
                    <KeyRound size={13} /> Password
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </SlidePanel>

      <ChangePasswordModal open={changePw} onClose={() => setChangePw(false)} />
    </>
  );
}
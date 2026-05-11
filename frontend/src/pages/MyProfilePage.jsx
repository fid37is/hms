// src/pages/MyProfilePage.jsx
// Personal profile page for the logged-in staff/admin user.
// Accessible from the sidebar user popup — separate from hotel Settings.

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Briefcase, Building2, Shield, Clock, KeyRound, Save, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import * as authApi from '../lib/api/authApi';
import { useAuthStore } from '../store/authStore';
import ChangePasswordModal from '../components/shared/ChangePasswordModal';

export default function MyProfilePage() {
  const qc                    = useQueryClient();
  const { user: storeUser }   = useAuthStore();
  const [changePw, setChangePw] = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [form,     setForm]     = useState(null);
  const fileInputRef            = React.useRef(null);

  const avatarUpload = useMutation({
    mutationFn: (file) => authApi.uploadAvatar(file),
    onSuccess:  (res) => {
      toast.success('Avatar updated');
      qc.invalidateQueries({ queryKey: ['my-profile'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to upload avatar'),
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    avatarUpload.mutate(file);
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn:  () => authApi.getProfile().then(r => r.data?.data || r.data),
    onSuccess: (d) => { if (!form) setForm({ full_name: d.full_name, department: d.department || '', phone: d.phone || '' }); },
  });

  const save = useMutation({
    mutationFn: (d) => authApi.updateProfile(d),
    onSuccess:  () => { toast.success('Profile updated'); setEditing(false); qc.invalidateQueries({ queryKey: ['my-profile'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed to update profile'),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent' }} />
    </div>
  );

  const p = profile || storeUser;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-base)' }}>My Profile</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage your personal information</p>
        </div>
        {!editing && (
          <button onClick={() => { setEditing(true); setForm({ full_name: p?.full_name || '', department: p?.department || '', phone: p?.phone || '' }); }}
            className="btn-secondary text-sm flex items-center gap-1.5">
            Edit Profile
          </button>
        )}
      </div>

      {/* Avatar + name card */}
      <div className="rounded-2xl p-6 flex items-center gap-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-soft)' }}>
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold uppercase"
            style={{ backgroundColor: 'var(--sidebar-item-active)', color: 'var(--accent)' }}>
            {p?.avatar_url
              ? <img src={p.avatar_url} alt={p.full_name} className="w-full h-full object-cover" />
              : (p?.full_name?.charAt(0) || 'U')}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUpload.isPending}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--brand)', color: '#fff', border: '2px solid var(--bg-surface)' }}
            title="Upload avatar">
            {avatarUpload.isPending
              ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              : <Camera size={11} />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="text-lg font-semibold" style={{ color: 'var(--text-base)' }}>{p?.full_name}</p>
          <p className="text-sm capitalize" style={{ color: 'var(--text-muted)' }}>{p?.role?.name || storeUser?.role}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p?.email}</p>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-soft)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Personal Information</p>
        </div>

        {editing && form ? (
          <div className="p-5 space-y-4">
            <div className="form-group">
              <label className="label">Full Name</label>
              <input className="input" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Department</label>
              <input className="input" value={form.department} placeholder="e.g. Front Desk, Management" onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Phone</label>
              <input className="input" value={form.phone} placeholder="+234..." onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={() => save.mutate(form)} disabled={save.isPending} className="btn-primary flex-1 justify-center flex items-center gap-1.5">
                <Save size={14} /> {save.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
            {[
              { icon: User,      label: 'Full Name',   value: p?.full_name },
              { icon: Mail,      label: 'Email',       value: p?.email },
              { icon: Briefcase, label: 'Department',  value: p?.department || '—' },
              { icon: Shield,    label: 'Role',        value: p?.role?.name || storeUser?.role },
              { icon: Building2, label: 'Phone',       value: p?.phone || '—' },
              { icon: Clock,     label: 'Last Login',  value: p?.last_login ? new Date(p.last_login).toLocaleString() : '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-3.5">
                <Icon size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span className="text-sm w-28 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-soft)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-soft)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Security</p>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>Password</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Change your account password</p>
            </div>
            <button onClick={() => setChangePw(true)} className="btn-secondary text-sm flex items-center gap-1.5">
              <KeyRound size={13} /> Change Password
            </button>
          </div>
        </div>
      </div>

      <ChangePasswordModal open={changePw} onClose={() => setChangePw(false)} />
    </div>
  );
}
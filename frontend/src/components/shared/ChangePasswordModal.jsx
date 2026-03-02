import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Modal from './Modal';
import * as authApi from '../../lib/api/authApi';
import toast from 'react-hot-toast';

export default function ChangePasswordModal({ open, onClose }) {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });

  const save = useMutation({
    mutationFn: (d) => authApi.changePassword(d),
    onSuccess: () => { toast.success('Password changed'); setForm({ current_password: '', new_password: '', confirm: '' }); onClose(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to change password'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.new_password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    save.mutate({ current_password: form.current_password, new_password: form.new_password });
  };

  return (
    <Modal open={open} onClose={onClose} title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="label" htmlFor="cp-current">Current Password</label>
          <input id="cp-current" name="current_password" type="password" className="input" required
            value={form.current_password} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="cp-new">New Password</label>
          <input id="cp-new" name="new_password" type="password" className="input" required minLength={8}
            value={form.new_password} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="cp-confirm">Confirm New Password</label>
          <input id="cp-confirm" name="confirm" type="password" className="input" required
            value={form.confirm} onChange={handleChange} />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={save.isPending} className="btn-primary flex-1 justify-center">
            {save.isPending ? 'Saving…' : 'Change Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

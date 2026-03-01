import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import Modal from './Modal';
import * as authApi from '../../lib/api/authApi';
import toast from 'react-hot-toast';

export default function ChangePasswordModal({ open, onClose }) {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [show, setShow] = useState(false);

  const save = useMutation({
    mutationFn: () => authApi.changePassword({
      current_password: form.current_password,
      new_password:     form.new_password,
    }),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setForm({ current_password: '', new_password: '', confirm: '' });
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to change password'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (form.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    save.mutate();
  };

  return (
    <Modal open={open} onClose={onClose} title="Change Password" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="form-group">
          <label className="label" htmlFor="cp-current">Current Password</label>
          <input id="cp-current" name="current_password"
            type={show ? 'text' : 'password'} className="input" required
            value={form.current_password} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="cp-new">New Password</label>
          <div className="relative">
            <input id="cp-new" name="new_password"
              type={show ? 'text' : 'password'} className="input pr-10" required
              minLength={8} placeholder="Min. 8 characters"
              value={form.new_password} onChange={handleChange} />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}>
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="cp-confirm">Confirm New Password</label>
          <input id="cp-confirm" name="confirm"
            type={show ? 'text' : 'password'} className="input" required
            value={form.confirm} onChange={handleChange} />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={save.isPending} className="btn-primary">
            {save.isPending ? 'Saving…' : 'Change Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
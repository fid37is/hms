import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as staffApi from '../../../lib/api/staffApi';
import toast from 'react-hot-toast';

export default function StaffForm({ staff, onSuccess }) {
  const isEdit = !!staff;

  const [form, setForm] = useState(() => ({
    full_name:       staff?.full_name       ?? '',
    email:           staff?.email           ?? '',
    phone:           staff?.phone           ?? '',
    job_title:       staff?.job_title       ?? '',
    department_id:   staff?.department_id   ?? '',
    employment_type: staff?.employment_type ?? 'full_time',
    employment_date: staff?.employment_date ?? new Date().toISOString().split('T')[0],
    salary:          staff?.salary != null   ? String(staff.salary / 100) : '',
    bank_name:       staff?.bank_name       ?? '',
    bank_account_no: staff?.bank_account_no ?? '',
  }));

  const { data: depts } = useQuery({
    queryKey: ['departments'],
    queryFn:  () => staffApi.getDepartments().then(r => r.data.data),
  });

  const save = useMutation({
    mutationFn: (d) => isEdit ? staffApi.updateStaff(staff.id, d) : staffApi.createStaff(d),
    onSuccess: () => { toast.success(isEdit ? 'Staff updated' : 'Staff added'); onSuccess(); },
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    save.mutate({ ...form, salary: Math.round(Number(form.salary) * 100) || 0 });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">

        <div className="form-group">
          <label className="label" htmlFor="sf-full_name">Full Name *</label>
          <input id="sf-full_name" name="full_name" className="input" required
            value={form.full_name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="sf-phone">Phone *</label>
          <input id="sf-phone" name="phone" className="input" required
            value={form.phone} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="sf-email">Email</label>
          <input id="sf-email" name="email" type="email" className="input"
            value={form.email} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="sf-job_title">Job Title</label>
          <input id="sf-job_title" name="job_title" className="input"
            value={form.job_title} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="sf-department_id">Department</label>
          <select id="sf-department_id" name="department_id" className="input"
            value={form.department_id} onChange={handleChange}>
            <option value="">None</option>
            {(depts || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="sf-employment_type">Employment Type</label>
          <select id="sf-employment_type" name="employment_type" className="input"
            value={form.employment_type} onChange={handleChange}>
            {['full_time','part_time','contract','intern'].map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="sf-employment_date">Employment Date</label>
          <input id="sf-employment_date" name="employment_date" type="date" className="input"
            value={form.employment_date} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="sf-salary">Monthly Salary (₦)</label>
          <input id="sf-salary" name="salary" type="number" min="0" step="0.01" className="input"
            value={form.salary} onChange={handleChange} />
        </div>

      </div>

      <div className="rounded-lg p-4 space-y-3"
        style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Bank Details
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label" htmlFor="sf-bank_name">Bank Name</label>
            <input id="sf-bank_name" name="bank_name" className="input"
              value={form.bank_name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="sf-bank_account_no">Account Number</label>
            <input id="sf-bank_account_no" name="bank_account_no" className="input"
              value={form.bank_account_no} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Staff Member'}
        </button>
      </div>
    </form>
  );
}

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as configApi from '../../../lib/api/configApi';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

export default function HotelConfig() {
  const { data, isLoading } = useQuery({
    queryKey: ['hotel-config'],
    queryFn:  () => configApi.getConfig().then(r => r.data.data),
  });

  // Single flat state object — no keys on inputs, no remount issues
  const [form, setForm] = useState({
    hotel_name:    '',
    address:       '',
    city:          '',
    state:         '',
    country:       'Nigeria',
    phone:         '',
    email:         '',
    website:       '',
    currency:      'NGN',
    tax_rate:      '',
    check_in_time: '14:00',
    check_out_time:'11:00',
    timezone:      'Africa/Lagos',
    receipt_footer:'',
  });

  // Populate form once data loads — don't reinitialise on every render
  useEffect(() => {
    if (data) {
      setForm(prev => ({
        ...prev,
        hotel_name:     data.hotel_name     ?? '',
        address:        data.address        ?? '',
        city:           data.city           ?? '',
        state:          data.state          ?? '',
        country:        data.country        ?? 'Nigeria',
        phone:          data.phone          ?? '',
        email:          data.email          ?? '',
        website:        data.website        ?? '',
        currency:       data.currency       ?? 'NGN',
        tax_rate:       data.tax_rate != null ? String(data.tax_rate) : '',
        check_in_time:  data.check_in_time  ?? '14:00',
        check_out_time: data.check_out_time ?? '11:00',
        timezone:       data.timezone       ?? 'Africa/Lagos',
        receipt_footer: data.receipt_footer ?? '',
      }));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: (d) => configApi.updateConfig(d),
    onSuccess: () => toast.success('Settings saved'),
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to save'),
  });

  // Single handler — no inline functions that cause key-related remounts
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    save.mutate({ ...form, tax_rate: Number(form.tax_rate) || 0 });
  };

  if (isLoading) return <LoadingSpinner center />;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Top row: Identity + Contact side by side */}
      <div className="grid grid-cols-2 gap-5">

      {/* Hotel Identity */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Hotel Identity</h3>

        <div className="form-group">
          <label className="label" htmlFor="hotel_name">Hotel Name</label>
          <input
            id="hotel_name"
            name="hotel_name"
            className="input"
            value={form.hotel_name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="address">Address</label>
          <input
            id="address"
            name="address"
            className="input"
            value={form.address}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label" htmlFor="city">City</label>
            <input
              id="city"
              name="city"
              className="input"
              value={form.city}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="state">State</label>
            <input
              id="state"
              name="state"
              className="input"
              value={form.state}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="country">Country</label>
          <input
            id="country"
            name="country"
            className="input"
            value={form.country}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Contact */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Contact</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label" htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              className="input"
              value={form.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              value={form.email}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            className="input"
            value={form.website}
            onChange={handleChange}
            placeholder="https://…"
          />
        </div>
      </div>

      </div>{/* end top grid */}

      {/* Bottom row: Financial + Operations side by side */}
      <div className="grid grid-cols-2 gap-5">

      {/* Financial */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Financial</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label" htmlFor="currency">Currency</label>
            <select
              id="currency"
              name="currency"
              className="input"
              value={form.currency}
              onChange={handleChange}
            >
              <option value="NGN">NGN — Nigerian Naira</option>
              <option value="USD">USD — US Dollar</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="tax_rate">Tax Rate (%)</label>
            <input
              id="tax_rate"
              name="tax_rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              className="input"
              value={form.tax_rate}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Operations */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>Operations</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="label" htmlFor="check_in_time">Check-in Time</label>
            <input
              id="check_in_time"
              name="check_in_time"
              type="time"
              className="input"
              value={form.check_in_time}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="check_out_time">Check-out Time</label>
            <input
              id="check_out_time"
              name="check_out_time"
              type="time"
              className="input"
              value={form.check_out_time}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="timezone">Timezone</label>
          <select
            id="timezone"
            name="timezone"
            className="input"
            value={form.timezone}
            onChange={handleChange}
          >
            <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
            <option value="Africa/Accra">Africa/Accra (GMT)</option>
            <option value="Europe/London">Europe/London (GMT/BST)</option>
            <option value="America/New_York">America/New_York (ET)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="receipt_footer">Receipt Footer</label>
          <textarea
            id="receipt_footer"
            name="receipt_footer"
            rows={3}
            className="input"
            value={form.receipt_footer}
            onChange={handleChange}
            placeholder="Thank you for staying with us…"
          />
        </div>
      </div>

      </div>{/* end bottom grid */}

      <button
        type="submit"
        disabled={save.isPending}
        className="btn-primary px-6 py-2.5"
      >
        {save.isPending ? 'Saving…' : 'Save Settings'}
      </button>
    </form>
  );
}

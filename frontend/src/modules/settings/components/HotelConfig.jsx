// hms/frontend/src/modules/settings/components/HotelConfig.jsx

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as configApi from '../../../lib/api/configApi';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const BLANK = {
  // Identity
  hotel_name: '', tagline: '', description: '', logo_url: '',
  // Location
  address: '', city: '', state: '', country: 'Nigeria', google_maps_url: '',
  // Contact
  phone: '', email: '', whatsapp_number: '',
  // Social
  instagram_url: '', facebook_url: '', twitter_url: '',
  // Financial
  currency: 'NGN', currency_symbol: '₦', tax_rate: '7.5', service_charge: '10',
  // Payment
  pay_on_arrival: true, bank_transfer: false, paystack_enabled: false,
  bank_name: '', bank_account_number: '', bank_account_name: '', paystack_public_key: '',
  // Operations
  timezone: 'Africa/Lagos', check_in_time: '14:00', check_out_time: '11:00',
  // Policies
  cancellation_policy: '', pets_policy: '', smoking_policy: 'No smoking on premises',
  // Billing
  receipt_footer: '',
};

function Section({ title, children }) {
  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="form-group">
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  );
}

export default function HotelConfig() {
  const { data, isLoading } = useQuery({
    queryKey: ['hotel-config'],
    queryFn:  () => configApi.getConfig().then(r => r.data.data),
  });

  const [form, setForm] = useState(BLANK);

  useEffect(() => {
    if (!data) return;
    setForm({
      hotel_name:          data.hotel_name          ?? '',
      tagline:             data.tagline             ?? '',
      description:         data.description         ?? '',
      logo_url:            data.logo_url            ?? '',
      // Location
      address:             data.address             ?? '',
      city:                data.city                ?? '',
      state:               data.state               ?? '',
      country:             data.country             ?? 'Nigeria',
      google_maps_url:     data.google_maps_url     ?? '',
      // Contact
      phone:               data.phone               ?? '',
      email:               data.email               ?? '',
      whatsapp_number:     data.whatsapp_number     ?? '',
      // Social
      instagram_url:       data.instagram_url       ?? '',
      facebook_url:        data.facebook_url        ?? '',
      twitter_url:         data.twitter_url         ?? '',
      // Financial
      currency:            data.currency            ?? 'NGN',
      currency_symbol:     data.currency_symbol     ?? '₦',
      tax_rate:            data.tax_rate   != null  ? String(data.tax_rate)          : '7.5',
      service_charge:      data.service_charge != null ? String(data.service_charge) : '10',
      // Payment
      pay_on_arrival:      data.pay_on_arrival      ?? true,
      bank_transfer:       data.bank_transfer       ?? false,
      paystack_enabled:    data.paystack_enabled    ?? false,
      bank_name:           data.bank_name           ?? '',
      bank_account_number: data.bank_account_number ?? '',
      bank_account_name:   data.bank_account_name   ?? '',
      paystack_public_key: data.paystack_public_key ?? '',
      // Operations
      timezone:            data.timezone            ?? 'Africa/Lagos',
      check_in_time:       (data.check_in_time  ?? '14:00').slice(0, 5),
      check_out_time:      (data.check_out_time ?? '11:00').slice(0, 5),
      // Policies
      cancellation_policy: data.cancellation_policy ?? '',
      pets_policy:         data.pets_policy         ?? '',
      smoking_policy:      data.smoking_policy      ?? 'No smoking on premises',
      receipt_footer:      data.receipt_footer      ?? '',
    });
  }, [data]);

  const save = useMutation({
    mutationFn: (d) => configApi.updateConfig(d),
    onSuccess: () => toast.success('Settings saved'),
    onError:   (e) => toast.error(e.response?.data?.message || 'Failed to save'),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const stripSeconds = (t) => t ? t.slice(0, 5) : t;
    save.mutate({
      ...form,
      tax_rate:         Number(form.tax_rate)       || 0,
      service_charge:   Number(form.service_charge) || 0,
      check_in_time:    stripSeconds(form.check_in_time),
      check_out_time:   stripSeconds(form.check_out_time),
      pay_on_arrival:   Boolean(form.pay_on_arrival),
      bank_transfer:    Boolean(form.bank_transfer),
      paystack_enabled: Boolean(form.paystack_enabled),
    });
  };

  if (isLoading) return <LoadingSpinner center />;

  return (
    <form onSubmit={handleSubmit} className="space-y-0">

      {/* ── Open Customizer ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div>
          <div className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>Layout & Design</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Colours, fonts, hero style, section order</div>
        </div>
        <a href="/settings/customize" target="_blank" rel="noreferrer"
          className="text-sm font-medium px-4 py-2 rounded border transition-colors whitespace-nowrap"
          style={{ borderColor: 'var(--border-base)', color: 'var(--text-base)' }}>
          Open Customizer →
        </a>
      </div>

      <div className="space-y-4">

        {/* Row 1 — Identity + Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section title="Hotel Identity">
            <Field label="Hotel Name *">
              <input name="hotel_name" className="input" required
                value={form.hotel_name} onChange={handleChange} />
            </Field>
            <Field label="Tagline">
              <input name="tagline" className="input" placeholder="e.g. Where comfort meets luxury"
                value={form.tagline} onChange={handleChange} />
            </Field>
            <Field label="Description">
              <textarea name="description" rows={3} className="input"
                placeholder="Short description shown on the website homepage…"
                value={form.description} onChange={handleChange} />
            </Field>
            <Field label="Logo URL">
              <input name="logo_url" className="input" placeholder="https://…"
                value={form.logo_url} onChange={handleChange} />
            </Field>
          </Section>

          <Section title="Location">
            <Field label="Street Address">
              <input name="address" className="input" value={form.address} onChange={handleChange} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <input name="city" className="input" value={form.city} onChange={handleChange} />
              </Field>
              <Field label="State">
                <input name="state" className="input" value={form.state} onChange={handleChange} />
              </Field>
            </div>
            <Field label="Country">
              <input name="country" className="input" value={form.country} onChange={handleChange} />
            </Field>
            <Field label="Google Maps URL">
              <input name="google_maps_url" className="input" placeholder="https://maps.google.com/…"
                value={form.google_maps_url} onChange={handleChange} />
            </Field>
          </Section>
        </div>

        {/* Row 2 — Contact + Social */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section title="Contact">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone">
                <input name="phone" className="input" value={form.phone} onChange={handleChange} />
              </Field>
              <Field label="WhatsApp">
                <input name="whatsapp_number" className="input" placeholder="+234…"
                  value={form.whatsapp_number} onChange={handleChange} />
              </Field>
            </div>
            <Field label="Email">
              <input name="email" type="email" className="input"
                value={form.email} onChange={handleChange} />
            </Field>
          </Section>

          <Section title="Social Media">
            <Field label="Instagram">
              <input name="instagram_url" className="input" placeholder="https://instagram.com/…"
                value={form.instagram_url} onChange={handleChange} />
            </Field>
            <Field label="Facebook">
              <input name="facebook_url" className="input" placeholder="https://facebook.com/…"
                value={form.facebook_url} onChange={handleChange} />
            </Field>
            <Field label="X / Twitter">
              <input name="twitter_url" className="input" placeholder="https://x.com/…"
                value={form.twitter_url} onChange={handleChange} />
            </Field>
          </Section>
        </div>

        {/* Row 3 — Financial + Payment + Operations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section title="Financial">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Currency">
                <select name="currency" className="input" value={form.currency} onChange={handleChange}>
                  <option value="NGN">NGN — Naira</option>
                  <option value="USD">USD — Dollar</option>
                  <option value="GBP">GBP — Pound</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GHS">GHS — Cedi</option>
                  <option value="KES">KES — Shilling</option>
                </select>
              </Field>
              <Field label="Symbol">
                <input name="currency_symbol" className="input font-mono" placeholder="₦"
                  value={form.currency_symbol} onChange={handleChange} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tax Rate (%)">
                <input name="tax_rate" type="number" min="0" max="100" step="0.01" className="input"
                  value={form.tax_rate} onChange={handleChange} />
              </Field>
              <Field label="Service Charge (%)">
                <input name="service_charge" type="number" min="0" max="100" step="0.01" className="input"
                  value={form.service_charge} onChange={handleChange} />
              </Field>
            </div>
            <Field label="Receipt Footer">
              <textarea name="receipt_footer" rows={2} className="input"
                placeholder="Thank you for staying with us…"
                value={form.receipt_footer} onChange={handleChange} />
            </Field>
          </Section>

          <Section title="Payment Methods">
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Choose which payment options guests can use when booking online.
            </p>
            <div className="flex flex-col gap-3 mb-4">
              {[
                { key: 'pay_on_arrival',   label: 'Pay on Arrival',        sub: 'Guest pays at the front desk on check-in. No charge now.' },
                { key: 'bank_transfer',    label: 'Bank Transfer',          sub: 'Guest pays to your bank account before arrival.' },
                { key: 'paystack_enabled', label: 'Paystack (Online Card)', sub: 'Guest pays by card at time of booking.' },
              ].map(({ key, label, sub }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer p-3 rounded-xl transition-colors"
                  style={{ border: '1px solid var(--border-soft)', backgroundColor: form[key] ? 'var(--brand-subtle)' : 'var(--bg-subtle)' }}>
                  <input type="checkbox" className="mt-0.5" checked={!!form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                  <div>
                    <p className="text-xs font-semibold"
                      style={{ color: form[key] ? 'var(--brand)' : 'var(--text-base)' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>
                  </div>
                </label>
              ))}
            </div>

            {form.bank_transfer && (
              <div className="flex flex-col gap-3 p-3 rounded-xl"
                style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-base)' }}>Bank Account Details</p>
                <Field label="Bank Name">
                  <input name="bank_name" className="input" placeholder="e.g. First Bank"
                    value={form.bank_name} onChange={handleChange} />
                </Field>
                <Field label="Account Number">
                  <input name="bank_account_number" className="input font-mono" placeholder="0123456789"
                    value={form.bank_account_number} onChange={handleChange} />
                </Field>
                <Field label="Account Name">
                  <input name="bank_account_name" className="input" placeholder="Eagle Base Hotel Ltd"
                    value={form.bank_account_name} onChange={handleChange} />
                </Field>
              </div>
            )}

            {form.paystack_enabled && (
              <div className="flex flex-col gap-3 p-3 rounded-xl mt-3"
                style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-base)' }}>Paystack Configuration</p>
                <Field label="Public Key">
                  <input name="paystack_public_key" className="input font-mono" placeholder="pk_live_…"
                    value={form.paystack_public_key} onChange={handleChange} />
                </Field>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Get your public key from your Paystack dashboard → Settings → API Keys.
                  Never enter your secret key here.
                </p>
              </div>
            )}
          </Section>

          <Section title="Operations">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Check-in Time">
                <input name="check_in_time" type="time" className="input"
                  value={form.check_in_time} onChange={handleChange} />
              </Field>
              <Field label="Check-out Time">
                <input name="check_out_time" type="time" className="input"
                  value={form.check_out_time} onChange={handleChange} />
              </Field>
            </div>
            <Field label="Timezone">
              <select name="timezone" className="input" value={form.timezone} onChange={handleChange}>
                <option value="Africa/Lagos">Africa/Lagos (WAT +1)</option>
                <option value="Africa/Accra">Africa/Accra (GMT)</option>
                <option value="Africa/Nairobi">Africa/Nairobi (EAT +3)</option>
                <option value="Africa/Johannesburg">Africa/Johannesburg (SAST +2)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="America/New_York">America/New_York (ET)</option>
              </select>
            </Field>
          </Section>
        </div>

        {/* Row 4 — Policies */}
        <Section title="Policies">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Cancellation Policy">
              <textarea name="cancellation_policy" rows={4} className="input"
                placeholder="e.g. Free cancellation up to 24 hours before check-in…"
                value={form.cancellation_policy} onChange={handleChange} />
            </Field>
            <Field label="Pets Policy">
              <textarea name="pets_policy" rows={4} className="input"
                placeholder="e.g. Pets are not allowed on the premises…"
                value={form.pets_policy} onChange={handleChange} />
            </Field>
            <Field label="Smoking Policy">
              <textarea name="smoking_policy" rows={4} className="input"
                placeholder="e.g. No smoking on premises…"
                value={form.smoking_policy} onChange={handleChange} />
            </Field>
          </div>
        </Section>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={save.isPending} className="btn-primary px-6 py-2">
            {save.isPending ? 'Saving…' : 'Save Settings'}
          </button>
        </div>

      </div>
    </form>
  );
}
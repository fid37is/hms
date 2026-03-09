// src/modules/settings/components/WebsitePanel.jsx
// Website & domain configuration — subdomain, custom domain, connection test

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe, Copy, CheckCircle2, ExternalLink, AlertTriangle,
  Loader2, Link2, Link2Off, RefreshCw, Info,
} from 'lucide-react';
import * as authApi from '../../../lib/api/authApi';
import toast from 'react-hot-toast';

const BASE_DOMAIN = import.meta.env.VITE_WEBSITE_BASE_DOMAIN || 'hms-67e.pages.dev';
const API_BASE    = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function CopyButton({ text, size = 'sm' }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-xs font-medium flex-shrink-0"
      style={{
        backgroundColor: copied ? 'var(--s-green-bg)' : 'var(--bg-subtle)',
        color: copied ? 'var(--s-green-text)' : 'var(--text-muted)',
        border: '1px solid var(--border-soft)',
      }}>
      {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function UrlRow({ label, url, hint }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5"
      style={{ borderBottom: '1px solid var(--border-soft)' }}>
      <div className="min-w-0">
        <p className="text-xs font-medium" style={{ color: 'var(--text-base)' }}>{label}</p>
        {hint && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
        <code className="text-xs mt-1 block truncate" style={{ color: 'var(--brand)' }}>{url}</code>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <CopyButton text={url} />
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-subtle)' }}>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

// ── Connection tester ──────────────────────────────────────
function ConnectionTest({ slug }) {
  const [status, setStatus] = useState(null); // null | 'testing' | 'ok' | 'fail'
  const [detail, setDetail] = useState('');

  const test = async () => {
    setStatus('testing');
    setDetail('');
    try {
      const url = `${API_BASE}/public/config`;
      const res = await fetch(url, {
        headers: { 'x-org-slug': slug },
      });
      const json = await res.json();
      if (res.ok && json?.data?.hotel_name) {
        setStatus('ok');
        setDetail(`Returned "${json.data.hotel_name}" — public API is live`);
      } else {
        setStatus('fail');
        setDetail(json?.message || `Unexpected response (${res.status})`);
      }
    } catch (e) {
      setStatus('fail');
      setDetail(e.message || 'Network error — check CORS and server status');
    }
  };

  const colors = {
    ok:      { bg: 'var(--s-green-bg)',  text: 'var(--s-green-text)',  icon: CheckCircle2 },
    fail:    { bg: 'var(--s-red-bg)',    text: 'var(--s-red-text)',    icon: AlertTriangle },
    testing: { bg: 'var(--s-blue-bg)',   text: 'var(--s-blue-text)',   icon: Loader2 },
  };
  const c = status ? colors[status] : null;

  return (
    <div className="space-y-2">
      <button onClick={test} disabled={status === 'testing'}
        className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all"
        style={{
          backgroundColor: 'var(--bg-subtle)',
          color: 'var(--text-base)',
          border: '1px solid var(--border-soft)',
        }}>
        {status === 'testing'
          ? <Loader2 size={14} className="animate-spin" />
          : <RefreshCw size={14} />}
        Test connection
      </button>

      {c && (
        <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-xs"
          style={{ backgroundColor: c.bg }}>
          <c.icon size={13} className={status === 'testing' ? 'animate-spin mt-0.5' : 'mt-0.5'}
            style={{ color: c.text, flexShrink: 0 }} />
          <span style={{ color: c.text }}>{detail || (status === 'testing' ? 'Contacting server…' : '')}</span>
        </div>
      )}
    </div>
  );
}

// ── Custom domain section ─────────────────────────────────
function CustomDomainSection({ org }) {
  const qc = useQueryClient();
  const [domain, setDomain] = useState(org.custom_domain || '');
  const [verifyStatus, setVerifyStatus] = useState(null); // null | 'checking' | 'ok' | 'fail'
  const [verifyDetail, setVerifyDetail] = useState('');

  const save = useMutation({
    mutationFn: (d) => authApi.updateOrg({ custom_domain: d }),
    onSuccess: () => {
      toast.success('Custom domain saved');
      qc.invalidateQueries({ queryKey: ['org-profile'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save domain'),
  });

  const verify = async () => {
    if (!domain) return;
    setVerifyStatus('checking');
    setVerifyDetail('');
    try {
      const url = `https://${domain}/api/v1/public/config`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const json = await res.json();
      if (res.ok && json?.data) {
        setVerifyStatus('ok');
        setVerifyDetail('Domain is resolving and public API responds correctly');
      } else {
        setVerifyStatus('fail');
        setVerifyDetail(`Server responded but returned an error (${res.status})`);
      }
    } catch (e) {
      setVerifyStatus('fail');
      setVerifyDetail('Could not reach domain — check DNS and SSL are configured');
    }
  };

  const verifyColors = {
    ok:       { bg: 'var(--s-green-bg)', text: 'var(--s-green-text)', Icon: CheckCircle2 },
    fail:     { bg: 'var(--s-red-bg)',   text: 'var(--s-red-text)',   Icon: AlertTriangle },
    checking: { bg: 'var(--s-blue-bg)',  text: 'var(--s-blue-text)',  Icon: Loader2 },
  };
  const vc = verifyStatus ? verifyColors[verifyStatus] : null;

  const hasChanged = domain !== (org.custom_domain || '');

  return (
    <div className="space-y-4">
      {/* DNS instructions */}
      <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
        <div className="flex items-center gap-2">
          <Info size={13} style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs font-semibold" style={{ color: 'var(--text-base)' }}>
            DNS Configuration
          </p>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Point your domain to this server by adding a CNAME record at your DNS provider:
        </p>
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-soft)' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-muted)' }}>
                {['Type', 'Name', 'Value', 'TTL'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: 'var(--bg-surface)' }}>
                <td className="px-3 py-2"><code style={{ color: 'var(--brand)' }}>CNAME</code></td>
                <td className="px-3 py-2"><code style={{ color: 'var(--text-base)' }}>www</code></td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <code style={{ color: 'var(--text-base)' }}>
                      {BASE_DOMAIN.includes('pages.dev') ? BASE_DOMAIN : `${org.slug}.${BASE_DOMAIN}`}
                    </code>
                    <CopyButton text={BASE_DOMAIN.includes('pages.dev') ? BASE_DOMAIN : `${org.slug}.${BASE_DOMAIN}`} />
                  </div>
                </td>
                <td className="px-3 py-2"><code style={{ color: 'var(--text-muted)' }}>Auto</code></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          DNS changes can take up to 48 hours to propagate. SSL is provisioned automatically once DNS resolves.
        </p>
      </div>

      {/* Domain input */}
      <div className="space-y-2">
        <label className="label">Custom Domain</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
              style={{ color: 'var(--text-muted)' }}>https://</span>
            <input
              type="text"
              className="input pl-14"
              placeholder="www.yourhotel.com"
              value={domain}
              onChange={e => setDomain(e.target.value.replace(/^https?:\/\//i, ''))}
            />
          </div>
          {hasChanged && (
            <button
              onClick={() => save.mutate(domain)}
              disabled={save.isPending}
              className="btn-primary px-4 text-sm gap-1.5 flex-shrink-0">
              {save.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
              Save
            </button>
          )}
        </div>

        {/* Current status badge */}
        {org.custom_domain && !hasChanged && (
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--s-green-bg)', color: 'var(--s-green-text)' }}>
              <Link2 size={10} /> Active
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {org.custom_domain}
            </span>
            <button
              onClick={() => { setDomain(''); save.mutate(''); }}
              className="text-xs flex items-center gap-1 ml-1"
              style={{ color: 'var(--s-red-text)' }}>
              <Link2Off size={10} /> Remove
            </button>
          </div>
        )}
      </div>

      {/* Verify button */}
      {org.custom_domain && !hasChanged && (
        <div className="space-y-2">
          <button onClick={verify} disabled={verifyStatus === 'checking'}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all"
            style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-base)', border: '1px solid var(--border-soft)' }}>
            {verifyStatus === 'checking'
              ? <Loader2 size={14} className="animate-spin" />
              : <RefreshCw size={14} />}
            Verify domain
          </button>

          {vc && (
            <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-xs"
              style={{ backgroundColor: vc.bg }}>
              <vc.Icon size={13} className={verifyStatus === 'checking' ? 'animate-spin mt-0.5' : 'mt-0.5'}
                style={{ color: vc.text, flexShrink: 0 }} />
              <span style={{ color: vc.text }}>{verifyDetail}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────
export default function WebsitePanel() {
  const { data: org, isLoading, isError } = useQuery({
    queryKey: ['org-profile'],
    queryFn:  () => authApi.getOrg().then(r => r.data.data),
  });

  if (isLoading) return (
    <div className="flex items-center gap-2 py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
      <Loader2 size={15} className="animate-spin" /> Loading…
    </div>
  );

  if (isError || !org) return (
    <div className="flex items-center gap-2 py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
      <AlertTriangle size={15} /> Could not load organisation data.
    </div>
  );

  const subdomainUrl  = BASE_DOMAIN.includes('pages.dev')
    ? `https://${BASE_DOMAIN}`
    : `https://${org.slug}.${BASE_DOMAIN}`;
  const publicApiUrl  = `${API_BASE}/public`;

  return (
    <div className="max-w-[640px] space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-base)' }}>
          Website & Domain
        </h2>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Your guest booking website is served from your subdomain. You can also point a custom domain to it.
        </p>
      </div>

      {/* Identity card */}
      <div className="card p-5 space-y-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--brand-subtle)' }}>
              <Globe size={15} style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>{org.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Slug: <code style={{ color: 'var(--brand)' }}>{org.slug}</code>
                {' · '}
                Plan: <span className="capitalize font-medium" style={{ color: 'var(--text-base)' }}>{org.plan}</span>
              </p>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
            style={{ backgroundColor: 'var(--s-green-bg)', color: 'var(--s-green-text)' }}>
            {org.status}
          </span>
        </div>

        <UrlRow
          label="Guest Website"
          url={subdomainUrl}
          hint="Your booking website — share this with guests"
        />
        <UrlRow
          label="Public API Base"
          url={publicApiUrl}
          hint="Your website's API base URL — configured automatically via subdomain"
        />
        {org.custom_domain && (
          <UrlRow
            label="Custom Domain"
            url={`https://${org.custom_domain}`}
            hint="Your branded domain"
          />
        )}
      </div>

      {/* Connection test */}
      <div className="card p-5 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Connection Health
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Verify the public API is reachable and returning your hotel's data.
        </p>
        <ConnectionTest slug={org.slug} />
      </div>

      {/* Custom domain */}
      <div className="card p-5 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Custom Domain
        </h3>
        <CustomDomainSection org={org} />
      </div>

    </div>
  );
}
// src/modules/settings/components/ApiKeysPanel.jsx
// Step 5: API Key system for guest website connection

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Plus, Trash2, Copy, CheckCircle2, Globe, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';
import * as authApi from '../../../lib/api/authApi';
import toast from 'react-hot-toast';

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return 'Just now';
  if (hours < 1)  return `${mins}m ago`;
  if (days < 1)   return `${hours}h ago`;
  return `${days}d ago`;
}

function KeyRevealBox({ apiKey, onDismiss }) {
  const [copied, setCopied] = useState(false);
  const [show, setShow]     = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-xl p-4 mt-4" style={{ backgroundColor: 'var(--bg-subtle)', border: '2px solid var(--warning)' }}>
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle size={17} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>
            Copy this key now
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            This key will not be shown again after you dismiss this notice.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <code className="flex-1 text-xs px-3 py-2 rounded-lg font-mono overflow-x-auto"
          style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-base)', border: '1px solid var(--border-soft)' }}>
          {show ? apiKey : '•'.repeat(Math.min(apiKey.length, 50))}
        </code>
        <button onClick={() => setShow(s => !s)} className="p-2 rounded-lg flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}>
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
        <button onClick={copy} className="p-2 rounded-lg flex-shrink-0 transition-all flex-shrink-0"
          style={{
            backgroundColor: copied ? 'var(--success-subtle,var(--brand-subtle))' : 'var(--brand)',
            color: 'white',
          }}>
          {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
        </button>
      </div>

      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        Add this to your guest website's environment:
      </p>
      <code className="block text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--brand)', border: '1px solid var(--border-soft)' }}>
        VITE_HMS_API_KEY={apiKey.slice(0, 15)}…
      </code>

      <button onClick={onDismiss} className="btn-secondary w-full justify-center mt-3 py-2 text-xs">
        I've saved my key
      </button>
    </div>
  );
}

export default function ApiKeysPanel() {
  const qc = useQueryClient();
  const [label,      setLabel]      = useState('Guest Website');
  const [newKey,     setNewKey]     = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [revokeId,   setRevokeId]   = useState(null);

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn:  () => authApi.listApiKeys().then(r => r.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (label) => authApi.generateApiKey({ label }),
    onSuccess: (res) => {
      const key = res.data.data;
      setNewKey(key.key);
      qc.invalidateQueries({ queryKey: ['api-keys'] });
      setShowCreate(false);
      setLabel('Guest Website');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate key'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id) => authApi.revokeApiKey(id),
    onSuccess: () => {
      toast.success('API key revoked');
      qc.invalidateQueries({ queryKey: ['api-keys'] });
      setRevokeId(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to revoke'),
  });

  return (
    <div className="max-w-[640px] space-y-6">
      <div>
        <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-base)' }}>
          API Keys
        </h2>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Connect your guest-facing booking website to this HMS account. Each key gives read-only public access scoped to your organization.
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-xl p-4 flex gap-4" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-soft)' }}>
        <Globe size={20} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 2 }} />
        <div className="text-xs space-y-1.5" style={{ color: 'var(--text-muted)' }}>
          <p className="font-medium" style={{ color: 'var(--text-base)' }}>How to connect your website</p>
          <p>1. Generate an API key below and copy it</p>
          <p>2. Add it to your website's environment variables:</p>
          <code className="block px-2 py-1 rounded text-xs mt-1"
            style={{ backgroundColor: 'var(--bg-base)', color: 'var(--brand)', border: '1px solid var(--border-soft)' }}>
            VITE_HMS_API_KEY=pk_live_xxxxx<br />
            VITE_HMS_BASE_URL=https://your-api.com/api/v1/public
          </code>
          <p>3. The website sends <code className="text-xs" style={{ color: 'var(--brand)' }}>X-API-Key</code> on every public request</p>
        </div>
      </div>

      {/* Newly generated key reveal */}
      {newKey && (
        <KeyRevealBox apiKey={newKey} onDismiss={() => setNewKey(null)} />
      )}

      {/* Create new key */}
      {showCreate ? (
        <div className="rounded-xl p-4 space-y-3" style={{ border: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-surface)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>New API key</p>
          <div className="form-group mb-0">
            <label className="label">Label (to identify where it's used)</label>
            <input type="text" className="input" placeholder="Guest Website"
              value={label} onChange={e => setLabel(e.target.value)} autoFocus />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1 justify-center py-2 text-sm">
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate(label || 'Guest Website')}
              disabled={createMutation.isPending}
              className="btn-primary flex-1 justify-center py-2 text-sm gap-1.5">
              {createMutation.isPending
                ? <><Loader2 size={13} className="animate-spin" /> Generating…</>
                : <><Key size={13} /> Generate Key</>}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowCreate(true)}
          className="btn-secondary gap-2 text-sm">
          <Plus size={14} /> Generate new API key
        </button>
      )}

      {/* Keys list */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Loader2 size={14} className="animate-spin" /> Loading keys…
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ border: '1px dashed var(--border-soft)' }}>
          <Key size={22} className="mx-auto mb-2" style={{ color: 'var(--text-disabled)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No API keys yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-disabled)' }}>Generate a key to connect your guest website</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Active keys ({keys.length})
          </p>
          {keys.map(key => (
            <div key={key.id} className="rounded-xl p-4 flex items-center gap-3"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-soft)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--brand-subtle)' }}>
                <Key size={16} style={{ color: 'var(--brand)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-base)' }}>{key.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: key.is_active ? 'var(--success-subtle,var(--brand-subtle))' : 'var(--bg-subtle)', color: key.is_active ? 'var(--success)' : 'var(--text-muted)' }}>
                    {key.is_active ? 'Active' : 'Revoked'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <code style={{ color: 'var(--text-disabled)' }}>{key.key_prefix}…</code>
                  <span>Created {timeAgo(key.created_at)}</span>
                  {key.last_used_at && <span>Last used {timeAgo(key.last_used_at)}</span>}
                </div>
              </div>

              {/* Revoke */}
              {key.is_active && (
                revokeId === key.id ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Revoke?</span>
                    <button onClick={() => revokeMutation.mutate(key.id)}
                      disabled={revokeMutation.isPending}
                      className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--error)', color: 'white' }}>
                      Yes
                    </button>
                    <button onClick={() => setRevokeId(null)}
                      className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                      No
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setRevokeId(key.id)}
                    className="p-2 rounded-lg flex-shrink-0 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    title="Revoke key"
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Trash2 size={15} />
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// src/pages/OnboardingPage.jsx
// Step 6: Onboarding checklist after first login

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hotel, Settings, BedDouble, CalendarPlus, Users, Link2,
  CheckCircle2, Circle, ArrowRight, Sparkles, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import * as roomApi   from '../lib/api/roomApi';
import * as staffApi  from '../lib/api/staffApi';
import * as configApi from '../lib/api/configApi';

const STEPS = [
  {
    id:       'config',
    icon:     Settings,
    title:    'Configure your hotel',
    desc:     'Set your hotel name, contact info, timezone and currency.',
    href:     '/settings',
    check:    (data) => !!data?.config?.hotel_name,
    cta:      'Open Settings',
  },
  {
    id:       'room_types',
    icon:     BedDouble,
    title:    'Add room types',
    desc:     'Define Standard, Deluxe, Suite — with rates and amenities.',
    href:     '/rooms',
    check:    (data) => (data?.roomTypes?.length || 0) > 0,
    cta:      'Go to Rooms',
  },
  {
    id:       'rooms',
    icon:     BedDouble,
    title:    'Add your rooms',
    desc:     'Create individual room records with floor and status.',
    href:     '/rooms',
    check:    (data) => (data?.rooms?.length || 0) > 0,
    cta:      'Go to Rooms',
  },
  {
    id:       'staff',
    icon:     Users,
    title:    'Add staff members',
    desc:     'Register your team, set departments and grant system access.',
    href:     '/staff',
    check:    (data) => (data?.staff?.total || 0) > 0,
    cta:      'Go to Staff',
  },
  {
    id:       'api_key',
    icon:     Link2,
    title:    'Connect your guest website',
    desc:     'Generate an API key and add it to your booking website.',
    href:     '/settings?tab=api-keys',
    check:    (data) => (data?.apiKeys?.length || 0) > 0,
    cta:      'Generate API Key',
  },
];

export default function OnboardingPage() {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const [dismissed, setDismissed] = useState(false);

  // Fetch all status data in parallel
  const { data: config }     = useQuery({ queryKey: ['hotel-config'],  queryFn: () => configApi.getConfig().then(r => r.data.data), retry: false });
  const { data: roomTypes }  = useQuery({ queryKey: ['room-types'],    queryFn: () => roomApi.getRoomTypes().then(r => r.data.data), retry: false });
  const { data: roomsRes }   = useQuery({ queryKey: ['rooms'],         queryFn: () => roomApi.getRooms().then(r => r.data.data), retry: false });
  const { data: staffRes }   = useQuery({ queryKey: ['staff'],         queryFn: () => staffApi.getStaff({}, 1, 1).then(r => r.data.data), retry: false });
  const { data: apiKeysRes } = useQuery({ queryKey: ['api-keys'],      queryFn: () => import('../lib/api/authApi').then(m => m.listApiKeys().then(r => r.data.data)), retry: false });

  const checkData = {
    config,
    roomTypes,
    rooms:   Array.isArray(roomsRes) ? roomsRes : roomsRes?.data || [],
    staff:   staffRes,
    apiKeys: Array.isArray(apiKeysRes) ? apiKeysRes : [],
  };

  const stepsWithStatus = STEPS.map(s => ({ ...s, done: s.check(checkData) }));
  const completedCount  = stepsWithStatus.filter(s => s.done).length;
  const allDone         = completedCount === STEPS.length;
  const progress        = Math.round((completedCount / STEPS.length) * 100);

  if (dismissed && !allDone) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex items-start justify-center p-6 pt-12"
      style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="w-full max-w-[600px]">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ backgroundColor: 'var(--brand-subtle)' }}>
            {allDone
              ? <Sparkles size={26} style={{ color: 'var(--brand)' }} />
              : <Hotel size={26} style={{ color: 'var(--brand)' }} />
            }
          </div>
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-base)' }}>
            {allDone ? 'You\'re all set! 🎉' : `Welcome, ${user?.full_name?.split(' ')[0]}!`}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {allDone
              ? 'Your HMS is fully configured and ready for operations.'
              : `Let's get your hotel set up. ${completedCount} of ${STEPS.length} steps complete.`}
          </p>
        </div>

        {/* Progress bar */}
        {!allDone && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs mb-2"
              style={{ color: 'var(--text-muted)' }}>
              <span>Setup progress</span>
              <span style={{ color: 'var(--brand)', fontWeight: 500 }}>{progress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, backgroundColor: 'var(--brand)' }} />
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-2 mb-6">
          {stepsWithStatus.map((step, i) => {
            const Icon = step.icon;
            return (
              <button key={step.id}
                onClick={() => navigate(step.href)}
                disabled={step.done}
                className="w-full text-left rounded-xl p-4 transition-all flex items-center gap-4 group"
                style={{
                  backgroundColor: step.done ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                  border: `1px solid ${step.done ? 'var(--border-soft)' : 'var(--border-soft)'}`,
                  opacity: step.done ? 0.75 : 1,
                  cursor: step.done ? 'default' : 'pointer',
                }}
                onMouseEnter={e => !step.done && (e.currentTarget.style.borderColor = 'var(--brand)')}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-soft)'}
              >
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {step.done
                    ? <CheckCircle2 size={22} style={{ color: 'var(--success)' }} />
                    : <Circle size={22} style={{ color: 'var(--text-disabled)' }} />
                  }
                </div>

                {/* Step icon */}
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: step.done ? 'var(--bg-subtle)' : 'var(--brand-subtle)' }}>
                  <Icon size={17} style={{ color: step.done ? 'var(--text-disabled)' : 'var(--brand)' }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{
                      color: step.done ? 'var(--text-muted)' : 'var(--text-base)',
                      textDecoration: step.done ? 'line-through' : 'none',
                    }}>
                      {step.title}
                    </span>
                    {!step.done && (
                      <span className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand)' }}>
                        {step.cta}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
                </div>

                {!step.done && (
                  <ChevronRight size={16} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--brand)' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer actions */}
        {allDone ? (
          <button onClick={() => navigate('/dashboard', { replace: true })}
            className="btn-primary w-full justify-center py-3 gap-2">
            Go to Dashboard <ArrowRight size={16} />
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <button onClick={() => setDismissed(true)}
              className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Skip for now
            </button>
            <button onClick={() => navigate('/dashboard', { replace: true })}
              className="btn-secondary gap-2 text-sm">
              Go to Dashboard <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
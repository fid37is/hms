import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import HotelConfig    from './components/HotelConfig';
import BillingPanel   from './components/BillingPanel';
import UserManagement from './components/UserManagement';
import RoleManager    from './components/RoleManager';
import WebsitePanel   from './components/WebsitePanel';
import PageHeader     from '../../components/shared/PageHeader';
import { Settings, Users, Shield, Globe, CreditCard } from 'lucide-react';

const TABS = [
  { key: 'hotel',   label: 'Hotel Config', icon: Settings },
  { key: 'website', label: 'Website',      icon: Globe    },
  { key: 'users',   label: 'Users',        icon: Users    },
  { key: 'roles',   label: 'Roles',        icon: Shield   },
  { key: 'billing', label: 'Billing',      icon: CreditCard },
];

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'hotel');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) setTab(t);
  }, [searchParams]);

  const switchTab = (key) => {
    setTab(key);
    setSearchParams({ tab: key }, { replace: true });
  };

  return (
    <div className="space-y-4">

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">

        {/* Tab nav */}
        <div className="w-full md:w-40 md:flex-shrink-0 md:sticky md:top-4">
          {/* Mobile: horizontal pills */}
          <div className="overflow-x-auto pb-1 md:hidden">
            <div className="flex gap-1 p-1 rounded-lg w-max" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              {TABS.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => switchTab(key)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: tab === key ? 'var(--bg-surface)' : 'transparent',
                    color:           tab === key ? 'var(--brand)'       : 'var(--text-muted)',
                    boxShadow:       tab === key ? 'var(--shadow-xs)'   : 'none',
                  }}>
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop: vertical nav */}
          <nav className="hidden md:block space-y-0.5">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => switchTab(key)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all"
                style={{
                  backgroundColor: tab === key ? 'var(--brand-subtle)' : 'transparent',
                  color:           tab === key ? 'var(--brand)'        : 'var(--text-muted)',
                }}
                onMouseEnter={e => tab !== key && (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                onMouseLeave={e => tab !== key && (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Icon size={15} />{label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab === 'hotel'   && <HotelConfig />}
          {tab === 'website' && <WebsitePanel />}
          {tab === 'users'   && <UserManagement />}
          {tab === 'roles'   && <RoleManager />}
          {tab === 'billing' && <BillingPanel />}
        </div>
      </div>
    </div>
  );
}
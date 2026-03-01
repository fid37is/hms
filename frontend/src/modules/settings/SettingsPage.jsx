import { useState } from 'react';
import HotelConfig    from './components/HotelConfig';
import UserManagement from './components/UserManagement';
import RoleManager    from './components/RoleManager';
import PageHeader     from '../../components/shared/PageHeader';
import { Settings, Users, Shield } from 'lucide-react';

const TABS = [
  { key: 'Hotel Config', icon: Settings },
  { key: 'Users',        icon: Users    },
  { key: 'Roles',        icon: Shield   },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('Hotel Config');

  return (
    <div className="flex gap-6 h-full">

      {/* Vertical sidebar nav */}
      <aside className="w-44 flex-shrink-0">
        <nav className="space-y-0.5">
          {TABS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all"
              style={{
                backgroundColor: tab === key ? 'var(--brand-subtle)' : 'transparent',
                color:           tab === key ? 'var(--brand)'        : 'var(--text-muted)',
              }}
              onMouseEnter={e => tab !== key && (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              onMouseLeave={e => tab !== key && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Icon size={15} />
              {key}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content area — fills remaining width */}
      <div className="flex-1 min-w-0">
        {tab === 'Hotel Config' && <HotelConfig />}
        {tab === 'Users'        && <UserManagement />}
        {tab === 'Roles'        && <RoleManager />}
      </div>

    </div>
  );
}
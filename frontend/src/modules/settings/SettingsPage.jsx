import { useState } from 'react';
import HotelConfig    from './components/HotelConfig';
import UserManagement from './components/UserManagement';
import RoleManager    from './components/RoleManager';
import { Settings, Users, Shield, Plus, UserCheck } from 'lucide-react';

const TABS = [
  { key: 'Hotel Config', icon: Settings },
  { key: 'Users',        icon: Users    },
  { key: 'Roles',        icon: Shield   },
];

export default function SettingsPage() {
  const [tab,           setTab]           = useState('Hotel Config');
  const [openUserForm,  setOpenUserForm]  = useState(false);
  const [openRoleForm,  setOpenRoleForm]  = useState(false);

  return (
    <div className="space-y-4">

      {/* Tabs + action button on same row */}
      <div className="flex items-center justify-between gap-3">
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-1 p-1 rounded-lg w-max" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            {TABS.map(({ key, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  backgroundColor: tab === key ? 'var(--bg-surface)' : 'transparent',
                  color:           tab === key ? 'var(--brand)'       : 'var(--text-muted)',
                  boxShadow:       tab === key ? 'var(--shadow-xs)'   : 'none',
                }}>
                <Icon size={13} />{key}
              </button>
            ))}
          </div>
        </div>

        {tab === 'Users' && (
          <button onClick={() => setOpenUserForm(true)} className="btn-primary text-xs flex-shrink-0">
            <UserCheck size={14} /> Grant Access
          </button>
        )}
        {tab === 'Roles' && (
          <button onClick={() => setOpenRoleForm(true)} className="btn-primary text-xs flex-shrink-0">
            <Plus size={14} /> New Role
          </button>
        )}
      </div>

      {/* Content */}
      <div>
        {tab === 'Hotel Config' && <HotelConfig />}
        {tab === 'Users' && (
          <UserManagement openForm={openUserForm} onFormClose={() => setOpenUserForm(false)} />
        )}
        {tab === 'Roles' && (
          <RoleManager openForm={openRoleForm} onFormClose={() => setOpenRoleForm(false)} />
        )}
      </div>
    </div>
  );
}
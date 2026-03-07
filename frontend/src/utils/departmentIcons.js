// src/utils/departmentIcons.js
// Returns Lucide icon component reference by department name.
// Render at call site: const Icon = getDeptIcon(name); <Icon size={14} />

import {
  UtensilsCrossed,
  Sparkles,
  GlassWater,
  Waves,
  Wrench,
  Calculator,
  ShieldCheck,
  LayoutDashboard,
  ConciergeBell,
} from 'lucide-react';

export const DEPT_ICONS = {
  'Front Desk':      ConciergeBell,
  'Concierge':       ConciergeBell,
  'Room Service':    UtensilsCrossed,
  'Food & Beverage': UtensilsCrossed,
  'Housekeeping':    Sparkles,
  'Bar':             GlassWater,
  'Spa & Wellness':  Waves,
  'Maintenance':     Wrench,
  'Accounts':        Calculator,
  'Security':        ShieldCheck,
  'Management':      LayoutDashboard,
};

// Returns the icon component — render as <Icon size={x} />
export function getDeptIcon(name) {
  return DEPT_ICONS[name] || ConciergeBell;
}
// src/config/constants.js

export const ROLES = {
  ADMIN:            'admin',
  MANAGER:          'manager',
  RECEPTIONIST:     'receptionist',
  CASHIER:          'cashier',
  HOUSEKEEPER:      'housekeeper',
  MAINTENANCE:      'maintenance',
  BAR_STAFF:        'bar_staff',
  RESTAURANT_STAFF: 'restaurant_staff',
  HR_OFFICER:       'hr_officer',
  SECURITY:         'security',
};

export const PERMISSIONS = {
  RESERVATIONS: {
    CREATE:   'reservations:create',
    READ:     'reservations:read',
    UPDATE:   'reservations:update',
    DELETE:   'reservations:delete',
    CHECKIN:  'reservations:checkin',
    CHECKOUT: 'reservations:checkout',
  },
  ROOMS: {
    READ:   'rooms:read',
    UPDATE: 'rooms:update',
    STATUS: 'rooms:status',
  },
  GUESTS: {
    CREATE: 'guests:create',
    READ:   'guests:read',
    UPDATE: 'guests:update',
  },
  BILLING: {
    READ:     'billing:read',
    CHARGE:   'billing:charge',
    PAYMENT:  'billing:payment',
    VOID:     'billing:void',
    DISCOUNT: 'billing:discount',
    APPROVE:  'billing:approve',
  },
  STAFF: {
    READ:    'staff:read',
    UPDATE:  'staff:manage',
    MANAGE:  'staff:manage',
    PAYROLL: 'staff:payroll',
  },
  INVENTORY: {
    READ:    'inventory:read',
    UPDATE:  'inventory:update',
    APPROVE: 'inventory:orders',
    ORDERS:  'inventory:orders',
  },
  REPORTS: {
    READ:      'reports:basic',
    BASIC:     'reports:basic',
    FINANCIAL: 'reports:financial',
    AUDIT:     'reports:audit',
  },
  CONFIG: {
    READ:   'settings:read',
    UPDATE: 'settings:update',
  },
  MAINTENANCE: {
    READ:   'maintenance:read',
    CREATE: 'maintenance:create',
    UPDATE: 'maintenance:update',
  },
  HOUSEKEEPING: {
    READ:   'housekeeping:read',
    UPDATE: 'housekeeping:update',
    ASSIGN: 'housekeeping:assign',
  },
  SETTINGS: {
    READ:   'settings:read',
    UPDATE: 'settings:update',
  },
};

export const RESERVATION_STATUS = {
  CONFIRMED:   'confirmed',
  CHECKED_IN:  'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED:   'cancelled',
  NO_SHOW:     'no_show',
};

export const ROOM_STATUS = {
  AVAILABLE:    'available',
  OCCUPIED:     'occupied',
  DIRTY:        'dirty',
  CLEAN:        'clean',
  OUT_OF_ORDER: 'out_of_order',
  MAINTENANCE:  'maintenance',
};

export const FOLIO_STATUS = {
  OPEN:   'open',
  CLOSED: 'closed',
  VOIDED: 'voided',
};

export const PAYMENT_METHOD = {
  CASH:          'cash',
  CARD:          'card',
  BANK_TRANSFER: 'bank_transfer',
  MOBILE_MONEY:  'mobile_money',
  ROOM_CHARGE:   'room_charge',
  COMPLIMENTARY: 'complimentary',
  OTHER:         'other',
};

export const PAYMENT_STATUS = {
  PENDING:   'pending',
  COMPLETED: 'completed',
  FAILED:    'failed',
  REFUNDED:  'refunded',
};

export const BOOKING_SOURCE = {
  WALK_IN:         'walk_in',
  PHONE:           'phone',
  ONLINE:          'online',
  OTA_BOOKING_COM: 'ota_booking_com',
  OTA_EXPEDIA:     'ota_expedia',
  CORPORATE:       'corporate',
  REFERRAL:        'referral',
};

export const GUEST_CATEGORY = {
  REGULAR:     'regular',
  VIP:         'vip',
  CORPORATE:   'corporate',
  BLACKLISTED: 'blacklisted',
};

export const TASK_STATUS = {
  PENDING:     'pending',
  IN_PROGRESS: 'in_progress',
  DONE:        'done',
  INSPECTED:   'inspected',
  SKIPPED:     'skipped',
};

export const PRIORITY = {
  LOW:    'low',
  NORMAL: 'normal',
  HIGH:   'high',
  URGENT: 'urgent',
};

export const WORK_ORDER_STATUS = {
  OPEN:        'open',
  ASSIGNED:    'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED:    'resolved',
  CLOSED:      'closed',
  DEFERRED:    'deferred',
};

export const CURRENCY = {
  CODE:   'NGN',
  SYMBOL: 'N',
  toMajor: (kobo)  => kobo / 100,
  toMinor: (naira) => Math.round(naira * 100),
  format:  (kobo)  => `NGN ${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
};
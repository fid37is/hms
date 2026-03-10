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
  ROOMS: {
    READ:   'rooms:read',
    CREATE: 'rooms:create',
    UPDATE: 'rooms:update',
    DELETE: 'rooms:delete',
    STATUS: 'rooms:status',
  },
  RESERVATIONS: {
    READ:     'reservations:read',
    CREATE:   'reservations:create',
    UPDATE:   'reservations:update',
    CANCEL:   'reservations:cancel',
    DELETE:   'reservations:delete',
    CHECKIN:  'reservations:checkin',
    CHECKOUT: 'reservations:checkout',
  },
  GUESTS: {
    READ:   'guests:read',
    CREATE: 'guests:create',
    UPDATE: 'guests:update',
    DELETE: 'guests:delete',
    MERGE:  'guests:merge',
  },
  BILLING: {
    READ:     'billing:read',
    CHARGE:   'billing:charge',
    PAYMENT:  'billing:payment',
    VOID:     'billing:void',
    REFUND:   'billing:refund',
    DISCOUNT: 'billing:discount',
    APPROVE:  'billing:approve',
    EXPORT:   'billing:export',
  },
  HOUSEKEEPING: {
    READ:   'housekeeping:read',
    UPDATE: 'housekeeping:update',
    ASSIGN: 'housekeeping:assign',
  },
  INVENTORY: {
    READ:    'inventory:read',
    UPDATE:  'inventory:update',
    DELETE:  'inventory:delete',
    ORDERS:  'inventory:orders',
    APPROVE: 'inventory:approve',
  },
  MAINTENANCE: {
    READ:    'maintenance:read',
    CREATE:  'maintenance:create',
    UPDATE:  'maintenance:update',
    ASSIGN:  'maintenance:assign',
    RESOLVE: 'maintenance:resolve',
    CLOSE:   'maintenance:close',
  },
  STAFF: {
    READ:    'staff:read',
    CREATE:  'staff:create',
    MANAGE:  'staff:manage',
    DELETE:  'staff:delete',
    PAYROLL: 'staff:payroll',
  },
  REPORTS: {
    BASIC:     'reports:basic',
    OCCUPANCY: 'reports:occupancy',
    FINANCIAL: 'reports:financial',
    AUDIT:     'reports:audit',
  },
  FNB: {
    READ:    'fnb:read',
    CREATE:  'fnb:create',
    UPDATE:  'fnb:update',
    DELETE:  'fnb:delete',
    BILLING: 'fnb:billing',
    MENU:    'fnb:menu',
  },
  NIGHT_AUDIT: {
    READ: 'night_audit:read',
    RUN:  'night_audit:run',
  },
  CHAT: {
    READ:  'chat:read',
    REPLY: 'chat:reply',
  },
  CONFIG: {
    READ:   'settings:read',
    UPDATE: 'settings:update',
  },
  SETTINGS: {
    READ:   'settings:read',
    UPDATE: 'settings:update',
    ROLES:  'settings:roles',
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

export const FNB_ORDER_STATUS = {
  OPEN:      'open',
  SENT:      'sent',
  PREPARING: 'preparing',
  READY:     'ready',
  SERVED:    'served',
  BILLED:    'billed',
  CANCELLED: 'cancelled',
};

export const FNB_ITEM_STATUS = {
  AVAILABLE:   'available',
  UNAVAILABLE: 'unavailable',
  SEASONAL:    'seasonal',
};
// src/utils/format.js

export const formatCurrency = (kobo) => {
  if (kobo == null) return '₦0.00';
  return `₦${(kobo / 100).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-NG', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
};

export const formatNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut) - new Date(checkIn);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const statusColor = (status) => {
  const map = {
    // Reservations
    confirmed:   'bg-blue-100 text-blue-800',
    checked_in:  'bg-green-100 text-green-800',
    checked_out: 'bg-gray-100 text-gray-700',
    cancelled:   'bg-red-100 text-red-700',
    // Rooms
    available:    'bg-green-100 text-green-800',
    occupied:     'bg-blue-100 text-blue-800',
    dirty:        'bg-yellow-100 text-yellow-800',
    clean:        'bg-green-100 text-green-800',
    maintenance:  'bg-orange-100 text-orange-800',
    out_of_order: 'bg-red-100 text-red-800',
    // Tasks / Work orders
    pending:     'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed:   'bg-green-100 text-green-800',
    resolved:    'bg-green-100 text-green-800',
    closed:      'bg-gray-100 text-gray-700',
    open:        'bg-yellow-100 text-yellow-800',
    // Payments / Folios
    paid:        'bg-green-100 text-green-800',
    refunded:    'bg-purple-100 text-purple-800',
    // Staff
    active:      'bg-green-100 text-green-800',
    on_leave:    'bg-yellow-100 text-yellow-800',
    suspended:   'bg-orange-100 text-orange-800',
    terminated:  'bg-red-100 text-red-800',
    // Generic
    approved:    'bg-green-100 text-green-800',
    rejected:    'bg-red-100 text-red-700',
    draft:       'bg-gray-100 text-gray-700',
    received:    'bg-green-100 text-green-800',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

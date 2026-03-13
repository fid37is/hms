// src/modules/events/components/EventCalendar.jsx
import { useState } from 'react';
import { useQuery }  from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as eventApi from '../../../lib/api/eventApi';

const EVENT_TYPE_COLORS = {
  wedding:    '#e91e8c', conference: 'var(--brand)',
  birthday:   '#9c27b0', corporate:  '#1976d2',
  gala:       '#f57c00', exhibition: '#00897b',
  meeting:    '#607d8b', workshop:   '#5c6bc0',
  other:      '#90a4ae',
};

const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function EventCalendar() {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(null);

  // Date range for the displayed month
  const from = `${year}-${String(month + 1).padStart(2,'0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to   = `${year}-${String(month + 1).padStart(2,'0')}-${lastDay}`;

  const { data: events = [] } = useQuery({
    queryKey: ['events-calendar', year, month],
    queryFn:  () => eventApi.getEvents({ date_from: from, date_to: to, limit: 100 }).then(r => r.data.data || []),
  });

  // Build a map: date string → events[]
  const eventMap = {};
  events.forEach(e => {
    if (!eventMap[e.event_date]) eventMap[e.event_date] = [];
    eventMap[e.event_date].push(e);
  });

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  // Build calendar grid
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = today.toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button className="btn-ghost p-2 rounded-lg" onClick={prevMonth}><ChevronLeft size={16} /></button>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>
          {MONTHS[month]} {year}
        </h3>
        <button className="btn-ghost p-2 rounded-lg" onClick={nextMonth}><ChevronRight size={16} /></button>
      </div>

      {/* Grid */}
      <div className="card overflow-hidden">
        {/* DOW headers */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border-soft)' }}>
          {DOW.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}>{d}</div>
          ))}
        </div>

        {/* Weeks */}
        {Array.from({ length: cells.length / 7 }, (_, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border-soft)' }}>
            {cells.slice(wi * 7, wi * 7 + 7).map((day, di) => {
              if (!day) return (
                <div key={di} className="min-h-20 p-1"
                  style={{ backgroundColor: 'var(--bg-subtle)' }} />
              );
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const dayEvents = eventMap[dateStr] || [];
              const isToday = dateStr === todayStr;

              return (
                <div key={di} className="min-h-20 p-1.5 border-r"
                  style={{
                    borderColor: 'var(--border-soft)',
                    backgroundColor: isToday ? 'var(--brand-subtle)' : 'var(--bg-surface)',
                  }}>
                  <p className="text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full"
                    style={{
                      color: isToday ? 'var(--text-on-brand)' : 'var(--text-base)',
                      backgroundColor: isToday ? 'var(--brand)' : 'transparent',
                    }}>
                    {day}
                  </p>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(e => (
                      <button key={e.id}
                        className="w-full text-left text-xs px-1.5 py-0.5 rounded truncate block"
                        style={{
                          backgroundColor: `${EVENT_TYPE_COLORS[e.event_type] || '#90a4ae'}22`,
                          color: EVENT_TYPE_COLORS[e.event_type] || '#607d8b',
                        }}
                        onClick={() => setSelected(e)}>
                        {e.start_time?.slice(0,5)} {e.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Tooltip / mini detail for selected event */}
      {selected && (
        <div className="card p-4 space-y-1"
          style={{ border: '1px solid var(--border-base)' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-base)' }}>{selected.title}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {selected.event_no} · {selected.client_name}
              </p>
            </div>
            <button className="btn-ghost p-1 rounded" onClick={() => setSelected(null)}>
              ✕
            </button>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-sub)' }}>
            📅 {selected.event_date} · {selected.start_time?.slice(0,5)} – {selected.end_time?.slice(0,5)}
          </p>
          {selected.event_venues?.name && (
            <p className="text-xs" style={{ color: 'var(--text-sub)' }}>📍 {selected.event_venues.name}</p>
          )}
          <p className="text-xs" style={{ color: 'var(--text-sub)' }}>👥 {selected.guest_count} guests</p>
          <span className="badge capitalize">{selected.status}</span>
        </div>
      )}
    </div>
  );
}
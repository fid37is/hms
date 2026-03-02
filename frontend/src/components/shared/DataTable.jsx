import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import { TableProperties } from 'lucide-react';

/**
 * DataTable with mobile card fallback.
 * On small screens, renders each row as a card.
 * On md+, renders a regular table.
 */
export default function DataTable({ columns, data, loading, emptyTitle = 'No records found', onRowClick, mobileCard }) {
  if (loading) return <LoadingSpinner center />;
  if (!data?.length) return <EmptyState icon={TableProperties} title={emptyTitle} />;

  // If a custom mobile card renderer is provided, use it on small screens
  const MobileCard = mobileCard;

  return (
    <>
      {/* Mobile card view */}
      {MobileCard ? (
        <div className="md:hidden space-y-2">
          {data.map((row, i) => (
            <div
              key={row.id || i}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer' : ''}
            >
              <MobileCard row={row} />
            </div>
          ))}
        </div>
      ) : (
        // Default compact mobile cards (auto-generated from columns)
        <div className="md:hidden space-y-2">
          {data.map((row, i) => {
            const visibleCols = columns.filter(c => c.key !== 'actions');
            const actionCol   = columns.find(c => c.key === 'actions');
            return (
              <div
                key={row.id || i}
                className="card p-3 cursor-pointer"
                onClick={() => onRowClick?.(row)}
                style={{ cursor: onRowClick || actionCol ? 'default' : undefined }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    {visibleCols.slice(0, 4).map(col => (
                      <div key={col.key} className="flex items-center gap-2 text-xs">
                        <span className="font-medium flex-shrink-0 w-20" style={{ color: 'var(--text-muted)' }}>
                          {col.label}
                        </span>
                        <span className="truncate" style={{ color: 'var(--text-base)' }}>
                          {col.render ? col.render(row) : (row[col.key] ?? '—')}
                        </span>
                      </div>
                    ))}
                  </div>
                  {actionCol && (
                    <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {actionCol.render(row)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border-soft)' }}>
        <table className="w-full">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className="table-th" style={col.width ? { width: col.width } : {}}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className="table-row"
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map(col => (
                  <td key={col.key} className="table-td">
                    {col.render ? col.render(row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

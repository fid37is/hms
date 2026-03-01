import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import { TableProperties } from 'lucide-react';

export default function DataTable({ columns, data, loading, emptyTitle = 'No records found', onRowClick }) {
  if (loading) return <LoadingSpinner center />;
  if (!data?.length) return <EmptyState icon={TableProperties} title={emptyTitle} />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {columns.map((col) => (
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
              className={onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
            >
              {columns.map((col) => (
                <td key={col.key} className="table-td">
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

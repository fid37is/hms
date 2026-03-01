import { statusColor } from '../../utils/format';

export default function StatusBadge({ status, label }) {
  return (
    <span className={`badge ${statusColor(status)}`}>
      {label || status?.replace(/_/g, ' ')}
    </span>
  );
}

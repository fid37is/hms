// Separate component so each line has its own stable onChange handler
// Avoids inline `e => handleLineChange(i, e)` closures that cause cursor-jump
export default function POLineItem({ line, index, items, onChange, onRemove }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(index, name, value);
  };

  return (
    <div className="grid grid-cols-3 gap-2 items-center">
      <select
        name="item_id"
        className="input"
        required
        value={line.item_id}
        onChange={handleChange}
      >
        <option value="">Select item…</option>
        {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
      </select>

      <input
        name="quantity"
        type="number"
        min="1"
        required
        className="input"
        placeholder="Qty"
        value={line.quantity}
        onChange={handleChange}
      />

      <div className="flex gap-1.5">
        <input
          name="unit_cost"
          type="number"
          min="0"
          step="0.01"
          className="input"
          placeholder="Unit cost ₦"
          value={line.unit_cost}
          onChange={handleChange}
        />
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="flex-shrink-0 px-2 rounded-md text-sm transition-colors"
            style={{ color: 'var(--s-red-text)', backgroundColor: 'var(--s-red-bg)' }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

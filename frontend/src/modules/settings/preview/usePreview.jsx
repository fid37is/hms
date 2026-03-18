// src/hooks/usePreview.jsx
//
// Two exports:
//
// 1. PreviewContext — provided by the HMS CustomizePage, wraps section preview.
//    Sections check this first; if present they read from it instead of
//    useHotelConfig, and EditableText fields become live inputs.
//
// 2. EditableText — renders an inline <input> or <textarea> when a section is
//    active in the HMS editor. On the live hotel website (no PreviewContext)
//    it renders the real element unchanged — zero impact on production.

import { createContext, useContext } from 'react';

export const PreviewContext = createContext(null);

export function usePreview() {
  return useContext(PreviewContext);
}

export function EditableText({
  sectionId, field, children, multiline,
  style, as: Tag = 'span', className,
}) {
  const ctx = useContext(PreviewContext);

  // ── Live hotel website — render the real element ──────────────────────────
  if (!ctx || !ctx.isPreview) {
    return <Tag style={style} className={className}>{children}</Tag>;
  }

  const { activeSection, content, setField } = ctx;
  const value = content?.[sectionId]?.[field] ?? (typeof children === 'string' ? children : '');

  // ── Section not focused — show current saved value as static text ─────────
  if (activeSection !== sectionId) {
    return <Tag style={style} className={className}>{value || children}</Tag>;
  }

  // ── Section focused — render editable input ───────────────────────────────
  const inputStyle = {
    ...style,
    display:       'block',
    width:         '100%',
    background:    'rgba(99,102,241,0.08)',
    border:        '1.5px dashed rgba(99,102,241,0.65)',
    borderRadius:  3,
    padding:       '2px 6px',
    fontFamily:    style?.fontFamily     || 'inherit',
    fontSize:      style?.fontSize       || 'inherit',
    fontWeight:    style?.fontWeight     || 'inherit',
    lineHeight:    style?.lineHeight     || 'inherit',
    letterSpacing: style?.letterSpacing  || 'inherit',
    textTransform: style?.textTransform  || 'inherit',
    color:         style?.color          || 'inherit',
    outline:       'none',
    resize:        'none',
    boxSizing:     'border-box',
    cursor:        'text',
    transition:    'border-color 0.15s, background 0.15s',
    margin:        0,
  };

  const onFocus = e => {
    e.target.style.borderColor = 'rgba(99,102,241,1)';
    e.target.style.background  = 'rgba(99,102,241,0.13)';
    e.target.style.borderStyle = 'solid';
  };
  const onBlur = e => {
    e.target.style.borderColor = 'rgba(99,102,241,0.65)';
    e.target.style.background  = 'rgba(99,102,241,0.08)';
    e.target.style.borderStyle = 'dashed';
  };
  const onChange = e => setField(sectionId, field, e.target.value);

  if (multiline) {
    return (
      <textarea
        value={value} onChange={onChange} onFocus={onFocus} onBlur={onBlur}
        className={className} style={inputStyle}
        rows={Math.max(2, (value || '').split('\n').length)}
      />
    );
  }
  return (
    <input
      type="text" value={value} onChange={onChange} onFocus={onFocus} onBlur={onBlur}
      className={className} style={{ ...inputStyle, height: 'auto' }}
    />
  );
}
import React, { memo, useEffect, useRef, useState } from 'react';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import * as styles from './styles.module.scss';

// Hover-to-edit title. When the user hovers over the H2, a pencil affordance
// appears; clicking the title swaps it for an inline input. Blur / Enter
// commits via onChange; Escape cancels and reverts.
const EditableTitle = ({ value, onChange, className = '', placeholder = 'Title' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const startEditing = () => setIsEditing(true);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== value) onChange(next);
    setIsEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  };

  if (isEditing) {
    return <input
      ref={inputRef}
      type="text"
      className={`${styles.input} ${className}`}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      aria-label="Edit title"
    />;
  }

  return <span
    className={`${styles.wrap} ${className}`}
    onClick={startEditing}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter') startEditing(); }}
    title="Click to edit"
  >
    <h2 className={styles.title}>{value || placeholder}</h2>
    <EditOutlinedIcon className={styles.pencil} />
  </span>;
};

export default memo(EditableTitle);

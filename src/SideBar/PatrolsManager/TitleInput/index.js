import React, { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as PencilIcon } from '../../../common/images/icons/pencil.svg';

import * as styles from './styles.module.scss';

const NEW_LINES = /[\r\n]+/g;
const WIDTH_CARET_BUFFER = 2;

const TitleInput = ({ isDirty, isReadOnly = false, onChange, value, ...otherProps }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'titleInput' });

  const inputRef = useRef();
  const measureRef = useRef();

  const [width, setWidth] = useState(null);

  const onEditButtonClick = () => {
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  // A title is a single line of text, so a newline in it is only ever a stray:
  // typed it does nothing, and pasted it reads as the space it stood for.
  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  useLayoutEffect(() => {
    if (measureRef.current) {
      setWidth(measureRef.current.offsetWidth + WIDTH_CARET_BUFFER);
    }
  // Dirty titles render in italics, which changes the text metrics.
  }, [isDirty, value]);

  // A title reads in full rather than truncating, so the field takes the height
  // its value wraps to at the width measured for it.
  useLayoutEffect(() => {
    const input = inputRef.current;

    if (input) {
      input.style.height = 'auto';

      if (input.scrollHeight) {
        input.style.height = `${input.scrollHeight}px`;
      }
    }
  }, [isDirty, value, width]);

  return <div className={styles.titleInput}>
    <textarea
      className={`${styles.input} ${isDirty ? styles.unsaved : ''}`}
      onChange={(event) => onChange(event.target.value.replace(NEW_LINES, ' '))}
      onKeyDown={onKeyDown}
      readOnly={isReadOnly}
      ref={inputRef}
      rows={1}
      style={width ? { width } : undefined}
      value={value}
      {...otherProps}
    />

    {/* The field grows to fit its value, which only a copy of the text laid
    out freely can measure. */}
    <span aria-hidden="true" className={`${styles.measure} ${isDirty ? styles.unsaved : ''}`} ref={measureRef}>
      {value}
    </span>

    {/* Mouse-only. The input is already focusable/editable. */}
    {!isReadOnly && <button
      aria-hidden="true"
      className={styles.editButton}
      onClick={onEditButtonClick}
      onMouseDown={(event) => event.preventDefault()}
      tabIndex={-1}
      title={t('editButtonLabel')}
      type="button"
    >
      <PencilIcon aria-hidden="true" />
    </button>}
  </div>;
};

export default TitleInput;

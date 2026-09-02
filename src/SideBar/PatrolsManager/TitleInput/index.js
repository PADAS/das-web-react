import React, { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as PencilIcon } from '../../../common/images/icons/pencil.svg';

import * as styles from './styles.module.scss';

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

  useLayoutEffect(() => {
    if (measureRef.current) {
      setWidth(measureRef.current.offsetWidth + WIDTH_CARET_BUFFER);
    }
  // Dirty titles render in italics, which changes the text metrics.
  }, [isDirty, value]);

  return <div className={styles.titleInput}>
    <input
      className={`${styles.input} ${isDirty ? styles.unsaved : ''}`}
      onChange={(event) => onChange(event.target.value)}
      readOnly={isReadOnly}
      ref={inputRef}
      style={width ? { width } : undefined}
      type="text"
      value={value}
      {...otherProps}
    />

    {/* The input grows to fit its value, which only a copy of the text laid
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

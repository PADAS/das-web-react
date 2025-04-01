import React, { forwardRef, memo } from 'react';
import LoadingOverlay from '../LoadingOverlay';
import * as styles from './styles.module.scss';

const SubjectControlButton = ({
  buttonClassName = '',
  containerClassName = '',
  disabled = false,
  labelText,
  onClick = null,
  showLabel = true,
  loading = false,
  ...rest
}, ref) => {
  return <div className={`${styles.container} ${containerClassName} ${showLabel ? ` ${styles.hasLabel}` : ''}`} onClick={onClick || undefined}>
    {loading && <LoadingOverlay className={styles.loadingOverlay} />}
    <button ref={ref} disabled={disabled} title={labelText} type="button" className={`${styles.button} ${buttonClassName}`} {...rest}></button>
    {showLabel && labelText && <span>{labelText}</span>}
  </div>;
};

const memoizedSubjectControlButton = memo(forwardRef(SubjectControlButton));

export default memoizedSubjectControlButton;

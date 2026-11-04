import { memo } from 'react';

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
  ref,
  ...rest
}) => {
  return <div className={`${styles.container} ${containerClassName} ${showLabel ? ` ${styles.hasLabel}` : ''}`} onClick={onClick || undefined}>
    {loading && <LoadingOverlay loaderSize='24' className={styles.loadingOverlay} />}
    <button
      aria-busy={loading || undefined}
      className={`${styles.button} ${buttonClassName}`}
      disabled={disabled}
      ref={ref}
      title={labelText}
      type="button"
      {...rest}
    />
    {showLabel && labelText && <span>{labelText}</span>}
  </div>;
};

export default memo(SubjectControlButton);

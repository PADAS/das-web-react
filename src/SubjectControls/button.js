import React, { forwardRef, memo } from 'react';
import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import LoadingOverlay from '../LoadingOverlay';
import styles from './styles.module.scss';

const SubjectControlButton = (props, ref) => {
  const { buttonClassName = '', containerClassName = '', disabled = false, labelText, onClick, showLabel, loading, ...rest } = props;

  return <div className={`${styles.container} ${containerClassName} ${showLabel ? ` ${styles.hasLabel}` : ''}`} onClick={onClick}>
    {loading && <LoadingOverlay className={styles.loadingOverlay} />}
    <button ref={ref} disabled={disabled} title={labelText} type="button" className={`${styles.button} ${buttonClassName}`} {...rest}></button>
    {showLabel && labelText && <span>{labelText}</span>}
  </div>;
};

export default memo(forwardRef(SubjectControlButton));

SubjectControlButton.defaultProps = {
  onClick: noop,
  showLabel: true,
  loading: false,
};

SubjectControlButton.propTypes = {
  buttonClassName: PropTypes.string,
  containerClassName: PropTypes.string,
  disabled: PropTypes.bool,
  labelText: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  showLabel: PropTypes.bool,
  loading: PropTypes.bool,
};
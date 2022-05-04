import React, { forwardRef, memo } from 'react';
import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';

const SubjectHistoryButton = (props, ref) => {
  const { className: externalClassName, disabled, onClick, showLabel, ...rest } = props;


  return <div className={`${styles.container} ${showLabel ? ` ${styles.hasLabel}` : ''}`} onClick={onClick}>
    <button ref={ref} disabled={disabled} title='Historical Data' type="button" className={`${styles.button} ${externalClassName || ''}`} {...rest}></button>
    {showLabel && <span>Historical Data</span>}
  </div>;
};

export default memo(forwardRef(SubjectHistoryButton));

SubjectHistoryButton.defaultProps = {
  onClick: noop,
  showLabel: true,
};

SubjectHistoryButton.propTypes = {
  trackVisible: PropTypes.bool.isRequired,
  trackPinned: PropTypes.bool.isRequired,
  onClick: PropTypes.func,
  showLabel: PropTypes.bool,
  loading: PropTypes.bool,
};
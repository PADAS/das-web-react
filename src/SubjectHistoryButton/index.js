import React, { forwardRef, memo } from 'react';
import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';

import SubjectControlButton from '../SubjectControls/button';

const SubjectHistoryButton = (props, ref) => {
  const { disabled, onClick, showLabel, ...rest } = props;

  return <SubjectControlButton disabled={disabled} buttonClassName={styles.button} containerClassName={styles.container} onClick={onClick} ref={ref} showLabel={showLabel} labelText='Historical Data' {...rest} />;
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
import React, { forwardRef, memo } from 'react';
import noop from 'lodash/noop';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';

import SubjectControlButton from '../SubjectControls/button';

const SubjectHistoryButton = (props, ref) => {

  return <SubjectControlButton buttonClassName={styles.button} containerClassName={styles.container} ref={ref} labelText='Historical Data' {...props} />;
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
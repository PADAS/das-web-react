import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { trackEvent } from '../utils/analytics';
import { ReactComponent as MultiPatrolIcon } from '../common/images/icons/multi-patrol-marker.svg';

import styles from './styles.module.scss';


const PatrolJumpButton = (props) => {
  const { clickAnalytics, onClick, map, hasMultiPatrols, ...rest } = props;

  const onJumpButtonClick = (e) => {

  };

  return <button title="Jump to patrol" type="button"
    className={styles.patrolJumpButton} onClick={onJumpButtonClick} {...rest}>
    <MultiPatrolIcon />
  </button>;
};

export default PatrolJumpButton;

PatrolJumpButton.propTypes = {
  coordinates: PropTypes.array,
  clickAnalytics: PropTypes.arrayOf(PropTypes.string),
  onClick: PropTypes.func,
  map: PropTypes.object,
  zoom: PropTypes.number,
};
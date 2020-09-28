import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { trackEvent } from '../utils/analytics';

import styles from './styles.module.scss';


const PatrolJumpButton = (props) => {
  const { clickAnalytics, onClick, map, showLabel, hoverText, ...rest } = props;

  const onJumpButtonClick = (e) => {
    // implement logic 
    trackEvent('Patrol List', 'Jump to Patrols on Map');
  };

  return <div className={styles.container}>
    <button title="Jump to patrol" type="button"
      className={styles.button} onClick={onJumpButtonClick} {...rest}>
    </button>
    {showLabel && <span>{hoverText}</span>}
  </div>;

};


export default memo(PatrolJumpButton);

PatrolJumpButton.propTypes = {
  coordinates: PropTypes.array,
  clickAnalytics: PropTypes.arrayOf(PropTypes.string),
  onClick: PropTypes.func,
  map: PropTypes.object,
  zoom: PropTypes.number,
};
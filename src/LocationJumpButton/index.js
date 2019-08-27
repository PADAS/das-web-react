import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { BREAKPOINTS } from '../constants';
import { updateUserPreferences } from '../ducks/user-preferences';
import { jumpToLocation } from '../utils/map';
import { trackEvent } from '../utils/analytics';

import styles from './styles.module.scss';


const { screenIsMediumLayoutOrLarger } = BREAKPOINTS;

const LocationJumpButton = memo((props) => {
  const { map, coordinates, zoom, updateUserPreferences, onButtonClick } = props;

  const closeSidebarForSmallViewports = () => {
    if (!screenIsMediumLayoutOrLarger.matches) {
      updateUserPreferences({ sidebarOpen: false });
    }
  };

  const onJumpButtonClick = () => {
    onButtonClick(map, coordinates, zoom);
    closeSidebarForSmallViewports();
  };

  return <button title="Jump to this location" type="button" 
    className={styles.jump} onClick={onJumpButtonClick}></button>
});

export default connect(null, { updateUserPreferences })(LocationJumpButton);


LocationJumpButton.defaultProps = {
  onButtonClick(map, coordinates, zoom) {
    trackEvent('Map Interaction', "Click 'Jump to Location' button");
    jumpToLocation(map, coordinates, zoom);
  }
}

LocationJumpButton.propTypes = {
  coordinates: PropTypes.arrayOf(PropTypes.number),
  onButtonClick: PropTypes.func,
  map: PropTypes.object,
  zoom: PropTypes.number,
};
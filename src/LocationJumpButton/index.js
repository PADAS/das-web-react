import React, { memo, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { BREAKPOINTS } from '../constants';
import { updateUserPreferences } from '../ducks/user-preferences';
import { jumpToLocation } from '../utils/map';

import styles from './styles.module.scss';


const { screenIsMediumLayoutOrLarger } = BREAKPOINTS;

const LocationJumpButton = memo((props) => {
  const { map, coordinates, zoom, updateUserPreferences, onButtonClick } = props;

  const closeSidebarForSmallViewports = () => {
    if (!screenIsMediumLayoutOrLarger.matches) {
      updateUserPreferences({ sidebarOpen: false });
    }
  };

  const handleClick = () => {
    onButtonClick(map, coordinates, zoom);
    closeSidebarForSmallViewports();
  };

  return <button title="Jump to this location" type="button" className={styles.jump} onClick={handleClick}></button>
});

export default connect(null, { updateUserPreferences })(LocationJumpButton);


LocationJumpButton.defaultProps = {
  onButtonClick(map, coordinates, zoom) {
    jumpToLocation(map, coordinates, zoom);
  }
}

LocationJumpButton.propTypes = {
  coordinates: PropTypes.arrayOf(PropTypes.number),
  onButtonClick: PropTypes.func,
  map: PropTypes.object,
  zoom: PropTypes.number,
};
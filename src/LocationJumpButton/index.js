import React, { memo, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { BREAKPOINTS } from '../constants';
import { updateUserPreferences } from '../ducks/user-preferences';
import { jumpToLocation } from '../utils/map';

import styles from './styles.module.scss';


const { screenIsMediumLayoutOrLarger } = BREAKPOINTS;

const LocationJumpButton = memo((props) => {
  const { map, coordinates, zoom, updateUserPreferences } = props;
  
  const closeSidebarForSmallViewports = () => {
    if (!screenIsMediumLayoutOrLarger.matches) {
      updateUserPreferences({ sidebarOpen: false });
    }
  };

  const onButtonClick = () => {
    jumpToLocation(coordinates, map, zoom);
    closeSidebarForSmallViewports();

    // close the sidebar for smaller layouts on jump and zoom
    
  };

  return <button title="Jump to this location" type="button" className={styles.jump} onClick={onButtonClick}></button>
});

export default connect(null, { updateUserPreferences })(LocationJumpButton);

LocationJumpButton.propTypes = {
  coordinates: PropTypes.arrayOf(PropTypes.number).isRequired,
  map: PropTypes.object.isRequired,
  zoom: PropTypes.number,
};
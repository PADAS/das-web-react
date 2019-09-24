import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { BREAKPOINTS } from '../constants';
import { updateUserPreferences } from '../ducks/user-preferences';
import { jumpToLocation } from '../utils/map';
import { trackEvent } from '../utils/analytics';
import { ReactComponent as MarkerIcon } from '../common/images/icons/marker-feed.svg';

import styles from './styles.module.scss';


const { screenIsMediumLayoutOrLarger } = BREAKPOINTS;

const LocationJumpButton = (props) => {
  const { map, coordinates, isMulti, zoom, updateUserPreferences, onButtonClick } = props;

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
    className={isMulti ? styles.multi : styles.jump} onClick={onJumpButtonClick}>
    <MarkerIcon />
    {isMulti && <MarkerIcon />}
  </button>;
};

export default connect(null, { updateUserPreferences })(memo(LocationJumpButton));


LocationJumpButton.defaultProps = {
  onButtonClick(map, coordinates, zoom) {
    trackEvent('Map Interaction', 'Click \'Jump to Location\' button');
    jumpToLocation(map, coordinates, zoom);
  }
};

LocationJumpButton.propTypes = {
  coordinates: PropTypes.arrayOf(PropTypes.number),
  onButtonClick: PropTypes.func,
  map: PropTypes.object,
  zoom: PropTypes.number,
};
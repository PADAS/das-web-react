import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { clearTracksState } from '../ducks/map-ui';
import { trackEvent } from '../utils/analytics';
import tracksIcon from '../common/images/icons/blue-tracks.png';

import styles from './styles.module.scss';

const ClearTracksControl = (props) => {

  const {  } = props;

  const clearTracks = () => {

  }
  const onClearTracksClick = (e) => {
    clearTracks();
    trackEvent('Clear Tracks', 'Click'); 
  };

  return <span className={styles.clearTracks}><img src={tracksIcon}/>
    <a href="#" onClick={() => onClearTracksClick()}>Clear Tracks</a>
    </span>
};

export default connect(null, { clearTracksState }) (ClearTracksControl);

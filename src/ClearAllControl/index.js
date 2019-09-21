import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { clearMapFeaturesState } from '../ducks/map-ui';
import { trackEvent } from '../utils/analytics';
import { ReactComponent as CheckIcon } from '../common/images/icons/check.svg';

import styles from './styles.module.scss';

const ClearAllControl = (props) => {

  const { clearMapFeatures, clearMapFeaturesState, map } = props;

  console.log('clearAllControl', props);

  const onClearAllClick = (e) => {
    clearMapFeaturesState(true);
    trackEvent('Clear All', 'Click'); 
  };

  return <div className={styles.clearAllRow}>
    <CheckIcon style={{height: '1.5rem', width: '1.5rem', stroke: '#000', fill: '#fff'}} />
    <a href="#" onClick={() => onClearAllClick()}>Clear All</a>
  </div>
};

const mapStateToProps = ( {view:{clearMapFeatures}} ) => {
  return {clearMapFeatures};
};

export default connect(mapStateToProps, {clearMapFeaturesState}) (ClearAllControl);

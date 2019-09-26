import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { toggleShowInactiveRadioState } from '../ducks/map-ui';
import { withMap } from '../EarthRangerMap';
import { displayInactiveRadios } from '../utils/map';
import { trackEvent } from '../utils/analytics';

import styles from './styles.module.scss';

const InactiveRadioControl = (props) => {

  const { showInactiveRadios, toggleShowInactiveRadioState, map } = props;

  const onCheckboxChange = (e) => {
    toggleShowInactiveRadioState(!showInactiveRadios);
    trackEvent('Map Interaction',  `${showInactiveRadios? 'Uncheck' : 'Check'} 'Show Inactive Radios' checkbox`);
  };

  useEffect( () => displayInactiveRadios(map, showInactiveRadios), [showInactiveRadios]);

  return <label>
    <input type='checkbox' name='inactiveRadios' checked={showInactiveRadios} onChange={onCheckboxChange}/>
    <span className={styles.cbxlabel}>Show Inactive Radios</span>
  </label>;
};

const mapStateToProps = ( {view:{showInactiveRadios}} ) => {
  return {showInactiveRadios};
};

export default connect(mapStateToProps, {toggleShowInactiveRadioState})(withMap(InactiveRadioControl));
import React from 'react';
import { connect } from 'react-redux';
import { toggleShowInactiveRadioState } from '../ducks/map-ui';
import { withMap } from '../EarthRangerMap';
import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const InactiveRadioControl = (props) => {

  const { showInactiveRadios, toggleShowInactiveRadioState } = props;

  const onCheckboxChange = () => {
    toggleShowInactiveRadioState(!showInactiveRadios);
    mapInteractionTracker.track(`${showInactiveRadios? 'Uncheck' : 'Check'} 'Show Inactive Radios' checkbox`);
  };

  return <label>
    <input type='checkbox' name='inactiveRadios' checked={showInactiveRadios} onChange={onCheckboxChange}/>
    <span className={styles.cbxlabel}>Show Inactive Radios</span>
  </label>;
};

const mapStateToProps = ( { view: { showInactiveRadios } } ) => {
  return { showInactiveRadios };
};

export default connect(mapStateToProps, { toggleShowInactiveRadioState })(withMap(InactiveRadioControl));
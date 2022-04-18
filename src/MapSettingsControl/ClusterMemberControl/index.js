import React from 'react';
import { connect } from 'react-redux';

import { setMapClusterConfig } from '../../ducks/map-ui';

import styles from './styles.module.scss';

const ClusterMemberControl = ({ mapClusterConfig, setMapClusterConfig, timeSliderActive }) => {
  const configEntries = Object.entries(mapClusterConfig).filter(([key]) => key !== '_persist');

  const fullyChecked = configEntries.every(([, val]) => !!val);
  const partiallyChecked = !fullyChecked && configEntries.some(([, val]) => !!val);

  const disableAll = !!timeSliderActive;

  const toggleAll = () => {
    const value = !fullyChecked;

    setMapClusterConfig(configEntries.reduce((accumulator, [key]) => ({
      ...accumulator,
      [key]: value,
    }), {}));
  };

  const toggle = ({ target: { checked, id } }) => {
    setMapClusterConfig({ ...mapClusterConfig, [id]: checked });
  };


  return <>
    <label>
      <input
    type='checkbox'
    disabled={disableAll}
    id='cluster-config-control'
    data-testid='cluster-config-control'
    checked={fullyChecked}
    ref={input => {
      if (input) {
        input.indeterminate = partiallyChecked;
      }
    }}
    onChange={toggleAll}
    />
      <span className={styles.checkboxlabel}>Cluster Map Data</span>
    </label>
    <ul className={styles.subListItems}>
      {configEntries.map(([key, value]) =>
        <li key={key}>
          <label>
            <input type='checkbox' disabled={disableAll} id={key} data-testid={`cluster-config-control-${key}`} checked={value} onChange={toggle}/>
            <span style={{ textTransform: 'capitalize' }} className={styles.checkboxlabel}>{key}</span>
          </label>
        </li>
    )}
    </ul>
  </>;
};

const mapStateToProps = ({ view: { mapClusterConfig, timeSliderState } }) => ({ mapClusterConfig, timeSliderActive: timeSliderState.active });

export default connect(mapStateToProps, { setMapClusterConfig })(ClusterMemberControl);
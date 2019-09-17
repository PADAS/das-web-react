import React, { memo, useRef } from 'react';
import { Popup } from 'react-mapbox-gl';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';
import { ReactComponent as GeofenceIcon } from '../common/images/icons/geofence-analyzer-icon.svg';
import { ReactComponent as ProximityIcon } from '../common/images/icons/proximity-analyzer-icon.svg';
import styles from './styles.module.scss';


import { hidePopup } from '../ducks/popup';

const AnalyzerConfigPopup = (props) => {

  const { data: { geometry, properties }, ...rest } = props;

  // XXX better way to inject style and stroke?
  const iconForCategory = category => { 
    if (category === 'geofence') return <GeofenceIcon stroke='black' style={{height: '2rem', width: '2rem'}} />;
    if (category === 'proximity') return <ProximityIcon stroke='black' style={{height: '2rem', width: '2rem'}} />;
    return null;
  }

  return (
    <Popup anchor='bottom' offset={[0, -16]} coordinates={geometry} id={`analyzer-config`}>
      <div className={styles.analyzerPopup}>
        <h4>{iconForCategory(properties.analyzer_type)}{properties.title}
          <a target="_blank" href={properties.admin_href}><GearIcon style={{height: '.5rem', width: '.5rem'}}/>
          </a>
        </h4>
        <h5>{properties.analyzer_type}</h5>
      </div>
    </Popup>
  );
};

export default connect(null, { hidePopup })(AnalyzerConfigPopup);



import React from 'react';
import { Popup } from 'react-mapbox-gl';
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
    const style = {height: '2rem', width: '2rem', marginRight: '.25rem'};
    if (category === 'geofence') return <GeofenceIcon stroke='black' style={style} />;
    if (category === 'proximity') return <ProximityIcon stroke='black' style={style} />;
    return null;
  }

  return (
    <Popup anchor='bottom' offset={[0, -16]} coordinates={geometry} id={`analyzer-config`}>
      <div className={styles.analyzerPopup}>
        <h4>{iconForCategory(properties.analyzer_type)}{properties.title}
          <a target="_blank" rel= "noopener noreferrer" href={properties.admin_href}><GearIcon fill = '#1E90FF' style={{height: '1.0rem', width: '1.0rem', marginLeft: '.5rem'}}/>
          </a>
        </h4>
        <h5>{properties.analyzer_type}</h5>
      </div>
    </Popup>
  );
};

export default connect(null, { hidePopup })(AnalyzerConfigPopup);



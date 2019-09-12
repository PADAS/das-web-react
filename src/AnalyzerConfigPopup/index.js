import React, { memo, useRef } from 'react';
import { Popup } from 'react-mapbox-gl';
import { connect } from 'react-redux';
import { ReactComponent as GeofenceIcon } from '../common/images/icons/geofence-analyzer-icon.svg';
import { ReactComponent as ProximityIcon } from '../common/images/icons/proximity-analyzer-icon.svg';
import styles from './styles.module.scss';


import { hidePopup } from '../ducks/popup';

const AnalyzerConfigPopup = (props) => {

  const{ name, adminHref, category } = props;

  const iconForCategory = category => { 
    if (category === 'geofence') return <GeofenceIcon />;
    if (category === 'proximity') return <ProximityIcon />;
    return null;
  }

  return (
    <Popup anchor='bottom' offset={[0, -16]} id={`analyzer-config`}>
      <div className={styles.analyzerPopup}>
        <h4>${iconForCategory(category)}${name}
          <a target="_blank" href={adminHref}
            class="glyphicon glyphicon-cog">
          </a>
        </h4>
        <h5>{category}</h5>
      </div>
    </Popup>
  );
};

export default connect(null, { hidePopup })(AnalyzerConfigPopup);



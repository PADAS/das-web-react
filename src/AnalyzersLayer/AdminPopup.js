import React from 'react';
import { ReactComponent as GeofenceIcon } from '../common/images/icons/geofence';
import { ReactComponent as ProximityIcon } from '../common/images/icons/proximity';

import styles from './styles.module.scss';

const AdminPopup = (props) => {

  const{ name, adminHref, category } = props;

  const iconForCategory = category => { 
    if (category === 'geofence') return <GeofenceIcon />;
    if (category === 'proximity') return <ProximityIcon />;
    return null;
  }

  return (
    <div className={styles.analyzerPopup}>
      <h4>${iconForCategory(category)}${name}
        <a target="_blank" href={adminHref}
          class="glyphicon glyphicon-cog">
        </a>
      </h4>
      <h5>{category}</h5>
    </div>
  );
};

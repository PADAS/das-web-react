import React from 'react';
import { connect } from 'react-redux';
import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';
import { ReactComponent as GeofenceIcon } from '../common/images/icons/geofence-analyzer-icon.svg';
import { ReactComponent as ProximityIcon } from '../common/images/icons/proximity-analyzer-icon.svg';
import styles from './styles.module.scss';


import { hidePopup } from '../ducks/popup';

const AnalyzerConfigPopup = (props) => {

  const { data: { properties } } = props;

  const iconForCategory = category => {
    if (category === 'geofence') return <GeofenceIcon className={styles.typeIcon} />;
    if (category === 'proximity') return <ProximityIcon className={styles.typeIcon} />;
    return null;
  };

  return (
    <>
      <div className={styles.analyzerPopup}>
        <h4>{iconForCategory(properties.analyzer_type)}{properties.title}
          <a target="_blank" rel="noopener noreferrer" href={properties.admin_href}><GearIcon className={styles.gearIcon} />
          </a>
        </h4>
        <h5>{properties.analyzer_type}</h5>
      </div>
    </>
  );
};

export default connect(null, { hidePopup })(AnalyzerConfigPopup);



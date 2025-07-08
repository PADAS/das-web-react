import React  from 'react';

import DisplayFieldSet from './DisplayFieldSet';
import GeneralFieldSet from './GeneralFieldSet';
import MapMarkersFieldSet from './MapMarkersFieldSet';

import * as styles from './styles.module.scss';

const MapTab = () => <>
  <GeneralFieldSet />

  <hr className={styles.separator} />

  <DisplayFieldSet />

  <hr className={styles.separator} />

  <MapMarkersFieldSet />

  <hr className={styles.separator} />
</>;

export default MapTab;

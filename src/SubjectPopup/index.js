import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';

import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';
import TrackLength from '../TrackLength';

import styles from './styles.module.scss';

export default class SubjectPopup extends PureComponent {
  render() {
    const { data: { geometry, properties }, ...rest } = this.props;

    const coordProps = typeof properties.coordinateProperties === 'string' ? JSON.parse(properties.coordinateProperties) : properties.coordinateProperties;

    return (
      <Popup anchor='bottom' offset={[0, -16]} coordinates={geometry.coordinates} id={`subject-popup-${properties.id}`}>
        <h4>{properties.name}</h4>
        {coordProps.time && <DateTime date={coordProps.time} />}
        <TrackLength className={styles.trackLength} id={properties.id} />
        {<GpsFormatToggle lat={geometry.coordinates[1]} lng={geometry.coordinates[0]} />}
      </Popup>
    );
  }
}

SubjectPopup.propTypes = {
  data: PropTypes.object.isRequired,
};
import React, { memo, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';

import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';
import TrackLength from '../TrackLength';
import SubjectControls from '../SubjectControls';

import styles from './styles.module.scss';

const SubjectPopup = (props) => {
  const { data: { geometry, properties }, map, ...rest } = props;
  const { tracks_available } = properties;
  const coordProps = typeof properties.coordinateProperties === 'string' ? JSON.parse(properties.coordinateProperties) : properties.coordinateProperties;

  return (
    <Popup anchor='bottom' offset={[0, -16]} coordinates={geometry.coordinates} id={`subject-popup-${properties.id}`} {...rest}>
      <h4>{properties.name}</h4>
      {coordProps.time && <DateTime date={coordProps.time} />}
      {<GpsFormatToggle lng={geometry.coordinates[0]} lat={geometry.coordinates[1]} />}
      {tracks_available && (
        <Fragment>
          <TrackLength className={styles.trackLength} trackId={properties.id} />
          <SubjectControls map={map} showJumpButton={false} subject={properties} className={styles.trackControls} />
        </Fragment>
      )}
    </Popup>
  );
};

export default memo(SubjectPopup);

SubjectPopup.propTypes = {
  data: PropTypes.object.isRequired,
};
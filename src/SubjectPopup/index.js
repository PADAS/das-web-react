import React, { memo, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';
import isEqual from 'react-fast-compare';

import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';
import TrackLength from '../TrackLength';
import SubjectControls from '../SubjectControls';

import styles from './styles.module.scss';

const SubjectPopup = (props) => {
  const { data: { geometry, properties }, onTrackToggle, onHeatmapToggle, trackState, heatmapState, map, ...rest } = props;
  console.log(geometry, properties);
  const { tracks_available } = properties;
  const coordProps = typeof properties.coordinateProperties === 'string' ? JSON.parse(properties.coordinateProperties) : properties.coordinateProperties;

  return (
    <Popup anchor='bottom' offset={[0, -16]} coordinates={geometry.coordinates} id={`subject-popup-${properties.id}`} {...rest}>
      <h4>{properties.name}</h4>
      {coordProps.time && <DateTime date={coordProps.time} />}
      {<GpsFormatToggle lng={geometry.coordinates[0]} lat={geometry.coordinates[1]} />}
      {tracks_available && (
        <Fragment>
          <TrackLength className={styles.trackLength} id={properties.id} />
          <SubjectControls map={map} showJumpButton={false} subject={properties} className={styles.trackControls} />
        </Fragment>
      )}
    </Popup>
  );
};

export default memo(SubjectPopup, (prev, current) => isEqual(prev.trackState, current.trackState)
&& isEqual(prev.heatmapState, current.heatmapState)
&& isEqual(prev.data, current.data)
);

SubjectPopup.defaultProps = {
  onTrackToggle() {
  },
  onHeatmapToggle() {
  },
};

SubjectPopup.propTypes = {
  data: PropTypes.object.isRequired,
  onTrackToggle: PropTypes.func,
  trackState: PropTypes.shape({
    visible: PropTypes.array,
    pinned: PropTypes.array,
  }).isRequired,
  heatmapState: PropTypes.array.isRequired,
  onHeatmapToggle: PropTypes.func,
};
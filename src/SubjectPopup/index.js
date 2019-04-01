import React, { PureComponent, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';

import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';
import TrackLength from '../TrackLength';
import TrackToggleButton from '../TrackToggleButton';
import HeatmapToggleButton from '../HeatmapToggleButton';

import styles from './styles.module.scss';

export default class SubjectPopup extends PureComponent {
  render() {
    const { data: { geometry, properties }, onTrackToggle, onHeatmapToggle, trackState, heatmapState, ...rest } = this.props;
    const { tracks_available } = properties;

    const coordProps = typeof properties.coordinateProperties === 'string' ? JSON.parse(properties.coordinateProperties) : properties.coordinateProperties;

    return (
      <Popup anchor='bottom' offset={[0, -16]} coordinates={geometry.coordinates} id={`subject-popup-${properties.id}`}>
        <h4>{properties.name}</h4>
        {coordProps.time && <DateTime date={coordProps.time} />}
        {<GpsFormatToggle lat={geometry.coordinates[1]} lng={geometry.coordinates[0]} />}
        {tracks_available && (
          <Fragment>
            <TrackLength className={styles.trackLength} id={properties.id} />
            <div className={styles.trackControls}>
              {trackState && <TrackToggleButton onButtonClick={onTrackToggle} trackId={properties.id} trackVisible={trackState.visible.includes(properties.id)} trackPinned={trackState.pinned.includes(properties.id)} />}
              {heatmapState && <HeatmapToggleButton onButtonClick={onHeatmapToggle} subjectId={properties.id} heatmapVisible={heatmapState.includes(properties.id)} />}
            </div>
          </Fragment>
        )}
      </Popup>
    );
  }
}

SubjectPopup.defaultProps = {
  onTrackToggle() {
    console.log('track toggle');
  },
  onHeatmapToggle() {
    console.log('heatmap toggle');
  },
};

SubjectPopup.propTypes = {
  data: PropTypes.object.isRequired,
  onTrackToggle: PropTypes.func,
  onHeatmapToggle: PropTypes.func,
};
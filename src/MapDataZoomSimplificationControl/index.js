import React from 'react';
import { connect } from 'react-redux';
import { toggleMapDataSimplificationOnZoom } from '../ducks/map-ui';
import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';

const labelString = 'Simplify Map Data on Zoom';
const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapTrackTimepointsControl = (props) => {
  const { simplifyMapDataOnZoom: { enabled: shouldSimplify }, toggleMapDataSimplificationOnZoom } = props;

  const handleChange = () => {
    toggleMapDataSimplificationOnZoom();

    mapInteractionTracker.track(`${shouldSimplify? 'Uncheck' : 'Check'} '${labelString}' checkbox`);
  };

  return <label>
    <input type='checkbox' id='map-data-overlap-when-zoomed' name='map-data-overlap-when-zoomed' checked={shouldSimplify} onChange={handleChange} />
    <span style={{ paddingLeft: '0.4rem' }} >{labelString}</span>
  </label>;
};

const mapStateToProps = ({ view: { simplifyMapDataOnZoom } }) => ({
  simplifyMapDataOnZoom,
});

export default connect(mapStateToProps, { toggleMapDataSimplificationOnZoom })(MapTrackTimepointsControl);
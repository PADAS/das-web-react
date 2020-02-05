import React, { memo, useEffect, Fragment } from 'react';
import PropTypes from 'prop-types';

import { withMap } from '../EarthRangerMap';
import { addMapImage } from '../utils/map';
import Arrow from '../common/images/icons/track-arrow.svg';

import TrackLayer from './track';

const ARROW_IMG_ID = 'track_arrow';

const getPointLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.id.includes('track-layer-points-'))[0];

const TracksLayer = (props) => {
  const { map, onPointClick, trackIds, showTimepoints } = props;
  const onSymbolClick = (e) => onPointClick(getPointLayer(e, map));


  useEffect(() => {
    if (!map.hasImage(ARROW_IMG_ID)) {
      addMapImage(Arrow, ARROW_IMG_ID);
    }
  }, []); // eslint-disable-line

  return <Fragment>{trackIds.map(id => <TrackLayer key={`track-layer-${id}`} map={map} onPointClick={onSymbolClick} showTimepoints={showTimepoints} trackId={id} />)}</Fragment>;
};

export default withMap(memo(TracksLayer));

TracksLayer.defaultProps = {
  onPointClick(layer) {
    console.log('clicked timepoint', layer);
  },
  showTimepoints: true,
};

TracksLayer.propTypes = {
  map: PropTypes.object.isRequired,
  trackIds: PropTypes.array.isRequired,
  onPointClick: PropTypes.func,
  showTimepoints: PropTypes.bool,
};
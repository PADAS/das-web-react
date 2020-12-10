import React, { Fragment, memo, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';

import { withMap } from '../EarthRangerMap';
import { getPatrols } from '../selectors/tracks';
import { drawLinesBetweenPatrolTrackAndPatrolPoints, extractPatrolPointsFromTrackData } from '../utils/patrols';
import { addMapImage } from '../utils/map';
import { patrolTrackData } from '../selectors/patrols';

import StartStopLayer from './layer';


const PatrolStartStopLayer = ({ allowOverlap, map, mapUserLayoutConfig, onPointClick, patrols, showTimepoints, trackData, ...props}) => {
  const patrolStartStopData = useMemo(() => trackData
    .map(data => {
      const points = extractPatrolPointsFromTrackData(data, patrols);

      if (!points) return null;

      const lines = drawLinesBetweenPatrolTrackAndPatrolPoints(points, data.trackData);

      return {
        points,
        lines,
      };
    })
    .filter(v => !!v)
  , [patrols, trackData]);

  useEffect(() => {
    const toAdd = patrolStartStopData.reduce((accumulator, item) => {
      const { points: { start_location } } = item;

      if (start_location && map.hasImage(start_location.properties.image)) return accumulator;
      return [...accumulator, start_location.properties.image];
    }, []);

    toAdd.forEach(item =>  addMapImage({ src: item }));

  }, [map, patrolStartStopData]);
  
  if (!patrolStartStopData.length) return null;

  const onSymbolClick = () => {};

  return <Fragment>
    {patrolStartStopData.map((data, index) => <StartStopLayer key={index} data={data} onSymbolClick={onSymbolClick} />)}
  </Fragment>;

};

const mapStateToProps = (state) => ({
  patrols: getPatrols(state),
  trackData: patrolTrackData(state)
});


export default connect(mapStateToProps, null)(withMap(
  memo(PatrolStartStopLayer),
));

PatrolStartStopLayer.defaultProps = {
  onPointClick(layer) {
    console.log('clicked timepoint', layer);
  },
  showTimepoints: true,
};

PatrolStartStopLayer.propTypes = {
  map: PropTypes.object.isRequired,
  onPointClick: PropTypes.func,
  showTimepoints: PropTypes.bool,
};

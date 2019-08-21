import React, { memo, isValidElement } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';

import { getHeatmapTrackPoints } from '../selectors';

import MapLegend from '../MapLegend';
import HeatmapStyleControls from '../HeatmapStyleControls';


const HeatmapLegend = ({collapsedTitle, pointCount, onClose, children }) => {

  const collapsedTitleElement = isValidElement(collapsedTitle) ? collapsedTitle: <h6>{collapsedTitle}</h6>;
  const settingsComponent = <HeatmapStyleControls showCancel={false} />;

  return <MapLegend
    collapsedTitleElement={collapsedTitleElement} 
    onClose={onClose}
    settingsComponent={settingsComponent}>
    {children}
    <div className={styles.gradient}></div>
    <span>{pointCount} total points</span>
  </MapLegend>;
};

HeatmapLegend.propTypes = {
  collapsedTitle: PropTypes.oneOfType([
    PropTypes.element, PropTypes.node,
  ]).isRequired,
  onClose: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  tracksAsPoints: getHeatmapTrackPoints(state),
});

export default connect(mapStateToProps, null)(memo(HeatmapLegend));


/* heatmap state should look like this:
  -- list of contained subjects with each subject's number of points
  -- featureCollection with all points
*/


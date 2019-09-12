import React, { memo, isValidElement } from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';

import MapLegend from '../MapLegend';
import HeatmapStyleControls from '../HeatmapStyleControls';

const HeatmapLegend = ({ title, pointCount, onClose, ...rest }) => {

  const titleElement = isValidElement(title) ? title : <h6>{title}</h6>;
  const settingsComponent = <HeatmapStyleControls showCancel={false} />;

  return <MapLegend
    titleElement={titleElement}
    onClose={onClose}
    settingsComponent={settingsComponent}
    {...rest} >
    <div className={styles.gradient}></div>
    <span>{pointCount} total points</span>
  </MapLegend>;
};

HeatmapLegend.propTypes = {
  title: PropTypes.oneOfType([
    PropTypes.element, PropTypes.node,
  ]).isRequired,
  onClose: PropTypes.func.isRequired,
};



export default memo(HeatmapLegend);


/* heatmap state should look like this:
  -- list of contained subjects with each subject's number of points
  -- featureCollection with all points
*/


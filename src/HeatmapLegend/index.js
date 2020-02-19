import React, { memo, isValidElement } from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';

import MapLegend from '../MapLegend';
import HeatmapStyleControls from '../HeatmapStyleControls';
import HeatmapToggleButton from '../HeatmapToggleButton';

import { trackEvent } from '../utils/analytics';

const HeatmapLegend = ({ title, pointCount, onClose, ...rest }) => {

  const onLegendClose = (e) => {
    trackEvent('Map Interaction', 'Close Heatmap');
    onClose(e);
  };
  
  const titleElement = isValidElement(title) ? title : <h6>{title}</h6>;
  const settingsComponent = <HeatmapStyleControls showCancel={false} />;

  return <MapLegend
    titleElement={
      <div className={styles.titleWrapper}>
        <HeatmapToggleButton heatmapVisible={true} showLabel={false} className={styles.heatIcon} />
        <div className={styles.innerTitleWrapper}>
          {titleElement}
          <span>{pointCount} total points</span>
        </div>
      </div>
    }
    onClose={onLegendClose}
    settingsComponent={settingsComponent}
    {...rest} >
    
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


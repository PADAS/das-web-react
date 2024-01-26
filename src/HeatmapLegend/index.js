import React, { memo, isValidElement } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.scss';

import MapLegend from '../MapLegend';
import HeatmapStyleControls from '../HeatmapStyleControls';
import HeatmapToggleButton from '../HeatmapToggleButton';

import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const HeatmapLegend = ({ title, dayCount, pointCount, onClose, ...rest }) => {
  const { t } = useTranslation('map-legends');

  const onLegendClose = (e) => {
    mapInteractionTracker.track('Close Heatmap');
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
          <span>{t('pointCount', { count: pointCount })} {t('dayTimespan', { count: dayCount })}</span>
        </div>
      </div>
    }
    onClose={onLegendClose}
    settingsComponent={settingsComponent}
    {...rest}
  />;
};

HeatmapLegend.propTypes = {
  title: PropTypes.oneOfType([
    PropTypes.element, PropTypes.node,
  ]).isRequired,
  pointCount: PropTypes.number.isRequired,
  dayCount: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
};



export default memo(HeatmapLegend);


/* heatmap state should look like this:
  -- list of contained subjects with each subject's number of points
  -- featureCollection with all points
*/


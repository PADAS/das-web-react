import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { displayReportsOnMapState } from '../../../ducks/map-layer-filter';
import { MAP_LAYERS_CATEGORY, REPORTS_CATEGORY, trackEventFactory } from '../../../utils/analytics';
import { setReportHeatmapVisibility } from '../../../ducks/map-ui';

import CheckMark from '../../../Checkmark';
import HeatmapToggleButton from '../../../HeatmapToggleButton';

import * as styles from './styles.module.scss';
import * as mapLayersStyles from '../styles.module.scss';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);
const reportsTracker = trackEventFactory(REPORTS_CATEGORY);

const EventsTab = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('map-controls');

  const showReportHeatmap = useSelector((state) => state.view.showReportHeatmap);
  const showReportsOnMap = useSelector((state) => state.data.mapLayerFilter.showReportsOnMap);

  const onViewReportsToggle = (e) => {
    e.stopPropagation();
    mapLayerTracker.track('Clicked Clear All Reports');
    dispatch(displayReportsOnMapState(!showReportsOnMap));
  };

  const toggleReportHeatmapVisibility = () => {
    dispatch(setReportHeatmapVisibility(!showReportHeatmap));
    reportsTracker.track(`${showReportHeatmap ? 'Hide' : 'Show'} Reports Heatmap`);
  };

  return <div className={styles.container}>
    <div>
      <CheckMark onClick={onViewReportsToggle} fullyChecked={showReportsOnMap} />
      <h5>{t('reportMapControlTitle')}</h5>
    </div>
    <HeatmapToggleButton className={mapLayersStyles.toggleButton} onButtonClick={toggleReportHeatmapVisibility} showLabel={false} heatmapVisible={showReportHeatmap} />
  </div>;
};

export default EventsTab;

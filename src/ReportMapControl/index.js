import React from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { displayReportsOnMapState } from '../ducks/map-layer-filter';
import { setReportHeatmapVisibility } from '../ducks/map-ui';
import { trackEventFactory, MAP_LAYERS_CATEGORY, REPORTS_CATEGORY } from '../utils/analytics';

import CheckMark from '../Checkmark';
import HeatmapToggleButton from '../HeatmapToggleButton';

import listStyles from '../SideBar/styles.module.scss';
import styles from './styles.module.scss';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);
const reportsTracker = trackEventFactory(REPORTS_CATEGORY);

const ReportMapControl = ({
  showReportsOnMap,
  showReportHeatmap,
  setReportHeatmapVisibility,
  displayReportsOnMapState
}) => {
  const { t } = useTranslation('map-controls');

  const onViewReportsToggle = (e) => {
    e.stopPropagation();
    mapLayerTracker.track('Clicked Clear All Reports');
    displayReportsOnMapState(!showReportsOnMap);
  };

  const toggleReportHeatmapVisibility = () => {
    setReportHeatmapVisibility(!showReportHeatmap);
    reportsTracker.track(`${showReportHeatmap ? 'Hide' : 'Show'} Reports Heatmap`);
  };

  return <div className={styles.container}>
    <div>
      <CheckMark onClick={onViewReportsToggle} fullyChecked={showReportsOnMap} />
      <h5>{t('reportMapControlTitle')}</h5>
    </div>
    <HeatmapToggleButton className={listStyles.toggleButton} onButtonClick={toggleReportHeatmapVisibility} showLabel={false} heatmapVisible={showReportHeatmap} />
  </div>;
};

const mapStateToProps = ({ view: { showReportHeatmap }, data: { mapLayerFilter: { showReportsOnMap } } }) => ({ showReportsOnMap, showReportHeatmap });

export default connect(mapStateToProps, { displayReportsOnMapState, setReportHeatmapVisibility })(ReportMapControl);
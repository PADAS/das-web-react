import React from 'react';
import { connect } from 'react-redux';
import { displayReportsOnMapState, setReportHeatmapVisibility } from '../ducks/map-ui';
import { trackEventFactory, MAP_LAYERS_CATEGORY, REPORTS_CATEGORY } from '../utils/analytics';

import CheckMark from '../Checkmark';
import HeatmapToggleButton from '../HeatmapToggleButton';

import listStyles from '../SideBar/styles.module.scss';
import styles from './styles.module.scss';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);
const reportsTracker = trackEventFactory(REPORTS_CATEGORY);

const ReportMapControl = (props) => {
  const { showReportsOnMap, showReportHeatmap, setReportHeatmapVisibility } = props;

  const onViewReportsToggle = (e) => {
    e.stopPropagation();
    mapLayerTracker.track('Clicked Clear All Reports');
    props.displayReportsOnMapState(!showReportsOnMap);
  };

  const toggleReportHeatmapVisibility = () => {
    setReportHeatmapVisibility(!showReportHeatmap);
    reportsTracker.track(`${showReportHeatmap ? 'Hide' : 'Show'} Reports Heatmap`);
  };

  return <div className={styles.container}>
    <div>
      <CheckMark onClick={onViewReportsToggle} fullyChecked={showReportsOnMap} />
      <h5>Reports</h5>
    </div>
    <HeatmapToggleButton className={listStyles.toggleButton} onButtonClick={toggleReportHeatmapVisibility} showLabel={false} heatmapVisible={showReportHeatmap} />
  </div>;
};

const mapStateToProps = ({ view: { showReportsOnMap, showReportHeatmap } }) => ({ showReportsOnMap, showReportHeatmap });

export default connect(mapStateToProps, { displayReportsOnMapState, setReportHeatmapVisibility })(ReportMapControl);
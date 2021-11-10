import React from 'react';
import { connect } from 'react-redux';

import { displayReportsOnMapState, setReportHeatmapVisibility } from '../../../ducks/map-ui';
import { trackEvent } from '../../../utils/analytics';

import CheckMark from '../../../common/components/forms/Checkmark';
import HeatmapToggleButton from '../../../heatmaps/HeatmapToggleButton';

import listStyles from '../../../views/App/layout/SideBar/styles.module.scss';
import styles from './styles.module.scss';

const ReportMapControl = (props) => {
  const { showReportsOnMap, showReportHeatmap, setReportHeatmapVisibility } = props;

  const onViewReportsToggle = (e) => {
    e.stopPropagation();
    trackEvent('Map Layer', 'Clicked Clear All Reports');
    props.displayReportsOnMapState(!showReportsOnMap);
  };

  const toggleReportHeatmapVisibility = () => {
    setReportHeatmapVisibility(!showReportHeatmap);
    trackEvent('Reports', `${showReportHeatmap ? 'Hide' : 'Show'} Reports Heatmap`);
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
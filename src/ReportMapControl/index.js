import React from 'react';
import { connect } from 'react-redux';
import { displayReportsOnMapState } from '../ducks/map-ui';
import { trackEvent } from '../utils/analytics';
import CheckMark from '../Checkmark';

import styles from './styles.module.scss';

const ReportMapControl = (props) => {
  const { showReportsOnMap } = props;

  const onViewReportsToggle = (e) => {
    e.stopPropagation();
    trackEvent('Map Layer', 'Clicked Clear All Reports');
    props.displayReportsOnMapState(!showReportsOnMap);
  };

  return <div className={styles.container}>
        <CheckMark onClick={onViewReportsToggle} fullyChecked={showReportsOnMap} /> <h5>Reports</h5>
      </div>;
};

const mapStateToProps = ({ view: { showReportsOnMap } }) => ({ showReportsOnMap });

export default connect(mapStateToProps, { displayReportsOnMapState })(ReportMapControl);
import React from 'react';
import { connect } from 'react-redux';
import Collapsible from 'react-collapsible';
import { displayReportsOnMapState } from '../ducks/map-ui';
import { trackEvent } from '../utils/analytics';
import CheckMark from '../Checkmark';

import listStyles from '../SideBar/styles.module.scss';
import localStyles from './styles.module.scss';

const ReportMapControl = (props) => {

  const { showReportsOnMap } = props;

  const onViewReportsToggle = (e) => {
    e.stopPropagation();
    trackEvent('Map Layer', 'Clicked Clear All Reports');
    props.displayReportsOnMapState(!showReportsOnMap);
  };

  const trigger = <div className={localStyles.reportTitle + ' ' + listStyles.trigger} >
    <CheckMark onClick={onViewReportsToggle} fullyChecked={showReportsOnMap} /> <h5>Reports</h5>
  </div >;

  return <ul className={listStyles.list}>
    <li>
      <Collapsible
        className={listStyles.collapsed}
        openedClassName={listStyles.opened}
        trigger={trigger}>
        <span className={listStyles.reportDesc}>
          <p>Report Types are now filtered in the Reports tab (at top)</p>
        </span>
      </Collapsible>
    </li>
  </ul>;
};

const mapStateToProps = (state) => {
  const { view } = state;
  const { showReportsOnMap } = view;
  return { showReportsOnMap };
};

export default connect(mapStateToProps, { displayReportsOnMapState })(ReportMapControl);

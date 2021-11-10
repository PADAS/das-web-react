import React, { memo } from 'react';
import { connect } from 'react-redux';
import ReportListItem from '../ReportListItem';
import { trackEventFactory, INCIDENT_REPORT_CATEGORY } from '../utils/analytics';

import styles from './styles.module.scss';
const incidentReportTracker = trackEventFactory(INCIDENT_REPORT_CATEGORY);

const IncidentReportsList = (props) => {
  const { eventStore, reports = [], onReportClick, children } = props;

  const reportList = reports.map(({ related_event: report }) => report);

  const onReportListItemClick = (report) => {
    onReportClick(report);
    const reportType = report.is_collection ? 'Incident' : 'Event';
    incidentReportTracker.track(`Open ${reportType} Report from Incident`, `Event Type:${report.event_type}`);
  };

  const createReportListItem = report => <ReportListItem
    report={eventStore[report.id] || report}
    key={report.id}
    onTitleClick={() => onReportListItemClick(report)}
    showJumpButton={false} />;

  return <form className={styles.form}>
    <ul className={styles.incidentList}>
      {reportList.map(createReportListItem)}
    </ul>
    {children}
  </form>;
};

const mapStateToProps = ({ data: { eventStore } }) => ({ eventStore });
export default connect(mapStateToProps, null)(memo(IncidentReportsList));
import React, { memo } from 'react';
import { connect } from 'react-redux';
import ReportListItem from '../ReportListItem';

import styles from './styles.module.scss';

const IncidentReportsList = (props) => {
  const { eventStore, reports, onReportClick, children } = props;

  const reportList = reports.map(({ related_event: report }) => report);

  const createReportListItem = report => <ReportListItem
    report={eventStore[report.id] || report}
    key={report.id}
    onTitleClick={() => onReportClick(report)}
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
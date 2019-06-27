import React, { memo } from 'react';
import ReportListItem from '../ReportListItem';

import styles from './styles.module.scss';

const IncidentReportsList = (props) => {
  const { reports, onReportClick, children } = props;

  const reportList = reports.map(({ related_event: report }) => report);

  const createReportListItem = report => <ReportListItem
    report={report}
    key={report.id}
    onTitleClick={() => onReportClick(report)}
    showJumpButton={false} />;


  return <form className={styles.form}>
    <ul>
      {reportList.map(createReportListItem)}
    </ul>
    {children}
  </form>;
};

export default memo(IncidentReportsList);
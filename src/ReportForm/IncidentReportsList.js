import React, { memo } from 'react';

import styles from './styles.module.scss';

const IncidentReportsList = (props) => {
  const { reports, onReportClick, children } = props;

  const reportList = reports.map(({ related_event: report }) => report);
  const createReportListItem = (report => <li key={report.id}>
    <button type='button' onClick={() => onReportClick(report)}>{report.id} {report.event_type}</button>
  </li>);


  return <div className={styles.form}>
    <ul>
      {reportList.map(createReportListItem)}
    </ul>
    {children}
  </div>;
};

export default memo(IncidentReportsList);
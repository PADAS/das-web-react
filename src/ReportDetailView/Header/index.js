import React from 'react';
import PropTypes from 'prop-types';

import useReport from '../../hooks/useReport';

import EventIcon from '../../EventIcon';

import styles from './styles.module.scss';

const Header = ({ report, setTitle, title }) => {
  const { title: originalReportTitle } = useReport(report);

  return <div className={styles.header}>
    <div className={`${styles.icon} ${styles[`priority-${report.priority}`]}`} data-testid="reportDetailHeader-icon">
      <EventIcon report={report} />
    </div>

    <div className={styles.title}>
      <input onChange={(event) => setTitle(event.target.value)} type="text" value={title || originalReportTitle} />
    </div>
  </div>;
};

Header.propTypes = {
  report: PropTypes.object.isRequired,
  setTitle: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
};

export default Header;

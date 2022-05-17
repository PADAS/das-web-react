import React, { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

import { PRIORITY_COLOR_MAP } from '../../utils/events';
import useReport from '../../hooks/useReport';

import DateTime from '../../DateTime';
import EventIcon from '../../EventIcon';

import styles from './styles.module.scss';

const Header = ({ report, setTitle }) => {
  const { displayTitle, eventTypeTitle } = useReport(report);

  const titleInput = useRef();

  const isNewReport = !report.id;

  const priorityTheme = PRIORITY_COLOR_MAP[report.priority];

  const onTitleBlur = useCallback((event) => {
    if (!event.target.textContent) {
      titleInput.current.innerHTML = eventTypeTitle;
    }
    setTitle(event.target.textContent || eventTypeTitle);
    event.target.scrollTop = 0;
  }, [eventTypeTitle, setTitle]);

  return <div className={`${styles.header} ${styles[`priority-${report.priority}`]}`}>
    <div className={`${styles.icon} ${styles[`priority-${report.priority}`]}`} data-testid="reportDetailHeader-icon">
      <EventIcon report={report} />
    </div>

    <p className={styles.serialNumber}>{report.serial_number}</p>

    <div
      className={styles.title}
      contentEditable={true}
      data-testid="reportDetailView-header-title"
      onBlur={onTitleBlur}
      ref={titleInput}
      suppressContentEditableWarning
    >
      {displayTitle}
    </div>

    {!isNewReport && <div className={styles.priorityAndDate}>
      <span style={{ color: priorityTheme.base }}>{priorityTheme.name}</span>
      <br />
      <DateTime className={styles.dateTime} date={report.updated_at || report.created_at} showElapsed={false} />
    </div>}
  </div>;
};

Header.propTypes = {
  report: PropTypes.object.isRequired,
  setTitle: PropTypes.func.isRequired,
};

export default Header;

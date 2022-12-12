import React, { memo, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { collectionHasMultipleValidLocations, PRIORITY_COLOR_MAP } from '../../utils/events';
import { MAP_LAYERS_CATEGORY } from '../../utils/analytics';
import useReport from '../../hooks/useReport';

import DateTime from '../../DateTime';
import EventIcon from '../../EventIcon';
import LocationJumpButton from '../../LocationJumpButton';
import ReportMenu from './ReportMenu';

import styles from './styles.module.scss';

const Header = ({ onChangeTitle, report, onReportChange }) => {
  const { coordinates, displayPriority, displayTitle, eventTypeTitle } = useReport(report);

  const titleInput = useRef();

  const isNewReport = !report.id;
  const showEventType = report.title !== eventTypeTitle;
  const priorityTheme = PRIORITY_COLOR_MAP[displayPriority];

  const onTitleBlur = useCallback((event) => {
    if (!event.target.textContent) {
      titleInput.current.innerHTML = eventTypeTitle;
    }
    onChangeTitle(event.target.textContent || eventTypeTitle);
    event.target.scrollTop = 0;
  }, [eventTypeTitle, onChangeTitle]);

  const onTitleFocus = useCallback((event) => window.getSelection().selectAllChildren(event.target), []);

  useEffect(() => {
    if (!report.title) {
      onChangeTitle(displayTitle);
    }
  }, [onChangeTitle, displayTitle, report.title]);

  return <div className={`${styles.header} ${styles[`priority-${displayPriority}`]}`}>
    <div className={`${styles.icon} ${styles[`priority-${displayPriority}`]}`} data-testid="reportDetailHeader-icon">
      <EventIcon report={report} />
    </div>

    <p className={styles.serialNumber}>{report.serial_number}</p>

    <div className={styles.titleAndType}>
      {report.title && <div
        className={styles.title}
        contentEditable={true}
        data-testid="reportManager-header-title"
        onBlur={onTitleBlur}
        onFocus={onTitleFocus}
        ref={titleInput}
        suppressContentEditableWarning
      >
        {report.title}
      </div>}

      {showEventType && <label
        className={styles.eventType}
        data-testid="reportManager-header-eventType"
      >
        {eventTypeTitle}
      </label>}
    </div>

    {!isNewReport && <div className={styles.priorityAndDate} data-testid="reportManager-header-priorityAndDate">
      <span style={{ color: priorityTheme.base }}>{priorityTheme.name}</span>
      <br />
      <DateTime className={styles.dateTime} date={report.updated_at || report.created_at} showElapsed={false} />
    </div>}

    {!!coordinates?.length && <div className={styles.locationJumpButton}>
      <LocationJumpButton
        clickAnalytics={[
          MAP_LAYERS_CATEGORY,
          'Click Jump To Report Location button',
          `Report Type:${report.event_type}`,
        ]}
        coordinates={coordinates}
        isMulti={collectionHasMultipleValidLocations(report)}
      />
    </div>}
    <div style={isNewReport ? { marginLeft: 'auto' } : {} }>
      <ReportMenu report={report} onReportChange={onReportChange}></ReportMenu>
    </div>
  </div>;
};

Header.propTypes = {
  onChangeTitle: PropTypes.func.isRequired,
  report: PropTypes.object.isRequired,
  onReportChange: PropTypes.func.isRequired,
};

export default memo(Header);

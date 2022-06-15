import React, { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import {
  collectionHasMultipleValidLocations,
  getCoordinatesForCollection,
  getCoordinatesForEvent,
  PRIORITY_COLOR_MAP,
} from '../../utils/events';
import { MAP_LAYERS_CATEGORY } from '../../utils/analytics';
import useReport from '../../hooks/useReport';

import DateTime from '../../DateTime';
import EventIcon from '../../EventIcon';
import LocationJumpButton from '../../LocationJumpButton';
import ReportMenu from './ReportMenu';

import styles from './styles.module.scss';

const Header = ({ report, setTitle, onReportChange }) => {
  const { displayTitle, eventTypeTitle } = useReport(report);

  const titleInput = useRef();

  const coordinates = report.is_collection ? getCoordinatesForCollection(report) : getCoordinatesForEvent(report);
  const isNewReport = !report.id;
  const showEventType = report.title !== eventTypeTitle;

  const priorityTheme = PRIORITY_COLOR_MAP[report.priority];

  useEffect(() => {
    if (!report.title) {
      setTitle(displayTitle);
    }
  }, [displayTitle, report.title, setTitle]);

  const onTitleBlur = useCallback((event) => {
    if (!event.target.textContent) {
      titleInput.current.innerHTML = eventTypeTitle;
    }
    setTitle(event.target.textContent || eventTypeTitle);
    event.target.scrollTop = 0;
  }, [eventTypeTitle, setTitle]);

  const onTitleFocus = useCallback((event) => window.getSelection().selectAllChildren(event.target), []);

  return <div className={`${styles.header} ${styles[`priority-${report.priority}`]}`}>
    <div className={`${styles.icon} ${styles[`priority-${report.priority}`]}`} data-testid="reportDetailHeader-icon">
      <EventIcon report={report} />
    </div>

    <p className={styles.serialNumber}>{report.serial_number}</p>

    <div className={styles.titleAndType}>
      {report.title && <div
        className={styles.title}
        contentEditable={true}
        data-testid="reportDetailView-header-title"
        onBlur={onTitleBlur}
        onFocus={onTitleFocus}
        ref={titleInput}
        suppressContentEditableWarning
      >
        {report.title}
      </div>}

      {showEventType && <label
        className={styles.eventType}
        data-testid="reportDetailView-header-eventType"
      >
        {eventTypeTitle}
      </label>}
    </div>

    {!isNewReport && <div className={styles.priorityAndDate}>
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
  report: PropTypes.object.isRequired,
  setTitle: PropTypes.func.isRequired,
  onReportChange: PropTypes.func.isRequired,
};

export default Header;

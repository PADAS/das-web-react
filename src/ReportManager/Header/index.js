import React, { memo, useCallback, useContext, useRef } from 'react';
import PropTypes from 'prop-types';

import { collectionHasMultipleValidLocations, PRIORITY_COLOR_MAP } from '../../utils/events';
import { INCIDENT_REPORT_CATEGORY, EVENT_REPORT_CATEGORY, TrackerContext } from '../../utils/analytics';
import useReport from '../../hooks/useReport';

import DateTime from '../../DateTime';
import EventIcon from '../../EventIcon';
import LocationJumpButton from '../../LocationJumpButton';
import ReportMenu from './ReportMenu';

import styles from './styles.module.scss';

const Header = ({
  isReadOnly,
  onChangeTitle,
  onSaveReport,
  printableContentRef,
  report,
  setRedirectTo,
}) => {
  const { coordinates, displayPriority, displayTitle, eventTypeTitle } = useReport(report);

  const category = report?.is_collection
    ? INCIDENT_REPORT_CATEGORY
    : EVENT_REPORT_CATEGORY;

  const reportTracker = useContext(TrackerContext);

  const titleInput = useRef();

  const isNewReport = !report.id;
  const showEventType = report.title !== eventTypeTitle;
  const priorityTheme = PRIORITY_COLOR_MAP[displayPriority];

  const onTitleBlur = useCallback((event) => {
    if (!event.target.textContent) {
      titleInput.current.innerHTML = eventTypeTitle;
    }

    reportTracker.track('Change report title');

    if (report.title !== null || event.target.textContent !== displayTitle) {
      onChangeTitle(event.target.textContent || eventTypeTitle);
    }
    event.target.scrollTop = 0;
  }, [displayTitle, eventTypeTitle, onChangeTitle, report.title, reportTracker]);

  const hasPatrols = !!report?.patrols?.length;

  const onTitleFocus = useCallback((event) => window.getSelection().selectAllChildren(event.target), []);

  const title = report.title || displayTitle;

  return <div className={`${styles.header} ${styles[`priority-${displayPriority}`]}`}>
    <div role='img' className={`${styles.icon} ${styles[`priority-${displayPriority}`]}`} data-testid="reportDetailHeader-icon">
      <EventIcon report={report} />
      {hasPatrols && <span className={styles.patrolIndicator}>p</span>}
    </div>

    <p className={styles.serialNumber}>{report.serial_number}</p>

    <div className={styles.titleAndType}>
      {title && <div
        className={`${styles.title} ${isReadOnly ? '' : styles.editable}`}
        contentEditable={isReadOnly ? false : true}
        data-testid="reportManager-header-title"
        onBlur={onTitleBlur}
        onFocus={onTitleFocus}
        ref={titleInput}
        suppressContentEditableWarning
      >
        {title}
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
          category,
          'Click header "jump to location" button',
          `Report Type:${report.event_type}`,
        ]}
        coordinates={coordinates}
        isMulti={collectionHasMultipleValidLocations(report)}
      />
    </div>}

    <div className={styles.menu} style={isNewReport ? { marginLeft: 'auto' } : {} }>
      <ReportMenu
        onSaveReport={onSaveReport}
        printableContentRef={printableContentRef}
        report={report}
        reportTitle={title}
        setRedirectTo={setRedirectTo}
      />
    </div>
  </div>;
};

Header.defaultProps = {
  isReadOnly: false,
};

Header.propTypes = {
  isReadOnly: PropTypes.bool,
  onChangeTitle: PropTypes.func.isRequired,
  report: PropTypes.object.isRequired,
  onSaveReport: PropTypes.func.isRequired,
  printableContentRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
  setRedirectTo: PropTypes.func.isRequired,
};

export default memo(Header);

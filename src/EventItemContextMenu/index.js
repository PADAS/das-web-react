import React, { memo, useCallback, useMemo, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { connect } from 'react-redux';
import { showToast } from '../utils/toast';
import { toast } from 'react-toastify';
import { SpinLoader } from 'react-css-loaders';
import PropTypes from 'prop-types';

import ContextMenu from '../ContextMenu';
import { isReportActive } from '../utils/events';
import { setEventState as setEventStateDuck, updateEvent as updateEventDuck } from '../ducks/events';

import styles from './styles.module.scss';

const { Item } = Dropdown;
const { TYPE: { INFO, ERROR } } = toast;

const showNotification = (message, details = '', type = INFO, showDetailsByDefault) => showToast({
  message,
  details,
  showDetailsByDefault,
  toastConfig: {
    type,
    autoClose: 4000,
    hideProgressBar: true,
  }
});

const EventItemContextMenu = ({ report, updateEvent, setEventState, className, children }) => {
  const isActive = useMemo(() => isReportActive(report), [report]);
  const title = useMemo(() => isActive ? 'Resolve': 'Reopen', [isActive]);
  const [isLoading, setIsLoading] = useState(false);

  const setStateContainedReport = useCallback(async (report, state) => {
    const reportStatus = [];
    for (const { related_event } of report.contains) {
      try {
        await setEventState(related_event.id, state);
        reportStatus.push({ ...related_event, processed: true });
      } catch (e) {
        reportStatus.push({ ...related_event, processed: false });
      }
    }
    return reportStatus;
  }, [setEventState]);

  const NotificationDetails = useCallback(({ processedReports, failedReports }) => {
    const processedReportsElements = processedReports.length ?
      <div>
        <p>These related events were {isActive ? 'resolved' : 'activated'} as well:</p>
        <ul>
          {processedReports.map(({ serial_number }) => <li key={serial_number}>#{serial_number}</li>)}
        </ul>
      </div>
      : null;

    if (failedReports.length){
      return <div>
        {processedReports.length && processedReportsElements}
        <p>WARNING: These reports are still {isActive ? 'activated' : 'resolved' } </p>
        <ul>
          { failedReports.map(({ serial_number }) => <li key={serial_number}>#{serial_number}</li>) }
        </ul>
      </div>;
    }

    return processedReportsElements;
  }, [isActive]);

  const updateReportState = useCallback(async () => {
    try {
      setIsLoading(true);
      const newState = isActive ? 'resolved' : 'active';
      await updateEvent({ id: report.id, state: newState });
      const containedReportStatus = report.is_collection ? await setStateContainedReport(report, newState) : null;

      if (Array.isArray(containedReportStatus)){
        const failedReports = containedReportStatus.filter(report => !report.processed );
        const processedReports = containedReportStatus.filter(report => report.processed );

        showNotification(`The collection #${report.serial_number} was ${ isActive ? 'resolved' : 'activated'} correctly`,
          <NotificationDetails failedReports={failedReports} processedReports={processedReports} />,
          INFO,
          true
        );
      } else {
        showNotification(`#${report.serial_number} ${ isActive ? 'Resolved' : 'Active'}`);
      }
    } catch (e) {
      showNotification(`#${report.serial_number} still ${ isActive ? 'active' : 'resolved'}, something went wrong`, false, ERROR);
    } finally {
      setIsLoading(false);
    }
  },
  [isActive, report, setStateContainedReport, updateEvent]);

  return <ContextMenu className={className} disabled={isLoading} options={
    <Item className={styles.option} onClick={updateReportState}>{title} #{report.serial_number}</Item>
  }>
    { isLoading && <div className={styles.loading}>
      <SpinLoader />
    </div>}
    {children}
  </ContextMenu>;
};

EventItemContextMenu.defaultProps = {
  className: ''
};

EventItemContextMenu.propTypes = {
  report: PropTypes.object.isRequired,
  children: PropTypes.element.isRequired,
  updateEvent: PropTypes.func,
  className: PropTypes.string
};

export default memo(connect(undefined, {
  updateEvent: (event) => updateEventDuck(event),
  setEventState: (id, state) => setEventStateDuck(id, state),
})(EventItemContextMenu));

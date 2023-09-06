import React, { memo, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import Dropdown from 'react-bootstrap/Dropdown';
import PropTypes from 'prop-types';
import { SpinLoader } from 'react-css-loaders';
import { toast } from 'react-toastify';

import { ReactComponent as LinkIcon } from '../common/images/icons/link.svg';

import { getReportLink, isReportActive } from '../utils/events';
import { showToast } from '../utils/toast';
import { setEventState, updateEvent } from '../ducks/events';

import ContextMenu from '../ContextMenu';
import TextCopyBtn from '../TextCopyBtn';

import styles from './styles.module.scss';

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

const EventItemContextMenu = ({ children, className, report }) => {
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);

  const isActive = isReportActive(report);
  const title = isActive ? 'Resolve': 'Reopen';

  const setStateContainedReport = useCallback(async (report, state) => {
    const reportStatus = [];
    for (const { related_event } of report.contains) {
      try {
        await dispatch(setEventState(related_event.id, state));
        reportStatus.push({ ...related_event, processed: true });
      } catch (e) {
        reportStatus.push({ ...related_event, processed: false });
      }
    }

    return reportStatus;
  }, [dispatch]);

  const NotificationDetails = useCallback(({ processedReports, failedReports }) => {
    const processedReportsElements = processedReports.length ?
      <div>
        <p>These related events were {isActive ? 'resolved' : 'activated'} as well:</p>
        <ul>{processedReports.map(({ serial_number }) => <li key={serial_number}>#{serial_number}</li>)}</ul>
      </div>
      : null;

    if (failedReports.length){
      return <div>
        {processedReports.length && processedReportsElements}
        <p>WARNING: These reports are still {isActive ? 'activated' : 'resolved' }</p>
        <ul>{failedReports.map(({ serial_number }) => <li key={serial_number}>#{serial_number}</li>)}</ul>
      </div>;
    }

    return processedReportsElements;
  }, [isActive]);

  const updateReportState = useCallback(async () => {
    try {
      setIsLoading(true);

      const newState = isActive ? 'resolved' : 'active';

      await dispatch(updateEvent({ id: report.id, state: newState }));

      const containedReportStatus = report.is_collection ? await setStateContainedReport(report, newState) : null;
      if (Array.isArray(containedReportStatus)) {
        const { failedReports, processedReports } = containedReportStatus.reduce((accumulator, report) => {
          if (report.processed) {
            return { ...accumulator, processedReports: [...accumulator.processedReports, report] };
          }
          return { ...accumulator, failedReports: [...accumulator.failedReports, report] };
        }, { failedReports: [], processedReports: [] });

        showNotification(
          `The collection #${report.serial_number} was ${ isActive ? 'resolved' : 'activated'} correctly`,
          <NotificationDetails failedReports={failedReports} processedReports={processedReports} />,
          INFO,
          true
        );
      } else {
        showNotification(`#${report.serial_number} ${isActive ? 'Resolved' : 'Active'}`);
      }
    } catch (error) {
      showNotification(
        `#${report.serial_number} still ${isActive ? 'active' : 'resolved'}, something went wrong`,
        null,
        ERROR
      );
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, isActive, report, setStateContainedReport]);

  return <ContextMenu className={className} disabled={isLoading} options={
    <>
      <Dropdown.Item className={styles.option} onClick={updateReportState}>
        {title} #{report.serial_number}
      </Dropdown.Item>

      <Dropdown.Item className={styles.option}>
        <TextCopyBtn
          icon={<LinkIcon />}
          label="Copy report link"
          permitPropagation
          successMessage="Link copied"
          text={getReportLink(report)}
        />
      </Dropdown.Item>
    </>
  }>
    {isLoading && <div className={styles.loading}>
      <SpinLoader />
    </div>}

    {children}
  </ContextMenu>;
};

EventItemContextMenu.defaultProps = {
  className: ''
};

EventItemContextMenu.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  report: PropTypes.object.isRequired,
};

export default memo(EventItemContextMenu);

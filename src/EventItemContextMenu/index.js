import React, { memo, useCallback, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import PropTypes from 'prop-types';
import { SpinLoader } from 'react-css-loaders';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as LinkIcon } from '../common/images/icons/link.svg';

import { getReportLink, isReportActive } from '../utils/events';
import { setEventState, updateEvent } from '../ducks/events';
import { showToast } from '../utils/toast';

import ContextMenu from '../ContextMenu';
import TextCopyBtn from '../TextCopyBtn';

import styles from './styles.module.scss';

const NotificationDetails = ({ failedReports, isActive, processedReports }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'eventItemContextMenu' });

  const processedReportsElements = processedReports.length ? <div>
    <p>
      {t('notificationDetails.processedReports.title', {
        newState: t(`notificationDetails.processedReports.${isActive ? 'resolved' : 'activated'}`),
      })}
    </p>

    <ul>{processedReports.map((report) => <li key={report.serial_number}>#{report.serial_number}</li>)}</ul>
  </div> : null;

  if (failedReports.length){
    return <div>
      {processedReportsElements}

      <p>{t('notificationDetails.failedReports', { state: t(`state.${isActive ? 'active' : 'resolved'}`) })}</p>

      <ul>{failedReports.map((report) => <li key={report.serial_number}>#{report.serial_number}</li>)}</ul>
    </div>;
  }

  return processedReportsElements;
};

const EventItemContextMenu = ({ children, className, report }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'eventItemContextMenu' });

  const [isLoading, setIsLoading] = useState(false);

  const isActive = isReportActive(report);

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

        showToast({
          details: <NotificationDetails
            failedReports={failedReports}
            isActive={isActive}
            processedReports={processedReports}
          />,
          message: t('updatedCollectionInfoToast.message', {
            collectionSerialNumber: report.serial_number,
            newState: t(`updatedCollectionInfoToast.${isActive ? 'resolved' : 'activated'}`),
          }),
          showDetailsByDefault: true,
          toastConfig: { autoClose: 4000, hideProgressBar: true, type: toast.TYPE.INFO },
        });
      } else {
        showToast({
          details: '',
          message: t('updatedReportInfoToastMessage', {
            newState: t(`state.${isActive ? 'resolved' : 'active'}`),
            reportSerialNumber: report.serial_number,
          }),
          toastConfig: { autoClose: 4000, hideProgressBar: true, type: toast.TYPE.INFO },
        });
      }
    } catch (error) {
      showToast({
        details: '',
        message: t('errorToastMessage', {
          serialNumber: report.serial_number,
          state: t(`state.${isActive ? 'active' : 'resolved'}`),
        }),
        toastConfig: { autoClose: 4000, hideProgressBar: true, type: toast.TYPE.ERROR },
      });
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, isActive, report, setStateContainedReport, t]);

  return <ContextMenu className={className} disabled={isLoading} options={
    <>
      <Dropdown.Item className={styles.option} onClick={updateReportState}>
        {t(`updateReportStateItem.${isActive ? 'resolve': 'reopen'}`)} #{report.serial_number}
      </Dropdown.Item>

      <Dropdown.Item className={styles.option}>
        <TextCopyBtn
          getText={() => getReportLink(report)}
          icon={<LinkIcon />}
          label={t('textCopyButtonItem.label')}
          permitPropagation
          successMessage={t('textCopyButtonItem.successMessage')}
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
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  report: PropTypes.object.isRequired,
};

export default memo(EventItemContextMenu);

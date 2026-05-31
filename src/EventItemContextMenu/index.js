import React, { memo, useCallback, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import MoonLoader from 'react-spinners/MoonLoader';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as LinkIcon } from '../common/images/icons/link.svg';

import { EVENT_FORM_STATES } from '../constants';
import { getReportLink, isReportActive } from '../utils/events';
import { setEventState, updateEvent } from '../ducks/events';
import { showToast } from '../utils/toast';

import ContextMenu from '../ContextMenu';
import TextCopyBtn from '../TextCopyBtn';

import * as styles from './styles.module.scss';

const LOADER_SIZE = 30;

const NotificationDetails = ({ failedReports, newState, processedReports }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'eventItemContextMenu' });

  const processedReportsElements = processedReports.length ? <div>
    <p>
      {t('notificationDetails.processedReports.title', {
        newState: t(`notificationDetails.processedReports.${newState === EVENT_FORM_STATES.ACTIVE ? 'activated' : newState}`),
      })}
    </p>

    <ul>{processedReports.map((report) => <li key={report.serial_number}>#{report.serial_number}</li>)}</ul>
  </div> : null;

  if (failedReports.length){
    return <div>
      {processedReportsElements}

      <p>{t('notificationDetails.failedReports', { state: t(`state.${newState}`) })}</p>

      <ul>{failedReports.map((report) => <li key={report.serial_number}>#{report.serial_number}</li>)}</ul>
    </div>;
  }

  return processedReportsElements;
};

const EventItemContextMenu = ({ children, className = '', report }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'eventItemContextMenu' });

  const [isLoading, setIsLoading] = useState(false);

  const isActive = isReportActive(report);
  const isInReview = report?.state === EVENT_FORM_STATES.REVIEW;

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

  const updateReportState = useCallback(async (newState) => {
    try {
      setIsLoading(true);

      await dispatch(updateEvent({ id: report.id, state: newState }));

      const containedReportStatus = report.is_collection ? await setStateContainedReport(report, newState) : null;
      if (Array.isArray(containedReportStatus)) {
        const { failedReports, processedReports } = containedReportStatus.reduce((accumulator, report) => {
          if (report.processed) {
            return { ...accumulator, processedReports: [...accumulator.processedReports, report] };
          }
          return { ...accumulator, failedReports: [...accumulator.failedReports, report] };
        }, { failedReports: [], processedReports: [] });

        const toastStateKey = newState === EVENT_FORM_STATES.ACTIVE ? 'activated' : newState;
        showToast({
          details: <NotificationDetails
            failedReports={failedReports}
            newState={newState}
            processedReports={processedReports}
          />,
          message: t('updatedCollectionInfoToast.message', {
            collectionSerialNumber: report.serial_number,
            newState: t(`updatedCollectionInfoToast.${toastStateKey}`),
          }),
          showDetailsByDefault: true,
          toastConfig: { autoClose: 4000, hideProgressBar: true, type: 'info' },
        });
      } else {
        showToast({
          details: '',
          message: t('updatedReportInfoToastMessage', {
            newState: t(`state.${newState}`),
            reportSerialNumber: report.serial_number,
          }),
          toastConfig: { autoClose: 4000, hideProgressBar: true, type: 'info' },
        });
      }
    } catch (error) {
      showToast({
        details: '',
        message: t('errorToastMessage', {
          serialNumber: report.serial_number,
          state: t(`state.${report.state}`),
        }),
        toastConfig: { autoClose: 4000, hideProgressBar: true, type: 'error' },
      });
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, report, setStateContainedReport, t]);

  return <ContextMenu className={className} disabled={isLoading} options={
    <>
      {(isActive || isInReview) && <Dropdown.Item className={styles.option} onClick={() => updateReportState(EVENT_FORM_STATES.RESOLVED)}>
        {t('updateReportStateItem.resolve')} #{report.serial_number}
      </Dropdown.Item>}
      {isActive && <Dropdown.Item className={styles.option} onClick={() => updateReportState(EVENT_FORM_STATES.REVIEW)}>
        {t('updateReportStateItem.review')} #{report.serial_number}
      </Dropdown.Item>}
      {!isActive && <Dropdown.Item className={styles.option} onClick={() => updateReportState(EVENT_FORM_STATES.ACTIVE)}>
        {t('updateReportStateItem.reopen')} #{report.serial_number}
      </Dropdown.Item>}

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
      <MoonLoader size={LOADER_SIZE} />
    </div>}

    {children}
  </ContextMenu>;
};

export default memo(EventItemContextMenu);

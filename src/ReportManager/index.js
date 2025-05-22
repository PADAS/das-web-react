import React, { memo, useCallback, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router';

import {
  EVENT_REPORT_CATEGORY,
  INCIDENT_REPORT_CATEGORY,
  TrackerContext,
  trackEventFactory,
} from '../utils/analytics';
import { fetchEvent } from '../ducks/events';
import { getCurrentIdFromURL } from '../utils/navigation';
import { NavigationContext } from '../NavigationContextProvider';
import { selectEventTypeById } from '../selectors/event-types';
import { TAB_KEYS } from '../constants';
import useNavigate from '../hooks/useNavigate';
import { uuid } from '../utils/string';

import DelayedUnmount from '../DelayedUnmount';
import LoadingOverlay from '../LoadingOverlay';
import ReportDetailView from './ReportDetailView';

import * as styles from './styles.module.scss';

const ADDED_REPORT_TRANSITION_EFFECT_TIME = 600;

const ReportManager = ({ onReportBeingAdded = null }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { navigationData } = useContext(NavigationContext);

  const reportData = location.state?.reportData;
  const reportTracker = trackEventFactory(reportData?.is_collection
    ? INCIDENT_REPORT_CATEGORY
    : EVENT_REPORT_CATEGORY);

  // Added secondary report
  const [addedReportClassName, setAddedReportClassName] = useState(styles.addedReport);
  const [addedReportFormProps, setAddedReportFormProps] = useState(null);
  const [addedReportData, setAddedReportData] = useState(null);
  const [addedReportTypeId, setAddedReportTypeId] = useState(null);
  const [showAddedReport, setShowAddedReport] = useState(false);

  const onCloseAddedReport = useCallback((saved = true) => {
    reportTracker.track(`${saved ? 'Added' : 'Discarded adding'} report to a report`);

    setShowAddedReport(false);

    setTimeout(() => {
      setAddedReportFormProps(null);
      setAddedReportData(null);
      setAddedReportTypeId(null);
    }, ADDED_REPORT_TRANSITION_EFFECT_TIME);
  }, [reportTracker]);

  const onCancelAddedReport = useCallback(() => onCloseAddedReport(false), [onCloseAddedReport]);

  useEffect(() => {
    setTimeout(() => setAddedReportClassName(`${styles.addedReport} ${showAddedReport ? styles.show : ''}`));
  }, [showAddedReport]);

  useEffect(() => {
    onReportBeingAdded?.(showAddedReport);
  }, [onReportBeingAdded, showAddedReport]);

  // Primary report
  const existingReportId = getCurrentIdFromURL(location.pathname);
  const newReportTemporalId = location.state?.temporalId;
  const newReportTypeId = searchParams.get('reportType');

  const isNewReport = existingReportId === 'new';
  const reportId = isNewReport ? newReportTemporalId : existingReportId;

  const event = useSelector((state) => state.data.eventStore[reportId]);
  const eventType = useSelector((state) => selectEventTypeById(state, newReportTypeId));

  const [isLoadingReport, setIsLoadingReport] = useState(true);

  const shouldRenderReportDetailView = !!(isNewReport ? eventType : (event && !isLoadingReport));

  const onAddReport = useCallback((formProps, reportData, reportTypeId) => {
    setAddedReportFormProps({ ...formProps, onCancelAddedReport });
    setAddedReportData(reportData);
    setAddedReportTypeId(reportTypeId);
    setShowAddedReport(true);
  }, [onCancelAddedReport]);

  useEffect(() => {
    if (isNewReport) {
      if (!eventType) {
        navigate(`/${TAB_KEYS.EVENTS}`, { replace: true });
      } else if (!newReportTemporalId) {
        navigate(
          `${location.pathname}${location.search}`,
          { replace: true, state: { ...location.state, temporalId: uuid() } }
        );
      }
    }
  }, [eventType, isNewReport, location.pathname, location.search, location.state, navigate, newReportTemporalId]);

  useEffect(() => {
    const shouldFetchEventDetails = !event
      || !event.event_details
      || !event.files
      || !event.notes
      || !event.updates;
    if (!isNewReport && shouldFetchEventDetails) {
      setIsLoadingReport(true);
      dispatch(fetchEvent(reportId))
        .then(() => setIsLoadingReport(false))
        .catch(() => navigate(`/${TAB_KEYS.EVENTS}`, { replace: true }));
    } else {
      setIsLoadingReport(false);
    }
  }, [dispatch, event, isNewReport, navigate, reportId]);

  return <TrackerContext.Provider value={reportTracker}>
    {shouldRenderReportDetailView ? <ReportDetailView
      formProps={navigationData?.formProps}
      isBehindAddedEvent={showAddedReport}
      isNewReport={isNewReport}
      key={reportId} // This resets component state when the id changes
      newReportTypeId={newReportTypeId}
      onAddReport={onAddReport}
      reportData={reportData}
      reportId={reportId}
    /> : <LoadingOverlay />}

    <DelayedUnmount isMounted={showAddedReport}>
      <ReportDetailView
        className={addedReportClassName}
        formProps={addedReportFormProps}
        isAddedReport={true}
        isNewReport={true}
        newReportTypeId={addedReportTypeId}
        onSaveAddedReport={onCloseAddedReport}
        reportData={addedReportData}
        reportId={addedReportTypeId || 'added'}
      />
    </DelayedUnmount>
  </TrackerContext.Provider>;
};

export default memo(ReportManager);

import React, { memo, useCallback, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';

import {
  EVENT_REPORT_CATEGORY,
  INCIDENT_REPORT_CATEGORY,
  TrackerContext,
  trackEventFactory,
} from '../../../utils/analytics';
import { fetchEvent } from '../../../ducks/events';
import { getCurrentIdFromURL } from '../../../utils/navigation';
import { getIsEventFullyLoaded } from '../../../utils/events';
import { NavigationContext } from '../../../NavigationContextProvider';
import { selectEventTypeById } from '../../../selectors/event-types';
import { TAB_KEYS } from '../../../constants';
import useNavigate from '../../../hooks/useNavigate';
import { uuid } from '../../../utils/string';

import DelayedUnmount from '../../../DelayedUnmount';
import DetailViewLoader from '../../DetailViewLoader';
import ReportDetailView from './ReportDetailView';

import * as styles from './styles.module.scss';

const ADDED_REPORT_TRANSITION_EFFECT_TIME = 600;

const EventOverview = ({
  communityInputValue = null,
  fallbackPath = null,
  hidePriority = false,
  hideReportedBy = false,
  isCommunity = false,
  newReportTypeId: newReportTypeIdProp = null,
  onBack = null,
  reportId: reportIdProp = null,
}) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation('reports', { keyPrefix: 'eventsManager.eventOverview' });

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

  // Primary report
  const existingReportId = getCurrentIdFromURL(location.pathname);
  const newReportTemporalId = location.state?.temporalId;
  const newReportTypeId = newReportTypeIdProp ?? searchParams.get('reportType');

  const isNewReport = !!newReportTypeIdProp || existingReportId === 'new';
  const reportId = reportIdProp ?? (isNewReport ? newReportTemporalId : existingReportId);

  const event = useSelector((state) => state.data.eventStore[reportId]);
  const eventType = useSelector((state) => selectEventTypeById(state, newReportTypeId));

  const isEventFullyLoaded = getIsEventFullyLoaded(event);

  const shouldRenderReportDetailView = !!(isNewReport ? eventType : isEventFullyLoaded);

  const onAddReport = useCallback((formProps, reportData, reportTypeId) => {
    setAddedReportFormProps({ ...formProps, onCancelAddedReport });
    setAddedReportData(reportData);
    setAddedReportTypeId(reportTypeId);
    setShowAddedReport(true);
  }, [onCancelAddedReport]);

  useEffect(() => {
    if (isNewReport) {
      if (!eventType) {
        navigate(fallbackPath ?? `/${TAB_KEYS.EVENTS}`, { replace: true });
      } else if (!reportIdProp && !newReportTemporalId) {
        navigate(
          `${location.pathname}${location.search}`,
          { replace: true, state: { ...location.state, temporalId: uuid() } }
        );
      }
    }
  }, [eventType, fallbackPath, isNewReport, location.pathname, location.search, location.state, navigate, newReportTemporalId, reportIdProp]);

  useEffect(() => {
    if (!isNewReport && !isEventFullyLoaded) {
      dispatch(fetchEvent(reportId))
        .catch(() => navigate(`/${TAB_KEYS.EVENTS}`, { replace: true }));
    }
  }, [dispatch, isEventFullyLoaded, isNewReport, navigate, reportId]);

  return <TrackerContext.Provider value={reportTracker}>
    {shouldRenderReportDetailView ? <ReportDetailView
      // Only the flows that add an event pass form props, and they outlive a
      // flow left through a link, so an existing event must not pick them up.
      formProps={isNewReport ? navigationData?.formProps : undefined}
      hidePriority={hidePriority}
      hideReportedBy={hideReportedBy}
      isCommunity={isCommunity}
      isBehindAddedEvent={showAddedReport}
      isNewReport={isNewReport}
      key={reportId} // This resets component state when the id changes
      newReportTypeId={newReportTypeId}
      onAddReport={onAddReport}
      onBack={onBack}
      reportData={reportData}
      reportId={reportId}
      communityInputValue={communityInputValue}
    /> : <DetailViewLoader label={t('loadingLabel')} />}

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

export default memo(EventOverview);

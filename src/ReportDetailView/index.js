import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router-dom';

import { createNewReportForEventType } from '../utils/events';
import { getCurrentIdFromURL } from '../utils/navigation';
import { NavigationContext } from '../NavigationContextProvider';
import { ReportsTabContext } from '../SideBar/ReportsTab';
import { TAB_KEYS } from '../constants';
import useNavigate from '../hooks/useNavigate';
import { uuid } from '../utils/string';

import ReportManager from './ReportManager';

import styles from './styles.module.scss';

const ADDED_REPORT_TRANSITION_EFFECT_TIME = 450;

const ReportDetailView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Added secondary report
  const [addedReportForm, setAddedReportForm] = useState(null);
  const [addedReportTypeId, setAddedReportTypeId] = useState(null);
  const [addedReportFormProps, setAddedReportFormProps] = useState(null);
  const [showAddedReport, setShowAddedReport] = useState(false);

  const addedReportType = useSelector(
    (state) => state.data.eventTypes.find((eventType) => eventType.id === addedReportTypeId)
  );

  const newAddedReport = useMemo(
    () => addedReportType ? createNewReportForEventType(addedReportType) : null,
    [addedReportType]
  );

  const onCancelAddedReport = useCallback(() => {
    setShowAddedReport(false);

    setTimeout(() => {
      setAddedReportForm(null);
      setAddedReportTypeId(null);
      setAddedReportFormProps(null);
    }, ADDED_REPORT_TRANSITION_EFFECT_TIME);
  }, []);

  useEffect(() => {
    if (newAddedReport) {
      setShowAddedReport(true);
      setAddedReportForm(newAddedReport);
    }
  }, [newAddedReport]);

  // Primary report
  const eventStore = useSelector((state) => state.data.eventStore);
  const reportType = useSelector(
    (state) => state.data.eventTypes.find((eventType) => eventType.id === searchParams.get('reportType'))
  );

  const { loadingEvents } = useContext(ReportsTabContext);
  const { navigationData } = useContext(NavigationContext);

  const temporalIdRef = useRef(null);

  const [reportForm, setReportForm] = useState(null);

  const itemId = getCurrentIdFromURL(location.pathname);
  const isNewReport = itemId === 'new';
  const reportData = location.state?.reportData;
  const temporalId = location.state?.temporalId;

  const newReport = useMemo(
    () => reportType ? createNewReportForEventType(reportType, reportData) : null,
    [reportData, reportType]
  );

  const onAddReport = useCallback((reportTypeId, formProps) => {
    setAddedReportTypeId(reportTypeId);
    setAddedReportFormProps(formProps);
  }, []);

  useEffect(() => {
    if (isNewReport && !temporalId) {
      navigate(
        `${location.pathname}${location.search}`,
        { replace: true, state: { ...location.state, temporalId: uuid() } }
      );
    }
  }, [isNewReport, location, navigate, temporalId]);

  useEffect(() => {
    if ((isNewReport && !reportType) || (!isNewReport && !loadingEvents && !eventStore[itemId])) {
      navigate(`/${TAB_KEYS.REPORTS}`, { replace: true });
    }
  }, [eventStore, isNewReport, itemId, loadingEvents, navigate, reportType]);

  useEffect(() => {
    if (!loadingEvents) {
      const idHasChanged = reportForm?.id !== itemId;
      const newReportTypeHasChanged = temporalIdRef.current !== temporalId;
      const selectedReportHasChanged = isNewReport ? newReportTypeHasChanged : idHasChanged;
      if (selectedReportHasChanged) {
        setReportForm(isNewReport ? newReport : eventStore[itemId]);
        setAddedReportForm(null);
        temporalIdRef.current = temporalId;
      }
    }
  }, [eventStore, isNewReport, itemId, loadingEvents, newReport, reportForm?.id, temporalId]);

  return <>
    <ReportManager
      id={isNewReport ? temporalId : itemId}
      isNewReport={isNewReport}
      key={isNewReport ? temporalId : itemId}
      formProps={navigationData?.formProps}
      newReport={newReport}
      onAddReport={onAddReport}
      reportForm={reportForm}
      setReportForm={setReportForm}
    />

    <ReportManager
      className={`${styles.addedReport} ${showAddedReport ? styles.show : ''}`}
      isNewReport
      formProps={addedReportFormProps}
      newReport={newAddedReport}
      onCancelAddedReport={onCancelAddedReport}
      reportForm={addedReportForm}
      setReportForm={setAddedReportForm}
    />
  </>;
};

export default memo(ReportDetailView);

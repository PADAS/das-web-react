import React, { memo, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { getCurrentIdFromURL } from '../utils/navigation';
import { NavigationContext } from '../NavigationContextProvider';
import useNavigate from '../hooks/useNavigate';
import { uuid } from '../utils/string';

import DelayedUnmount from '../DelayedUnmount';
import ReportDetailView from './ReportDetailView';

import styles from './styles.module.scss';

const ADDED_REPORT_TRANSITION_EFFECT_TIME = 450;

const ReportManager = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Added secondary report
  const [addedReportClassName, setAddedReportClassName] = useState(styles.addedReport);
  const [addedReportFormProps, setAddedReportFormProps] = useState(null);
  const [addedReportData, setAddedReportData] = useState(null);
  const [addedReportTypeId, setAddedReportTypeId] = useState(null);
  const [showAddedReport, setShowAddedReport] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setAddedReportClassName(`${styles.addedReport} ${showAddedReport ? styles.show : ''}`);
    });
  }, [showAddedReport]);

  const onCancelAddedReport = useCallback(() => {
    setShowAddedReport(false);

    setTimeout(() => {
      setAddedReportFormProps(null);
      setAddedReportData(null);
      setAddedReportTypeId(null);
    }, ADDED_REPORT_TRANSITION_EFFECT_TIME);
  }, []);

  // Primary report
  const { navigationData } = useContext(NavigationContext);

  const existingReportId = getCurrentIdFromURL(location.pathname);
  const newReportTemporalId = location.state?.temporalId;
  const newReportTypeId = searchParams.get('reportType');

  const isNewReport = existingReportId === 'new';

  const reportId = isNewReport ? newReportTemporalId : existingReportId;
  const reportData = location.state?.reportData;

  const onAddReport = useCallback((formProps, reportData, reportTypeId) => {
    setAddedReportFormProps(formProps);
    setAddedReportData(reportData);
    setAddedReportTypeId(reportTypeId);
    setShowAddedReport(true);
  }, []);

  useEffect(() => {
    if (isNewReport && !newReportTemporalId) {
      navigate(
        `${location.pathname}${location.search}`,
        { replace: true, state: { ...location.state, temporalId: uuid() } }
      );
    }
  }, [isNewReport, location, navigate, newReportTemporalId]);

  return <>
    <ReportDetailView
      key={reportId} // This resets component state when the id changes
      formProps={navigationData?.formProps}
      isNewReport={isNewReport}
      newReportTypeId={newReportTypeId}
      onAddReport={onAddReport}
      reportData={reportData}
      reportId={reportId}
    />

    <DelayedUnmount isMounted={showAddedReport}>
      <ReportDetailView
        className={addedReportClassName}
        formProps={addedReportFormProps}
        isAddedReport
        isNewReport
        newReportTypeId={addedReportTypeId}
        onCancelAddedReport={onCancelAddedReport}
        reportData={addedReportData}
        reportId={addedReportTypeId || 'added'}
      />
    </DelayedUnmount>
  </>;
};

export default memo(ReportManager);

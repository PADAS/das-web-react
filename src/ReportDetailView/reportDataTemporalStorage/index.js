let REPORT_DATA_TEMPORAL_STORAGE = null;

export const setReportDataTemporalStorage = (reportData) => {
  REPORT_DATA_TEMPORAL_STORAGE = { ...reportData };
};

export const getReportDataTemporalStorage = () => ({ ...REPORT_DATA_TEMPORAL_STORAGE });

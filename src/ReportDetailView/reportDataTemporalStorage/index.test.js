import { getReportDataTemporalStorage, setReportDataTemporalStorage } from './';

describe('ReportDetailView - reportDataTemporalStorage', () => {
  test('sets and retrieves data in the temporal storage', () => {
    const reportData = {
      attachmentsToAdd: ['attachment'],
      id: '123',
      notesToAdd: ['note'],
      reportChanges: { change: 'change' },
    };
    setReportDataTemporalStorage(reportData);

    expect(getReportDataTemporalStorage()).toEqual(reportData);
  });
});

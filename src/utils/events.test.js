import { calcDisplayPriorityForReport } from './events';

import * as eventTypeUtils from './event-types';

jest.mock('./event-types', () => ({
  ...jest.requireActual('./event-types'),
  calcTopRatedReportAndTypeForCollection: jest.fn(),
}));

describe('#calcDisplayPriorityForReport', () => {
  beforeEach(() => {
    eventTypeUtils.calcTopRatedReportAndTypeForCollection.mockReturnValue({ related_event: { priority: 100 } });
  });

  test('getting the priority from a single report', () => {
    const testReport = {
      is_collection: false,
      priority: 200,
    };

    const result = calcDisplayPriorityForReport(testReport, []);

    expect(result).toBe(200);
  });

  test('extracting the top priority from an incident collection when the incident\'s priority is 0 (aka "unset")', () => {
    const testReport = {
      is_collection: true,
      priority: 0,
    };

    const result = calcDisplayPriorityForReport(testReport, []);

    expect(result).toBe(100);
  });

  test('falling back on the incident\'s priority if #calcTopRatedReportAndTypeForCollection fails', () => {
    eventTypeUtils.calcTopRatedReportAndTypeForCollection.mockReturnValue(null);

    const testReport = {
      is_collection: true,
      priority: 100,
    };

    const result = calcDisplayPriorityForReport(testReport, []);

    expect(result).toBe(100);
  });

  test('extracting the top priority from an incident collection based on a member event\'s default high priority', () => {
    eventTypeUtils.calcTopRatedReportAndTypeForCollection.mockReturnValue({ event_type: { default_priority: 200 } });

    const testReport = {
      is_collection: true,
      priority: 0,
    };

    const result = calcDisplayPriorityForReport(testReport, []);

    expect(result).toBe(200);
  });

  test('extracting the top priority from an incident collection when the incident\'s priority IS set', () => {
    const testReport = {
      is_collection: true,
      priority: 300,
    };

    const result = calcDisplayPriorityForReport(testReport, []);

    expect(result).toBe(300);
  });

});
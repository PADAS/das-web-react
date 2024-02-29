import {
  calcDisplayPriorityForReport,
  createNewReportForEventType,
  getCoordinatesForEvent,
  getReportLink,
} from './events';
import { eventWithPoint, eventWithPolygon } from '../__test-helpers/fixtures/events';

import * as eventTypeUtils from './event-types';

jest.mock('./event-types', () => ({
  ...jest.requireActual('./event-types'),
  calcTopRatedReportAndTypeForCollection: jest.fn(),
}));

describe('#createNewReportForEventType', () => {
  const time = new Date('2023-01-15T16:45:30');
  const reportType = {
    default_priority: 100,
    default_state: 'resolved',
    icon_id: 'carcass_rep',
    value: 'carcass_rep',
  };
  const data = {
    location: {
      latitude: 28.369420586280313,
      longitude: -97.11756745711632
    },
    reportedById: '64243889-5955-462e-a670-39153ff61903',
    time,
  };

  test('creates a new event with extra data', () => {
    expect(createNewReportForEventType(reportType, data)).toStrictEqual({
      event_details: {},
      event_type: 'carcass_rep',
      icon_id: 'carcass_rep',
      is_collection: false,
      location: {
        latitude: 28.369420586280313,
        longitude: -97.11756745711632,
      },
      priority: 100,
      reported_by: null,
      state: 'resolved',
      time,
    });
  });

  test('creates a new event without extra data', () => {
    expect(createNewReportForEventType(reportType)).toMatchObject({
      event_details: {},
      event_type: 'carcass_rep',
      icon_id: 'carcass_rep',
      is_collection: false,
      priority: 100,
      reported_by: null,
      state: 'resolved',
    });
  });

  test('creates a new event with default values', () => {
    expect(createNewReportForEventType({ icon_id: 'carcass_rep', value: 'carcass_rep' })).toMatchObject({
      event_details: {},
      event_type: 'carcass_rep',
      icon_id: 'carcass_rep',
      is_collection: false,
      priority: 0,
      reported_by: null,
      state: 'active',
    });
  });
});

describe('#calcDisplayPriorityForReport', () => {
  beforeEach(() => {
    eventTypeUtils.calcTopRatedReportAndTypeForCollection.mockReturnValue({ related_event: { priority: 100 } });
  });

  test('getting the priority from a single event', () => {
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

describe('#getCoordinatesForEvent', () => {
  test('getting single point coordinates', () => {
    const result = getCoordinatesForEvent(eventWithPoint);
    expect(result).toEqual([18.714, 5.8676]);
  });

  test('getting polygon coordinates', () => {
    const result = getCoordinatesForEvent(eventWithPolygon);
    expect(result).toEqual([
      [ 58.31891231904782, -32.95903350246844 ],
      [ 58.47630823380208, -32.59422031588628 ],
      [ 58.62248893060512, -32.69629040415761 ],
      [ 57.291173483506896, -33.91600187660145 ],
      [ 56.81251637929487, -33.02717890265869 ],
      [ 58.31891231904782, -32.95903350246844 ]
    ]);
  });
});

describe('#getReportLink', () => {
  test('calculates a report link for a point geometry type', () => {
    expect(getReportLink(eventWithPoint))
      .toEqual('http://localhost/reports/3662f167-37f6-4c75-9d93-673f436aa1a6?lnglat=18.714,5.8676');
  });

  test('calculates a report link for a polygon geometry type', () => {
    expect(getReportLink(eventWithPolygon))
      .toEqual('http://localhost/reports/8b386bfe-227e-40a0-97de-425abfcb3289?lnglat=57.53006316795646,-33.27303370265189');
  });

  test('calculates a report link for an incident', () => {
    const testReport = {
      contains: [{
        related_event: eventWithPoint,
      }, {
        related_event: eventWithPolygon,
      }],
      id: '123',
      is_collection: true,
    };

    expect(getReportLink(testReport))
      .toEqual('http://localhost/reports/123?lnglat=38.668244465302564,-14.024200938300725');
  });
});
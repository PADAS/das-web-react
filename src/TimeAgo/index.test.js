import subMinutes from 'date-fns/sub_minutes';
import subSeconds from 'date-fns/sub_seconds';
import subHours from 'date-fns/sub_hours';
import subMonths from 'date-fns/sub_months';
import subYears from 'date-fns/sub_years';

import TimeAgo from '../TimeAgo';
import { /* act,  */render, screen } from '@testing-library/react';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('the TimeAgo component', () => {
  const testDate = '2019-01-04T00:00:00.000Z';
  it('displays descriptive times for durations under one hour', () => {

  });

  it('displays abbreviated times for durations over one hour in the XXy XXmo XXd XXh XXm format', () => {

  });

  it('displays a prefix', () => {

  });

  it('displays a suffix', () => {

  });

  it('updates every second for values under one minute', () => {

  });

  it('updates every minute for values over one minute', () => {

  });
});
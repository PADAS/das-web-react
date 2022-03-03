import React from 'react';
import { act, render, screen } from '@testing-library/react';

import subMinutes from 'date-fns/sub_minutes';
import subSeconds from 'date-fns/sub_seconds';
import subHours from 'date-fns/sub_hours';
import subDays from 'date-fns/sub_days';
import subMonths from 'date-fns/sub_months';
import subYears from 'date-fns/sub_years';

import TimeAgo from '../TimeAgo';
import { /* advanceTimersByTime, */ runOnlyPendingTimers } from '../__test-helpers/timers';

beforeEach(() => {
  jest.useFakeTimers('modern')
    .setSystemTime(new Date('2021-02-01').getTime());
});

afterEach(async () => {
  await runOnlyPendingTimers();
  jest.useRealTimers();
});


describe('the TimeAgo component', () => {
  it('displays descriptive times for durations under one minute', async () => {
    const testDate = subMinutes(new Date(), 30);

    render(<TimeAgo date={testDate} />);

    const component = await screen.findByTestId('time-ago');

    expect(component).toHaveTextContent('30 minutes');
  });

  it('displays descriptive times for durations under one hour', async () => {
    const testDate = subSeconds(new Date(), 30);

    render(<TimeAgo date={testDate} />);

    const component = await screen.findByTestId('time-ago');

    expect(component).toHaveTextContent('30 seconds');
  });

  it('displays abbreviated times for durations over one hour in the XXy XXmo XXd XXh XXm format', async () => {
    const testDate =
      subYears(
        subMonths(
          subHours(new Date('01-01-2021'), 2)
          , 1)
        , 1);

    render(<TimeAgo date={testDate} />);

    const component = await screen.findByTestId('time-ago');

    expect(component).toHaveTextContent('1y 2mo 1d 17h');
  });

  it('displays a prefix', async () => {
    const testDate = subSeconds(new Date(), 30);
    const testPrefix = 'about';

    render(<TimeAgo date={testDate} prefix={testPrefix} />);

    const component = await screen.findByTestId('time-ago');

    expect(component).toHaveTextContent(`${testPrefix} 30 seconds`);
  });

  it('displays a suffix', async () => {
    const testDate = subSeconds(new Date(), 30);
    const testSuffix = 'ago';

    render(<TimeAgo date={testDate} suffix={testSuffix} />);

    const component = await screen.findByTestId('time-ago');

    expect(component).toHaveTextContent(`30 seconds ${testSuffix}`);
  });
/* 
  it('updates every second for values under one minute', async () => {
    const testDate = subSeconds(new Date(), 30);

    render(<TimeAgo date={testDate} />);

    const component = await screen.findByTestId('time-ago');

    expect(component).toHaveTextContent('30 seconds');

    await advanceTimersByTime(1100);

    expect(component).toHaveTextContent('31 seconds');


  });

  it('updates every minute for values over one minute', async () => {
    const testDate = subMinutes(new Date(), 1);

    render(<TimeAgo date={testDate} />);

    const component = await screen.findByTestId('time-ago');

    expect(component).toHaveTextContent('1 minute');

    await advanceTimersByTime(61000);

    expect(component).toHaveTextContent('2 minutes');
  }); */
});
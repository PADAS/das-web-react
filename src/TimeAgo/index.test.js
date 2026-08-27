import React from 'react';

import {
  subMinutes,
  subSeconds,
  subHours,
  subMonths,
  subYears
} from 'date-fns';

import i18n from '../i18nForTests';
import TimeAgo from '../TimeAgo';
import { runOnlyPendingTimers } from '../__test-helpers/timers';
import { act, render, screen } from '../test-utils';

beforeEach(() => {
  const mockSystemTime = new Date('2021-02-01');
  mockSystemTime.setUTCHours(20);

  jest.useFakeTimers('modern')
    .setSystemTime(mockSystemTime.getTime());
});

afterEach(async () => {
  await runOnlyPendingTimers();
  jest.useRealTimers();
});


describe('the TimeAgo component', () => {

  const renderTimeAgo = (props) => render(
    <TimeAgo {...props} />
  );

  it('displays descriptive times for durations under one minute', async () => {
    const testDate = subMinutes(new Date(), 30);
    renderTimeAgo({ date: testDate });

    const component = await screen.findByTestId('time-ago');

    expect(component).toHaveTextContent('30 minutes');
  });

  it('displays descriptive times for durations under one hour', async () => {
    const testDate = subSeconds(new Date(), 30);

    renderTimeAgo({ date: testDate });

    const component = await screen.findByTestId('time-ago');

    expect(component).toHaveTextContent('30 seconds');
  });

  it('displays abbreviated times for durations over one hour in the XXy XXmo XXd XXh XXm format', async () => {
    const testDate = new Date('01-01-2021');
    testDate.setUTCHours(20);
    const date = subYears(
      subMonths(
        subHours(testDate, 2)
        , 1)
      , 1);

    renderTimeAgo({ date });

    const component = await screen.findByTestId('time-ago');

    expect(component).toHaveTextContent('1y 2mo');
  });

  it('displays a prefix', async () => {
    const testDate = subSeconds(new Date(), 30);
    const testPrefix = 'about';

    renderTimeAgo({ date: testDate, prefix: testPrefix });

    const component = await screen.findByTestId('time-ago');

    expect(component).toHaveTextContent(`${testPrefix} 30 seconds`);
  });

  it('displays a suffix', async () => {
    const testDate = subSeconds(new Date(), 30);
    const testSuffix = 'ago';

    renderTimeAgo({ date: testDate, suffix: testSuffix });


    const component = await screen.findByTestId('time-ago');

    expect(component).toHaveTextContent(`30 seconds ${testSuffix}`);
  });

  it('includes the elapsed time in its accessible name', async () => {
    const testDate = subSeconds(new Date(), 30);

    renderTimeAgo({ date: testDate });

    const component = await screen.findByTestId('time-ago');

    expect(component).toHaveAccessibleName(expect.stringContaining('30 seconds'));
  });

  it('updates the displayed elapsed time as time passes', async () => {
    const testDate = subSeconds(new Date(), 30);
    renderTimeAgo({ date: testDate });

    const component = await screen.findByTestId('time-ago');

    expect(component).toHaveTextContent('30 seconds');

    await act(() => runOnlyPendingTimers());

    expect(component).toHaveTextContent('31 seconds');
  });
});
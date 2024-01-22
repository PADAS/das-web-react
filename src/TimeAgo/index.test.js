import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import subMinutes from 'date-fns/sub_minutes';
import subSeconds from 'date-fns/sub_seconds';
import subHours from 'date-fns/sub_hours';
import subMonths from 'date-fns/sub_months';
import subYears from 'date-fns/sub_years';

import TimeAgo from '../TimeAgo';
import { /* advanceTimersByTime, */ runOnlyPendingTimers } from '../__test-helpers/timers';
import i18nForTests from '../i18nForTests';

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
    <I18nextProvider i18n={i18nForTests}>
      <TimeAgo {...props} />
    </I18nextProvider>
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

    expect(component).toHaveTextContent('1y 2mo 1d 23h');
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
});
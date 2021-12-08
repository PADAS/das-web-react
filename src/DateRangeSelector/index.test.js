import React from 'react';
import subSeconds from 'date-fns/sub_seconds';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { generateDaysAgoDate } from '../utils/datetime';

import DateRangeSelector from './';

test('rendering without crashing', () => {
  render(<DateRangeSelector />);
});

describe('presets', () => {
  describe('"yesterday"', () => {
    const dateRangePresetFn = jest.fn();
    let lastCall;

    beforeAll(async () => {
      render(<DateRangeSelector onClickDateRangePreset={dateRangePresetFn} showPresets={true} />);

      const yesterdayBtn = await screen.findByTestId('yesterday-btn');
      userEvent.click(yesterdayBtn);

      expect(dateRangePresetFn.mock.calls.length).toEqual(1);

      lastCall = dateRangePresetFn.mock.calls[0];
    });
    test('the lower value is the beginning of yesterday', () => {
      const { lower } = lastCall[0];

      expect(lower).toEqual(generateDaysAgoDate(1));
    });

    test('the upper value is the last second of yesterday', () => {
      const { upper } = lastCall[0];

      expect(expect(upper).toEqual(subSeconds(generateDaysAgoDate(0), 1)));
    });
  });
});

it('lets you add a class to the start date label', async () => {
  render(<DateRangeSelector startDateLabelClass='start-label-time-yeehaw' />);

  const label = await screen.findByTestId('dateRangeSelector-startLabel');
  expect(label).toHaveClass('start-label-time-yeehaw');
});

it('lets you add a class to the end date label', async () => {
  render(<DateRangeSelector endDateLabelClass='end-label-time-okay-whatever' />);

  const label = await screen.findByTestId('dateRangeSelector-endLabel');
  expect(label).toHaveClass('end-label-time-okay-whatever');
});

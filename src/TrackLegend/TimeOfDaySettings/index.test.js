import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../test-utils';
import { mockStore } from '../../__test-helpers/MockStore';

import TimeOfDaySettings from '.';

describe('TrackLegend - TimeOfDaySettings', () => {
  const onCollapseTimeOfDaySettings = jest.fn();
  const onExpandTimeOfDaySettings = jest.fn();

  let store;
  beforeEach(() => {
    store = {
      view: {
        trackSettings: {
          timeOfDayTimeZone: 'America/Mexico_City',
        },
      },
    };
  });

  const renderTimeOfDaySettings = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <TimeOfDaySettings
        isExpanded
        onCollapseTimeOfDaySettings={onCollapseTimeOfDaySettings}
        onExpandTimeOfDaySettings={onExpandTimeOfDaySettings}
        {...props}
      />
    </Provider>
  );

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows the time of day settings expanded', () => {
    renderTimeOfDaySettings();

    expect(screen.getByLabelText('Collapse the time of day settings')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('arrow-up-simple.svg')).toBeVisible();
    expect(screen.queryByText('arrow-down-simple.svg')).toBeNull();
  });

  test('shows the time of day settings collapsed', () => {
    renderTimeOfDaySettings({ isExpanded: false });

    expect(screen.getByLabelText('Expand the time of day settings')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('arrow-down-simple.svg')).toBeVisible();
    expect(screen.queryByText('arrow-up-simple.svg')).toBeNull();
  });

  test('collapses the time of day settings', () => {
    renderTimeOfDaySettings();

    expect(onCollapseTimeOfDaySettings).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Collapse the time of day settings'));

    expect(onCollapseTimeOfDaySettings).toHaveBeenCalledTimes(1);
  });

  test('expands the time of day settings', () => {
    renderTimeOfDaySettings({ isExpanded: false });

    expect(onExpandTimeOfDaySettings).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Expand the time of day settings'));

    expect(onExpandTimeOfDaySettings).toHaveBeenCalledTimes(1);
  });
});

import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../test-utils';
import { mockStore } from '../../../__test-helpers/MockStore';
import { setTimeOfDayTimeZone } from '../../../ducks/tracks';

import TimeZoneSelect from '.';

jest.mock('../../../ducks/tracks', () => ({
  ...jest.requireActual('../../../ducks/tracks'),
  setTimeOfDayTimeZone: jest.fn(),
}));

describe('TrackLegend - TimeOfDaySettings - TimeZoneSelect', () => {
  let setTimeOfDayTimeZoneMock, store;
  beforeEach(() => {
    setTimeOfDayTimeZoneMock = jest.fn(() => () => { });
    setTimeOfDayTimeZone.mockImplementation(setTimeOfDayTimeZoneMock);

    store = {
      view: {
        trackSettings: {
          timeOfDayTimeZone: 'America/Mexico_City',
        },
      },
    };
  });

  const renderTimeZoneSelect = (overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <TimeZoneSelect />
    </Provider>
  );

  /*   test('sets the user time zone as the default value if none has been selected', () => {
      store.view.trackSettings.timeOfDayTimeZone = null;
  
      expect(setTimeOfDayTimeZone).not.toHaveBeenCalled();
  
      renderTimeZoneSelect();
  
      expect(setTimeOfDayTimeZone).toHaveBeenCalledTimes(1);
      expect(setTimeOfDayTimeZone).toHaveBeenCalledWith('America/Mexico_City');
    }); */

  test('shows an option for each time zone supported sorted by offset', () => {
    renderTimeZoneSelect();

    userEvent.click(screen.getByLabelText('Time zone:'));

    const options = screen.getAllByRole('option');

    expect(options).toHaveLength(Intl.supportedValuesOf('timeZone').length);
    // These tests may break if someday the IANA standard updates.
    expect(options[0]).toHaveTextContent('(UTC-11:00) Pacific / Midway');
    expect(options[0]).toHaveTextContent('Samoa Standard Time');
    expect(options[options.length - 1]).toHaveTextContent('(UTC+14:00) Pacific / Kiritimati');
    expect(options[options.length - 1]).toHaveTextContent('Line Islands Time');
  });

  test('selects a new time zone', () => {
    renderTimeZoneSelect();

    userEvent.click(screen.getByLabelText('Time zone:'));

    expect(setTimeOfDayTimeZone).not.toHaveBeenCalled();

    userEvent.click(screen.getAllByRole('option')[100]);

    expect(setTimeOfDayTimeZone).toHaveBeenCalledTimes(1);
    // This test may break if someday the IANA standard updates.
    expect(setTimeOfDayTimeZone).toHaveBeenCalledWith('America/Marigot');
  });
});

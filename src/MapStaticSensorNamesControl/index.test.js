import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { toggleMapStaticSubjectsNameState } from '../ducks/map-ui';

import { mockStore } from '../__test-helpers/MockStore';

import MapStaticSensorNamesControl from './';

const store = { view: { showMapStaticSubjectsNames: false } };

jest.mock('../ducks/map-ui', () => ({
  ...jest.requireActual('../ducks/map-ui'),
  toggleMapStaticSubjectsNameState: jest.fn(),
}));

test('rendering without crashing', () => {
  render(
    <Provider store={mockStore(store)}>
      <MapStaticSensorNamesControl/>
    </Provider>
  );
});

test('changing the checkbox value', async () => {
  const toggleMapStaticSubjectsNameStateMock = jest.fn(() => () => {});
  toggleMapStaticSubjectsNameState.mockImplementation(toggleMapStaticSubjectsNameStateMock);

  render(
    <Provider store={mockStore(store)}>
      <MapStaticSensorNamesControl/>
    </Provider>
  );
  const checkboxInput = await screen.findByRole('checkbox');
  userEvent.click(checkboxInput);

  expect(toggleMapStaticSubjectsNameState).toHaveBeenCalledTimes(1);
});


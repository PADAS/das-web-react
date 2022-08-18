import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Footer from './';
import { mockStore } from '../../__test-helpers/MockStore';
import { setIsPickingLocation } from '../../ducks/map-ui';

jest.mock('../../ducks/map-ui', () => ({
  ...jest.requireActual('../../ducks/map-ui'),
  setIsPickingLocation: jest.fn(),
}));

describe('Footer', () => {
  const onSave = jest.fn();
  let setIsPickingLocationMock, store;

  beforeEach(() => {
    setIsPickingLocationMock = jest.fn(() => () => {});
    setIsPickingLocation.mockImplementation(setIsPickingLocationMock);

    store = {};

    render(
      <Provider store={mockStore(store)}>
        <Footer onSave={onSave} />
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('triggers setIsPickingLocation with false when canceling the geometry', async () => {
    expect(setIsPickingLocation).toHaveBeenCalledTimes(0);

    const cancelButton = await screen.findByText('Cancel');
    userEvent.click(cancelButton);

    expect(setIsPickingLocation).toHaveBeenCalledTimes(1);
    expect(setIsPickingLocation).toHaveBeenCalledWith(false);
  });

  test('triggers onSave when saving the geometry', async () => {
    expect(onSave).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

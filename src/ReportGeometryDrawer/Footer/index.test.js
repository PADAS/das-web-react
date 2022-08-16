import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Footer from './';
import { mockStore } from '../../__test-helpers/MockStore';
import { setMapAreaSelection } from '../../ducks/map-ui';

jest.mock('../../ducks/map-ui', () => ({
  ...jest.requireActual('../../ducks/map-ui'),
  setMapAreaSelection: jest.fn(),
}));

describe('Footer', () => {
  const onSave = jest.fn();
  let setMapAreaSelectionMock, store;

  beforeEach(() => {
    setMapAreaSelectionMock = jest.fn(() => () => {});
    setMapAreaSelection.mockImplementation(setMapAreaSelectionMock);

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

  test('triggers setMapAreaSelection with false when canceling the geometry', async () => {
    expect(setMapAreaSelection).toHaveBeenCalledTimes(0);

    const cancelButton = await screen.findByText('Cancel');
    userEvent.click(cancelButton);

    expect(setMapAreaSelection).toHaveBeenCalledTimes(1);
    expect(setMapAreaSelection).toHaveBeenCalledWith(false);
  });

  test('triggers onSave when saving the geometry', async () => {
    expect(onSave).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

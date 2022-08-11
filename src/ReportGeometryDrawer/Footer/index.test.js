import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Footer from './';
import { mockStore } from '../../__test-helpers/MockStore';
import { setMapInteractionIsPickingArea } from '../../ducks/map-ui';

jest.mock('../../ducks/map-ui', () => ({
  ...jest.requireActual('../../ducks/map-ui'),
  setMapInteractionIsPickingArea: jest.fn(),
}));

describe('Footer', () => {
  const onSave = jest.fn();
  let setMapInteractionIsPickingAreaMock, store;

  beforeEach(() => {
    setMapInteractionIsPickingAreaMock = jest.fn(() => () => {});
    setMapInteractionIsPickingArea.mockImplementation(setMapInteractionIsPickingAreaMock);

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

  test('triggers setMapInteractionIsPickingArea with false when canceling the geometry', async () => {
    expect(setMapInteractionIsPickingArea).toHaveBeenCalledTimes(0);

    const cancelButton = await screen.findByText('Cancel');
    userEvent.click(cancelButton);

    expect(setMapInteractionIsPickingArea).toHaveBeenCalledTimes(1);
    expect(setMapInteractionIsPickingArea).toHaveBeenCalledWith(false);
  });

  test('triggers onSave when saving the geometry', async () => {
    expect(onSave).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

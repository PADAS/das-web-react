import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CancelationConfirmationModal from './';
import { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';
import { mockStore } from '../../__test-helpers/MockStore';
import { removeModal } from '../../ducks/modals';
import { setIsPickingLocation } from '../../ducks/map-ui';

jest.mock('../../ducks/modals', () => ({
  ...jest.requireActual('../../ducks/modals'),
  removeModal: jest.fn(),
}));

jest.mock('../../ducks/map-ui', () => ({
  ...jest.requireActual('../../ducks/map-ui'),
  setIsPickingLocation: jest.fn(),
}));

describe('CancelationConfirmationModal', () => {
  const setMapDrawingData = jest.fn();
  let removeModalMock, setIsPickingLocationMock, store;

  beforeEach(() => {
    removeModalMock = jest.fn(() => () => {});
    removeModal.mockImplementation(removeModalMock);
    setIsPickingLocationMock = jest.fn(() => () => {});
    setIsPickingLocation.mockImplementation(setIsPickingLocationMock);

    store = {};

    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContext.Provider value={{ setMapDrawingData }}>
          <CancelationConfirmationModal id="123" />
        </MapDrawingToolsContext.Provider>
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('closes the modal without canceling picking a location if user clicks continue editing', async () => {
    expect(removeModal).toHaveBeenCalledTimes(0);
    expect(setIsPickingLocation).toHaveBeenCalledTimes(0);
    expect(setMapDrawingData).toHaveBeenCalledTimes(0);

    const continueEditingButton = await screen.findByText('Continue Editing');
    userEvent.click(continueEditingButton);

    expect(removeModal).toHaveBeenCalledTimes(1);
    expect(removeModal).toHaveBeenCalledWith('123');
    expect(setIsPickingLocation).toHaveBeenCalledTimes(0);
    expect(setMapDrawingData).toHaveBeenCalledTimes(0);
  });

  test('closes the modal and cancels picking a location if user clicks discard', async () => {
    expect(removeModal).toHaveBeenCalledTimes(0);
    expect(setIsPickingLocation).toHaveBeenCalledTimes(0);
    expect(setMapDrawingData).toHaveBeenCalledTimes(0);

    const discartButton = await screen.findByText('Discard');
    userEvent.click(discartButton);

    expect(removeModal).toHaveBeenCalledTimes(1);
    expect(removeModal).toHaveBeenCalledWith('123');
    expect(setIsPickingLocation).toHaveBeenCalledTimes(1);
    expect(setIsPickingLocation).toHaveBeenCalledWith(false);
    expect(setMapDrawingData).toHaveBeenCalledTimes(1);
    expect(setMapDrawingData).toHaveBeenCalledWith(null);
  });
});

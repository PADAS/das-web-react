import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CancelationConfirmationModal from './';
import { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';
import { mockStore } from '../../__test-helpers/MockStore';
import { setIsPickingLocation } from '../../ducks/map-ui';

jest.mock('../../ducks/map-ui', () => ({
  ...jest.requireActual('../../ducks/map-ui'),
  setIsPickingLocation: jest.fn(),
}));

describe('CancelationConfirmationModal', () => {
  const onHide = jest.fn(), setMapDrawingData = jest.fn();
  let setIsPickingLocationMock, store;

  beforeEach(() => {
    setIsPickingLocationMock = jest.fn(() => () => {});
    setIsPickingLocation.mockImplementation(setIsPickingLocationMock);

    store = {};

    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContext.Provider value={{ setMapDrawingData }}>
          <CancelationConfirmationModal onHide={onHide} show />
        </MapDrawingToolsContext.Provider>
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('closes the modal without canceling picking a location if user clicks continue editing', async () => {
    expect(onHide).toHaveBeenCalledTimes(0);
    expect(setIsPickingLocation).toHaveBeenCalledTimes(0);
    expect(setMapDrawingData).toHaveBeenCalledTimes(0);

    const continueEditingButton = await screen.findByText('Continue Editing');
    userEvent.click(continueEditingButton);

    expect(onHide).toHaveBeenCalledTimes(1);
    expect(setIsPickingLocation).toHaveBeenCalledTimes(0);
    expect(setMapDrawingData).toHaveBeenCalledTimes(0);
  });

  test('closes the modal and cancels picking a location if user clicks discard', async () => {
    expect(onHide).toHaveBeenCalledTimes(0);
    expect(setIsPickingLocation).toHaveBeenCalledTimes(0);
    expect(setMapDrawingData).toHaveBeenCalledTimes(0);

    const discartButton = await screen.findByText('Discard');
    userEvent.click(discartButton);

    expect(onHide).toHaveBeenCalledTimes(1);
    expect(setIsPickingLocation).toHaveBeenCalledTimes(1);
    expect(setIsPickingLocation).toHaveBeenCalledWith(false);
    expect(setMapDrawingData).toHaveBeenCalledTimes(1);
    expect(setMapDrawingData).toHaveBeenCalledWith(null);
  });
});

import React from 'react';
import { Provider } from 'react-redux';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Footer from './';
import { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';
import { mockStore } from '../../__test-helpers/MockStore';
import { setIsPickingLocation } from '../../ducks/map-ui';

jest.mock('../../ducks/map-ui', () => ({
  ...jest.requireActual('../../ducks/map-ui'),
  setIsPickingLocation: jest.fn(),
}));

describe('Footer', () => {
  const onSave = jest.fn(), setMapDrawingData = jest.fn();
  let setIsPickingLocationMock, store;

  beforeEach(() => {
    setIsPickingLocationMock = jest.fn(() => () => {});
    setIsPickingLocation.mockImplementation(setIsPickingLocationMock);

    store = {};

    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContext.Provider value={{ setMapDrawingData }}>
          <Footer isDrawing={false} isGeometryAValidPolygon onSave={onSave} />
        </MapDrawingToolsContext.Provider>
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('triggers setIsPickingLocation with false when canceling the geometry', async () => {
    expect(setIsPickingLocation).toHaveBeenCalledTimes(0);
    expect(setMapDrawingData).toHaveBeenCalledTimes(0);

    const cancelButton = await screen.findByText('Cancel');
    userEvent.click(cancelButton);

    expect(setIsPickingLocation).toHaveBeenCalledTimes(1);
    expect(setIsPickingLocation).toHaveBeenCalledWith(false);
    expect(setMapDrawingData).toHaveBeenCalledTimes(1);
    expect(setMapDrawingData).toHaveBeenCalledWith(null);
  });

  test('triggers onSave when saving the geometry', async () => {
    expect(onSave).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test('shows the save button tooltip if polygon is not closed', async () => {
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContext.Provider value={{ setMapDrawingData }}>
          <Footer isDrawing isGeometryAValidPolygon onSave={onSave} />
        </MapDrawingToolsContext.Provider>
      </Provider>
    );
    expect((await screen.queryByRole('tooltip'))).toBeNull();

    const saveButton = await screen.findByText('Save');
    userEvent.hover(saveButton);

    expect((await screen.findByRole('tooltip'))).toHaveTextContent('Only closed shapes can be saved');
  });

  test('shows the save button tooltip if polygon is not valid', async () => {
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContext.Provider value={{ setMapDrawingData }}>
          <Footer isDrawing={false} isGeometryAValidPolygon={false} onSave={onSave} />
        </MapDrawingToolsContext.Provider>
      </Provider>
    );
    expect((await screen.queryByRole('tooltip'))).toBeNull();

    const saveButton = await screen.findByText('Save');
    userEvent.hover(saveButton);

    expect((await screen.findByRole('tooltip'))).toHaveTextContent('Segments of the shape cannot intersect');
  });

  test('does not show the save button tooltip if there is a valid closed polygon', async () => {
    cleanup();
    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContext.Provider value={{ setMapDrawingData }}>
          <Footer isDrawing={false} isGeometryAValidPolygon onSave={onSave} />
        </MapDrawingToolsContext.Provider>
      </Provider>
    );
    expect((await screen.queryByRole('tooltip'))).toBeNull();

    const saveButton = await screen.findByText('Save');
    userEvent.hover(saveButton);

    expect((await screen.queryByRole('tooltip'))).toBeNull();
  });
});

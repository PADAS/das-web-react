import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import GeometryPreview from './';
import { mockStore } from '../../__test-helpers/MockStore';
import { report } from '../../__test-helpers/fixtures/reports';

describe('GeometryPreview', () => {
  const onAreaSelectStart = jest.fn(), onDeleteArea = jest.fn();
  let store;
  beforeEach(() => {
    report.geometry = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [6.657425, 9.301125],
            [-40.668725, 5.047775],
            [5.0602, -13.74975]
          ]
        ]
      }
    };;

    store = mockStore({ view: { mapLocationSelection: { event: report } } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders the preview geometry preview', async () => {
    render(
      <Provider store={store}>
        <GeometryPreview onAreaSelectStart={onAreaSelectStart} />
      </Provider>
    );

    expect((await screen.findByAltText('Static map with geometry'))).toBeDefined();
    expect((await screen.findByAltText('Static map with geometry')))
      .toHaveAttribute('src', 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/geojson(%7B%22type%22:%22Feature%22,%22properties%22:%7B%7D,%22geometry%22:%7B%22type%22:%22Polygon%22,%22coordinates%22:%5B%5B%5B6.657425,9.301125%5D,%5B-40.668725,5.047775%5D,%5B5.0602,-13.74975%5D%5D%5D%7D%7D)/[-40.668725,-13.74975,6.657425,9.301125]/296x130?padding=10&access_token=pk.eyJ1IjoidmpvZWxtIiwiYSI6ImNrdW15MXczdTFnaWcyb3A4NjN2dzVzdWcifQ.jYrSffOGKKPxXDJoxwtNfQ&logo=false&attribution=false');
    expect((await screen.findByTitle('Place geometry on map'))).toHaveTextContent('Edit Area');
  });

  test('triggers onAreaSelectStart when pressing the edit area button', async () => {
    render(
      <Provider store={store}>
        <GeometryPreview onAreaSelectStart={onAreaSelectStart} />
      </Provider>
    );

    expect(onAreaSelectStart).toHaveBeenCalledTimes(0);

    const editAreaButton = await screen.findByTitle('Place geometry on map');
    userEvent.click(editAreaButton);

    expect(onAreaSelectStart).toHaveBeenCalledTimes(1);
  });

  test('triggers onDeleteArea when pressing the delete button', async () => {
    render(
      <Provider store={store}>
        <GeometryPreview onDeleteArea={onDeleteArea} />
      </Provider>
    );

    expect(onDeleteArea).toHaveBeenCalledTimes(0);

    const deleteAreaButton = await screen.findByTitle('Delete area button');
    userEvent.click(deleteAreaButton);

    expect(onDeleteArea).toHaveBeenCalledTimes(1);
  });

  test('calculates and shows the area and perimeter of the geometry', async () => {
    render(
      <Provider store={store}>
        <GeometryPreview onDeleteArea={onDeleteArea} />
      </Provider>
    );

    expect((await screen.findByText('6666984.03km²'))).toBeDefined();
    expect((await screen.findByText('10700.51km'))).toBeDefined();
  });
});

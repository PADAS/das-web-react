import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AreaTab from './';
import { mockStore } from '../../../__test-helpers/MockStore';
import { report } from '../../../__test-helpers/fixtures/reports';

describe('AreaTab', () => {
  const geometryExample = {
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
  };

  const onAreaSelectCancel = jest.fn(), onAreaSelectStart = jest.fn();
  let store;
  beforeEach(() => {
    store = mockStore({
      view: { showUserLocation: true, userLocation: { coords: { latitude: 123, longitude: 456 } } },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders the create area button if report does not have geometry', async () => {
    render(
      <Provider store={store}>
        <AreaTab areaFor={report} onAreaSelectCancel={onAreaSelectCancel} onAreaSelectStart={onAreaSelectStart} />
      </Provider>
    );

    expect((await screen.findByTitle('Place geometry on map'))).toHaveTextContent('Create report area');
  });

  test('triggers onAreaSelectStart when pressing the create area button', async () => {
    render(
      <Provider store={store}>
        <AreaTab areaFor={report} onAreaSelectCancel={onAreaSelectCancel} onAreaSelectStart={onAreaSelectStart} />
      </Provider>
    );

    expect(onAreaSelectStart).toHaveBeenCalledTimes(0);

    const createAreaButton = await screen.findByTitle('Place geometry on map');
    userEvent.click(createAreaButton);

    expect(onAreaSelectStart).toHaveBeenCalledTimes(1);
  });

  test('renders the preview geometry preview image if report has a geometry', async () => {
    report.geometry = geometryExample;

    render(
      <Provider store={store}>
        <AreaTab areaFor={report} onAreaSelectCancel={onAreaSelectCancel} onAreaSelectStart={onAreaSelectStart} />
      </Provider>
    );

    expect((await screen.findByAltText('Static map with geometry'))).toBeDefined();
    expect((await screen.findByAltText('Static map with geometry')))
      .toHaveAttribute('src', 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/geojson(%7B%22type%22:%22Feature%22,%22geometry%22:%7B%22type%22:%22Polygon%22,%22coordinates%22:%5B%5B%5B6.657425,9.301125%5D,%5B-40.668725,5.047775%5D,%5B5.0602,-13.74975%5D%5D%5D%7D%7D)/[-13.74975,-40.668725,9.301125,6.657425]/300x130?access_token=pk.eyJ1IjoidmpvZWxtIiwiYSI6ImNrdW15MXczdTFnaWcyb3A4NjN2dzVzdWcifQ.jYrSffOGKKPxXDJoxwtNfQ&logo=false&attribution=false');
    expect((await screen.findByTitle('Place geometry on map'))).toHaveTextContent('Edit Area');
  });

  test('triggers onAreaSelectStart when pressing the edit area button', async () => {
    report.geometry = geometryExample;

    render(
      <Provider store={store}>
        <AreaTab areaFor={report} onAreaSelectCancel={onAreaSelectCancel} onAreaSelectStart={onAreaSelectStart} />
      </Provider>
    );

    expect(onAreaSelectStart).toHaveBeenCalledTimes(0);

    const editAreaButton = await screen.findByTitle('Place geometry on map');
    userEvent.click(editAreaButton);

    expect(onAreaSelectStart).toHaveBeenCalledTimes(1);
  });
});

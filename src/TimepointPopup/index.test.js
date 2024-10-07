import React from 'react';
import { Provider } from 'react-redux';

import { render, screen } from '../test-utils';
import { mockStore } from '../__test-helpers/MockStore';
import { GPS_FORMATS } from '../utils/location';
import { DAS_HOST } from '../constants';

import TimepointPopup from './';

describe('TimepointPopup', () => {
  const store = {
    data: {},
    view: {
      userPreferences: {
        gpsFormat: Object.values(GPS_FORMATS)[0],
      },
    },
  };
  const observationData = {
    geometry: {
      coordinates: [20.654227,  -103.423024]
    },
    properties: {
      id: '2f125269-a284-4ae1-8fbd-534e9dd9ea61',
      title: 'Alexis Puentes',
      name: '',
      time: '2024-09-26T18:54:54+00:00',
    },
  };

  const renderTimepointPopUp = () => render(
    <Provider store={mockStore(store)}>
      <TimepointPopup data={observationData} />
    </Provider>
  );

  test('displays title properly', () => {
    renderTimepointPopUp();

    expect(screen.getByText(observationData.properties.title)).toBeVisible();
  });

  test('displays time properly', () => {
    renderTimepointPopUp();

    expect(screen.getByText('26 Sep 24 13:54')).toBeVisible();
  });

  test('displays location coordinates properly', () => {
    renderTimepointPopUp();

    expect(screen.getByTestId('gpsFormatToggle-gpsString')).toHaveTextContent('-76.576976°, 20.654227°');
  });

  test('shows admin link to edit observation', () => {
    renderTimepointPopUp();

    expect(screen.getByRole('link')).toHaveAttribute('href', `${DAS_HOST}/admin/observations/observation/${observationData.properties.id}/change/`);
  });



});

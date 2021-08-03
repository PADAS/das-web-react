

import { createMapMock } from '../__test-helpers/mocks'; /* eslint-disable-line no-unused-vars */
// import ReactMapboxGl from 'react-mapbox-gl';
import React from 'react';
import { Provider } from 'react-redux';
// import ReactGA from 'react-ga';

import '../__test-helpers/MockStore';
import { mockStore } from '../__test-helpers/MockStore';
import { mockMapSubjectFeatureCollection } from '../__test-helpers/fixtures/subjects';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GPS_FORMATS } from '../utils/location';

import SubjectPopup from './';

const store = mockStore({
  data: { 
    eventFilter: {
      filter: {
        date_range: {
          lower: null,
          upper: null,
        },     
      },
    },
    tracks: {},
  }, 
  view: { 
    heatmapSubjectIDs: [],
    timeSliderState: { 
      active: false, 
      virtualDate: null, 
    }, 
    trackLength: {
      origin: 'customLength',
      length: 21,
    },
    subjectTrackState: { 
      visible: [],
      pinned: [], 
    },
    patrolTrackState: { 
      visible: [],
      pinned: [], 
    },
    userPreferences: {
      gpsFormat: GPS_FORMATS.DEG,
    },
  },
});

/* const mapInstance = createMapMock();
const MapboxMap = ReactMapboxGl({
  accessToken: 'fake-token-content-does-not-matter',
  mapInstance,
}); */
const subjectGeoJsonWithAdditionalProperties = mockMapSubjectFeatureCollection.features[0];

test('rendering without crashing', () => {

  render(<Provider store={store}>
    <SubjectPopup data={subjectGeoJsonWithAdditionalProperties} />
  </Provider>);
});

describe('the popup', () => {
  beforeEach(() => {
    render(<Provider store={store}>
      <SubjectPopup data={subjectGeoJsonWithAdditionalProperties} />
    </Provider>);
  });
  test('showing the subject name', () => {
    expect(screen.getByText('RD-001')).toBeInTheDocument();
  });

  test('showing and hiding additional device properties', async () => {
    const additionalPropsToggleBtn = await screen.getByTestId('additional-props-toggle-btn');

    userEvent.click(additionalPropsToggleBtn);

    const additionalProps = await screen.findByTestId('additional-props');
    const deviceStatusProps = subjectGeoJsonWithAdditionalProperties.properties.device_status_properties;

    deviceStatusProps.forEach(({ label, value }) => {
      if (label.length) expect(additionalProps).toHaveTextContent(label);
      if (value.length) expect(additionalProps).toHaveTextContent(value);
    });

    userEvent.click(additionalPropsToggleBtn);
    expect(additionalProps).not.toBeInTheDocument();

  });

  test('static subject popups', () => {

  });

});



import { createMapMock } from '../__test-helpers/mocks'; /* eslint-disable-line no-unused-vars */
import ReactMapboxGl from 'react-mapbox-gl';
import React from 'react';
import { Provider } from 'react-redux';
// import ReactGA from 'react-ga';

import '../__test-helpers/MockStore';
import { mockStore } from '../__test-helpers/MockStore';
import { mockMapSubjectFeatureCollection } from '../__test-helpers/fixtures/subjects';

import { render, waitFor, waitForElementToBeRemoved, screen } from '@testing-library/react';
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

const mapInstance = createMapMock();
const MapboxMap = ReactMapboxGl({
  accessToken: 'fake-token-content-does-not-matter',
  mapInstance,
});
const subjectGeoJson = mockMapSubjectFeatureCollection.features[0];

it('it renders without crashing', () => {

  render(<Provider store={store}>
    <MapboxMap>
      <SubjectPopup data={subjectGeoJson} />
    </MapboxMap>
  </Provider>);
});

describe('the popup', () => {
  beforeAll(() => {
    render(<Provider store={store}>
      {/* <MapboxMap> */}
      <SubjectPopup data={subjectGeoJson} />
      {/* </MapboxMap> */}
    </Provider>);
  });
  it('shows the subject name', () => {
    expect(screen.getByText('RD-001')).toBeInTheDocument();
  });
});

import mocks from '../__test-helpers/mocks'; /* eslint-disable-line no-unused-vars */
import React from 'react';
import { Provider } from 'react-redux';
import ReactGA from 'react-ga';

import { NEWS_API_URL } from '../ducks/news';
// import { INITIAL_STATE as INITIAL_TIMESLIDER_STATE } from '../ducks/timeslider';
// import { INITIAL_TRACK_STATE } from '../ducks/map-ui';
// import { INITIAL_TRACKS_STATE } from '../ducks/tracks';

import '../__test-helpers/MockStore';
import { mockStore } from '../__test-helpers/MockStore';
import { mockMapSubjectFeatureCollection } from '../__test-helpers/fixtures/subjects';

import { render, waitFor, waitForElementToBeRemoved, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

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

fit('it renders without crashing', () => {
  const mapMock = {
    on: jest.fn(),
    off: jest.fn(),
  };

  render(<Provider store={store}>
    <SubjectPopup data={mockMapSubjectFeatureCollection.features[0]} map={mapMock} />
  </Provider>);
});
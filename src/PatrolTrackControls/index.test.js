import React from 'react';
import { Provider } from 'react-redux';
import bbox from '@turf/bbox';
import { lineString } from '@turf/helpers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MapContext } from '../App';
import { mockStore } from '../__test-helpers/MockStore';
import { createMapMock } from '../__test-helpers/mocks';
import { UPDATE_SUBJECT_TRACK_STATE } from '../ducks/map-ui';
import * as patrolUtils from '../utils/patrols';

import { UPDATE_PATROL_TRACK_STATE } from '../ducks/patrols';
import { activePatrol, cancelledPatrol, patrolDefaultStoreData } from '../__test-helpers/fixtures/patrols';

import PatrolTrackControls from './';


let store = mockStore(patrolDefaultStoreData);
const map = createMapMock({ fitBounds: jest.fn() });
const onLocationClick = jest.fn();

test('rendering without crashing', () => {
  render(<Provider store={store}>
    <MapContext.Provider value={map}>
      <PatrolTrackControls patrol={activePatrol} onLocationClick={onLocationClick}/>
    </MapContext.Provider>
  </Provider>);
});


describe('patrols with leader, location and track data', () => {
  const patrolWithLeader = { ...activePatrol };
  let testPatrol;

  beforeEach(() => {
    testPatrol = { ...patrolWithLeader };

    jest.spyOn(patrolUtils, 'patrolHasGeoDataToDisplay').mockImplementation(() => {
      return true;
    });

    jest.spyOn(patrolUtils, 'getBoundsForPatrol').mockImplementation(() => {
      const line = lineString([[-74, 40], [-78, 42], [-82, 35]]); /* some random valid line to create bounding box around */
      const boundingBox = bbox(line);
      return boundingBox;
    });

    render(<Provider store={store}>
      <MapContext.Provider value={map}>
        <PatrolTrackControls patrol={testPatrol} onLocationClick={onLocationClick}/>
      </MapContext.Provider>
    </Provider>);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  test('toggling a patrol track on when clicking the "jump to location button"', async () => {
    const jumpButton = await screen.findByTestId(`patrol-list-item-jump-btn-${testPatrol.id}`);
    userEvent.click(jumpButton);

    const actions = store.getActions();

    const actionMatch = actions.find(action => action.type === UPDATE_PATROL_TRACK_STATE);

    expect(actionMatch).toBeDefined();
    expect(actionMatch.payload).toEqual({ visible: [testPatrol.id] });
  });

  test('toggling a patrol leader\'s track on when clicking the "jump to location button"', async () => {
    const jumpButton = await screen.findByTestId(`patrol-list-item-jump-btn-${testPatrol.id}`);
    userEvent.click(jumpButton);

    const actions = store.getActions();

    const actionMatch = actions.find(action => action.type === UPDATE_SUBJECT_TRACK_STATE);

    expect(actionMatch).toBeDefined();
    expect(actionMatch.payload).toEqual({ visible: [testPatrol.patrol_segments[0].leader.id] });

  });

  test('showing a location jump button if the patrol has any location data', async () => {
    await screen.findByTestId(`patrol-list-item-jump-btn-${testPatrol.id}`);
  });

  test('showing a track button if the patrol has track data', async () => {
    await screen.findByTestId(`patrol-list-item-track-btn-${testPatrol.id}`);
  });
});

describe('patrols WITHOUT location and track data', () => {
  const patrolWithLeader = { ...activePatrol };
  let testPatrol;
  beforeEach(() => {
    testPatrol = { ...patrolWithLeader };

    jest.spyOn(patrolUtils, 'patrolHasGeoDataToDisplay').mockImplementation(() => {
      return false;
    });

    jest.spyOn(patrolUtils, 'getBoundsForPatrol').mockImplementation(() => {
      return null;
    });

    render(<Provider store={store}>
      <MapContext.Provider value={map}>
        <PatrolTrackControls patrol={testPatrol} onLocationClick={onLocationClick}/>
      </MapContext.Provider>
    </Provider>);
  });

  test('it should NOT show a location jump button', () => {
    expect(() => screen.getByTestId(`patrol-list-item-jump-btn-${testPatrol.id}`)).toThrow();
  });

  test('it should NOT a track button', () => {
    expect(() => screen.getByTestId(`patrol-list-item-track-btn-${testPatrol.id}`)).toThrow();
  });
});

describe('patrols WITHOUT leader', () => {
  const patrolWithoutLeader = { ...cancelledPatrol };
  let testPatrol;

  beforeEach(() => {
    testPatrol = { ...patrolWithoutLeader };

    jest.spyOn(patrolUtils, 'patrolHasGeoDataToDisplay').mockImplementation(() => {
      return true;
    });

    jest.spyOn(patrolUtils, 'getBoundsForPatrol').mockImplementation(() => {
      const line = lineString([[-74, 40], [-78, 42], [-82, 35]]); /* some random valid line to create bounding box around */
      const boundingBox = bbox(line);
      return boundingBox;
    });

    render(<Provider store={store}>
      <MapContext.Provider value={map}>
        <PatrolTrackControls patrol={testPatrol} onLocationClick={onLocationClick}/>
      </MapContext.Provider>
    </Provider>);
  });

  test('showing a location jump button because patrol has location data', async () => {
    await screen.findByTestId(`patrol-list-item-jump-btn-${testPatrol.id}`);
  });

  test('NOT showing a track jump button even if the patrol has track data but there is no leader', () => {
    expect(() => screen.getByTestId(`patrol-list-item-track-btn-${testPatrol.id}`)).toThrow();
  });
});
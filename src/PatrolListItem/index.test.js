import React from 'react';
import { Provider } from 'react-redux';
import { bbox, lineString } from '@turf/turf';
import userEvent from '@testing-library/user-event';

import { PATROL_API_STATES, PATROL_UI_STATES, PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../constants';

import { mockStore } from '../__test-helpers/MockStore';

import { MapContext } from '../MapContext';
import * as trackUtils from '../utils/tracks';
import { UPDATE_SUBJECT_TRACK_STATE } from '../ducks/map-ui';
import * as patrolUtils from '../utils/patrols';

import { UPDATE_PATROL_TRACK_STATE, updatePatrol } from '../ducks/patrols';

import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import patrols from '../__test-helpers/fixtures/patrols';
import { render, screen } from '../test-utils';
import { TRACK_LENGTH_ORIGINS } from '../ducks/tracks';

import PatrolListItem from './';

import { createMapMock } from '../__test-helpers/mocks';

jest.mock('../ducks/patrols', () => ({
  ...jest.requireActual('../ducks/patrols'),
  updatePatrol: jest.fn(),
}));

const minimumNecessaryStoreStructure = {
  view: {
    timeSliderState: {
      active: false
    },
    subjectTrackState: {
      pinned: [], visible: []
    },
    patrolTrackState: {
      pinned: [], visible: []
    },
    systemConfig: {
      [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
    },
    trackSettings: {
      length: 21,
      origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH,
    },
  },
  data: {
    eventFilter: { filter: { date_range: { lower: '2020-01-01T06:00:00.000Z' } } },
    subjectStore: {},
    tracks: {},
    patrolTypes,
    patrolStore: patrols.reduce((p, acc = {}) => ({ ...acc, [p.id]: p })),
    user: {
      permissions: {
        [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.UPDATE],
      },
    },
  }
};

let store = mockStore(minimumNecessaryStoreStructure);

const onClick = jest.fn();
const onPatrolSelfManagedStateChange = jest.fn();
const map = createMapMock({ fitBounds: jest.fn() });

jest.spyOn(trackUtils, 'fetchTracksIfNecessary').mockImplementation(() => Promise.resolve({}));

let testPatrol;

let updatePatrolMock;
beforeEach(() => {
  updatePatrolMock = jest.fn(() => () => {});
  updatePatrol.mockImplementation(updatePatrolMock);
});

const initialProps = {
  onClick,
  onPatrolSelfManagedStateChange,
  patrol: testPatrol,
  showStateTitle: true,
  showTitleDetails: true,
  showControls: true,
  map
};

const getPatrolListItemComponent = ({ onClick, onPatrolSelfManagedStateChange, patrol, map, showStateTitle, showTitleDetails, ...otherProps }, storeObject = store) => (
  <Provider store={storeObject}>
    <MapContext.Provider value={map}>
      <PatrolListItem
              onClick={onClick}
              onSelfManagedStateChange={onPatrolSelfManagedStateChange}
              patrol={patrol}
              map={map}
              showStateTitle={showStateTitle}
              showTitleDetails={showTitleDetails}
              {...otherProps} />
    </MapContext.Provider>
  </Provider>
);

const renderPatrolListItem = (props = initialProps, storeObject = store) => render(getPatrolListItemComponent(props, storeObject));

test('rendering without showing title details', () => {
  testPatrol = { ...patrols[0] };
  const stateLabel = 'Scheduled:';
  const props = { ...initialProps, patrol: testPatrol };
  const { rerender } = renderPatrolListItem(props);

  expect(screen.getByText(stateLabel)).toBeInTheDocument();

  rerender(getPatrolListItemComponent({ ...props, showTitleDetails: false }));

  expect(screen.queryByText(stateLabel)).not.toBeInTheDocument();
});

test('rendering without state label', () => {
  testPatrol = { ...patrols[0] };
  const props = { ...initialProps, patrol: testPatrol };
  const testId = `patrol-list-item-state-title-${testPatrol.id}`;
  const { rerender } = renderPatrolListItem(props);

  expect(screen.getByTestId(testId)).toBeInTheDocument();

  rerender(getPatrolListItemComponent({ ...props, showStateTitle: false }));

  expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
});

describe('the patrol list item', () => {
  const TEST_PATROL_TITLE = 'wow what a neat patrol';

  beforeEach(() => {
    testPatrol = { ...patrols[0] };
    testPatrol.title = TEST_PATROL_TITLE;

    jest.spyOn(patrolUtils, 'calcPatrolState').mockImplementation(() => PATROL_UI_STATES.ACTIVE);

    renderPatrolListItem({ ...initialProps, patrol: testPatrol });
  });

  test('showing an icon for the patrol', async () => {
    await screen.findByTestId(`patrol-list-item-icon-${testPatrol.id}`);
  });

  test('showing the patrol title', async () => {
    const title = await screen.findByTestId(`patrol-list-item-title-${testPatrol.id}`);

    expect(title).toHaveTextContent(TEST_PATROL_TITLE);
  });

  test('showing the patrol\'s current state', async () => {
    const state = await screen.findByTestId(`patrol-list-item-state-title-${testPatrol.id}`);

    expect(state).toHaveTextContent(PATROL_UI_STATES.ACTIVE.title);
  });

  test('showing a kebab menu for additional actions', async () => {
    await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
  });

  test('hides menu on outside click to prevent menu overlapping', async () => {
    const kebabMenu = screen.getByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
    const kebabButton = kebabMenu.querySelector('button');

    expect(kebabButton).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(kebabButton);
    expect(kebabButton).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(document.body);

    expect(kebabButton).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('for active patrols', () => {
  const patrolWithLeader = { ...patrols[1] };
  const mockStartDate = new Date('2021-10-09');

  beforeEach(() => {
    testPatrol = { ...patrolWithLeader };
    testPatrol.patrol_segments[0].time_range.start_time = mockStartDate.toISOString();

    jest.spyOn(patrolUtils, 'patrolHasGeoDataToDisplay').mockImplementation(() => true);
    jest.spyOn(patrolUtils, 'getBoundsForPatrol').mockImplementation(() => {
      var line = lineString([[-74, 40], [-78, 42], [-82, 35]]); /* some random valid line to create bounding box around */
      var boundingBox = bbox(line);

      return boundingBox;
    });
    jest.spyOn(patrolUtils, 'calcPatrolState').mockImplementation(() => PATROL_UI_STATES.ACTIVE);

    renderPatrolListItem({ ...initialProps, patrol: testPatrol });
  });

  test('showing a location jump button if the patrol has any location data', async () => {
    await screen.findByTestId(`patrol-list-item-jump-btn-${testPatrol.id}`);
  });

  test('toggling a patrol track on when clicking the "jump to location button"', async () => {
    const jumpButton = await screen.findByTestId(`patrol-list-item-jump-btn-${testPatrol.id}`);
    await userEvent.click(jumpButton);

    const actions = store.getActions();

    const actionMatch = actions.find(action => action.type === UPDATE_PATROL_TRACK_STATE);

    expect(actionMatch).toBeDefined();
    expect(actionMatch.payload).toEqual({ visible: [testPatrol.id] });
  });

  test('toggling a patrol leader\'s track on when clicking the "jump to location button"', async () => {
    const jumpButton = await screen.findByTestId(`patrol-list-item-jump-btn-${testPatrol.id}`);
    await userEvent.click(jumpButton);

    const actions = store.getActions();

    const actionMatch = actions.find(action => action.type === UPDATE_SUBJECT_TRACK_STATE);

    expect(actionMatch).toBeDefined();
    expect(actionMatch.payload).toEqual({ visible: [testPatrol.patrol_segments[0].leader.id] });
  });

  test('showing a track button if the patrol has track data', async () => {
    await screen.findByTestId(`patrol-list-item-track-btn-${testPatrol.id}`);
  });

  test('showing the distance the patrol has covered', async () => {
    expect(await screen.findByText('0km')).toBeInTheDocument();
  });

  test('canceling the patrol from the kebab menu', async () => {
    const kebabMenu = await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
    const kebabButton = kebabMenu.querySelector('button');
    await userEvent.click(kebabButton);

    expect(updatePatrol).toHaveBeenCalledTimes(0);

    const cancelBtn = await screen.findByText('Cancel Patrol');
    await userEvent.click(cancelBtn);

    expect(updatePatrol).toHaveBeenCalledTimes(1);
    expect(updatePatrol.mock.calls[0][0].state).toBe(PATROL_API_STATES.CANCELLED);
  });

  test('ending a patrol from the kebab menu', async () => {
    const kebabMenu = await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
    const kebabButton = kebabMenu.querySelector('button');
    await userEvent.click(kebabButton);

    expect(updatePatrol).toHaveBeenCalledTimes(0);

    const endBtn = await screen.findByText('End Patrol');
    await userEvent.click(endBtn);

    expect(updatePatrol).toHaveBeenCalledTimes(1);
    expect(updatePatrol.mock.calls[0][0].state).toBe(PATROL_API_STATES.DONE);
  });
});

describe('for scheduled patrols', () => {
  const mockStartDate = new Date('10-10-2021 11:00');

  beforeEach(() => {
    testPatrol = { ...patrols[0] };
    testPatrol.patrol_segments[0].time_range.scheduled_start = mockStartDate.toISOString();

    jest.spyOn(patrolUtils, 'calcPatrolState').mockImplementation(() => PATROL_UI_STATES.READY_TO_START);

    renderPatrolListItem({ ...initialProps, patrol: testPatrol });
  });

  test('showing a "start" button which starts the patrol', async () => {
    expect(updatePatrol).toHaveBeenCalledTimes(0);

    const startBtn = await screen.findByTestId(`patrol-list-item-start-btn-${testPatrol.id}`);
    await userEvent.click(startBtn);

    expect(updatePatrol).toHaveBeenCalledTimes(1);
    expect(updatePatrol.mock.calls[0][0].state).toBe(PATROL_API_STATES.OPEN);
  });

  test('canceling the patrol from the kebab menu', async () => {
    const kebabMenu = await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
    const kebabButton = kebabMenu.querySelector('button');
    await userEvent.click(kebabButton);

    expect(updatePatrol).toHaveBeenCalledTimes(0);

    const cancelBtn = await screen.findByText('Cancel Patrol');
    await userEvent.click(cancelBtn);

    expect(updatePatrol).toHaveBeenCalledTimes(1);
    expect(updatePatrol.mock.calls[0][0].state).toBe(PATROL_API_STATES.CANCELLED);
  });
});

describe('for overdue patrols', () => {
  const mockStartDate = new Date('10-10-2021 01:00');

  beforeEach(() => {
    testPatrol = { ...patrols[0] };
    testPatrol.patrol_segments[0].time_range.scheduled_start = mockStartDate.toISOString();

    jest.spyOn(patrolUtils, 'calcPatrolState').mockImplementation(() => PATROL_UI_STATES.START_OVERDUE);

    renderPatrolListItem({ ...initialProps, patrol: testPatrol });
  });

  test('showing an overdue indicator', async () => {
    const stateIndicator = await screen.findByTestId(`patrol-list-item-state-title-${testPatrol.id}`);

    expect(stateIndicator).toHaveTextContent(PATROL_UI_STATES.START_OVERDUE.title);
  });
});

describe('for cancelled patrols', () => {
  beforeEach(() => {
    testPatrol = { ...patrols[0] };
    testPatrol.state = PATROL_API_STATES.CANCELLED;

    jest.spyOn(patrolUtils, 'calcPatrolState').mockImplementation(() => PATROL_UI_STATES.CANCELLED);

    renderPatrolListItem({ ...initialProps, patrol: testPatrol });
  });

  test('showing a button to restore the patrol', async () => {
    expect(updatePatrol).toHaveBeenCalledTimes(0);

    const restoreBtn = await screen.findByTestId(`patrol-list-item-restore-btn-${testPatrol.id}`);
    await userEvent.click(restoreBtn);

    expect(updatePatrol).toHaveBeenCalledTimes(1);
    expect(updatePatrol.mock.calls[0][0].state).toBe(PATROL_API_STATES.OPEN);
    expect(updatePatrol.mock.calls[0][0].patrol_segments[0].time_range.end_time).toBeNull();
  });

  test('restoring the patrol from the kebab menu', async () => {
    const kebabMenu = await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
    const kebabButton = kebabMenu.querySelector('button');
    await userEvent.click(kebabButton);

    expect(updatePatrol).toHaveBeenCalledTimes(0);

    const restoreBtn = await screen.findByText('Restore Patrol');
    await userEvent.click(restoreBtn);

    expect(updatePatrol).toHaveBeenCalledTimes(1);
    expect(updatePatrol.mock.calls[0][0].state).toBe(PATROL_API_STATES.OPEN);
    expect(updatePatrol.mock.calls[0][0].patrol_segments[0].time_range.end_time).toBeNull();
  });
});

describe('for completed patrols', () => {
  beforeEach(() => {
    testPatrol = { ...patrols[0] };
    testPatrol.state = PATROL_API_STATES.CANCELLED;

    jest.spyOn(patrolUtils, 'calcPatrolState').mockImplementation(() => PATROL_UI_STATES.CANCELLED);

    renderPatrolListItem({ ...initialProps, patrol: testPatrol });
  });

  test('restoring the patrol from the kebab menu', async () => {
    const kebabMenu = await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
    const kebabButton = kebabMenu.querySelector('button');
    await userEvent.click(kebabButton);

    expect(updatePatrol).toHaveBeenCalledTimes(0);

    const restoreBtn = await screen.findByText('Restore Patrol');
    await userEvent.click(restoreBtn);

    expect(updatePatrol).toHaveBeenCalledTimes(1);
    expect(updatePatrol.mock.calls[0][0].state).toBe(PATROL_API_STATES.OPEN);
    expect(updatePatrol.mock.calls[0][0].patrol_segments[0].time_range.end_time).toBeNull();
  });
});

import React from 'react';
import { Provider } from 'react-redux';
import bbox from '@turf/bbox';
import { lineString } from '@turf/helpers';
import userEvent from '@testing-library/user-event';
import { within } from '@testing-library/dom';

import { PATROL_API_STATES, PATROL_UI_STATES } from '../constants';

import { mockStore } from '../__test-helpers/MockStore';

import { MapContext } from '../App';
import * as trackUtils from '../utils/tracks';
import { UPDATE_SUBJECT_TRACK_STATE } from '../ducks/map-ui';
import * as patrolUtils from '../utils/patrols';
import * as customHooks from '../hooks';

import { UPDATE_PATROL_TRACK_STATE, updatePatrol } from '../ducks/patrols';

import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import patrols from '../__test-helpers/fixtures/patrols';
import { render, screen } from '../test-utils';

import PatrolListItem from './';

import { createMapMock } from '../__test-helpers/mocks';

import colorVariables from '../common/styles/vars/colors.module.scss';

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
    }
  },
  data: {
    subjectStore: {},
    tracks: {},
    patrolTypes,
    patrolStore: patrols.reduce((p, acc = {}) => ({ ...acc, [p.id]: p }))
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

  jest.spyOn(customHooks, 'usePermissions').mockImplementation(() => true); // full permissions for list item read+write access
  jest.useFakeTimers('modern');
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
    const toggleClass = 'show';
    const patrolListItem = screen.getByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
    const [, , kebabMenu] = screen.getAllByRole('button');

    expect(patrolListItem.classList.contains(toggleClass)).toBeFalsy();
    await userEvent.click(kebabMenu);
    expect(patrolListItem.classList.contains(toggleClass)).toBeTruthy();

    await userEvent.click(document.body);

    expect(patrolListItem.classList.contains(toggleClass)).toBeFalsy();
  });
});

describe('for active patrols', () => {
  const patrolWithLeader = { ...patrols[1] };
  const mockStartDate = new Date('2021-10-09');
  const mockCurrentDate = new Date('2021-10-10');

  beforeEach(() => {
    testPatrol = { ...patrolWithLeader };
    testPatrol.patrol_segments[0].time_range.start_time = mockStartDate.toISOString();

    jest.useFakeTimers('modern');
    jest.setSystemTime(mockCurrentDate.getTime());

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

  test('showing a track button if the patrol has track data', async () => {
    await screen.findByTestId(`patrol-list-item-track-btn-${testPatrol.id}`);
  });

  test('canceling the patrol from the kebab menu', async () => {
    const kebabMenu = await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
    const kebabButton = kebabMenu.querySelector('.dropdown-toggle');
    userEvent.click(kebabButton);

    expect(updatePatrol).toHaveBeenCalledTimes(0);

    const cancelBtn = await within(kebabMenu).findByText('Cancel Patrol');
    userEvent.click(cancelBtn);

    expect(updatePatrol).toHaveBeenCalledTimes(1);
    expect(updatePatrol.mock.calls[0][0].state).toBe(PATROL_API_STATES.CANCELLED);
  });

  test('ending a patrol from the kebab menu', async () => {
    const kebabMenu = await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
    const kebabButton = kebabMenu.querySelector('.dropdown-toggle');
    userEvent.click(kebabButton);

    expect(updatePatrol).toHaveBeenCalledTimes(0);

    const endBtn = await within(kebabMenu).findByText('End Patrol');
    userEvent.click(endBtn);

    expect(updatePatrol).toHaveBeenCalledTimes(1);
    expect(updatePatrol.mock.calls[0][0].state).toBe(PATROL_API_STATES.DONE);
    expect(updatePatrol.mock.calls[0][0].patrol_segments[0].time_range.end_time).toBe(mockCurrentDate.toISOString());
  });

  test('theming', async () => {
    const iconContainer = await screen.findByRole('img');

    expect(iconContainer).toHaveStyle(`background-color: ${colorVariables.patrolActiveThemeColor}`);
  });

});

describe('for scheduled patrols', () => {
  const mockStartDate = new Date('10-10-2021 11:00');
  const mockCurrentDate = new Date('10-10-2021 9:00');

  beforeEach(() => {
    testPatrol = { ...patrols[0] };
    testPatrol.patrol_segments[0].time_range.scheduled_start = mockStartDate.toISOString();

    jest.setSystemTime(mockCurrentDate.getTime());

    jest.spyOn(patrolUtils, 'calcPatrolState').mockImplementation(() => PATROL_UI_STATES.READY_TO_START);

    renderPatrolListItem({ ...initialProps, patrol: testPatrol });
  });

  test('showing a "start" button which starts the patrol', async () => {
    expect(updatePatrol).toHaveBeenCalledTimes(0);

    const startBtn = await screen.findByTestId(`patrol-list-item-start-btn-${testPatrol.id}`);
    userEvent.click(startBtn);

    expect(updatePatrol).toHaveBeenCalledTimes(1);
    expect(updatePatrol.mock.calls[0][0].state).toBe(PATROL_API_STATES.OPEN);
    expect(updatePatrol.mock.calls[0][0].patrol_segments[0].time_range.end_time).toBeNull();
    expect(updatePatrol.mock.calls[0][0].patrol_segments[0].time_range.start_time).toBe(mockCurrentDate.toISOString());
  });

  test('canceling the patrol from the kebab menu', async () => {
    const kebabMenu = await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
    const kebabButton = kebabMenu.querySelector('.dropdown-toggle');
    userEvent.click(kebabButton);

    expect(updatePatrol).toHaveBeenCalledTimes(0);

    const cancelBtn = await within(kebabMenu).findByText('Cancel Patrol');
    userEvent.click(cancelBtn);

    expect(updatePatrol).toHaveBeenCalledTimes(1);
    expect(updatePatrol.mock.calls[0][0].state).toBe(PATROL_API_STATES.CANCELLED);
  });

  test('theming', async () => {
    const iconContainer = await screen.findByRole('img');

    expect(iconContainer).toHaveStyle(`background-color: ${colorVariables.patrolReadyThemeColor}`);
  });

});

describe('for overdue patrols', () => {
  const mockStartDate = new Date('10-10-2021 01:00');
  const mockCurrentDate = new Date('10-10-2021 13:00');

  beforeEach(() => {
    testPatrol = { ...patrols[0] };
    testPatrol.patrol_segments[0].time_range.scheduled_start = mockStartDate.toISOString();

    jest.setSystemTime(mockCurrentDate.getTime());

    jest.spyOn(patrolUtils, 'calcPatrolState').mockImplementation(() => PATROL_UI_STATES.START_OVERDUE);

    renderPatrolListItem({ ...initialProps, patrol: testPatrol });
  });

  test('showing an overdue indicator', async () => {
    const stateIndicator = await screen.findByTestId(`patrol-list-item-state-title-${testPatrol.id}`);

    expect(stateIndicator).toHaveTextContent(PATROL_UI_STATES.START_OVERDUE.title);
  });

  test('theming', async () => {
    const iconContainer = await screen.findByRole('img');

    expect(iconContainer).toHaveStyle(`background-color: ${colorVariables.patrolOverdueThemeColor}`);
  });

});

describe('for cancelled patrols', () => {
  const mockCurrentDate = new Date('10-10-2021 13:00');

  beforeEach(() => {
    testPatrol = { ...patrols[0] };
    testPatrol.state = PATROL_API_STATES.CANCELLED;

    jest.setSystemTime(mockCurrentDate.getTime());

    jest.spyOn(patrolUtils, 'calcPatrolState').mockImplementation(() => PATROL_UI_STATES.CANCELLED);

    renderPatrolListItem({ ...initialProps, patrol: testPatrol });
  });

  test('showing a button to restore the patrol', async () => {
    expect(updatePatrol).toHaveBeenCalledTimes(0);

    const restoreBtn = await screen.findByTestId(`patrol-list-item-restore-btn-${testPatrol.id}`);
    userEvent.click(restoreBtn);

    expect(updatePatrol).toHaveBeenCalledTimes(1);
    expect(updatePatrol.mock.calls[0][0].state).toBe(PATROL_API_STATES.OPEN);
    expect(updatePatrol.mock.calls[0][0].patrol_segments[0].time_range.end_time).toBeNull();
  });

  test('restoring the patrol from the kebab menu', async () => {
    const kebabMenu = await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
    const kebabButton = kebabMenu.querySelector('.dropdown-toggle');
    userEvent.click(kebabButton);

    expect(updatePatrol).toHaveBeenCalledTimes(0);

    const restoreBtn = await within(kebabMenu).findByText('Restore Patrol');
    userEvent.click(restoreBtn);

    expect(updatePatrol).toHaveBeenCalledTimes(1);
    expect(updatePatrol.mock.calls[0][0].state).toBe(PATROL_API_STATES.OPEN);
    expect(updatePatrol.mock.calls[0][0].patrol_segments[0].time_range.end_time).toBeNull();
  });

  test('theming', async () => {
    const iconContainer = await screen.findByRole('img');

    expect(iconContainer).toHaveStyle(`background-color: ${colorVariables.patrolCancelledThemeColor}`);
  });
});

describe('for completed patrols', () => {
  const mockCurrentDate = new Date('10-10-2021 13:00');

  beforeEach(() => {
    testPatrol = { ...patrols[0] };
    testPatrol.state = PATROL_API_STATES.CANCELLED;

    jest.setSystemTime(mockCurrentDate.getTime());

    jest.spyOn(patrolUtils, 'calcPatrolState').mockImplementation(() => PATROL_UI_STATES.CANCELLED);

    renderPatrolListItem({ ...initialProps, patrol: testPatrol });
  });

  test('restoring the patrol from the kebab menu', async () => {
    const kebabMenu = await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
    const kebabButton = kebabMenu.querySelector('.dropdown-toggle');
    userEvent.click(kebabButton);

    expect(updatePatrol).toHaveBeenCalledTimes(0);

    const restoreBtn = await within(kebabMenu).findByText('Restore Patrol');
    userEvent.click(restoreBtn);

    expect(updatePatrol).toHaveBeenCalledTimes(1);
    expect(updatePatrol.mock.calls[0][0].state).toBe(PATROL_API_STATES.OPEN);
    expect(updatePatrol.mock.calls[0][0].patrol_segments[0].time_range.end_time).toBeNull();
  });

  test('theming', async () => {
    const iconContainer = await screen.findByRole('img');

    expect(iconContainer).toHaveStyle(`background-color: ${colorVariables.patrolDoneThemeColor}`);
  });
});

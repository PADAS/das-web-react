import React from 'react';
import { Provider } from 'react-redux';
import bbox from '@turf/bbox';
import { lineString } from '@turf/helpers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { within } from '@testing-library/dom';

import { PATROL_API_STATES, PATROL_UI_STATES } from '../constants';

import { mockStore } from '../__test-helpers/MockStore';

import * as trackUtils from '../utils/tracks';
import { UPDATE_SUBJECT_TRACK_STATE } from '../ducks/map-ui';
import * as patrolUtils from '../utils/patrols';
import * as customHooks from '../hooks';

import { UPDATE_PATROL_TRACK_STATE } from '../ducks/patrols';
import * as trackDucks from '../ducks/tracks';

import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import patrols from '../__test-helpers/fixtures/patrols';

import PatrolListItem from './';

import { createMapMock } from '../__test-helpers/mocks';

import colorVariables from '../common/styles/vars/colors.module.scss';

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

const onTitleClick = jest.fn();
const onPatrolChange = jest.fn();
const onPatrolSelfManagedStateChange = jest.fn();
const map = createMapMock({ fitBounds: jest.fn() });

jest.spyOn(trackUtils, 'fetchTracksIfNecessary').mockImplementation(() => Promise.resolve({}));

let testPatrol;

beforeEach(() => {
  jest.spyOn(customHooks, 'usePermissions').mockImplementation(() => true); // full permissions for list item read+write access
  jest.useFakeTimers('modern');
});

test('rendering without crashing', () => {
  testPatrol = { ...patrols[0] };

  render(<Provider store={store}>
    <PatrolListItem onTitleClick={onTitleClick}
      onPatrolChange={onPatrolChange}
      onSelfManagedStateChange={onPatrolSelfManagedStateChange}
      patrol={testPatrol}
      map={map} />
  </Provider>);
});

describe('the patrol list item', () => {
  const TEST_PATROL_TITLE = 'wow what a neat patrol';

  beforeEach(() => {
    testPatrol = { ...patrols[0] };
    testPatrol.title = TEST_PATROL_TITLE;

    jest.spyOn(patrolUtils, 'calcPatrolState').mockImplementation(() => {
      return PATROL_UI_STATES.ACTIVE;
    });


    render(<Provider store={store}>
      <PatrolListItem onTitleClick={onTitleClick}
        onPatrolChange={onPatrolChange}
        onSelfManagedStateChange={onPatrolSelfManagedStateChange}
        patrol={testPatrol}
        map={map} />
    </Provider>);
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

    jest.spyOn(patrolUtils, 'patrolHasGeoDataToDisplay').mockImplementation(() => {
      return true;
    });
    jest.spyOn(patrolUtils, 'getBoundsForPatrol').mockImplementation(() => {
      var line = lineString([[-74, 40], [-78, 42], [-82, 35]]); /* some random valid line to create bounding box around */
      var boundingBox = bbox(line);
      return boundingBox;
    });
    jest.spyOn(patrolUtils, 'calcPatrolState').mockImplementation(() => {
      return PATROL_UI_STATES.ACTIVE;
    });

    render(<Provider store={store}>
      <PatrolListItem onTitleClick={onTitleClick}
        onPatrolChange={onPatrolChange}
        onSelfManagedStateChange={onPatrolSelfManagedStateChange}
        patrol={testPatrol}
        map={map} />
    </Provider>);
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

    const cancelBtn = await within(kebabMenu).findByText('Cancel Patrol');
    userEvent.click(cancelBtn);
    expect(onPatrolChange).toHaveBeenCalledWith({ state: PATROL_API_STATES.CANCELLED });
  });

  test('ending a patrol from the kebab menu', async () => {
    const kebabMenu = await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
    const kebabButton = kebabMenu.querySelector('.dropdown-toggle');
    userEvent.click(kebabButton);

    const endBtn = await within(kebabMenu).findByText('End Patrol');

    userEvent.click(endBtn);

    expect(onPatrolChange).toHaveBeenCalledWith(expect.objectContaining({
      state: PATROL_API_STATES.DONE,
      patrol_segments: [
        { time_range: {
          end_time: mockCurrentDate.toISOString(),
        } }
      ]
    }));
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

    jest.spyOn(patrolUtils, 'calcPatrolState').mockImplementation(() => {
      return PATROL_UI_STATES.READY_TO_START;
    });

    render(<Provider store={store}>
      <PatrolListItem onTitleClick={onTitleClick}
        onPatrolChange={onPatrolChange}
        onSelfManagedStateChange={onPatrolSelfManagedStateChange}
        patrol={testPatrol}
        map={map} />
    </Provider>);
  });
  test('showing a "start" button which starts the patrol', async () => {
    const startBtn = await screen.findByTestId(`patrol-list-item-start-btn-${testPatrol.id}`);
    userEvent.click(startBtn);
    expect(onPatrolChange).toHaveBeenCalledWith(expect.objectContaining({
      state: PATROL_API_STATES.OPEN,
      patrol_segments: [
        { time_range: {
          end_time: null,
          start_time: mockCurrentDate.toISOString(),
        } }
      ]
    }));
  });

  test('canceling the patrol from the kebab menu', async () => {
    const kebabMenu = await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
    const kebabButton = kebabMenu.querySelector('.dropdown-toggle');
    userEvent.click(kebabButton);

    const cancelBtn = await within(kebabMenu).findByText('Cancel Patrol');

    userEvent.click(cancelBtn);

    expect(onPatrolChange).toHaveBeenCalledWith(expect.objectContaining({
      state: PATROL_API_STATES.CANCELLED,
    }));
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

    jest.spyOn(patrolUtils, 'calcPatrolState').mockImplementation(() => {
      return PATROL_UI_STATES.START_OVERDUE;
    });

    render(<Provider store={store}>
      <PatrolListItem onTitleClick={onTitleClick}
        onPatrolChange={onPatrolChange}
        onSelfManagedStateChange={onPatrolSelfManagedStateChange}
        patrol={testPatrol}
        map={map} />
    </Provider>);
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

    jest.spyOn(patrolUtils, 'calcPatrolState').mockImplementation(() => {
      return PATROL_UI_STATES.CANCELLED;
    });

    render(<Provider store={store}>
      <PatrolListItem onTitleClick={onTitleClick}
        onPatrolChange={onPatrolChange}
        onSelfManagedStateChange={onPatrolSelfManagedStateChange}
        patrol={testPatrol}
        map={map} />
    </Provider>);
  });

  test('showing a button to restore the patrol', async () => {
    const restoreBtn = await screen.findByTestId(`patrol-list-item-restore-btn-${testPatrol.id}`);

    userEvent.click(restoreBtn);
    expect(onPatrolChange).toHaveBeenCalledWith(expect.objectContaining({
      state: 'open',
      patrol_segments: [
        {
          time_range: {
            end_time: null,
          },
        },
      ],
    }));
  });

  test('restoring the patrol from the kebab menu', async () => {
    const kebabMenu = await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
    const kebabButton = kebabMenu.querySelector('.dropdown-toggle');
    userEvent.click(kebabButton);

    const restoreBtn = await within(kebabMenu).findByText('Restore Patrol');

    userEvent.click(restoreBtn);

    expect(onPatrolChange).toHaveBeenCalledWith(expect.objectContaining({
      state: 'open',
      patrol_segments: [
        {
          time_range: {
            end_time: null,
          },
        },
      ],
    }));
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

    jest.spyOn(patrolUtils, 'calcPatrolState').mockImplementation(() => {
      return PATROL_UI_STATES.CANCELLED;
    });

    render(<Provider store={store}>
      <PatrolListItem onTitleClick={onTitleClick}
        onPatrolChange={onPatrolChange}
        onSelfManagedStateChange={onPatrolSelfManagedStateChange}
        patrol={testPatrol}
        map={map} />
    </Provider>);
  });

  test('restoring the patrol from the kebab menu', async () => {
    const kebabMenu = await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
    const kebabButton = kebabMenu.querySelector('.dropdown-toggle');
    userEvent.click(kebabButton);

    const restoreBtn = await within(kebabMenu).findByText('Restore Patrol');

    userEvent.click(restoreBtn);

    expect(onPatrolChange).toHaveBeenCalledWith(expect.objectContaining({
      state: 'open',
      patrol_segments: [
        {
          time_range: {
            end_time: null,
          },
        },
      ],
    }));
  });

  test('theming', async () => {
    const iconContainer = await screen.findByRole('img');
    expect(iconContainer).toHaveStyle(`background-color: ${colorVariables.patrolDoneThemeColor}`);
  });

});

import React from 'react';
import { Provider } from 'react-redux';
import bbox from '@turf/bbox';
import { lineString } from '@turf/helpers';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { within } from '@testing-library/dom';

import { PATROL_STATES } from '../constants';

import { mockStore } from '../__test-helpers/MockStore';

import * as trackUtils from '../utils/tracks';

import * as patrolUtils from '../utils/patrols';
import * as patrolSelectors from '../selectors/patrols';
import * as customHooks from '../hooks';

import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import patrols from '../__test-helpers/fixtures/patrols';


import PatrolListItem from './';

import { createMapMock } from '../__test-helpers/mocks';

let store = mockStore({ view: { timeSliderState: { active: false }, subjectTrackState: { pinned: [], visible: [] }, patrolTrackState: { pinned: [], visible: [] } }, data: { subjectStore: {}, tracks: {}, patrolTypes, patrolStore: patrols.reduce((p, acc = {}) => ({ ...acc, [p.id]: p })) } });

const onTitleClick = jest.fn();
const onPatrolChange = jest.fn();
const onPatrolSelfManagedStateChange = jest.fn();
const map = createMapMock();

jest.spyOn(trackUtils, 'fetchTracksIfNecessary').mockImplementation(() => Promise.resolve({}));

let testPatrol;

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

  test('showing a kebab menu for additional actions', async () => {
    await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
  });
});

describe('for active patrols', () => {
  const patrolWithLeader = patrols[1];

  beforeEach(() => {
    testPatrol = { ...patrolWithLeader };

    jest.spyOn(patrolUtils, 'patrolHasGeoDataToDisplay').mockImplementation(() => {
      return true;
    });
    jest.spyOn(patrolUtils, 'getBoundsForPatrol').mockImplementation(() => {
      var line = lineString([[-74, 40], [-78, 42], [-82, 35]]); /* some random valid line to create bounding box around */
      var boundingBox = bbox(line);
      return boundingBox;
    });
    jest.spyOn(patrolUtils, 'calcPatrolState').mockImplementation(() => {
      return PATROL_STATES.ACTIVE;
    });

    jest.spyOn(customHooks, 'usePermissions').mockImplementation(() => true);

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

  test('showing a track button if the patrol has track data', async () => {
    await screen.findByTestId(`patrol-list-item-track-btn-${testPatrol.id}`);
  });

  test('canceling the patrol from the kebab menu', async () => {
    const kebabMenu = await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
    const kebabButton = kebabMenu.querySelector('.dropdown-toggle');
    userEvent.click(kebabButton);

    const cancelBtn = await within(kebabMenu).findByText('Cancel Patrol');
    userEvent.click(cancelBtn);
    expect(onPatrolChange).toHaveBeenCalledWith({ state: 'cancelled' });
  });

  test('ending a patrol from the kebab menu', () => {

  });

});

describe('for scheduled patrols', () => {
  test('showing a "start" button which starts the patrol', () => {

  });

  test('canceling the patrol from the kebab menu', () => {

  });

});

describe('for overdue patrols', () => {
  test('showing an overdue indicator', () => {

  });
});

describe('for cancelled patrols', () => {
  test('showing a button to restore the patrol', () => {

  });
});

describe('for completed patrols', () => {
  // what goes here?
});

describe('using color to indicate state', () => {
  test('blue backgrounds for active patrols', () => {

  });

  test('green backgrounds for scheduled patrols', () => {

  });

  test('gray backgrounds for completed patrols', () => {

  });

  test('light gray backgrounds for cancelled patrols', () => {

  });

  test('red backgrounds for overdue patrols', () => {

  });

});
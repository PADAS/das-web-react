import React from 'react';
import { Provider } from 'react-redux';
import { mockStore } from '../__test-helpers/MockStore';

import patrolTypes from '../__test-helpers/fixtures/patrol-types';
import patrols from '../__test-helpers/fixtures/patrols';

import PatrolListItem from './';

import { createMapMock } from '../__test-helpers/mocks';

import { render, screen } from '@testing-library/react';

let store = mockStore({ view: { timeSliderState: { active: false } }, data: { tracks: {}, patrolTypes, patrolStore: patrols.reduce((p, acc = {}) => ({ ...acc, [p.id]: p })) } });

const onTitleClick = jest.fn();
const onPatrolChange = jest.fn();
const onPatrolSelfManagedStateChange = jest.fn();
const map = createMapMock();

const testPatrol = { ...patrols[0] };

test('rendering without crashing', () => {
  render(<Provider store={store}>
    <PatrolListItem onTitleClick={onTitleClick}
      onPatrolChange={onPatrolChange}
      onSelfManagedStateChange={onPatrolSelfManagedStateChange}
      patrol={testPatrol}
      map={map} />
  </Provider>);
});

describe('the patrol list item', () => {
  beforeEach(() => {
    render(<Provider store={store}>
      <PatrolListItem onTitleClick={onTitleClick}
        onPatrolChange={onPatrolChange}
        onSelfManagedStateChange={onPatrolSelfManagedStateChange}
        patrol={testPatrol}
        map={map} />
    </Provider>);
  });
  test('showing an icon for the patrol type', async () => {
    await screen.findByTestId(`patrol-list-item-icon-${testPatrol.id}`);
  });

  test('showing the patrol title', async () => {
    await screen.findByTestId(`patrol-list-item-title-${testPatrol.id}`);
  });

  test('showing a kebab menu for additional actions', async () => {
    await screen.findByTestId(`patrol-list-item-kebab-menu-${testPatrol.id}`);
  });

  describe('for active patrols', () => {
    test('showing a location jump button if the patrol has location data', () => {

    });

    test('showing a track button if the patrol has track data', () => {

    });

    test('canceling the patrol from the kebab menu', () => {

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
});


import React from 'react';
import { Provider } from 'react-redux';

import { mockStore } from '../../../../__test-helpers/MockStore';
import { PATROL_UI_STATES, SYSTEM_CONFIG_FLAGS } from '../../../../constants';
import patrolTypes from '../../../../__test-helpers/fixtures/patrol-types';
import { multiLegPatrol } from '../../../../__test-helpers/fixtures/patrols';
import { render, screen } from '../../../../test-utils';
import { TRACK_LENGTH_ORIGINS } from '../../../../ducks/tracks';

import Overview from './';

describe('SideBar - PatrolsManager - PatrolOverview - Overview', () => {
  const onCancelNote = jest.fn();
  const onChangeNote = jest.fn();
  const onDeleteAttachment = jest.fn();
  const onDeleteNote = jest.fn();
  const onDoneNote = jest.fn();

  const patrolWithLeader = multiLegPatrol;

  let store;
  beforeEach(() => {
    store = {
      data: {
        eventFilter: { filter: { date_range: { lower: '2020-01-01T06:00:00.000Z' } } },
        patrolTypes,
        tracks: {},
      },
      view: {
        systemConfig: {
          [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
        },
        timeSliderState: {},
        trackSettings: { length: 21, origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH },
      },
    };
  });

  const renderOverview = (props) => render(
    <Provider store={mockStore(store)}>
      <Overview
        newAttachments={[]}
        newNotes={[]}
        onCancelNote={onCancelNote}
        onChangeNote={onChangeNote}
        onDeleteAttachment={onDeleteAttachment}
        onDeleteNote={onDeleteNote}
        onDoneNote={onDoneNote}
        patrol={patrolWithLeader}
        patrolState={PATROL_UI_STATES.ACTIVE}
        {...props}
      />
    </Provider>
  );

  test('shows the legs', () => {
    renderOverview();

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(patrolWithLeader.patrol_segments.length + 1);
  });

  test('shows the activity', () => {
    renderOverview();

    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument();
  });
});

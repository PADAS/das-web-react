import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../__test-helpers/MockStore';
import { render, screen } from '../test-utils';
import { TRACK_LENGTH_ORIGINS } from '../ducks/tracks';
import { UPDATE_PATROL_TRACK_STATE } from '../ducks/patrols';

import PatrolTrackLegend from '.';

jest.mock('../SvgIcon', () => {
  const SvgIcon = ({ title }) => <span>{title}</span>;

  return SvgIcon;
});

describe('PatrolTrackLegend', () => {
  const LEAD = { id: 'subjectLead', image_url: '/static/ranger.svg', name: 'Maya Chen' };

  const patrol = {
    id: 'patrol123',
    patrol_segments: [{
      leader: LEAD,
      time_range: { end_time: '2020-01-05T00:00:00.000Z', start_time: '2020-01-01T00:00:00.000Z' },
    }],
    state: 'done',
    title: 'Northern sweep',
  };

  let reduxStore, store;
  beforeAll(() => {
    jest.useFakeTimers({ advanceTimers: true }).setSystemTime(new Date('2020-01-06'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    store = {
      data: {
        eventFilter: { filter: { date_range: { lower: '2020-01-01T06:00:00.000Z' } } },
        patrolStore: { [patrol.id]: patrol },
        patrolTeamAndTrackingOptions: { assets: [], leaders: [LEAD], members: [], teams: [] },
        subjectStore: {},
        tracks: {
          [LEAD.id]: {
            fetchedDateRange: { since: '2020-01-01T00:00:00.000Z' },
            points: { features: [], type: 'FeatureCollection' },
            track: {
              features: [{
                geometry: { coordinates: [[1, 0], [0, 0]], type: 'LineString' },
                properties: {
                  coordinateProperties: {
                    times: ['2020-01-05T00:00:00.000Z', '2020-01-01T00:00:00.000Z'],
                  },
                },
                type: 'Feature',
              }],
              type: 'FeatureCollection',
            },
          },
        },
      },
      view: {
        patrolTrackState: { hiddenSubjects: { [patrol.id]: [LEAD.id] }, pinned: [], visible: [patrol.id] },
        timeSliderState: { active: false, virtualDate: null },
        trackSettings: {
          isTimeOfDayColoringActive: false,
          length: 21,
          origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH,
          timeOfDayTimeZone: null,
        },
      },
    };
  });

  const renderPatrolTrackLegend = () => {
    reduxStore = mockStore(store);

    return render(<Provider store={reduxStore}><PatrolTrackLegend /></Provider>);
  };

  const lastTrackStateAction = () => reduxStore.getActions()
    .filter((action) => action.type === UPDATE_PATROL_TRACK_STATE)
    .at(-1);

  test('lists the patrols with a track on the map', () => {
    renderPatrolTrackLegend();

    expect(screen.getByText('Patrol: Northern sweep')).toBeVisible();
  });

  test('lists the subjects a patrol track is made up of', async () => {
    renderPatrolTrackLegend();

    await userEvent.click(screen.getByLabelText('Open the list of patrols'));

    expect(screen.getByText(LEAD.name)).toBeVisible();
  });

  test('forgets the subjects the user hid on the patrol whose track is cleared', async () => {
    const otherPatrol = { ...patrol, id: 'patrol456', title: 'Southern sweep' };
    store.data.patrolStore[otherPatrol.id] = otherPatrol;
    store.view.patrolTrackState = {
      hiddenSubjects: { [otherPatrol.id]: [LEAD.id], [patrol.id]: [LEAD.id] },
      pinned: [],
      visible: [patrol.id, otherPatrol.id],
    };
    renderPatrolTrackLegend();

    await userEvent.click(screen.getByLabelText('Open the list of patrols'));
    await userEvent.click(screen.getByLabelText('Clear the tracks of Patrol: Northern sweep'));

    expect(lastTrackStateAction().payload).toEqual({
      hiddenSubjects: { [otherPatrol.id]: [LEAD.id] },
      pinned: [],
      visible: [otherPatrol.id],
    });
  });

  test('forgets every hidden subject when every patrol track is cleared', async () => {
    renderPatrolTrackLegend();

    await userEvent.click(screen.getByRole('button', { name: 'Clear Tracks' }));

    expect(lastTrackStateAction().payload).toEqual({ hiddenSubjects: {}, pinned: [], visible: [] });
  });
});

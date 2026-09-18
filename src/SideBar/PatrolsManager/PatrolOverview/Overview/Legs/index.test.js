import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { MapContext } from '../../../../../MapContext';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { createMapMock } from '../../../../../__test-helpers/mocks';
import patrolTypes from '../../../../../__test-helpers/fixtures/patrol-types';
import { multiLegPatrol, patrolTeamAndTrackingOptions } from '../../../../../__test-helpers/fixtures/patrols';
import { PATROL_UI_STATES, PERMISSION_KEYS, PERMISSIONS } from '../../../../../constants';
import { render, screen, within } from '../../../../../test-utils';
import { format, STANDARD_DATE_FORMAT } from '../../../../../utils/datetime';
import { TrackerContext } from '../../../../../utils/analytics';
import { TRACK_LENGTH_ORIGINS } from '../../../../../ducks/tracks';
import useNavigate from '../../../../../hooks/useNavigate';

import Legs from './';

const SIMPLIFIED_DATE_FORMAT = 'MM/dd/yyyy HH:mm';

jest.mock('../../../../../hooks/useNavigate', () => jest.fn());

describe('SideBar - PatrolsManager - PatrolOverview - Overview - Legs', () => {
  const patrol = multiLegPatrol;
  const [legOne, legTwo] = patrol.patrol_segments;
  const legTwoLeaderId = legTwo.leader.id;
  const patrolWithPlannedLeg = {
    ...patrol,
    patrol_segments: [legOne, { ...legTwo, scheduled_start: '2099-04-20T08:00:00.000Z', time_range: {} }],
  };
  const overPatrolWithPlannedLeg = { ...patrolWithPlannedLeg, state: 'done' };

  const map = createMapMock();
  const navigate = jest.fn();

  let store;
  beforeEach(() => {
    useNavigate.mockReturnValue(navigate);

    store = {
      data: {
        eventFilter: { filter: { date_range: { lower: '2020-01-01T06:00:00.000Z' } } },
        patrolTeamAndTrackingOptions,
        patrolTypes,
        subjectStore: {},
        user: { permissions: { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ, PERMISSIONS.UPDATE] } },
        tracks: {
          // Only the 2nd leg's leader has track data, so only its leg has bounds to zoom to.
          [legTwoLeaderId]: {
            fetchedDateRange: { since: '2026-04-01T00:00:00.000Z', until: '2026-05-01T00:00:00.000Z' },
            track: {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                properties: { coordinateProperties: { times: ['2026-04-13T09:20:00.000Z', '2026-04-13T09:10:00.000Z'] }, stroke: '#FF0080' },
                geometry: { type: 'LineString', coordinates: [[37.482, 0.232], [37.480, 0.230]] },
              }],
            },
            points: {
              type: 'FeatureCollection',
              features: [
                { type: 'Feature', properties: { time: '2026-04-13T09:20:00.000Z', bearing: 0 }, geometry: { type: 'Point', coordinates: [37.482, 0.232] } },
                { type: 'Feature', properties: { time: '2026-04-13T09:10:00.000Z', bearing: 0 }, geometry: { type: 'Point', coordinates: [37.480, 0.230] } },
              ],
            },
          },
        },
      },
      view: {
        timeSliderState: {},
        trackSettings: { length: 21, origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH },
      },
    };
  });

  const track = jest.fn();

  const renderLegs = (props) => render(
    <Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <TrackerContext.Provider value={{ track }}>
          <Legs patrol={patrol} patrolState={PATROL_UI_STATES.ACTIVE} {...props} />
        </TrackerContext.Provider>
      </MapContext.Provider>
    </Provider>
  );

  const getRows = () => screen.getAllByRole('row');

  test('shows the leg table', () => {
    renderLegs();

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Patrol legs')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Leg' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Patrol Type' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Start Date' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'End Date' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Team & Tracking' })).toBeInTheDocument();
  });

  test('lists the lead, the team members and the assets of a leg in its team and tracking menu', async () => {
    renderLegs();

    const [, legOneRow] = getRows();
    await userEvent.click(within(legOneRow).getByRole('button', { expanded: false }));

    expect(screen.getAllByRole('listitem').map(({ textContent }) => textContent)).toEqual([
      'Ranger AmaraTeam lead',
      'Ranger Nadia',
      'Land Cruiser 42',
      'Handheld Radio 07',
    ]);
  });

  test('navigates to the leg overview when the leg row is clicked', async () => {
    renderLegs();

    const [, legOneRow] = getRows();
    await userEvent.click(legOneRow);

    expect(navigate).toHaveBeenCalledWith(`/patrols/${patrol.id}/legs/${legOne.id}`);
  });

  test('shows the leg number', () => {
    renderLegs();

    const [, legOneRow, legTwoRow] = getRows();

    expect(within(legOneRow).getByText('1')).toBeInTheDocument();
    expect(within(legTwoRow).getByText('2')).toBeInTheDocument();
  });

  test('lists a pause as a leg of its own, named by its state instead of a patrol type', () => {
    const pause = { ...legOne, id: 'pause-1', is_pause: true };

    renderLegs({ patrol: { ...patrol, patrol_segments: [legOne, pause, legTwo] } });

    const [, legOneRow, pauseRow, legTwoRow] = getRows();

    expect(within(legOneRow).getByText('1')).toBeInTheDocument();
    expect(within(pauseRow).getByText('2')).toBeInTheDocument();
    expect(within(pauseRow).getByText('Paused')).toBeInTheDocument();
    expect(within(pauseRow).queryByText('Routine Patrol')).not.toBeInTheDocument();
    expect(within(legTwoRow).getByText('3')).toBeInTheDocument();
  });

  test('shows the leg patrol type', () => {
    renderLegs();

    const [, legOneRow, legTwoRow] = getRows();

    expect(within(legOneRow).getByText('Routine Patrol')).toBeInTheDocument();
    expect(within(legTwoRow).getByText('Dog Patrol')).toBeInTheDocument();
  });

  test('shows the leg start date', () => {
    renderLegs();

    const [, legOneRow, legTwoRow] = getRows();
    const legOneStart = new Date(legOne.time_range.start_time);
    const legTwoStart = new Date(legTwo.time_range.start_time);

    expect(within(legOneRow).getByText(format(legOneStart, STANDARD_DATE_FORMAT))).toBeInTheDocument();
    expect(within(legOneRow).getByText(format(legOneStart, SIMPLIFIED_DATE_FORMAT))).toBeInTheDocument();
    expect(within(legTwoRow).getByText(format(legTwoStart, STANDARD_DATE_FORMAT))).toBeInTheDocument();
  });

  test('shows the leg end date', () => {
    renderLegs();

    const [, legOneRow] = getRows();
    const legOneEnd = new Date(legOne.time_range.end_time);

    expect(within(legOneRow).getByText(format(legOneEnd, STANDARD_DATE_FORMAT))).toBeInTheDocument();
    expect(within(legOneRow).getByText(format(legOneEnd, SIMPLIFIED_DATE_FORMAT))).toBeInTheDocument();
  });

  test('shows a dash instead of an empty date on the leg that is still running', () => {
    renderLegs();

    const [, , legTwoRow] = getRows();

    expect(within(legTwoRow).getAllByRole('cell')[3]).toHaveTextContent('-');
    expect(within(legTwoRow).getAllByRole('time')).toHaveLength(1);
  });

  test('shows the subjects each leg tracks, its lead first', () => {
    renderLegs();

    const [, legOneRow, legTwoRow] = getRows();

    expect(within(legOneRow).getByRole('button', { expanded: false })).toHaveTextContent(legOne.leader.name);
    expect(within(legTwoRow).getByRole('button', { expanded: false })).toHaveTextContent(legTwo.leader.name);
  });

  test('shows nothing in the team and tracking column when the leg tracks no subject', () => {
    const legWithoutTrackedSubjects = { ...legOne, assets: [], leader: null, members: [] };
    const patrolWithoutTrackedSubjects = {
      ...patrol,
      patrol_segments: [legWithoutTrackedSubjects, legTwo],
    };

    renderLegs({ patrol: patrolWithoutTrackedSubjects });

    const [, legOneRow] = getRows();

    expect(within(legOneRow).getAllByRole('cell')[4]).toHaveTextContent('-');
  });

  test('does not navigate to the leg overview when its team and tracking list is opened', async () => {
    renderLegs();

    const [, legOneRow] = getRows();
    await userEvent.click(within(legOneRow).getByRole('button', { expanded: false }));

    expect(screen.getByRole('list', { name: 'Subjects tracked by leg 1' })).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  test('marks the legs the patrol never ran once it is over', () => {
    renderLegs({ patrol: overPatrolWithPlannedLeg, patrolState: PATROL_UI_STATES.DONE });

    const [, legOneRow, legTwoRow] = getRows();

    expect(legOneRow).not.toHaveClass('notRunLeg');
    expect(legTwoRow).toHaveClass('notRunLeg');
  });

  test('says in words which legs the patrol never ran, not in colour alone', () => {
    renderLegs({ patrol: overPatrolWithPlannedLeg, patrolState: PATROL_UI_STATES.DONE });

    const [, legOneRow, legTwoRow] = getRows();

    expect(within(legTwoRow).getByText('This leg never ran')).toBeInTheDocument();
    expect(within(legOneRow).queryByText('This leg never ran')).toBeNull();
  });

  test('shows the planned end of a leg the patrol never ran, not the end that closed it', () => {
    const closedUnrunLeg = {
      ...legTwo,
      scheduled_end: '2026-09-03T20:00:00.000Z',
      scheduled_start: '2026-09-03T18:00:00.000Z',
      time_range: { end_time: '2026-09-02T15:57:00.000Z', start_time: null },
    };

    renderLegs({
      patrol: { ...patrol, patrol_segments: [legOne, closedUnrunLeg], state: 'done' },
      patrolState: PATROL_UI_STATES.DONE,
    });

    const [, , legTwoRow] = getRows();
    const legTwoEnd = within(legTwoRow).getAllByRole('time')[1];

    expect(legTwoEnd).toHaveAttribute('datetime', '2026-09-03T20:00:00.000Z');
    expect(legTwoEnd).not.toHaveTextContent('02 Sep');
  });

  test('does not mark the legs a patrol has yet to run while it is under way', () => {
    renderLegs({ patrol: patrolWithPlannedLeg });

    const [, legOneRow, legTwoRow] = getRows();

    expect(legOneRow).not.toHaveClass('notRunLeg');
    expect(legTwoRow).not.toHaveClass('notRunLeg');
  });

  test('keeps the leg link reachable on a leg the patrol never ran', async () => {
    renderLegs({ patrol: overPatrolWithPlannedLeg, patrolState: PATROL_UI_STATES.DONE });

    const viewLegTwoLink = screen.getByRole('link', { name: 'View leg 2' });

    expect(viewLegTwoLink).toHaveAttribute('href', `/patrols/${patrol.id}/legs/${legTwo.id}`);

    await userEvent.click(viewLegTwoLink);

    expect(track).toHaveBeenCalledWith('View leg from patrol overview');
  });

  test('shows the zoom to leg bounds button', () => {
    renderLegs();

    expect(screen.getByRole('button', { name: 'Zoom to leg 1 bounds' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom to leg 2 bounds' })).toBeInTheDocument();
  });

  test('zooms to the tracked bounds of a leg that has a track', async () => {
    renderLegs();

    await userEvent.click(screen.getByRole('button', { name: 'Zoom to leg 2 bounds' }));

    expect(map.fitBounds).toHaveBeenCalledWith(
      [[37.480, 0.230], [37.482, 0.232]],
      expect.objectContaining({ maxZoom: 17 })
    );
  });

  test('falls back to the planned locations of a leg nothing has tracked', async () => {
    renderLegs();

    await userEvent.click(screen.getByRole('button', { name: 'Zoom to leg 1 bounds' }));

    expect(map.fitBounds).toHaveBeenCalledWith(
      [[37.472, 0.225], [37.480, 0.230]],
      expect.objectContaining({ maxZoom: 17 })
    );
  });

  test('has no bounds to zoom to on a leg with neither a track nor planned locations', () => {
    const legWithoutGeometry = { ...legOne, end_location: null, start_location: null };

    renderLegs({ patrol: { ...patrol, patrol_segments: [legWithoutGeometry, legTwo] } });

    expect(screen.getByRole('button', { name: 'Zoom to leg 1 bounds' })).toBeDisabled();
  });

  test('shows the view leg link', () => {
    renderLegs();

    const viewLegOneLink = screen.getByRole('link', { name: 'View leg 1' });
    const viewLegTwoLink = screen.getByRole('link', { name: 'View leg 2' });

    expect(viewLegOneLink).toHaveAttribute('href', `/patrols/${patrol.id}/legs/${legOne.id}`);
    expect(viewLegTwoLink).toHaveAttribute('href', `/patrols/${patrol.id}/legs/${legTwo.id}`);
  });

  test('does not trigger the row navigation when the view leg link is clicked', async () => {
    renderLegs();

    await userEvent.click(screen.getByRole('link', { name: 'View leg 1' }));

    expect(navigate).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('View leg from patrol overview');
  });

  test('shows the new leg link', () => {
    renderLegs();

    expect(screen.getByRole('link', { name: 'New Patrol Leg' })).toHaveAttribute(
      'href',
      `/patrols/${patrol.id}/legs/new`
    );
  });

  test('hides the new leg link while a patrol with a mobile provenance is active', () => {
    renderLegs({ patrol: { ...patrol, provenance: 'mobile' } });

    expect(screen.queryByRole('link', { name: 'New Patrol Leg' })).not.toBeInTheDocument();
  });

  test.each([PATROL_UI_STATES.READY_TO_START, PATROL_UI_STATES.SCHEDULED, PATROL_UI_STATES.START_OVERDUE])(
    'shows the new leg link for a patrol with a mobile provenance that is not active',
    (patrolState) => {
      renderLegs({ patrol: { ...patrol, provenance: 'mobile' }, patrolState });

      expect(screen.getByRole('link', { name: 'New Patrol Leg' })).toBeInTheDocument();
    }
  );

  test.each([PATROL_UI_STATES.CANCELLED, PATROL_UI_STATES.DONE])(
    'hides the new leg link for a patrol that is over',
    (patrolState) => {
      renderLegs({ patrolState });

      expect(screen.queryByRole('link', { name: 'New Patrol Leg' })).not.toBeInTheDocument();
    }
  );

  test('hides the new leg link when the user may not update patrols', () => {
    store.data.user.permissions[PERMISSION_KEYS.PATROLS] = [PERMISSIONS.READ];

    renderLegs();

    expect(screen.queryByRole('link', { name: 'New Patrol Leg' })).not.toBeInTheDocument();
  });
});

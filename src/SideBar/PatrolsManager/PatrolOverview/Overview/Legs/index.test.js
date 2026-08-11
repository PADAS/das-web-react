import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { MapContext } from '../../../../../MapContext';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { createMapMock } from '../../../../../__test-helpers/mocks';
import patrolTypes from '../../../../../__test-helpers/fixtures/patrol-types';
import { multiLegPatrol } from '../../../../../__test-helpers/fixtures/patrols';
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

  const map = createMapMock();
  const navigate = jest.fn();

  let store;
  beforeEach(() => {
    useNavigate.mockReturnValue(navigate);

    store = {
      data: {
        eventFilter: { filter: { date_range: { lower: '2020-01-01T06:00:00.000Z' } } },
        patrolTypes,
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

  const renderLegs = (props) => render(
    <Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <TrackerContext.Provider value={{ track: jest.fn() }}>
          <Legs patrol={patrol} {...props} />
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

    const [, legOneRow, legTwoRow] = getRows();
    const legOneEnd = new Date(legOne.time_range.end_time);

    expect(within(legOneRow).getByText(format(legOneEnd, STANDARD_DATE_FORMAT))).toBeInTheDocument();
    expect(within(legOneRow).getByText(format(legOneEnd, SIMPLIFIED_DATE_FORMAT))).toBeInTheDocument();

    // The 2nd leg has no end time yet, since it's the currently active leg.
    const legTwoTimeCells = within(legTwoRow).getAllByRole('time');
    expect(legTwoTimeCells[1]).not.toHaveAttribute('datetime');
    expect(legTwoTimeCells[1]).toHaveTextContent('');
  });

  test('shows the leg leader name', () => {
    renderLegs();

    const [, legOneRow, legTwoRow] = getRows();

    expect(within(legOneRow).getByText(legOne.leader.name)).toBeInTheDocument();
    expect(within(legTwoRow).getByText(legTwo.leader.name)).toBeInTheDocument();
  });

  test('shows nothing in the leader column when the leg has no leader assigned', () => {
    const legWithoutLeader = { ...legOne, leader: null };
    const patrolWithoutLeader = { ...patrol, patrol_segments: [legWithoutLeader, legTwo] };

    renderLegs({ patrol: patrolWithoutLeader });

    const [, legOneRow] = getRows();
    const leaderCell = within(legOneRow).getAllByRole('cell')[4];

    expect(leaderCell).toHaveTextContent('');
  });

  test('shows the zoom to leg bounds button', () => {
    renderLegs();

    expect(screen.getByRole('button', { name: 'Zoom to leg 1 bounds' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom to leg 2 bounds' })).toBeInTheDocument();
  });

  test('zooms to the leg bounds when the zoom to leg bounds button is clicked', async () => {
    renderLegs();

    // The 1st leg has no track data, so it has no bounds to zoom to.
    expect(screen.getByRole('button', { name: 'Zoom to leg 1 bounds' })).toBeDisabled();

    const zoomButton = screen.getByRole('button', { name: 'Zoom to leg 2 bounds' });
    expect(zoomButton).not.toBeDisabled();

    await userEvent.click(zoomButton);

    expect(map.fitBounds).toHaveBeenCalledWith(
      [[37.480, 0.230], [37.482, 0.232]],
      expect.objectContaining({ maxZoom: 17 })
    );
  });

  test('shows the view leg link', () => {
    renderLegs();

    const viewLegOneLink = screen.getByRole('link', { name: 'View leg 1' });
    const viewLegTwoLink = screen.getByRole('link', { name: 'View leg 2' });

    expect(viewLegOneLink).toHaveAttribute('href', `/patrols/${patrol.id}/legs/${legOne.id}`);
    expect(viewLegTwoLink).toHaveAttribute('href', `/patrols/${patrol.id}/legs/${legTwo.id}`);
  });

  test('navigates to the leg overview without navigating twice when the view leg link is clicked', async () => {
    renderLegs();

    await userEvent.click(screen.getByRole('link', { name: 'View leg 1' }));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(`/patrols/${patrol.id}/legs/${legOne.id}`);
  });

  test('shows the new leg link', () => {
    renderLegs();

    expect(screen.getByRole('link', { name: 'New Patrol Leg' })).toHaveAttribute(
      'href',
      `/patrols/${patrol.id}/legs/new`
    );
  });
});

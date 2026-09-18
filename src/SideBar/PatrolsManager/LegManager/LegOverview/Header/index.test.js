import React from 'react';
import { Provider } from 'react-redux';
import { useLocation } from 'react-router';
import userEvent from '@testing-library/user-event';
import { useReactToPrint } from 'react-to-print';

import { createMapMock } from '../../../../../__test-helpers/mocks';
import { downloadJsonAsFile } from '../../../../../utils/download';
import { MapContext } from '../../../../../MapContext';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { PATROL_UI_STATES, PERMISSION_KEYS, PERMISSIONS } from '../../../../../constants';
import { multiLegPatrol } from '../../../../../__test-helpers/fixtures/patrols';
import patrolTypes from '../../../../../__test-helpers/fixtures/patrol-types';
import * as patrolUtils from '../../../../../utils/patrols';
import { render, screen, within } from '../../../../../test-utils';
import { TRACK_LENGTH_ORIGINS } from '../../../../../ducks/tracks';
import { TrackerContext } from '../../../../../utils/analytics';
import { UPDATE_PATROL_TRACK_STATE } from '../../../../../ducks/patrols';

import Header from './';

jest.mock('react-to-print', () => ({
  ...jest.requireActual('react-to-print'),
  useReactToPrint: jest.fn(),
}));

jest.mock('../../../../../utils/download', () => ({
  downloadJsonAsFile: jest.fn(),
}));

jest.mock('../../../../../SvgIcon', () => {
  const SvgIcon = ({ iconId }) => <span data-testid="header-legIcon">{iconId}</span>;

  return SvgIcon;
});

const LocationDisplay = () => <div data-testid="test-location">{useLocation().pathname}</div>;

const trackFor = (leaderId, times, fetchedSince) => ({
  [leaderId]: {
    fetchedDateRange: { since: fetchedSince },
    points: {
      features: times.map((time, index) => ({
        geometry: { coordinates: [37.482 - index / 1000, 0.232 - index / 1000], type: 'Point' },
        properties: { bearing: 0, time },
        type: 'Feature',
      })),
      type: 'FeatureCollection',
    },
    track: {
      features: [{
        geometry: { coordinates: [[37.482, 0.232], [37.481, 0.231]], type: 'LineString' },
        properties: { coordinateProperties: { times }, stroke: '#FF0080' },
        type: 'Feature',
      }],
      type: 'FeatureCollection',
    },
  },
});

describe('SideBar - PatrolsManager - LegManager - LegOverview - Header', () => {
  const patrol = multiLegPatrol;
  const patrolSegment = patrol.patrol_segments[1];

  const legTracks = trackFor(
    patrolSegment.leader.id,
    ['2026-04-13T04:00:00.000-07:00', '2026-04-13T03:00:00.000-07:00'],
    '2026-04-13T01:00:00.000-07:00'
  );

  const map = createMapMock();
  const handlePrint = jest.fn();

  let reduxStore, store, tracker;
  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    useReactToPrint.mockImplementation(() => handlePrint);

    tracker = { track: jest.fn() };

    store = {
      data: {
        eventFilter: { filter: { date_range: { lower: '2020-01-01T06:00:00.000Z' } } },
        patrolTypes,
        subjectStore: {},
        tracks: {},
        user: { permissions: { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.UPDATE] } },
      },
      view: {
        patrolTrackState: { pinned: [], visible: [] },
        timeSliderState: { active: false },
        trackSettings: { length: 21, origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH },
      },
    };
  });

  const renderHeader = (props, { withLocationDisplay = false } = {}) => {
    reduxStore = mockStore(store);

    return render(
      <Provider store={reduxStore}>
        <MapContext.Provider value={map}>
          <TrackerContext.Provider value={tracker}>
            <Header
              legNumber={2}
              legState={PATROL_UI_STATES.ACTIVE}
              patrol={patrol}
              patrolSegment={patrolSegment}
              printableContentRef={{ current: <div>Printable leg</div> }}
              {...props}
            />

            {withLocationDisplay && <LocationDisplay />}
          </TrackerContext.Provider>
        </MapContext.Provider>
      </Provider>,
      { initialEntries: ['/patrols/some-other-patrol'] }
    );
  };

  const openKebabMenu = async () => {
    await userEvent.click(screen.getByRole('button', { name: 'More options' }));
  };

  test('shows the leg number as the heading', () => {
    renderHeader();

    expect(screen.getByRole('heading', { level: 2, name: 'Leg 2' })).toBeInTheDocument();
  });

  test('shows the ticker of the patrol the leg belongs to', () => {
    renderHeader();

    expect(screen.getByText(patrol.serial_number)).toBeInTheDocument();
  });

  test('shows the icon of the leg patrol type', () => {
    renderHeader();

    expect(screen.getByTestId('header-legIcon')).toBeInTheDocument();
  });

  test('shows the state of the leg as a read only pill', () => {
    renderHeader({ legState: PATROL_UI_STATES.DONE });

    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /status/i })).not.toBeInTheDocument();
  });

  test('says a leg was a pause alongside the state it ended in', () => {
    renderHeader({ legState: PATROL_UI_STATES.DONE, patrolSegment: { ...patrolSegment, is_pause: true } });

    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  test('does not repeat the pause pill while the pause is the leg under way', () => {
    renderHeader({ legState: PATROL_UI_STATES.PAUSED, patrolSegment: { ...patrolSegment, is_pause: true } });

    expect(screen.getAllByText('Paused')).toHaveLength(1);
  });

  test('leads back to the patrols feed and to the patrol through the breadcrumb', () => {
    renderHeader();

    const breadcrumb = screen.getByRole('navigation', { name: 'Patrol navigation' });

    expect(within(breadcrumb).getByRole('link', { name: 'Patrols' })).toHaveAttribute('href', '/patrols');
    expect(within(breadcrumb).getAllByRole('link')[1]).toHaveAttribute('href', `/patrols/${patrol.id}`);
    expect(within(breadcrumb).getByText('Leg 2')).toHaveAttribute('aria-current', 'page');
  });

  test('shows the mobile pill for a patrol started from the mobile app', () => {
    renderHeader({ patrol: { ...patrol, provenance: 'mobile' } });

    expect(screen.getByText('Mobile')).toBeInTheDocument();
  });

  test('does not show the mobile pill for a patrol started from the web client', () => {
    renderHeader();

    expect(screen.queryByText('Mobile')).not.toBeInTheDocument();
  });

  test('toggles the track of the whole patrol, since visibility is a patrol wide setting', async () => {
    store.data.tracks = legTracks;

    renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'Show patrol track' }));

    const action = reduxStore.getActions().find((item) => item.type === UPDATE_PATROL_TRACK_STATE);

    expect(action.payload).toEqual({ visible: [patrol.id] });
  });

  test('jumps to the last position of the leg', async () => {
    store.data.tracks = legTracks;

    renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'Jump to location' }));

    expect(map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [37.482, 0.232] }));
  });

  test('zooms to the bounds of the leg alone', async () => {
    jest.spyOn(patrolUtils, 'getBoundsForPatrolSegment').mockReturnValue([1, 2, 3, 4]);

    renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'Zoom to patrol leg bounds' }));

    expect(map.fitBounds).toHaveBeenCalledWith([[1, 2], [3, 4]], expect.objectContaining({ maxZoom: 17 }));
  });

  test('has no track to toggle while the patrol has none', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: 'Show patrol track' })).toBeDisabled();
  });

  test('offers the track toggle on a leg of its own without a track, since it acts on the patrol', () => {
    store.data.tracks = legTracks;

    renderHeader({ patrolSegment: patrol.patrol_segments[0] });

    expect(screen.getByRole('button', { name: 'Show patrol track' })).not.toBeDisabled();
  });

  test('falls back to the planned locations of a leg nothing has tracked', async () => {
    renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'Jump to location' }));

    expect(map.easeTo).toHaveBeenCalledWith(expect.objectContaining({
      center: [patrolSegment.start_location.longitude, patrolSegment.start_location.latitude],
    }));
  });

  test('zooms to the planned locations of a leg nothing has tracked', async () => {
    renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'Zoom to patrol leg bounds' }));

    expect(map.fitBounds).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ maxZoom: 17 }));
  });

  test('offers no map location on a leg with neither a track nor planned locations', () => {
    renderHeader({ patrolSegment: { ...patrolSegment, end_location: null, start_location: null } });

    expect(screen.getByRole('button', { name: 'Jump to location' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom to patrol leg bounds' })).toBeDisabled();
  });

  test('offers the map actions in the kebab menu for mobile devices', async () => {
    renderHeader();
    await openKebabMenu();

    expect(await screen.findByRole('menuitem', { name: 'Show patrol track' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Jump to location' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Zoom to patrol leg bounds' })).toBeInTheDocument();
  });

  test('copies the link of the leg', async () => {
    window.navigator.clipboard = { writeText: jest.fn() };

    renderHeader();
    await openKebabMenu();

    await userEvent.click(await screen.findByRole('menuitem', { name: 'Copy patrol leg link' }));

    expect(window.navigator.clipboard.writeText)
      .toHaveBeenCalledWith(expect.stringContaining(`/patrols/${patrol.id}/legs/${patrolSegment.id}`));
  });

  test('prints the leg', async () => {
    renderHeader();
    await openKebabMenu();

    await userEvent.click(await screen.findByRole('menuitem', { name: 'Print Patrol Leg' }));

    expect(handlePrint).toHaveBeenCalled();
  });

  test('downloads the track of the leg alone', async () => {
    store.data.tracks = legTracks;

    renderHeader();
    await openKebabMenu();

    await userEvent.click(await screen.findByRole('menuitem', { name: 'Download Patrol Leg Track' }));

    expect(downloadJsonAsFile).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'FeatureCollection' }),
      `Patrol_${patrol.serial_number}_Leg_2.geojson`
    );
  });

  test('closes the sidebar', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Close sidebar' })).toHaveAttribute('href', '/');
  });
});

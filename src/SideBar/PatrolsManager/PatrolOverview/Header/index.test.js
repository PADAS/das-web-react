import React from 'react';
import { Provider } from 'react-redux';
import { useLocation } from 'react-router';
import userEvent from '@testing-library/user-event';
import { useReactToPrint } from 'react-to-print';

import { createMapMock } from '../../../../__test-helpers/mocks';
import { downloadJsonAsFile } from '../../../../utils/download';
import { MapContext } from '../../../../MapContext';
import { mockStore } from '../../../../__test-helpers/MockStore';
import patrols from '../../../../__test-helpers/fixtures/patrols';
import { render, screen, within } from '../../../../test-utils';
import { UPDATE_PATROL_TRACK_STATE } from '../../../../ducks/patrols';
import { TRACK_LENGTH_ORIGINS } from '../../../../ducks/tracks';
import * as patrolSelectors from '../../../../selectors/patrols';
import * as patrolUtils from '../../../../utils/patrols';

import Header from './';

jest.mock('react-to-print', () => ({
  ...jest.requireActual('react-to-print'),
  useReactToPrint: jest.fn(),
}));

jest.mock('../../../../utils/download', () => ({
  downloadJsonAsFile: jest.fn(),
}));

const LocationDisplay = () => {
  const location = useLocation();

  return <div data-testid="test-location">{location.pathname}</div>;
};

describe('SideBar - PatrolsManager - PatrolOverview - Header', () => {
  const patrolWithLeader = patrols[1];
  const leaderId = patrolWithLeader.patrol_segments[0].leader.id;

  const map = createMapMock();
  const handlePrint = jest.fn();

  let store;
  let reduxStore;
  beforeEach(() => {
    useReactToPrint.mockImplementation(() => handlePrint);

    store = {
      data: {
        eventFilter: { filter: { date_range: { lower: '2020-01-01T06:00:00.000Z' } } },
        subjectStore: {},
        tracks: {},
      },
      view: {
        patrolTrackState: {
          pinned: [],
          visible: [],
        },
        timeSliderState: {
          active: false,
        },
        trackSettings: { length: 21, origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH },
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderHeader = (props, { withLocationDisplay = false } = {}) => {
    reduxStore = mockStore(store);

    return render(
      <Provider store={reduxStore}>
        <MapContext.Provider value={map}>
          <Header
            patrol={patrolWithLeader}
            printableContentRef={{ current: <div>Printable patrol</div> }}
            {...props}
          />

          {withLocationDisplay && <LocationDisplay />}
        </MapContext.Provider>
      </Provider>,
      { initialEntries: ['/patrols/some-other-patrol'] }
    );
  };

  const openKebabMenu = async () => {
    await userEvent.click(screen.getByRole('button', { name: 'More options' }));
  };

  test('shows the breadcrumbs', () => {
    renderHeader();

    const nav = screen.getByRole('navigation', { name: 'Patrol navigation' });

    expect(within(nav).getByRole('link', { name: 'Patrols' })).toBeInTheDocument();
    expect(within(nav).getByText('6p-test')).toHaveAttribute('aria-current', 'page');
  });

  test('shows the toggle track button when the patrol tracks are off', () => {
    renderHeader();

    const button = screen.getByRole('button', { name: 'Show patrol track' });

    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  test('shows the toggle track button when the patrol tracks are on', () => {
    store.view.patrolTrackState.visible = [patrolWithLeader.id];

    renderHeader();

    const button = screen.getByRole('button', { name: 'Pin patrol track' });

    expect(button).toHaveAttribute('aria-pressed', 'mixed');
  });

  test('shows the toggle track button when the patrol tracks are pinned', () => {
    store.view.patrolTrackState.pinned = [patrolWithLeader.id];

    renderHeader();

    const button = screen.getByRole('button', { name: 'Hide patrol track' });

    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  test('toggles the patrol tracks when the toggle track button is clicked', async () => {
    jest.spyOn(patrolUtils, 'patrolHasTrackData').mockReturnValue(true);

    renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'Show patrol track' }));

    const action = reduxStore.getActions().find((item) => item.type === UPDATE_PATROL_TRACK_STATE);

    expect(action).toBeDefined();
    expect(action.payload).toEqual({ visible: [patrolWithLeader.id] });
  });

  test('shows the jump to location button', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: 'Jump to location' })).toBeInTheDocument();
  });

  test('shows the jump to location button disabled when the patrol has no track or start location data', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: 'Jump to location' })).toBeDisabled();
  });

  test('jumps to the last patrol track coordinates when the jump to location button is clicked', async () => {
    store.data.tracks[leaderId] = {
      fetchedDateRange: { since: '2021-01-01T00:00:00.000Z', until: '2022-01-01T00:00:00.000Z' },
      track: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: { coordinateProperties: { times: ['2021-11-03T00:00:00.000Z', '2021-11-02T00:00:00.000Z'] }, stroke: '#FF0080' },
          geometry: { type: 'LineString', coordinates: [[37.482, 0.232], [37.480, 0.230]] },
        }],
      },
      points: {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { time: '2021-11-03T00:00:00.000Z', bearing: 0 }, geometry: { type: 'Point', coordinates: [37.482, 0.232] } },
          { type: 'Feature', properties: { time: '2021-11-02T00:00:00.000Z', bearing: 0 }, geometry: { type: 'Point', coordinates: [37.480, 0.230] } },
        ],
      },
    };

    renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'Jump to location' }));

    expect(map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [37.482, 0.232], zoom: 15 }));
  });

  test('falls back to the patrol start location when the jump to location button is clicked and there is no track data', async () => {
    jest.spyOn(patrolSelectors, 'selectPatrolTrackData').mockReturnValue({
      leader: patrolWithLeader.patrol_segments[0].leader,
      trackData: null,
      startStopGeometries: {
        points: {
          start_location: { type: 'Feature', geometry: { type: 'Point', coordinates: [37.472, 0.226] } },
        },
      },
    });

    renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'Jump to location' }));

    expect(map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [37.472, 0.226], zoom: 15 }));
  });

  test('shows the fit to bounds button', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: 'Zoom to patrol bounds' })).toBeInTheDocument();
  });

  test('shows the fit to bounds button disabled when the patrol bounds are not set', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: 'Zoom to patrol bounds' })).toBeDisabled();
  });

  test('fits the map to the patrol bounds when the fit to bounds button is clicked', async () => {
    jest.spyOn(patrolUtils, 'getBoundsForPatrol').mockReturnValue([1, 2, 3, 4]);

    renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'Zoom to patrol bounds' }));

    expect(map.fitBounds).toHaveBeenCalledWith([[1, 2], [3, 4]], expect.objectContaining({ maxZoom: 17 }));
  });

  test('shows the kebab menu', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
  });

  test('shows the toggle track button in the kebab menu for mobile devices', async () => {
    renderHeader();
    await openKebabMenu();

    expect(await screen.findByRole('menuitem', { name: 'Show patrol track' })).toBeInTheDocument();
  });

  test('toggles the patrol tracks when the toggle track button in the kebab menu is clicked', async () => {
    jest.spyOn(patrolUtils, 'patrolHasTrackData').mockReturnValue(true);

    renderHeader();
    await openKebabMenu();

    const menuItem = await screen.findByRole('menuitem', { name: 'Show patrol track' });
    await userEvent.click(menuItem);

    const action = reduxStore.getActions().find((item) => item.type === UPDATE_PATROL_TRACK_STATE);

    expect(action).toBeDefined();
    expect(action.payload).toEqual({ visible: [patrolWithLeader.id] });
  });

  test('shows the jump to location button in the kebab menu for mobile devices', async () => {
    renderHeader();
    await openKebabMenu();

    expect(await screen.findByRole('menuitem', { name: 'Jump to location' })).toBeInTheDocument();
  });

  test('jumps to the last patrol track coordinates when the jump to location button in the kebab menu is clicked', async () => {
    store.data.tracks[leaderId] = {
      fetchedDateRange: { since: '2021-01-01T00:00:00.000Z', until: '2022-01-01T00:00:00.000Z' },
      track: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: { coordinateProperties: { times: ['2021-11-03T00:00:00.000Z', '2021-11-02T00:00:00.000Z'] }, stroke: '#FF0080' },
          geometry: { type: 'LineString', coordinates: [[37.482, 0.232], [37.480, 0.230]] },
        }],
      },
      points: {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { time: '2021-11-03T00:00:00.000Z', bearing: 0 }, geometry: { type: 'Point', coordinates: [37.482, 0.232] } },
          { type: 'Feature', properties: { time: '2021-11-02T00:00:00.000Z', bearing: 0 }, geometry: { type: 'Point', coordinates: [37.480, 0.230] } },
        ],
      },
    };

    renderHeader();
    await openKebabMenu();

    const menuItem = await screen.findByRole('menuitem', { name: 'Jump to location' });
    await userEvent.click(menuItem);

    expect(map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [37.482, 0.232], zoom: 15 }));
  });

  test('shows the fit to bounds button in the kebab menu for mobile devices', async () => {
    renderHeader();
    await openKebabMenu();

    expect(await screen.findByRole('menuitem', { name: 'Zoom to patrol bounds' })).toBeInTheDocument();
  });

  test('fits the map to the patrol bounds when the fit to bounds button in the kebab menu is clicked', async () => {
    jest.spyOn(patrolUtils, 'getBoundsForPatrol').mockReturnValue([1, 2, 3, 4]);

    renderHeader();
    await openKebabMenu();

    const menuItem = await screen.findByRole('menuitem', { name: 'Zoom to patrol bounds' });
    await userEvent.click(menuItem);

    expect(map.fitBounds).toHaveBeenCalledWith([[1, 2], [3, 4]], expect.objectContaining({ maxZoom: 17 }));
  });

  test('shows the print button in the kebab menu', async () => {
    renderHeader();
    await openKebabMenu();

    expect(await screen.findByRole('menuitem', { name: 'Print Patrol' })).toBeInTheDocument();
  });

  test('prints the patrol when the print button in the kebab menu is clicked', async () => {
    renderHeader();
    await openKebabMenu();

    const menuItem = await screen.findByRole('menuitem', { name: 'Print Patrol' });
    await userEvent.click(menuItem);

    expect(handlePrint).toHaveBeenCalledTimes(1);
  });

  test('shows the download track button in the kebab menu', async () => {
    renderHeader();
    await openKebabMenu();

    expect(await screen.findByRole('menuitem', { name: 'Download Patrol Track' })).toBeInTheDocument();
  });

  test('downloads the combined patrol track (all legs) when the download track button in the kebab menu is clicked', async () => {
    const track = {
      type: 'FeatureCollection',
      // Both points fall after the leg's own start_time (2021-11-01T18:50:00.724Z), so none of
      // them get trimmed off by the leg's own time range.
      features: [{
        type: 'Feature',
        properties: { coordinateProperties: { times: ['2021-11-03T00:00:00.000Z', '2021-11-02T00:00:00.000Z'] }, stroke: '#FF0080' },
        geometry: { type: 'LineString', coordinates: [[37.482, 0.232], [37.480, 0.230]] },
      }],
    };
    store.data.tracks[leaderId] = {
      fetchedDateRange: { since: '2021-01-01T00:00:00.000Z', until: '2022-01-01T00:00:00.000Z' },
      track,
      points: {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { time: '2021-11-03T00:00:00.000Z', bearing: 0 }, geometry: { type: 'Point', coordinates: [37.482, 0.232] } },
          { type: 'Feature', properties: { time: '2021-11-02T00:00:00.000Z', bearing: 0 }, geometry: { type: 'Point', coordinates: [37.480, 0.230] } },
        ],
      },
    };

    renderHeader();
    await openKebabMenu();

    const menuItem = await screen.findByRole('menuitem', { name: 'Download Patrol Track' });
    await userEvent.click(menuItem);

    expect(downloadJsonAsFile).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'FeatureCollection', features: track.features }),
      `Patrol_${patrolWithLeader.serial_number}.geojson`
    );
  });

  test('disables the download track button in the kebab menu when the patrol has no track data', async () => {
    renderHeader();
    await openKebabMenu();

    expect(await screen.findByRole('menuitem', { name: 'Download Patrol Track' })).toBeDisabled();
  });

  test('shows the close button', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Close sidebar' })).toHaveAttribute('href', '/');
  });

  test('navigates to the "/" when the close button is clicked', async () => {
    renderHeader(undefined, { withLocationDisplay: true });

    expect(screen.getByTestId('test-location')).toHaveTextContent('/patrols/some-other-patrol');

    await userEvent.click(screen.getByRole('link', { name: 'Close sidebar' }));

    expect(screen.getByTestId('test-location')).toHaveTextContent('/');
  });

  test('shows the patrol icon', () => {
    const { container } = renderHeader();

    expect(container.querySelector('.icon')).toBeInTheDocument();
  });

  test('shows the patrol serial number', () => {
    renderHeader();

    expect(screen.getByText(String(patrolWithLeader.serial_number))).toBeInTheDocument();
  });

  test('shows the patrol title input', () => {
    renderHeader();

    expect(screen.getByTestId('patrolOverview-title')).toHaveValue('6p-test');
  });

  test('changes the patrol title when the user types in the title input', async () => {
    renderHeader();

    const input = screen.getByTestId('patrolOverview-title');
    await userEvent.clear(input);
    await userEvent.type(input, 'New Patrol Title');

    expect(input).toHaveValue('New Patrol Title');
  });

  test('resyncs the title when the patrol changes without the component unmounting', () => {
    const otherPatrol = patrols[0];

    const { rerender } = renderHeader();

    expect(screen.getByTestId('patrolOverview-title')).toHaveValue('6p-test');

    rerender(
      <Provider store={reduxStore}>
        <MapContext.Provider value={map}>
          <Header patrol={otherPatrol} printableContentRef={{ current: <div>Printable patrol</div> }} />
        </MapContext.Provider>
      </Provider>
    );

    expect(screen.getByTestId('patrolOverview-title')).toHaveValue(otherPatrol.title);
  });

  test('shows the edit title button', () => {
    renderHeader();

    expect(screen.getByTitle('Edit title')).toBeInTheDocument();
  });

  test('focuses and selects the title input when the edit title button is clicked', async () => {
    const selectSpy = jest.spyOn(HTMLInputElement.prototype, 'select');

    renderHeader();

    await userEvent.click(screen.getByTitle('Edit title'));

    expect(screen.getByTestId('patrolOverview-title')).toHaveFocus();
    expect(selectSpy).toHaveBeenCalled();
  });

  test('shows the status pill', () => {
    renderHeader();

    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});

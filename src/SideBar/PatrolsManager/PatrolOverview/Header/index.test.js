import React from 'react';
import { Provider } from 'react-redux';
import { useLocation } from 'react-router';
import userEvent from '@testing-library/user-event';
import { useReactToPrint } from 'react-to-print';

import { MapContext } from '../../../../MapContext';
import { mockStore } from '../../../../__test-helpers/MockStore';
import { createMapMock } from '../../../../__test-helpers/mocks';
import patrols from '../../../../__test-helpers/fixtures/patrols';
import { render, screen, within } from '../../../../test-utils';
import { UPDATE_PATROL_TRACK_STATE } from '../../../../ducks/patrols';
import { downloadFileFromUrl } from '../../../../utils/download';
import * as patrolUtils from '../../../../utils/patrols';

import Header from './';

jest.mock('react-to-print', () => ({
  ...jest.requireActual('react-to-print'),
  useReactToPrint: jest.fn(),
}));

jest.mock('../../../../ducks/tracks', () => ({
  TRACKS_API_URL: (id) => `/api/v1.0/subject/${id}/tracks/`,
}));

jest.mock('../../../../utils/download', () => ({
  downloadFileFromUrl: jest.fn(() => Promise.resolve()),
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
    downloadFileFromUrl.mockImplementation(() => Promise.resolve());

    store = {
      data: {
        subjectStore: {},
        tracks: {},
      },
      view: {
        patrolTrackState: {
          pinned: [],
          visible: [],
        },
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
    jest.spyOn(patrolUtils, 'patrolHasGeoDataToDisplay').mockReturnValue(true);

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

  test('shows the jump to location button disabled when the patrol leader has no coordinates', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: 'Jump to location' })).toBeDisabled();
  });

  test('jumps to the patrol leader location when the jump to location button is clicked', async () => {
    store.data.subjectStore[leaderId] = { last_position: { geometry: { coordinates: [37.472, 0.226] } } };

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
    jest.spyOn(patrolUtils, 'patrolHasGeoDataToDisplay').mockReturnValue(true);

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

  test('jumps to the patrol leader location when the jump to location button in the kebab menu is clicked', async () => {
    store.data.subjectStore[leaderId] = { last_position: { geometry: { coordinates: [37.472, 0.226] } } };

    renderHeader();
    await openKebabMenu();

    const menuItem = await screen.findByRole('menuitem', { name: 'Jump to location' });
    await userEvent.click(menuItem);

    expect(map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [37.472, 0.226], zoom: 15 }));
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

  test('downloads the patrol track when the download track button in the kebab menu is clicked', async () => {
    jest.spyOn(patrolUtils, 'patrolHasGeoDataToDisplay').mockReturnValue(true);

    renderHeader();
    await openKebabMenu();

    const menuItem = await screen.findByRole('menuitem', { name: 'Download Patrol Track' });
    await userEvent.click(menuItem);

    expect(downloadFileFromUrl).toHaveBeenCalledWith(
      `/api/v1.0/subject/${leaderId}/tracks/`,
      expect.objectContaining({
        filename: `Patrol_${patrolWithLeader.serial_number}_6p-test.geojson`,
        params: { since: patrolWithLeader.patrol_segments[0].time_range.start_time },
      })
    );
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

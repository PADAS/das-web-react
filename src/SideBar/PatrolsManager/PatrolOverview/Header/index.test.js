import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { useLocation } from 'react-router';
import userEvent from '@testing-library/user-event';
import { useReactToPrint } from 'react-to-print';

import { createMapMock } from '../../../../__test-helpers/mocks';
import { downloadJsonAsFile } from '../../../../utils/download';
import { MapContext } from '../../../../MapContext';
import { mockStore } from '../../../../__test-helpers/MockStore';
import patrols from '../../../../__test-helpers/fixtures/patrols';
import * as patrolSelectors from '../../../../selectors/patrols';
import * as patrolUtils from '../../../../utils/patrols';
import { PATROL_UI_STATES, PERMISSION_KEYS, PERMISSIONS } from '../../../../constants';
import { render, screen, within } from '../../../../test-utils';
import { TRACK_LENGTH_ORIGINS } from '../../../../ducks/tracks';
import { TrackerContext } from '../../../../utils/analytics';
import { UPDATE_PATROL_TRACK_STATE } from '../../../../ducks/patrols';

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

// The title input and the status select are controlled by PatrolOverview, so the tests own their
// state too.
const ControlledHeader = ({ onChangeState, onChangeTitle, patrol, ...restProps }) => {
  const [editedState, setEditedState] = useState(null);
  const [title, setTitle] = useState(
    () => patrolUtils.displayTitleForPatrol(patrol, patrol.patrol_segments.at(-1)?.leader)
  );

  const patrolState = patrolUtils.calcPatrolState(patrol);
  const state = editedState ?? patrolState;

  const onChangeStateValue = (newState) => {
    setEditedState(newState);
    onChangeState(newState);
  };

  const onChangeTitleValue = (newTitle) => {
    setTitle(newTitle);
    onChangeTitle(newTitle);
  };

  return <Header
    {...restProps}
    isStateDirty={state !== patrolState}
    onChangeState={onChangeStateValue}
    onChangeTitle={onChangeTitleValue}
    patrol={patrol}
    patrolState={patrolState}
    state={state}
    title={title}
  />;
};

describe('SideBar - PatrolsManager - PatrolOverview - Header', () => {
  const patrolWithLeader = patrols[1];
  const patrolWithoutLeader = patrols[0];
  const leaderId = patrolWithLeader.patrol_segments[0].leader.id;

  const map = createMapMock();
  const handlePrint = jest.fn();

  let onChangeTitle;
  let onChangeState;
  let store;
  let reduxStore;
  beforeEach(() => {
    useReactToPrint.mockImplementation(() => handlePrint);

    onChangeTitle = jest.fn();
    onChangeState = jest.fn();

    store = {
      data: {
        eventFilter: { filter: { date_range: { lower: '2020-01-01T06:00:00.000Z' } } },
        subjectStore: {},
        tracks: {},
        user: { permissions: { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.UPDATE] } },
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
          <TrackerContext.Provider value={{ track: jest.fn() }}>
            <ControlledHeader
              onChangeTitle={onChangeTitle}
              onChangeState={onChangeState}
              patrol={patrolWithLeader}
              printableContentRef={{ current: <div>Printable patrol</div> }}
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

  const openStatusSelect = async () => {
    await userEvent.click(screen.getByRole('button', { name: /Change patrol status/ }));
  };

  test('shows the breadcrumbs', () => {
    renderHeader();

    const nav = screen.getByRole('navigation', { name: 'Patrol navigation' });

    expect(within(nav).getByRole('link', { name: 'Patrols' })).toBeInTheDocument();
    expect(within(nav).getByText('6p-test')).toHaveAttribute('aria-current', 'page');
  });

  test('shows the patrol title for a leg with no assigned leader', () => {
    renderHeader({ patrol: patrolWithoutLeader });

    expect(screen.getByTestId('patrolOverview-title')).toHaveValue(patrolWithoutLeader.title);
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

  test('shows the copy patrol link button in the kebab menu', async () => {
    renderHeader();
    await openKebabMenu();

    expect(await screen.findByRole('menuitem', { name: 'Copy patrol link' })).toBeInTheDocument();
  });

  test('copies the patrol link when the copy patrol link button in the kebab menu is clicked', async () => {
    window.navigator.clipboard = { writeText: jest.fn() };

    renderHeader();
    await openKebabMenu();

    const menuItem = await screen.findByRole('menuitem', { name: 'Copy patrol link' });
    await userEvent.click(menuItem);

    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining(`/patrols/${patrolWithLeader.id}`));
  });

  test('logs a warning instead of crashing if copying the patrol link fails', async () => {
    const clipboardError = new Error('Clipboard permission denied');
    window.navigator.clipboard = { writeText: jest.fn().mockRejectedValue(clipboardError) };
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    renderHeader();
    await openKebabMenu();

    const menuItem = await screen.findByRole('menuitem', { name: 'Copy patrol link' });
    await userEvent.click(menuItem);

    expect(warnSpy).toHaveBeenCalledWith('Error copying patrol link to clipboard: ', clipboardError);
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

  test('omits the serial number prefix from the print title when the patrol has none', () => {
    renderHeader({ patrol: { ...patrolWithLeader, serial_number: null } });

    const [{ documentTitle }] = useReactToPrint.mock.calls.at(-1);

    expect(documentTitle).toBe('6p-test');
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

  test('reports every title the user types', async () => {
    renderHeader();

    const input = screen.getByTestId('patrolOverview-title');

    await userEvent.type(input, ' edited');

    expect(onChangeTitle).toHaveBeenLastCalledWith('6p-test edited');

    await userEvent.clear(input);

    expect(onChangeTitle).toHaveBeenLastCalledWith('');
  });

  test('italicizes the patrol title while the edit is staged', () => {
    renderHeader({ isTitleDirty: true });

    expect(screen.getByRole('textbox', { name: 'Patrol title' })).toHaveClass('unsaved');
  });

  test('does not italicize the patrol title when it matches the saved one', () => {
    renderHeader();

    expect(screen.getByRole('textbox', { name: 'Patrol title' })).not.toHaveClass('unsaved');
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

  test('does not show the mobile pill for a patrol without a mobile provenance', () => {
    renderHeader({ patrol: { ...patrolWithLeader, provenance: 'web' } });

    expect(screen.queryByText('Mobile')).not.toBeInTheDocument();
  });

  test('shows the mobile pill for a patrol with a mobile provenance', () => {
    renderHeader({ patrol: { ...patrolWithLeader, provenance: 'mobile' } });

    expect(screen.getByText('Mobile')).toBeInTheDocument();
  });

  describe('patrol status', () => {
    const selectStatus = async (name) => {
      await openStatusSelect();
      await userEvent.click(await screen.findByRole('menuitemradio', { name }));
    };

    test('shows the patrol state in the status pill', () => {
      renderHeader();

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    test('reports the picked status', async () => {
      renderHeader();

      await selectStatus('Done');

      expect(onChangeState).toHaveBeenCalledWith(PATROL_UI_STATES.DONE);
    });

    test('shows the picked status instead of the one the patrol is saved with', async () => {
      renderHeader();

      await selectStatus('Paused');

      expect(screen.getByRole('button', { name: 'Paused, Change patrol status' })).toBeInTheDocument();
    });
  });
});

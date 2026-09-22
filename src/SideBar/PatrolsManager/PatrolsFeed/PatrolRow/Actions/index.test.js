import React from 'react';
import { Provider } from 'react-redux';
import { toast } from 'react-toastify';
import userEvent from '@testing-library/user-event';

import { activePatrol } from '../../../../../__test-helpers/fixtures/patrols';
import { createMapMock } from '../../../../../__test-helpers/mocks';
import { downloadJsonAsFile } from '../../../../../utils/download';
import { MapContext } from '../../../../../MapContext';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { PATROL_UI_STATES, PERMISSION_KEYS, PERMISSIONS } from '../../../../../constants';
import * as patrolSelectors from '../../../../../selectors/patrols';
import * as patrolUtils from '../../../../../utils/patrols';
import { render, screen, waitFor } from '../../../../../test-utils';
import { TRACK_LENGTH_ORIGINS } from '../../../../../ducks/tracks';
import { TrackerContext } from '../../../../../utils/analytics';
import { updatePatrol, UPDATE_PATROL_TRACK_STATE } from '../../../../../ducks/patrols';

import Actions from './';

jest.mock('../../../../../utils/download', () => ({ downloadJsonAsFile: jest.fn() }));

jest.mock('../../../../../ducks/patrols', () => ({
  ...jest.requireActual('../../../../../ducks/patrols'),
  updatePatrol: jest.fn(),
}));

describe('SideBar - PatrolsManager - PatrolsFeed - PatrolRow - Actions', () => {
  const map = createMapMock();

  let reduxStore;
  let store;

  beforeAll(() => {
    jest.useFakeTimers({ advanceTimers: true }).setSystemTime(new Date('2022-02-01'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    updatePatrol.mockImplementation(() => () => Promise.resolve());

    store = {
      data: {
        eventFilter: { filter: { date_range: { lower: '2020-01-01T06:00:00.000Z' } } },
        subjectStore: {},
        tracks: {},
        user: { permissions: { [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.UPDATE] } },
      },
      view: {
        patrolTrackState: { hiddenSubjects: {}, pinned: [], visible: [] },
        timeSliderState: { active: false },
        trackSettings: { length: 21, origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH },
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderActions = (props) => {
    reduxStore = mockStore(store);

    return render(
      <Provider store={reduxStore}>
        <MapContext.Provider value={map}>
          <TrackerContext.Provider value={{ track: jest.fn() }}>
            <Actions patrol={activePatrol} patrolState={PATROL_UI_STATES.ACTIVE} {...props} />
          </TrackerContext.Provider>
        </MapContext.Provider>
      </Provider>
    );
  };

  const openKebabMenu = () => userEvent.click(screen.getByRole('button', { name: 'More options' }));

  test('disables the track controls while the patrol has no track', () => {
    renderActions();

    expect(screen.getByRole('button', { name: 'Show patrol track' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Jump to location' })).toBeDisabled();
  });

  test('toggles the patrol track from hidden to visible', async () => {
    jest.spyOn(patrolUtils, 'patrolHasTrackData').mockReturnValue(true);

    renderActions();

    await userEvent.click(screen.getByRole('button', { name: 'Show patrol track' }));

    expect(reduxStore.getActions().find((action) => action.type === UPDATE_PATROL_TRACK_STATE).payload)
      .toEqual({ visible: [activePatrol.id] });
  });

  test('marks a visible track and names pinning it as the next move', () => {
    jest.spyOn(patrolUtils, 'patrolHasTrackData').mockReturnValue(true);
    store.view.patrolTrackState.visible = [activePatrol.id];

    renderActions();

    expect(screen.getByRole('button', { name: 'Pin patrol track' })).toHaveClass('visible');
  });

  test('marks a pinned track and names hiding it as the next move', () => {
    jest.spyOn(patrolUtils, 'patrolHasTrackData').mockReturnValue(true);
    store.view.patrolTrackState.pinned = [activePatrol.id, 'another-patrol-id'];
    store.view.patrolTrackState.visible = [activePatrol.id];

    renderActions();

    expect(screen.getByRole('button', { name: 'Hide patrol track' })).toHaveClass('pinned');
  });

  test('jumps to the patrol location', async () => {
    jest.spyOn(patrolSelectors, 'selectPatrolTrackData').mockReturnValue({
      hasTrackData: true,
      leader: activePatrol.patrol_segments[0].leader,
      startStopGeometries: {
        points: {
          features: [{ geometry: { coordinates: [37.472, 0.226], type: 'Point' }, type: 'Feature' }],
          type: 'FeatureCollection',
        },
      },
      subjectsTrackData: [],
      trackData: null,
    });

    renderActions();

    await userEvent.click(screen.getByRole('button', { name: 'Jump to location' }));

    expect(map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [37.472, 0.226], zoom: 15 }));
  });

  test('offers the moves the patrol can make ahead of its other options', async () => {
    renderActions();

    await openKebabMenu();

    const options = await screen.findAllByRole('menuitem');

    expect(options).toHaveLength(7);
    expect(options[0]).toHaveAccessibleName('Cancel');
    expect(options[1]).toHaveAccessibleName('Pause');
    expect(options[2]).toHaveAccessibleName('End');
    expect(options[3]).toHaveAccessibleName('Show patrol track');
    expect(options[4]).toHaveAccessibleName('Jump to location');
    expect(options[5]).toHaveAccessibleName('Copy patrol link');
    expect(options[6]).toHaveAccessibleName('Download Patrol Track');
  });

  test('separates the statuses from the rest of the options', async () => {
    renderActions();

    await openKebabMenu();

    expect(await screen.findAllByRole('separator')).toHaveLength(2);
  });

  test('does not offer any move without permission to update patrols', async () => {
    store.data.user.permissions[PERMISSION_KEYS.PATROLS] = [PERMISSIONS.READ];

    renderActions();

    await openKebabMenu();

    expect(await screen.findAllByRole('menuitem')).toHaveLength(4);
    expect(screen.getAllByRole('separator')).toHaveLength(1);
  });

  test('updates the patrol as soon as the user picks a move', async () => {
    renderActions();

    await openKebabMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Cancel' }));

    expect(updatePatrol).toHaveBeenCalledWith(expect.objectContaining({ id: activePatrol.id, state: 'cancelled' }));
  });

  test('holds the menu shut while the move it was given is still saving', async () => {
    let resolveUpdate;
    updatePatrol.mockImplementation(() => () => new Promise((resolve) => {
      resolveUpdate = resolve;
    }));

    renderActions();

    await openKebabMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Cancel' }));

    const kebabMenuButton = screen.getByRole('button', { name: 'More options' });

    expect(kebabMenuButton).toHaveAttribute('aria-busy', 'true');
    expect(kebabMenuButton).toHaveFocus();

    await userEvent.click(kebabMenuButton);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(kebabMenuButton).toHaveFocus();

    resolveUpdate();

    await waitFor(() => expect(kebabMenuButton).toHaveAttribute('aria-busy', 'false'));
  });

  test('warns the user when the patrol status could not be updated', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(toast, 'error').mockImplementation(() => {});
    updatePatrol.mockImplementation(() => () => Promise.reject(new Error('Patrol update error')));

    renderActions();

    await openKebabMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Cancel' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('The patrol status could not be updated. Please try again.');
    });
  });

  test('toggles the patrol track from its menu option', async () => {
    jest.spyOn(patrolUtils, 'patrolHasTrackData').mockReturnValue(true);

    renderActions();

    await openKebabMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Show patrol track' }));

    expect(reduxStore.getActions().find((action) => action.type === UPDATE_PATROL_TRACK_STATE).payload)
      .toEqual({ visible: [activePatrol.id] });
  });

  test('jumps to the patrol location from its menu option', async () => {
    jest.spyOn(patrolSelectors, 'selectPatrolTrackData').mockReturnValue({
      hasTrackData: true,
      leader: activePatrol.patrol_segments[0].leader,
      startStopGeometries: {
        points: {
          features: [{ geometry: { coordinates: [37.472, 0.226], type: 'Point' }, type: 'Feature' }],
          type: 'FeatureCollection',
        },
      },
      subjectsTrackData: [],
      trackData: null,
    });

    renderActions();

    await openKebabMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Jump to location' }));

    expect(map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [37.472, 0.226], zoom: 15 }));
  });

  test('disables the track menu options while the patrol has no track', async () => {
    renderActions();

    await openKebabMenu();

    expect(await screen.findByRole('menuitem', { name: 'Show patrol track' })).toBeDisabled();
    expect(screen.getByRole('menuitem', { name: 'Jump to location' })).toBeDisabled();
  });

  test('does not offer to download a track the patrol does not have', async () => {
    renderActions();

    await openKebabMenu();

    expect(await screen.findByRole('menuitem', { name: 'Download Patrol Track' })).toBeDisabled();
  });

  test('does not offer to download a track whose every subject is hidden', async () => {
    jest.spyOn(patrolSelectors, 'selectPatrolTrackData').mockReturnValue({
      hasTrackData: true,
      leader: activePatrol.patrol_segments[0].leader,
      startStopGeometries: null,
      subjectsTrackData: [],
      trackData: null,
    });

    renderActions();

    await openKebabMenu();

    expect(await screen.findByRole('menuitem', { name: 'Download Patrol Track' })).toBeDisabled();
  });

  test('downloads the patrol track', async () => {
    const track = { features: [], type: 'FeatureCollection' };
    jest.spyOn(patrolSelectors, 'selectPatrolTrackData').mockReturnValue({
      hasTrackData: true,
      leader: activePatrol.patrol_segments[0].leader,
      startStopGeometries: null,
      subjectsTrackData: [],
      trackData: { track },
    });

    renderActions();

    await openKebabMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Download Patrol Track' }));

    expect(downloadJsonAsFile).toHaveBeenCalledWith(track, `Patrol_${activePatrol.serial_number}.geojson`);
  });
});

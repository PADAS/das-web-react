import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { activePatrol, cancelledPatrol, scheduledPatrol } from '../../../../__test-helpers/fixtures/patrols';
import { createMapMock } from '../../../../__test-helpers/mocks';
import { MapContext } from '../../../../MapContext';
import { mockStore } from '../../../../__test-helpers/MockStore';
import { PERMISSION_KEYS, PERMISSIONS, TAB_KEYS } from '../../../../constants';
import { render, screen } from '../../../../test-utils';
import { TRACK_LENGTH_ORIGINS } from '../../../../ducks/tracks';
import { TrackerContext } from '../../../../utils/analytics';
import useNavigate from '../../../../hooks/useNavigate';

import PatrolRow from './';

jest.mock('../../../../hooks/useNavigate', () => jest.fn());

jest.mock('../../../../SvgIcon', () => {
  const SvgIcon = ({ iconId }) => <span data-testid="patrolRow-icon">{iconId}</span>;

  return SvgIcon;
});

describe('SideBar - PatrolsManager - PatrolsFeed - PatrolRow', () => {
  const map = createMapMock();

  let navigate;
  let store;

  beforeAll(() => {
    jest.useFakeTimers({ advanceTimers: true }).setSystemTime(new Date('2022-02-01'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    navigate = jest.fn();
    useNavigate.mockImplementation(() => navigate);

    store = {
      data: {
        eventFilter: { filter: { date_range: { lower: '2020-01-01T06:00:00.000Z' } } },
        patrolTypes: [{ display: 'Don Patrol', icon_id: 'don-patrol-icon', value: 'The_Don_Patrol' }],
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

  const renderPatrolRow = (props) => render(
    <Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <TrackerContext.Provider value={{ track: jest.fn() }}>
          <ul>
            <PatrolRow patrol={activePatrol} {...props} />
          </ul>
        </TrackerContext.Provider>
      </MapContext.Provider>
    </Provider>,
    { initialEntries: [`/${TAB_KEYS.PATROLS}`] }
  );

  test('opens the patrol through a link on its title', () => {
    renderPatrolRow();

    expect(screen.getByRole('link', { name: activePatrol.title })).toHaveAttribute(
      'href',
      `/${TAB_KEYS.PATROLS}/${activePatrol.id}`
    );
  });

  test('titles an untitled patrol after the patrol type of its leg rather than its leader', () => {
    renderPatrolRow({ patrol: { ...activePatrol, title: null } });

    expect(screen.getByRole('link', { name: 'Don Patrol' })).toBeVisible();
  });

  test('titles a patrol with a blank title after its patrol type', () => {
    renderPatrolRow({ patrol: { ...activePatrol, title: '  ' } });

    expect(screen.getByRole('link', { name: 'Don Patrol' })).toBeVisible();
  });

  test('opens the patrol when the user reaches its title by keyboard', async () => {
    renderPatrolRow();

    await userEvent.tab();

    expect(screen.getByRole('link', { name: activePatrol.title })).toHaveFocus();
  });

  test('keeps the row itself out of the tab order', () => {
    renderPatrolRow();

    expect(screen.getByRole('listitem')).not.toHaveAttribute('tabindex');
  });

  test('shows the ticker number of the patrol', () => {
    renderPatrolRow();

    expect(screen.getByText(activePatrol.serial_number)).toBeVisible();
  });

  test('shows the patrol type icon of the leg the patrol is on', () => {
    renderPatrolRow();

    expect(screen.getByTestId('patrolRow-icon')).toHaveTextContent('don-patrol-icon');
  });

  test('shows when a scheduled patrol is due to start', () => {
    renderPatrolRow({ patrol: scheduledPatrol });

    expect(screen.getByText(/^Scheduled:/)).toBeVisible();
  });

  test('shows the status of the patrol as plain text', () => {
    renderPatrolRow();

    expect(screen.getByText('Active')).toBeVisible();
    expect(screen.queryByRole('button', { name: /Change patrol status/ })).toBeNull();
  });

  test('opens the patrol when the user clicks the row itself', async () => {
    renderPatrolRow();

    await userEvent.click(screen.getByText(activePatrol.serial_number));

    expect(navigate).toHaveBeenCalledWith(`/${TAB_KEYS.PATROLS}/${activePatrol.id}`);
  });

  test('does not open the patrol when the user picks an option from the row menu', async () => {
    renderPatrolRow();

    await userEvent.click(screen.getByRole('button', { name: 'More options' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Copy patrol link' }));

    expect(navigate).toHaveBeenCalledTimes(0);
  });

  test('marks a patrol that was created on mobile', () => {
    renderPatrolRow({ patrol: { ...activePatrol, provenance: 'mobile' } });

    expect(screen.getByText('Mobile')).toBeVisible();
  });

  test('does not mark a patrol that was created on the web', () => {
    renderPatrolRow();

    expect(screen.queryByText('Mobile')).toBeNull();
  });

  test('does not open the patrol when the user clicks the chrome of the row menu', async () => {
    renderPatrolRow();

    await userEvent.click(screen.getByRole('button', { name: 'More options' }));
    await userEvent.click((await screen.findAllByRole('separator'))[0]);

    expect(navigate).toHaveBeenCalledTimes(0);
  });

  test('shows the status of a cancelled patrol', () => {
    renderPatrolRow({ patrol: cancelledPatrol });

    expect(screen.getByText('Cancelled')).toBeVisible();
  });
});

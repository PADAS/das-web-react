import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { MapContext } from '../../../../../../MapContext';
import { createMapMock } from '../../../../../../__test-helpers/mocks';
import { mockStore } from '../../../../../../__test-helpers/MockStore';
import { render, screen, waitFor } from '../../../../../../test-utils';
import { TrackerContext } from '../../../../../../utils/analytics';

import TeamAndTracking from './';

const LEAD = {
  coordinates: [37.482, 0.232],
  isTeamLead: true,
  subject: { id: 'lead-1', image_url: '/static/ranger-black.svg', name: 'Ranger Amara' },
};

const MEMBER = {
  coordinates: null,
  isTeamLead: false,
  subject: { id: 'member-1', image_url: null, name: 'Ranger Nadia' },
};

const ASSET = {
  coordinates: [37.48, 0.23],
  isTeamLead: false,
  subject: { id: 'asset-1', image_url: '/static/suv.svg', name: 'Land Cruiser 42' },
};

describe('SideBar - PatrolsManager - PatrolOverview - Overview - Legs - TeamAndTracking', () => {
  const map = createMapMock();
  const track = jest.fn();

  let user;
  beforeEach(() => {
    user = userEvent.setup();
  });

  const renderTeamAndTracking = (props) => render(
    <Provider store={mockStore({ data: {}, view: {} })}>
      <MapContext.Provider value={map}>
        <TrackerContext.Provider value={{ track }}>
          <TeamAndTracking legNumber={1} trackedSubjects={[LEAD, MEMBER, ASSET]} {...props} />

          <button data-testid="teamAndTracking-outsideControl" type="button">Outside</button>
        </TrackerContext.Provider>
      </MapContext.Provider>
    </Provider>
  );

  const openList = async () => {
    await user.click(screen.getByRole('button', { expanded: false }));
  };

  test('shows the first tracked subject and how many others there are', () => {
    renderTeamAndTracking();

    expect(screen.getByRole('button', { expanded: false })).toHaveAccessibleName('Ranger Amara +2');
  });

  test('shows the only tracked subject without a count', () => {
    renderTeamAndTracking({ trackedSubjects: [LEAD] });

    expect(screen.getByRole('button', { expanded: false })).toHaveTextContent('Ranger Amara');
    expect(screen.getByRole('button', { expanded: false })).not.toHaveTextContent('+');
  });

  test('shows a dash when the leg tracks nothing', () => {
    renderTeamAndTracking({ trackedSubjects: [] });

    expect(screen.queryByRole('button', { expanded: false })).not.toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  test('does not show the tracked subjects until the list is opened', () => {
    renderTeamAndTracking();

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  test('lists every subject the leg tracks once opened', async () => {
    renderTeamAndTracking();

    await openList();

    expect(screen.getByRole('list', { name: 'Subjects tracked by leg 1' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent))
      .toEqual(['Ranger AmaraTeam lead', 'Ranger Nadia', 'Land Cruiser 42']);
  });

  test('marks the team lead among the subjects', async () => {
    renderTeamAndTracking();

    await openList();

    expect(screen.getByText('Team lead')).toBeInTheDocument();
  });

  test('offers no action other than jumping to a subject location', async () => {
    renderTeamAndTracking();

    await openList();

    expect(screen.getAllByRole('button', { name: /Jump to the location of/ })).toHaveLength(2);
  });

  test('offers no jump to location for a subject nothing has located', async () => {
    renderTeamAndTracking();

    await openList();

    expect(screen.queryByRole('button', { name: 'Jump to the location of Ranger Nadia' })).not.toBeInTheDocument();
  });

  test('jumps to the location of a subject', async () => {
    renderTeamAndTracking();

    await openList();
    await user.click(screen.getByRole('button', { name: 'Jump to the location of Land Cruiser 42' }));

    expect(map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: ASSET.coordinates, zoom: 17 }));
  });

  test('focuses the first subject that can be jumped to when the list opens', async () => {
    renderTeamAndTracking();

    await openList();

    expect(screen.getByRole('button', { name: 'Jump to the location of Ranger Amara' })).toHaveFocus();
  });

  test('moves the focus among the jump to location buttons with the arrow keys', async () => {
    renderTeamAndTracking();

    await openList();
    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('button', { name: 'Jump to the location of Land Cruiser 42' })).toHaveFocus();

    await user.keyboard('{ArrowUp}');

    expect(screen.getByRole('button', { name: 'Jump to the location of Ranger Amara' })).toHaveFocus();
  });

  test('closes the list and restores the focus with the escape key', async () => {
    renderTeamAndTracking();

    await openList();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { expanded: false })).toHaveFocus();
  });

  test('opens the list from the toggle with the arrow keys', async () => {
    renderTeamAndTracking();

    screen.getByRole('button', { expanded: false }).focus();

    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  test('leaves a key it has no open list to walk to whatever surrounds the toggle', async () => {
    renderTeamAndTracking();

    screen.getByRole('button', { expanded: false }).focus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { expanded: false })).toHaveFocus();
  });

  test('closes the list and lets the focus move on when tabbing out of it', async () => {
    renderTeamAndTracking();

    await openList();
    await user.keyboard('{Tab}');

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByTestId('teamAndTracking-outsideControl')).toHaveFocus();
  });

  test('closes the list on tab when it holds nothing to jump to', async () => {
    renderTeamAndTracking({ trackedSubjects: [MEMBER] });

    await openList();

    expect(screen.getByRole('list')).toBeInTheDocument();

    await user.keyboard('{Tab}');

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  test('closes the list when something outside it takes the focus', async () => {
    renderTeamAndTracking();

    await openList();

    expect(screen.getByRole('list')).toBeInTheDocument();

    screen.getByTestId('teamAndTracking-outsideControl').focus();

    await waitFor(() => expect(screen.queryByRole('list')).not.toBeInTheDocument());
  });
});

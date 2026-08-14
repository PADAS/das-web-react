import React from 'react';
import userEvent from '@testing-library/user-event';

import patrols, { multiLegPatrol } from '../../../../__test-helpers/fixtures/patrols';
import { render, screen, within } from '../../../../test-utils';
import { format, STANDARD_DATE_FORMAT } from '../../../../utils/datetime';
import { TrackerContext } from '../../../../utils/analytics';

import History from './';

describe('SideBar - PatrolsManager - PatrolOverview - History', () => {
  const patrolWithLeader = patrols[1];

  const renderHistory = (props) => render(
    <TrackerContext.Provider value={{ track: jest.fn() }}>
      <History patrol={patrolWithLeader} {...props} />
    </TrackerContext.Provider>
  );

  test('shows the sort direction button', () => {
    renderHistory();

    expect(screen.getByRole('button', { name: 'Sort history in ascending order' })).toBeInTheDocument();
  });

  test('shows the sort direction button pressed when the sort direction is up', async () => {
    renderHistory();

    await userEvent.click(screen.getByRole('button', { name: 'Sort history in ascending order' }));

    expect(screen.getByRole('button', { name: 'Sort history in descending order' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('toggles the sort direction when the sort direction button is clicked', async () => {
    renderHistory();

    const button = screen.getByRole('button', { name: 'Sort history in ascending order' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(button);

    const toggledButton = screen.getByRole('button', { name: 'Sort history in descending order' });
    expect(toggledButton).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(toggledButton);

    expect(screen.getByRole('button', { name: 'Sort history in ascending order' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('shows the updates list in descending order when the sort direction is down', () => {
    renderHistory({ patrol: multiLegPatrol });

    const messages = screen.getAllByRole('listitem').map((item) => item.textContent);

    expect(messages[0]).toEqual(expect.stringContaining('Leg 1 Ended'));
    expect(messages[1]).toEqual(expect.stringContaining('Leg 2 Started'));
    expect(messages[2]).toEqual(expect.stringContaining('Patrol Added'));
  });

  test('shows the updates list in ascending order when the sort direction is up', async () => {
    renderHistory({ patrol: multiLegPatrol });

    await userEvent.click(screen.getByRole('button', { name: 'Sort history in ascending order' }));

    const messages = screen.getAllByRole('listitem').map((item) => item.textContent);

    expect(messages[0]).toEqual(expect.stringContaining('Patrol Added'));
    expect(messages[1]).toEqual(expect.stringContaining('Leg 2 Started'));
    expect(messages[2]).toEqual(expect.stringContaining('Leg 1 Ended'));
  });

  test('shows the user display name in the updates where it is available', () => {
    renderHistory({ patrol: multiLegPatrol });

    expect(screen.getAllByText('Amara Osei')).toHaveLength(2);
  });

  test('does not show the user display name in the updates where it is not available', () => {
    renderHistory({ patrol: multiLegPatrol });

    const legTwoItem = screen.getAllByRole('listitem').find((item) => item.textContent.includes('Leg 2 Started'));

    expect(within(legTwoItem).queryByText('Amara Osei')).not.toBeInTheDocument();
  });

  test('shows the update message', () => {
    renderHistory();

    expect(screen.getByText('Patrol Added')).toBeInTheDocument();
  });

  test('shows the update date', () => {
    renderHistory();

    const [update] = patrolWithLeader.updates;

    expect(screen.getByTestId('date-time')).toHaveTextContent(format(new Date(update.time), STANDARD_DATE_FORMAT));
  });

  test('does not crash when the patrol is missing files, notes, or segment events', () => {
    const partiallyLoadedPatrol = {
      ...patrolWithLeader,
      files: undefined,
      notes: undefined,
      patrol_segments: patrolWithLeader.patrol_segments.map((segment) => ({ ...segment, events: undefined })),
    };

    renderHistory({ patrol: partiallyLoadedPatrol });

    expect(screen.getByText('Patrol Added')).toBeInTheDocument();
  });

  test('does not crash when the patrol or its segments are missing updates', () => {
    const partiallyLoadedPatrol = {
      ...patrolWithLeader,
      updates: undefined,
      patrol_segments: patrolWithLeader.patrol_segments.map((segment) => ({ ...segment, updates: undefined })),
    };

    renderHistory({ patrol: partiallyLoadedPatrol });

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});

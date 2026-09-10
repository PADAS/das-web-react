import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { createMapMock } from '../../../../../../__test-helpers/mocks';
import { format, STANDARD_DATE_FORMAT } from '../../../../../../utils/datetime';
import { GPS_FORMATS } from '../../../../../../utils/location';
import { MapContext } from '../../../../../../MapContext';
import { mockStore } from '../../../../../../__test-helpers/MockStore';
import { multiLegPatrol, patrolTeamAndTrackingOptions } from '../../../../../../__test-helpers/fixtures/patrols';
import { render, screen } from '../../../../../../test-utils';

import StaticFields from './';

describe('SideBar - PatrolsManager - LegManager - LegOverview - Plan - StaticFields', () => {
  const map = createMapMock();
  const patrol = multiLegPatrol;
  const leg = patrol.patrol_segments[0];

  let store;
  beforeEach(() => {
    store = {
      data: { patrolTeamAndTrackingOptions },
      view: {
        coordinateReferenceSystems: { storedSystems: [] },
        userPreferences: { gpsFormat: GPS_FORMATS.DEG },
      },
    };
  });

  const renderStaticFields = (patrolSegment = leg, patrolOverride = patrol) => render(
    <Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <StaticFields patrol={patrolOverride} patrolSegment={patrolSegment} />
      </MapContext.Provider>
    </Provider>
  );

  const readFields = () => Object.fromEntries(
    [...document.querySelectorAll('dt')].map((label) => [label.textContent, label.nextElementSibling.textContent])
  );

  const formatted = (isoDate) => format(new Date(isoDate), STANDARD_DATE_FORMAT);

  test('shows the start and the end of the leg', () => {
    const { time_range: timeRange } = leg;

    renderStaticFields();

    expect(readFields()['Start']).toContain(formatted(timeRange.start_time));
    expect(readFields()['End']).toContain(formatted(timeRange.end_time));
  });

  test('shows the times as machine readable', () => {
    const startTime = leg.time_range.start_time;

    renderStaticFields();

    expect(screen.getByText(formatted(startTime)).tagName).toBe('TIME');
    expect(screen.getByText(formatted(startTime)))
      .toHaveAttribute('datetime', new Date(startTime).toISOString());
  });

  test('shows an empty end for a leg that has not ended', () => {
    renderStaticFields(patrol.patrol_segments[1]);

    expect(readFields()['End']).toBe('-');
  });

  test('falls back to the time the leg was scheduled to start', () => {
    renderStaticFields({
      ...leg,
      scheduled_start: '2026-04-13T01:00:00.000-07:00',
      time_range: { end_time: null, start_time: null },
    });

    expect(readFields()['Start']).toContain(formatted('2026-04-13T01:00:00.000-07:00'));
  });

  test('shows the coordinates of the start and the end locations', () => {
    renderStaticFields();

    expect(screen.getByText('0.225000°, 37.472000°')).toBeInTheDocument();
    expect(screen.getByText('0.230000°, 37.480000°')).toBeInTheDocument();
  });

  test('does not offer the location actions of a leg without locations', () => {
    renderStaticFields({
      ...leg,
      end_location: null,
      start_location: null,
    });

    expect(screen.queryByRole('button', { name: /Jump to the/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Copy the/ })).not.toBeInTheDocument();
  });

  test('jumps to the start location of the leg', async () => {
    renderStaticFields();

    await userEvent.click(screen.getByRole('button', { name: 'Jump to the Start location' }));

    expect(map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [37.472, 0.225] }));
  });

  test('copies the coordinates of the start location', async () => {
    const writeText = jest.fn(() => Promise.resolve());
    window.navigator.clipboard = { writeText };

    renderStaticFields();

    await userEvent.click(screen.getByRole('button', { name: 'Copy the Start coordinates' }));

    expect(writeText).toHaveBeenCalledWith('0.225000°, 37.472000°');
  });

  test('marks a start the leg has not actually reached as scheduled', () => {
    renderStaticFields({ ...leg, scheduled_start: leg.time_range.start_time, time_range: {} });

    expect(readFields()['Start']).toContain('Scheduled');
  });

  test('does not mark a start the leg really began at', () => {
    renderStaticFields();

    expect(readFields()['Start']).not.toContain('Scheduled');
  });

  test('marks a start still in the future as scheduled, even when it is a real one', () => {
    const startTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    renderStaticFields({ ...leg, time_range: { end_time: null, start_time: startTime } });

    expect(readFields()['Start']).toContain('Scheduled');
  });

  test('shows the team lead of the leg', () => {
    renderStaticFields();

    expect(readFields()['Team Lead']).toBe('Ranger Amara');
  });

  test('shows the team of the leg', () => {
    renderStaticFields();

    expect(readFields()['Team']).toBe('Alpha');
  });

  test('lists every team member by name alone', () => {
    renderStaticFields();

    expect(readFields()['Team Members']).toBe('Ranger AmaraLeadRanger Nadia');
  });

  test('still lists a team member the rosters no longer offer, so a past leg keeps who ran it', () => {
    const deactivatedMember = { id: 'a-deactivated-ranger', name: 'Ranger Kofi' };

    store.data.subjectStore = { [deactivatedMember.id]: deactivatedMember };

    const legWithDeactivatedMember = { ...leg, members: [...leg.members, deactivatedMember.id] };

    renderStaticFields(
      legWithDeactivatedMember,
      { ...patrol, patrol_segments: [legWithDeactivatedMember, patrol.patrol_segments[1]] }
    );

    expect(readFields()['Team Members']).toBe('Ranger AmaraLeadRanger NadiaRanger Kofi');
  });

  test('marks the team lead among the team members', () => {
    renderStaticFields();

    const teamLeadEntry = screen.getAllByRole('listitem')
      .find((item) => item.textContent.includes('Ranger Amara'));

    expect(teamLeadEntry).toHaveTextContent('Lead');
  });

  test('lists every asset by name alone', () => {
    renderStaticFields();

    expect(readFields()['Assets']).toBe('Land Cruiser 42Handheld Radio 07');
  });

  test('shows the team, its members and the assets as empty when the leg carries none', () => {
    renderStaticFields({
      ...leg,
      assets: [],
      leader: null,
      members: [],
      team: null,
    });

    expect(readFields()['Team']).toBe('-');
    expect(readFields()['Team Members']).toBe('-');
    expect(readFields()['Assets']).toBe('-');
  });

  test('pairs every label with its value in a definition list', () => {
    renderStaticFields();

    [...document.querySelectorAll('dt')].forEach((label) => {
      expect(label.parentElement.tagName).toBe('DIV');
      expect(label.parentElement.parentElement.tagName).toBe('DL');
      expect(label.nextElementSibling.tagName).toBe('DD');
    });
  });
});

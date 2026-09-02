import React, { useState } from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import buildLegDraft from '../utils/buildLegDraft';
import { GPS_FORMATS } from '../../../../utils/location';
import { mockStore } from '../../../../__test-helpers/MockStore';
import { render, screen, within } from '../../../../test-utils';

import StaticFields from './';

describe('SideBar - PatrolsManager - LegForm - StaticFields', () => {
  const onChangeLeg = jest.fn();

  let store;
  beforeEach(() => {
    store = {
      data: {
        patrolTeamAndTrackingOptions: {
          assets: [{ id: 'asset-1', name: 'Radio 7' }],
          leaders: [
            { id: 'leader-1', image_url: '/static/ranger-black.svg', name: 'Alex' },
            { id: 'leader-2', image_url: '/static/ranger-black.svg', name: 'Priya' },
          ],
          teamMembers: [{ id: 'member-1', name: 'Maya Chen' }],
          teams: [{ display: 'Alpha', id: 'team-1' }],
        },
      },
      view: {
        coordinateReferenceSystems: { storedSystems: [] },
        mapLocationSelection: { isPickingLocation: false },
        showUserLocation: false,
        userLocation: null,
        userPreferences: { gpsFormat: GPS_FORMATS.DEG },
      },
    };
  });

  const ControlledStaticFields = ({ earliestStartDateTime, errors, initialLeg }) => {
    const [leg, setLeg] = useState(initialLeg);

    return <StaticFields
      earliestStartDateTime={earliestStartDateTime}
      errors={errors}
      leg={leg}
      onChangeLeg={(legChanges) => {
        onChangeLeg(legChanges);
        setLeg((prevLeg) => ({ ...prevLeg, ...legChanges }));
      }}
    />;
  };

  const renderStaticFields = ({ earliestStartDateTime = null, errors = {}, leg } = {}) => render(
    <Provider store={mockStore(store)}>
      <ControlledStaticFields
        earliestStartDateTime={earliestStartDateTime}
        errors={errors}
        initialLeg={{ ...buildLegDraft(), startDate: '2026-04-13', startTime: '08:00', ...leg }}
      />
    </Provider>
  );

  const getDateInput = (groupName, inputName) =>
    within(screen.getByRole('group', { name: groupName })).getByRole('textbox', { name: inputName });

  test('shows the start and the end of the leg', () => {
    renderStaticFields();

    expect(screen.getByRole('group', { name: 'Start Time' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'End Time' })).toBeVisible();
    expect(getDateInput('Start date', 'Year')).toHaveValue('2026');
  });

  test('shows the team and tracking fields', () => {
    renderStaticFields();

    ['Team', 'Team Lead', 'Team Members', 'Assets'].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
  });

  test('offers the leaders the site serves as team leads, each with its icon', async () => {
    renderStaticFields();

    await userEvent.click(screen.getByLabelText('Team Lead'));

    const optionIcon = (await screen.findByText('Alex')).querySelector('img');

    expect(optionIcon).toHaveAttribute('src', expect.stringContaining('/static/ranger-black.svg'));
  });

  test('reports the team lead the user picks', async () => {
    renderStaticFields();

    await userEvent.click(screen.getByLabelText('Team Lead'));
    await userEvent.click(await screen.findByText('Priya'));

    expect(onChangeLeg).toHaveBeenCalledWith({
      teamLead: store.data.patrolTeamAndTrackingOptions.leaders[1],
    });
  });

  test.each([
    ['Team', 'teams', 'Alpha', (option) => ({ team: option })],
    ['Team Members', 'teamMembers', 'Maya Chen', (option) => ({ teamMembers: [option] })],
    ['Assets', 'assets', 'Radio 7', (option) => ({ assets: [option] })],
  ])('reports the %s the user picks out of the ones the site serves', async (label, options, optionName, legChange) => {
    renderStaticFields();

    await userEvent.click(screen.getByLabelText(label));
    await userEvent.click(await screen.findByText(optionName));

    expect(onChangeLeg).toHaveBeenCalledWith(legChange(store.data.patrolTeamAndTrackingOptions[options][0]));
  });

  test('shows the locations of the leg', () => {
    renderStaticFields();

    expect(screen.getByLabelText('Start Location')).toBeInTheDocument();
    expect(screen.getByLabelText('End Location')).toBeInTheDocument();
  });

  test('reports the start date the user types', async () => {
    renderStaticFields();

    await userEvent.clear(getDateInput('Start date', 'Year'));
    await userEvent.type(getDateInput('Start date', 'Year'), '2027');

    expect(onChangeLeg).toHaveBeenCalledWith({ startDate: '2027-04-13' });
  });

  test('reports the automatic start the user asks for', async () => {
    renderStaticFields({ leg: { startDate: '2099-01-01' } });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Automatically start the leg at this time' }));

    expect(onChangeLeg).toHaveBeenCalledWith({ isAutoStart: true });
  });

  test('does not offer an automatic start for a leg that already started', () => {
    renderStaticFields({ leg: { startDate: '2020-01-01' } });

    expect(screen.getByRole('checkbox', { name: 'Automatically start the leg at this time' })).toBeDisabled();
  });

  test('does not offer an automatic end for a leg with no end date', () => {
    renderStaticFields();

    expect(screen.getByRole('checkbox', { name: 'Automatically end the leg at this time' })).toBeDisabled();
  });

  test('offers every end time option while the start time is still incomplete', async () => {
    renderStaticFields({ leg: { endDate: '2026-04-13', endTime: '10:00', startTime: ':' } });

    const endTime = screen.getByRole('group', { name: 'End time' });
    await userEvent.click(within(endTime).getByLabelText('Open time options'));

    expect(within(endTime).getAllByRole('option')).toHaveLength(96);
  });

  test('measures the end time options from the start time once it is complete', async () => {
    renderStaticFields({ leg: { endDate: '2026-04-13', endTime: '10:00' } });

    const endTime = screen.getByRole('group', { name: 'End time' });
    await userEvent.click(within(endTime).getByLabelText('Open time options'));

    expect(within(endTime).getAllByRole('option')).toHaveLength(64);
  });

  test('does not offer an end time for an end date the calendar does not have', () => {
    renderStaticFields({ leg: { endDate: '2026-02-31' } });

    expect(within(screen.getByRole('group', { name: 'End time' })).getByLabelText('Open time options'))
      .toBeDisabled();
  });

  test('offers every start time option when the leg follows no other one', async () => {
    renderStaticFields();

    const startTime = screen.getByRole('group', { name: 'Start time' });
    await userEvent.click(within(startTime).getByLabelText('Open time options'));

    expect(within(startTime).getAllByRole('option')).toHaveLength(96);
  });

  test('measures the start time options from the earliest start of the leg on its same day', async () => {
    renderStaticFields({ earliestStartDateTime: new Date(2026, 3, 13, 8, 0) });

    const startTime = screen.getByRole('group', { name: 'Start time' });
    await userEvent.click(within(startTime).getByLabelText('Open time options'));

    expect(within(startTime).getAllByRole('option')).toHaveLength(64);
  });

  test('offers every start time option on a day later than the earliest start of the leg', async () => {
    renderStaticFields({ earliestStartDateTime: new Date(2026, 3, 12, 8, 0) });

    const startTime = screen.getByRole('group', { name: 'Start time' });
    await userEvent.click(within(startTime).getByLabelText('Open time options'));

    expect(within(startTime).getAllByRole('option')).toHaveLength(96);
  });

  test('holds the start date at the earliest start of the leg when the user types an earlier one', async () => {
    renderStaticFields({ earliestStartDateTime: new Date(2026, 3, 13, 8, 0) });

    await userEvent.clear(getDateInput('Start date', 'Day'));
    await userEvent.type(getDateInput('Start date', 'Day'), '10');

    expect(getDateInput('Start date', 'Day')).toHaveValue('13');
  });

  test('shows the errors of the start and end dates', () => {
    renderStaticFields({ errors: { endDate: 'The end is too early.', startDate: 'A date is needed.' } });

    expect(screen.getByText('A date is needed.')).toBeVisible();
    expect(screen.getByText('The end is too early.')).toBeVisible();
    expect(screen.getByRole('group', { name: 'Start date' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('group', { name: 'End date' })).toHaveAttribute('aria-invalid', 'true');
  });

  test('marks only the dates invalid for an error about them', () => {
    renderStaticFields({ errors: { endDate: 'The end is too early.', startDate: 'A date is needed.' } });

    expect(screen.getByRole('group', { name: 'Start time' })).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByRole('group', { name: 'End time' })).toHaveAttribute('aria-invalid', 'false');
  });

  test('shows the errors of the start and end times on the times themselves', () => {
    renderStaticFields({ errors: { endTime: 'An end time is needed.', startTime: 'A start time is needed.' } });

    expect(screen.getByText('A start time is needed.')).toBeVisible();
    expect(screen.getByText('An end time is needed.')).toBeVisible();
    expect(screen.getByRole('group', { name: 'Start time' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('group', { name: 'End time' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('group', { name: 'Start date' })).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByRole('group', { name: 'End date' })).toHaveAttribute('aria-invalid', 'false');
  });

  test('does not mark the times invalid when there are no errors', () => {
    renderStaticFields();

    expect(screen.getByRole('group', { name: 'Start time' })).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByRole('group', { name: 'End time' })).toHaveAttribute('aria-invalid', 'false');
  });

  test('announces the errors of the start and end dates as they appear', () => {
    renderStaticFields({ errors: { endDate: 'The end is too early.', startDate: 'A date is needed.' } });

    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  test('points the start date at its error message', () => {
    renderStaticFields({ errors: { startDate: 'A date is needed.' } });

    expect(screen.getByRole('group', { name: 'Start date' })).toHaveAccessibleErrorMessage('A date is needed.');
  });
});

import { useState } from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import buildLegDraft from '../../utils/buildLegDraft';
import { GPS_FORMATS } from '../../../../utils/location';
import { mockStore } from '../../../../__test-helpers/MockStore';
import { act, render, screen, within } from '../../../../test-utils';
import { TrackerContext, trackEventFactory } from '../../../../utils/analytics';

import StaticFields from './';

describe('SideBar - PatrolsManager - LegForm - StaticFields', () => {
  const onChangeLeg = jest.fn();

  let store;
  let tracker;
  let trackMock;
  beforeEach(() => {
    trackMock = jest.fn();
    tracker = trackEventFactory('Test', trackMock);
    store = {
      data: {
        patrolTeamAndTrackingOptions: {
          assets: [{ id: 'asset-1', name: 'Radio 7' }],
          members: [
            { id: 'member-1', image_url: '/static/ranger-black.svg', name: 'Maya Chen' },
            { id: 'member-2', image_url: '/static/ranger-black.svg', name: 'Priya' },
          ],
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

  const ControlledStaticFields = ({ earliestStartDateTime, errors, initialLeg, isLastLeg, latestEndDateTime }) => {
    const [leg, setLeg] = useState(initialLeg);

    return <StaticFields
      earliestStartDateTime={earliestStartDateTime}
      errors={errors}
      isLastLeg={isLastLeg}
      latestEndDateTime={latestEndDateTime}
      leg={leg}
      onChangeLeg={(legChanges) => {
        onChangeLeg(legChanges);
        setLeg((prevLeg) => ({ ...prevLeg, ...legChanges }));
      }}
    />;
  };

  const renderStaticFields = ({
    earliestStartDateTime = null,
    errors = {},
    isLastLeg = true,
    latestEndDateTime = null,
    leg,
  } = {}) =>
    render(
      <Provider store={mockStore(store)}>
        <TrackerContext.Provider value={tracker}>
          <ControlledStaticFields
            earliestStartDateTime={earliestStartDateTime}
            errors={errors}
            initialLeg={{ ...buildLegDraft(), startDate: '2026-04-13', startTime: '08:00', ...leg }}
            isLastLeg={isLastLeg}
            latestEndDateTime={latestEndDateTime}
          />
        </TrackerContext.Provider>
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

  test('offers only the team members the site serves as team leads, each with its icon', async () => {
    store.data.patrolTeamAndTrackingOptions.leaders = [{ id: 'leader-1', name: 'Alex' }];

    renderStaticFields();

    await userEvent.click(screen.getByLabelText('Team Lead'));

    const optionIcon = (await screen.findByText('Maya Chen')).querySelector('img');

    expect(optionIcon).toHaveAttribute('src', expect.stringContaining('/static/ranger-black.svg'));
    expect(screen.getByText('Priya')).toBeVisible();
    expect(screen.queryByText('Alex')).not.toBeInTheDocument();
  });

  test('reports the team lead the user picks', async () => {
    renderStaticFields();

    await userEvent.click(screen.getByLabelText('Team Lead'));
    await userEvent.click(await screen.findByText('Priya'));

    expect(onChangeLeg).toHaveBeenCalledWith({
      teamLead: store.data.patrolTeamAndTrackingOptions.members[1],
    });
  });

  test.each([
    ['Team', 'teams', 'Alpha', (option) => ({ team: option })],
    ['Team Members', 'members', 'Maya Chen', (option) => ({ teamMembers: [option] })],
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

  test('ends a leg another one follows automatically, without offering to plan its end', () => {
    renderStaticFields({ isLastLeg: false, leg: { endDate: '2099-04-13', endTime: '10:00', isAutoEnd: false } });

    const autoEndCheckbox = screen.getByRole('checkbox', { name: 'Automatically end the leg at this time' });

    expect(autoEndCheckbox).toBeChecked();
    expect(autoEndCheckbox).toBeDisabled();
  });

  test('offers to plan the end of a first leg still planned, even when another one follows it', () => {
    renderStaticFields({
      isLastLeg: false,
      leg: { endDate: '2099-04-13', endTime: '10:00', isAutoEnd: false, startDate: '2099-04-13' },
    });

    const autoEndCheckbox = screen.getByRole('checkbox', { name: 'Automatically end the leg at this time' });

    expect(autoEndCheckbox).not.toBeChecked();
    expect(autoEndCheckbox).toBeEnabled();
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

  test('measures the start time options up to the latest end of the leg on its same day', async () => {
    renderStaticFields({ latestEndDateTime: new Date(2026, 3, 13, 8, 0) });

    const startTime = screen.getByRole('group', { name: 'Start time' });
    await userEvent.click(within(startTime).getByLabelText('Open time options'));

    expect(within(startTime).getAllByRole('option')).toHaveLength(33);
  });

  test('measures the end time options up to the latest end of the leg on its same day', async () => {
    renderStaticFields({
      latestEndDateTime: new Date(2026, 3, 14, 12, 0),
      leg: { endDate: '2026-04-14', endTime: '10:00' },
    });

    const endTime = screen.getByRole('group', { name: 'End time' });
    await userEvent.click(within(endTime).getByLabelText('Open time options'));

    expect(within(endTime).getAllByRole('option')).toHaveLength(49);
  });

  test('holds the end date at the latest end of the leg when the user types a later one', async () => {
    renderStaticFields({
      latestEndDateTime: new Date(2026, 3, 14, 12, 0),
      leg: { endDate: '2026-04-14', endTime: '10:00' },
    });

    await userEvent.clear(getDateInput('End date', 'Day'));
    await userEvent.type(getDateInput('End date', 'Day'), '20');

    expect(getDateInput('End date', 'Day')).toHaveValue('14');
  });

  test('shows the errors of the start and end dates', () => {
    renderStaticFields({ errors: { endDateTime: 'The end is too early.', startDate: 'A date is needed.' } });

    expect(screen.getByText('A date is needed.')).toBeVisible();
    expect(screen.getByText('The end is too early.')).toBeVisible();
    expect(screen.getByRole('group', { name: 'Start date' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('group', { name: 'End date' })).toHaveAttribute('aria-invalid', 'true');
  });

  test('marks only the date invalid for an error about it', () => {
    renderStaticFields({ errors: { startDate: 'A date is needed.' } });

    expect(screen.getByRole('group', { name: 'Start time' })).toHaveAttribute('aria-invalid', 'false');
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
    renderStaticFields({ errors: { endDateTime: 'The end is too early.', startDate: 'A date is needed.' } });

    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  test('points the start date at its error message', () => {
    renderStaticFields({ errors: { startDate: 'A date is needed.' } });

    expect(screen.getByRole('group', { name: 'Start date' })).toHaveAccessibleErrorMessage('A date is needed.');
  });

  describe('tracking', () => {
    const openLocationMenu = (user, fieldLabel) => user.click(
      within(screen.getByLabelText(fieldLabel).closest('[role="group"]'))
        .getByRole('button', { name: 'Open the location picker menu to set a value' })
    );

    test.each([
      ['Team', 'Alpha', 'Select a team from the leg form', undefined],
      ['Team Lead', 'Priya', 'Select a team lead from the leg form', undefined],
      ['Team Members', 'Maya Chen', 'Select a team member from the leg form', '1'],
      ['Assets', 'Radio 7', 'Select an asset from the leg form', '1'],
    ])('tracks the %s the user selects', async (label, optionName, action, trackedLabel) => {
      renderStaticFields();

      await userEvent.click(screen.getByLabelText(label));
      await userEvent.click(await screen.findByText(optionName));

      expect(trackMock).toHaveTrackedAction(action, trackedLabel, { category: 'Test' });
    });

    test.each([
      ['Team', { team: { display: 'Alpha', id: 'team-1' } }, 'Clear the team from the leg form', undefined],
      [
        'Team Lead',
        { teamLead: { id: 'member-2', name: 'Priya' } },
        'Clear the team lead from the leg form',
        undefined,
      ],
      [
        'Team Members',
        { teamMembers: [{ id: 'member-2', name: 'Priya' }] },
        'Deselect a team member from the leg form',
        '0',
      ],
      ['Assets', { assets: [{ id: 'asset-1', name: 'Radio 7' }] }, 'Deselect an asset from the leg form', '0'],
    ])('tracks the user pressing backspace in the %s field', async (label, leg, action, trackedLabel) => {
      renderStaticFields({ leg });

      await userEvent.type(screen.getByRole('combobox', { name: label }), '{backspace}');

      expect(trackMock).toHaveTrackedAction(action, trackedLabel, { category: 'Test' });
    });

    test.each([
      [
        'Team Members',
        { teamMembers: [{ id: 'member-2', name: 'Priya' }] },
        'Priya',
        'Deselect a team member from the leg form',
      ],
      ['Assets', { assets: [{ id: 'asset-1', name: 'Radio 7' }] }, 'Radio 7', 'Deselect an asset from the leg form'],
    ])('tracks the user removing one of the %s', async (label, leg, optionName, action) => {
      renderStaticFields({ leg });

      await userEvent.click(screen.getByRole('button', { name: `Remove ${optionName}` }));

      expect(trackMock).toHaveTrackedAction(action, '0', { category: 'Test' });
    });

    test.each([
      [
        'Team Members',
        { teamMembers: [{ id: 'member-1', name: 'Maya Chen' }, { id: 'member-2', name: 'Priya' }] },
        'Clear team members from the leg form',
      ],
      ['Assets', { assets: [{ id: 'asset-1', name: 'Radio 7' }] }, 'Clear assets from the leg form'],
    ])('tracks the user clearing all the %s', async (label, leg, action) => {
      renderStaticFields({ leg });

      await userEvent.click(screen.getByTestId('select-clearIndicator'));

      expect(trackMock).toHaveTrackedAction(action, '0', { category: 'Test' });
    });

    test.each([['Team'], ['Team Lead']])(
      'does not track the user pressing backspace in the empty %s field',
      async (label) => {
        renderStaticFields();

        await userEvent.type(screen.getByRole('combobox', { name: label }), '{backspace}');

        expect(trackMock).not.toHaveBeenCalled();
      }
    );

    test.each([
      ['Team', { team: { display: 'Alpha', id: 'team-1' } }, 'Alpha'],
      ['Team Lead', { teamLead: { id: 'member-2', name: 'Priya' } }, 'Priya'],
    ])('does not track the user picking the %s already chosen', async (label, leg, optionName) => {
      renderStaticFields({ leg });

      await userEvent.click(screen.getByLabelText(label));
      await userEvent.click(await screen.findByRole('option', { name: optionName }));

      expect(trackMock).not.toHaveBeenCalled();
    });

    test('tracks nothing and still works without a tracker', async () => {
      render(
        <Provider store={mockStore(store)}>
          <StaticFields errors={{}} leg={buildLegDraft()} onChangeLeg={onChangeLeg} />
        </Provider>
      );

      await userEvent.click(screen.getByLabelText('Team'));
      await userEvent.click(await screen.findByText('Alpha'));

      expect(onChangeLeg).toHaveBeenCalledWith({ team: { display: 'Alpha', id: 'team-1' } });
    });

    test.each([
      ['Automatically start the leg at this time', { startDate: '2099-01-01' }, 'Toggle auto-start from the leg form'],
      [
        'Automatically end the leg at this time',
        { endDate: '2099-01-02', endTime: '10:00', startDate: '2099-01-01' },
        'Toggle auto-end from the leg form',
      ],
    ])('tracks the user turning "%s" on and off', async (checkboxName, leg, action) => {
      renderStaticFields({ leg });

      await userEvent.click(screen.getByRole('checkbox', { name: checkboxName }));
      expect(trackMock).toHaveTrackedAction(action, 'on', { category: 'Test' });

      await userEvent.click(screen.getByRole('checkbox', { name: checkboxName }));
      expect(trackMock).toHaveTrackedAction(action, 'off', { category: 'Test' });
    });

    describe('fields that track once per edit', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      const DATE_TIME_FIELDS = [
        ['Start date', 'Year', '2027', 'Change the start date from the leg form'],
        ['Start time', 'Hour', '09', 'Change the start time from the leg form'],
        ['End date', 'Year', '2027', 'Change the end date from the leg form'],
        ['End time', 'Hour', '11', 'Change the end time from the leg form'],
      ];

      const typeInField = async (groupName, inputName, value) => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        const input = within(screen.getByRole('group', { name: groupName })).getByRole('textbox', { name: inputName });

        await user.clear(input);
        await user.type(input, value);
      };

      const countTracked = (action) => trackMock.mock.calls.filter((call) => call[1] === action).length;

      test.each(DATE_TIME_FIELDS)(
        'tracks the edit of the %s once, a second after the user stops typing',
        async (groupName, inputName, value, action) => {
          renderStaticFields({ leg: { endDate: '2026-04-14', endTime: '10:00' } });

          await typeInField(groupName, inputName, value);

          expect(countTracked(action)).toBe(0);

          await act(async () => jest.advanceTimersByTime(999));

          expect(countTracked(action)).toBe(0);

          await act(async () => jest.advanceTimersByTime(1));

          expect(countTracked(action)).toBe(1);
          expect(trackMock).toHaveTrackedAction(action, undefined, { category: 'Test' });
        }
      );

      test.each(DATE_TIME_FIELDS)(
        'tracks a pending edit of the %s when the form closes',
        async (groupName, inputName, value, action) => {
          const { unmount } = renderStaticFields({ leg: { endDate: '2026-04-14', endTime: '10:00' } });

          await typeInField(groupName, inputName, value);

          expect(countTracked(action)).toBe(0);

          unmount();

          expect(countTracked(action)).toBe(1);
        }
      );

      test.each([
        ['Start Location', 'Change start location from the leg form'],
        ['End Location', 'Change end location from the leg form'],
      ])('tracks the %s once as set after typing stops, and once as cleared', async (fieldLabel, action) => {
        store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = Object.values(GPS_FORMATS);
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

        renderStaticFields();

        await openLocationMenu(user, fieldLabel);
        const searchInput = screen.getByRole('searchbox', { name: 'Search location in DEG format' });
        await user.type(searchInput, '10,10');

        expect(countTracked(action)).toBe(0);

        await act(async () => jest.advanceTimersByTime(1000));

        expect(countTracked(action)).toBe(1);
        expect(trackMock).toHaveTrackedAction(action, 'set', { category: 'Test' });

        await user.clear(searchInput);
        await act(async () => jest.advanceTimersByTime(1000));

        expect(countTracked(action)).toBe(2);
        expect(trackMock).toHaveTrackedAction(action, 'cleared', { category: 'Test' });
      });
    });

    test('sends only fixed labels, never a name or a location', async () => {
      store.view.coordinateReferenceSystems.selectedCoordinateRepresentations = Object.values(GPS_FORMATS);

      const { unmount } = renderStaticFields();

      for (const [fieldLabel, optionName] of [
        ['Team', 'Alpha'],
        ['Team Lead', 'Priya'],
        ['Team Members', 'Maya Chen'],
        ['Assets', 'Radio 7'],
      ]) {
        await userEvent.click(screen.getByLabelText(fieldLabel));
        await userEvent.click(await screen.findByText(optionName));
      }
      await openLocationMenu(userEvent, 'Start Location');
      await userEvent.type(screen.getByRole('searchbox', { name: 'Search location in DEG format' }), '10,10');
      unmount();

      const labels = trackMock.mock.calls.map(([, , label]) => label);

      expect(labels).toEqual([undefined, undefined, '1', '1', 'set']);
    });
  });
});

import React, { useState } from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { eventTypes } from '../../../../__test-helpers/fixtures/event-types';
import { mockStore } from '../../../../__test-helpers/MockStore';
import patrolTypes from '../../../../__test-helpers/fixtures/patrol-types';
import { PREVIEW_FEATURES } from '../../../../constants';
import { render, screen, within } from '../../../../test-utils';
import { report } from '../../../../__test-helpers/fixtures/reports';
import { TrackerContext } from '../../../../utils/analytics';
import useJumpToLocation from '../../../../hooks/useJumpToLocation';

import Header from './';

jest.mock('../../../../hooks/useJumpToLocation', () => jest.fn());

const ControlledHeader = ({ onChangeState, onChangeTitle, report: initialReport, ...otherProps }) => {
  const [editedReport, setEditedReport] = useState(initialReport);

  const onChangeStateValue = (state) => {
    setEditedReport((currentReport) => ({ ...currentReport, state }));
    onChangeState(state);
  };

  const onChangeTitleValue = (title) => {
    setEditedReport((currentReport) => ({ ...currentReport, title }));
    onChangeTitle(title);
  };

  return <Header
    isStateDirty={editedReport.state !== initialReport.state}
    isTitleDirty={editedReport.title !== initialReport.title}
    onChangeState={onChangeStateValue}
    onChangeTitle={onChangeTitleValue}
    report={editedReport}
    savedState={initialReport.state}
    {...otherProps}
  />;
};

describe('SideBar - EventsManager - EventOverview - Header', () => {
  let jumpToLocation, onChangeState, onChangeTitle, store, track;

  beforeEach(() => {
    jumpToLocation = jest.fn();
    onChangeState = jest.fn();
    onChangeTitle = jest.fn();
    track = jest.fn();

    useJumpToLocation.mockImplementation(() => jumpToLocation);

    store = { data: { eventTypes, patrolTypes, subjectStore: {} }, view: { systemConfig: {} } };
  });

  const renderHeader = (props = {}, storeOverrides = store) => render(
    <Provider store={mockStore(storeOverrides)}>
      <TrackerContext.Provider value={{ track }}>
        <ControlledHeader
          onChangeState={onChangeState}
          onChangeTitle={onChangeTitle}
          parentCrumbs={[{ label: 'Events', to: '/events' }]}
          report={report}
          {...props}
        />
      </TrackerContext.Provider>
    </Provider>
  );

  const getTitleInput = () => screen.getByRole('textbox', { name: 'Event title' });

  const getStatusSelect = () => screen.getByRole('button', { name: /Change event state/ });

  test('shows the breadcrumb back to the events feed', () => {
    renderHeader();

    const breadcrumb = screen.getByRole('navigation', { name: 'Event navigation' });

    expect(within(breadcrumb).getByRole('link', { name: 'Events' })).toHaveAttribute('href', '/events');
    expect(within(breadcrumb).getByText('Light')).toHaveAttribute('aria-current', 'page');
  });

  test('leads back through the crumbs of the view it was opened from', () => {
    renderHeader({ parentCrumbs: [{ label: 'Patrols', to: '/patrols' }, { label: 'Delta Patrol', to: '/patrols/1' }] });

    const breadcrumb = screen.getByRole('navigation', { name: 'Event navigation' });

    expect(within(breadcrumb).getByRole('link', { name: 'Delta Patrol' })).toHaveAttribute('href', '/patrols/1');
    expect(within(breadcrumb).getByText('Light')).toHaveAttribute('aria-current', 'page');
  });

  test('closes the sidebar', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Close sidebar' })).toHaveAttribute('href', '/');
  });

  test('shows the serial number of the event', () => {
    renderHeader();

    expect(screen.getByText('165634')).toBeVisible();
  });

  test('does not show a serial number for a new event', () => {
    renderHeader({ report: { ...report, id: undefined, serial_number: undefined } });

    expect(screen.queryByText('165634')).toBeNull();
  });

  test('shows the event type icon in the color of a high priority', () => {
    renderHeader();

    expect(screen.getByTestId('eventOverviewHeader-icon')).toHaveClass('red');
  });

  test('shows the event type icon in the color of a low priority', () => {
    renderHeader({ report: { ...report, priority: 100 } });

    expect(screen.getByTestId('eventOverviewHeader-icon')).toHaveClass('green');
  });

  test('marks the icon of an event linked to a patrol', () => {
    renderHeader({ report: { ...report, patrols: ['patrol-id'] } });

    expect(within(screen.getByTestId('eventOverviewHeader-icon')).getByText('p')).toBeInTheDocument();
  });

  test('does not mark the icon of an event linked to no patrol', () => {
    renderHeader({ report: { ...report, patrols: [] } });

    expect(within(screen.getByTestId('eventOverviewHeader-icon')).queryByText('p')).toBeNull();
  });

  test('shows the event type as the title of an event without one', () => {
    renderHeader();

    expect(getTitleInput()).toHaveValue('Light');
  });

  test('shows the title of an event that has one', () => {
    renderHeader({ report: { ...report, title: 'Broken fence light' } });

    expect(getTitleInput()).toHaveValue('Broken fence light');
  });

  test('shows the event type below a title of its own', () => {
    renderHeader({ report: { ...report, title: 'Broken fence light' } });

    expect(screen.getByText('Light')).toBeVisible();
  });

  test('does not repeat the event type below a title that is the event type', () => {
    renderHeader();

    expect(screen.queryByText('Light', { selector: 'p' })).toBeNull();
  });

  test('reports the title the user types', async () => {
    renderHeader();

    await userEvent.type(getTitleInput(), ' A');

    expect(onChangeTitle).toHaveBeenLastCalledWith('Light A');
  });

  test('shows an edited title as unsaved', async () => {
    renderHeader();

    await userEvent.type(getTitleInput(), ' A');

    expect(getTitleInput()).toHaveClass('unsaved');
  });

  test('falls back to the event type title when the user leaves the title empty', async () => {
    renderHeader({ report: { ...report, title: 'Broken fence light' } });

    await userEvent.clear(getTitleInput());
    await userEvent.tab();

    expect(onChangeTitle).toHaveBeenLastCalledWith('Light');
    expect(getTitleInput()).toHaveValue('Light');
  });

  test('does not change the title when the user leaves it untouched', async () => {
    renderHeader();

    await userEvent.click(getTitleInput());
    await userEvent.tab();

    expect(onChangeTitle).not.toHaveBeenCalled();
  });

  test('does not let the user edit the title of a read only event', () => {
    renderHeader({ isReadOnly: true });

    expect(getTitleInput()).toHaveAttribute('readonly');
  });

  test('jumps to the location of the event', async () => {
    renderHeader();

    await userEvent.click(screen.getByRole('button', { name: 'Jump to location' }));

    expect(jumpToLocation).toHaveBeenCalledWith(report.geojson.geometry.coordinates);
  });

  test('shows two markers on the jump to location button of a collection with several locations', () => {
    renderHeader({
      report: {
        ...report,
        contains: [
          { related_event: { geojson: { geometry: { coordinates: [1, 2], type: 'Point' } }, id: 'contained-event-1' } },
          { related_event: { geojson: { geometry: { coordinates: [3, 4], type: 'Point' } }, id: 'contained-event-2' } },
        ],
        is_collection: true,
      },
    });

    expect(screen.getByRole('button', { name: 'Jump to location' }).querySelectorAll('svg')).toHaveLength(2);
  });

  test('disables the jump to location button of an event without a location', () => {
    renderHeader({ report: { ...report, geojson: null, location: null } });

    expect(screen.getByRole('button', { name: 'Jump to location' })).toBeDisabled();
  });

  test('shows the event options menu', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: 'More options' })).toBeVisible();
  });

  test('shows the state of the event', () => {
    renderHeader();

    expect(getStatusSelect()).toHaveAccessibleName('Active, Change event state');
  });

  test('shows a legacy new event as active', () => {
    renderHeader({ report: { ...report, state: 'new' } });

    expect(getStatusSelect()).toHaveAccessibleName('Active, Change event state');
  });

  test('lists the saved state first and the moves away from it as verbs, with the current state checked', async () => {
    renderHeader();

    await userEvent.click(getStatusSelect());

    const menu = screen.getByRole('menu', { name: 'Event states' });

    expect(within(menu).getAllByRole('menuitem').map((option) => option.textContent)).toEqual(['Active', 'Resolve']);
    expect(within(menu).getByRole('menuitem', { name: 'Active' })).toHaveAttribute('aria-current', 'true');
  });

  test('offers to reopen or send to review a resolved event', async () => {
    renderHeader({ report: { ...report, state: 'resolved' } }, {
      ...store,
      view: { systemConfig: { previewFeatures: { [PREVIEW_FEATURES.COMMUNITY_INPUT_ADMIN]: true } } },
    });

    await userEvent.click(getStatusSelect());

    expect(screen.getAllByRole('menuitem').map((option) => option.textContent))
      .toEqual(['Resolved', 'Reopen', 'Send to review']);
  });

  test('offers to activate or resolve an event in review', async () => {
    renderHeader({ report: { ...report, state: 'review' } });

    await userEvent.click(getStatusSelect());

    expect(screen.getAllByRole('menuitem').map((option) => option.textContent))
      .toEqual(['In review', 'Activate', 'Resolve']);
  });

  test('offers to send an active event to review when community input is enabled', async () => {
    renderHeader({}, {
      ...store,
      view: { systemConfig: { previewFeatures: { [PREVIEW_FEATURES.COMMUNITY_INPUT_ADMIN]: true } } },
    });

    await userEvent.click(getStatusSelect());

    expect(screen.getByRole('menuitem', { name: 'Send to review' })).toBeInTheDocument();
  });

  test('changes the state of the event when the user picks one', async () => {
    renderHeader();

    await userEvent.click(getStatusSelect());
    await userEvent.click(screen.getByRole('menuitem', { name: 'Resolve' }));

    expect(onChangeState).toHaveBeenCalledWith('resolved');
    expect(getStatusSelect()).toHaveAccessibleName('Resolved, Change event state');
    expect(within(getStatusSelect()).getByText('Resolved')).toHaveClass('unsavedLabel');
    expect(getStatusSelect()).toHaveFocus();
  });

  test('keeps naming the moves from the saved state after the user picks another one', async () => {
    renderHeader();

    await userEvent.click(getStatusSelect());
    await userEvent.click(screen.getByRole('menuitem', { name: 'Resolve' }));
    await userEvent.click(getStatusSelect());

    expect(screen.getAllByRole('menuitem').map((option) => option.textContent)).toEqual(['Active', 'Resolve']);
    expect(screen.getByRole('menuitem', { name: 'Resolve' })).toHaveAttribute('aria-current', 'true');
  });

  test('opens the state menu from the keyboard on the current state', async () => {
    renderHeader();

    getStatusSelect().focus();
    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitem', { name: 'Active' })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitem', { name: 'Resolve' })).toHaveFocus();
  });

  test('closes the state menu and returns focus to it on escape', async () => {
    renderHeader();

    await userEvent.click(getStatusSelect());
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('menu', { name: 'Event states' })).toBeNull();
    expect(getStatusSelect()).toHaveFocus();
  });

  describe('a community event', () => {
    test('shows only the title bar', () => {
      renderHeader({ isCommunity: true });

      expect(getTitleInput()).toBeVisible();
      expect(screen.queryByRole('navigation')).toBeNull();
      expect(screen.queryByRole('link', { name: 'Close sidebar' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'More options' })).toBeNull();
    });

    test('does not let the user change its state', () => {
      renderHeader({ isCommunity: true });

      expect(screen.queryByRole('button', { name: /Change event state/ })).toBeNull();
    });
  });
});

import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { eventTypes } from '../../../../__test-helpers/fixtures/event-types';
import { format, STANDARD_DATE_FORMAT } from '../../../../utils/datetime';
import { mockStore } from '../../../../__test-helpers/MockStore';
import { render, screen, within } from '../../../../test-utils';
import { report } from '../../../../__test-helpers/fixtures/reports';
import { TAB_KEYS } from '../../../../constants';
import { TrackerContext } from '../../../../utils/analytics';
import useJumpToLocation from '../../../../hooks/useJumpToLocation';
import useNavigate from '../../../../hooks/useNavigate';

import EventRow from './';

jest.mock('../../../../hooks/useJumpToLocation', () => jest.fn());

jest.mock('../../../../hooks/useNavigate', () => jest.fn());

jest.mock('../../../../SvgIcon', () => {
  const SvgIcon = ({ iconId }) => <span>{iconId}</span>;

  return SvgIcon;
});

describe('SideBar - EventsManager - EventsFeed - EventRow', () => {
  let event;
  let navigate;
  let store;
  let track;

  beforeEach(() => {
    navigate = jest.fn();
    track = jest.fn();
    useJumpToLocation.mockImplementation(() => jest.fn());
    useNavigate.mockImplementation(() => navigate);

    event = { ...report, title: 'Poacher camp' };
    store = {
      data: { eventTypes, patrolTypes: [] },
      view: { systemConfig: { previewFeatures: {} } },
    };
  });

  const renderEventRow = (props) => render(
    <Provider store={mockStore(store)}>
      <TrackerContext.Provider value={{ track }}>
        <ul>
          <EventRow displayTimeProp="updated_at" event={event} {...props} />
        </ul>
      </TrackerContext.Provider>
    </Provider>,
    { initialEntries: [`/${TAB_KEYS.EVENTS}`] }
  );

  test('shows the serial number of the event', () => {
    renderEventRow();

    expect(screen.getByText(report.serial_number)).toBeVisible();
  });

  test('opens the event through a link on its title', () => {
    renderEventRow();

    expect(screen.getByRole('link', { name: 'Poacher camp' }))
      .toHaveAttribute('href', `/${TAB_KEYS.EVENTS}/${report.id}`);
  });

  test('titles an untitled event after its event type', () => {
    event.title = null;

    renderEventRow();

    expect(screen.getByRole('link', { name: 'Light' })).toBeVisible();
  });

  test('shows the event type title on the details line of an event with a title of its own', () => {
    renderEventRow();

    expect(screen.getByText('Light')).toBeVisible();
  });

  test('titles an event with a blank title after its event type', () => {
    event.title = '  ';

    renderEventRow();

    expect(screen.getByRole('link', { name: 'Light' })).toBeVisible();
  });

  test('does not repeat the event type below an untitled event', () => {
    event.title = null;

    renderEventRow();

    expect(screen.getAllByText('Light')).toHaveLength(1);
  });

  test('does not repeat the event type below a title that is the event type', () => {
    event.title = 'Light';

    renderEventRow();

    expect(screen.getAllByText('Light')).toHaveLength(1);
  });

  test('shows the state of an active event in the active state color', () => {
    renderEventRow();

    expect(screen.getByText('Active')).toBeVisible();
    expect(screen.getByText('Active')).toHaveClass('active');
  });

  test('shows the legacy new state as active', () => {
    event.state = 'new';

    renderEventRow();

    expect(screen.getByText('Active')).toBeVisible();
  });

  test('shows the state of a resolved event in the resolved state color', () => {
    event.state = 'resolved';

    renderEventRow();

    expect(screen.getByText('Resolved')).toBeVisible();
    expect(screen.getByText('Resolved')).toHaveClass('resolved');
  });

  test('shows the state of an event in review in the review state color', () => {
    event.state = 'review';

    renderEventRow();

    expect(screen.getByText('In review')).toBeVisible();
    expect(screen.getByText('In review')).toHaveClass('review');
  });

  test('shows the date the feed is sorted by', () => {
    event = { ...event, created_at: '2024-01-02T10:00:00Z', updated_at: '2024-03-04T11:00:00Z' };

    renderEventRow({ displayTimeProp: 'created_at' });

    expect(within(screen.getByTestId('date-time')).getByText(format(new Date(event.created_at), STANDARD_DATE_FORMAT)))
      .toBeVisible();
  });

  test('falls back to the update date when the event lacks the date the feed is sorted by', () => {
    event = { ...event, created_at: undefined, time: '2024-01-02T10:00:00Z', updated_at: '2024-03-04T11:00:00Z' };

    renderEventRow({ displayTimeProp: 'created_at' });

    expect(within(screen.getByTestId('date-time')).getByText(format(new Date(event.updated_at), STANDARD_DATE_FORMAT)))
      .toBeVisible();
  });

  test('marks a high priority event with the red priority class', () => {
    renderEventRow();

    expect(screen.getByRole('listitem')).toHaveClass('red');
  });

  test('marks a medium priority event with the amber priority class', () => {
    event.priority = 200;

    renderEventRow();

    expect(screen.getByRole('listitem')).toHaveClass('amber');
  });

  test('marks a low priority event with the green priority class', () => {
    event.priority = 100;

    renderEventRow();

    expect(screen.getByRole('listitem')).toHaveClass('green');
  });

  test('marks an event without priority with the none priority class', () => {
    event.priority = 0;

    renderEventRow();

    expect(screen.getByRole('listitem')).toHaveClass('none');
  });

  test('shows the patrol indicator when the event belongs to a patrol', () => {
    event.patrols = ['patrol-id'];

    renderEventRow();

    expect(screen.getByText('p')).toBeInTheDocument();
  });

  test('does not show the patrol indicator when the event belongs to no patrol', () => {
    event.patrols = [];

    renderEventRow();

    expect(screen.queryByText('p')).toBeNull();
  });

  test('opens the event and tracks it when the user clicks the row itself', async () => {
    renderEventRow();

    await userEvent.click(screen.getByText(report.serial_number));

    expect(navigate).toHaveBeenCalledWith(`/${TAB_KEYS.EVENTS}/${report.id}`);
    expect(track).toHaveBeenCalledWith('Open Event Report', `Event Type:${report.event_type}`);
  });

  test('tracks opening a collection as an incident', async () => {
    event.is_collection = true;

    renderEventRow();

    await userEvent.click(screen.getByText(report.serial_number));

    expect(track).toHaveBeenCalledWith('Open Incident Report', `Event Type:${report.event_type}`);
  });

  test('leaves opening the event to its title link, tracking it once', async () => {
    renderEventRow();

    await userEvent.click(screen.getByRole('link', { name: 'Poacher camp' }));

    expect(navigate).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('Open Event Report', `Event Type:${report.event_type}`);
  });

  test('does not open the event when the user clicks a control inside the row', async () => {
    renderEventRow();

    await userEvent.click(screen.getByRole('button', { name: 'Jump to location' }));

    expect(navigate).not.toHaveBeenCalled();
  });

  test('does not open the event when the user picks an option from the row menu', async () => {
    renderEventRow();

    await userEvent.click(screen.getByRole('button', { name: 'More options' }));
    await userEvent.click((await screen.findAllByRole('separator'))[0]);

    expect(navigate).not.toHaveBeenCalled();
  });
});

import { http, HttpResponse } from 'msw/http';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';

import { activePatrol } from '../../../../../__test-helpers/fixtures/patrols';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { render, screen, within } from '../../../../../test-utils';
import { report } from '../../../../../__test-helpers/fixtures/reports';
import { TRACKS_API_URL } from '../../../../../ducks/tracks';
import { LINK_TYPES } from '../../../../../constants';

import LinkItem from '.';

const store = {
  data: {
    eventFilter: { filter: { date_range: {} } },
    eventTypes: [],
    patrolTypes: [],
    subjectStore: {},
    tracks: {},
  },
  view: {
    patrolTrackState: { hiddenSubjects: {}, pinned: [], visible: [] },
    timeSliderState: {},
    trackSettings: { origin: 'eventFilter' },
  },
};

jest.mock('../../../../../store', () => mockStore(store));

const server = setupServer(
  http.get(
    TRACKS_API_URL(activePatrol.patrol_segments[0].leader.id),
    () => HttpResponse.json({ data: { features: {} } })
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('SideBar - EventsManager - EventOverview - LinksSection - LinkItem', () => {
  const renderLinkItem = (props) => render(<Provider store={mockStore(store)}>
    <ul>
      <LinkItem item={activePatrol} type={LINK_TYPES.PATROL} {...props} />
    </ul>
  </Provider>);

  test('renders a patrol list item if type is patrol', async () => {
    render(<Provider store={mockStore(store)}>
      <LinkItem item={activePatrol} type={LINK_TYPES.PATROL} />
    </Provider>);

    expect((await screen.findByTestId('patrol-list-item-title-05113dd3-3f41-49ef-aa7d-fbc6b7379533')))
      .toHaveTextContent('The Don Patrol Aza');
  });

  test('renders a report list item if type is report', async () => {
    render(<Provider store={mockStore(store)}>
      <LinkItem item={report} type={LINK_TYPES.EVENT} />
    </Provider>);

    expect((await screen.findByTestId('feed-list-item-title-container'))).toHaveTextContent('165634light_rep');
  });

  test('leaves the link as the only control of a patrol or an event, beside its remove button', () => {
    const { unmount } = renderLinkItem({ onRemove: jest.fn() });

    expect(within(screen.getByRole('link')).queryAllByRole('button')).toHaveLength(0);

    unmount();
    renderLinkItem({ item: report, onRemove: jest.fn(), to: `/events/${report.id}`, type: LINK_TYPES.EVENT });

    expect(within(screen.getByRole('link')).queryAllByRole('button')).toHaveLength(0);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  test('renders as a list item without a remove button by default', () => {
    renderLinkItem();

    expect(screen.getByRole('listitem')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remove/ })).toBeNull();
  });

  test('renders a remove button beside the link, named after the patrol it removes the event from', () => {
    renderLinkItem({ onRemove: jest.fn() });

    const removeButton = screen.getByRole('button', { name: 'Remove from patrol 1595' });

    expect(removeButton).toHaveTextContent('Remove');
    expect(within(screen.getByRole('link')).queryByRole('button', { name: 'Remove from patrol 1595' })).toBeNull();
  });

  test('names the remove button of an event after the incident it removes the event from', () => {
    renderLinkItem({ item: { ...report, serial_number: 20 }, onRemove: jest.fn(), type: LINK_TYPES.EVENT });

    expect(screen.getByRole('button', { name: 'Remove from incident 20' })).toBeInTheDocument();
  });

  test('removes the link when the user presses the button with the keyboard', async () => {
    const onRemove = jest.fn();
    renderLinkItem({ onRemove });

    screen.getByRole('button', { name: 'Remove from patrol 1595' }).focus();
    await userEvent.keyboard('{Enter}');

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  test('keeps the pressed button focusable and busy while it removes the link, ignoring presses', async () => {
    const onRemove = jest.fn();
    renderLinkItem({ isRemoveDisabled: true, isRemoving: true, onRemove });

    const removeButton = screen.getByRole('button', { name: 'Remove from patrol 1595' });
    await userEvent.click(removeButton);

    expect(removeButton).toHaveAttribute('aria-busy', 'true');
    expect(removeButton).toHaveAttribute('aria-disabled', 'true');
    expect(removeButton).toBeEnabled();
    expect(onRemove).not.toHaveBeenCalled();
  });

  test('disables the button without marking it busy while another link is removed', () => {
    renderLinkItem({ isRemoveDisabled: true, onRemove: jest.fn() });

    const removeButton = screen.getByRole('button', { name: 'Remove from patrol 1595' });

    expect(removeButton).toHaveAttribute('aria-busy', 'false');
    expect(removeButton).toHaveAttribute('aria-disabled', 'true');
  });
});

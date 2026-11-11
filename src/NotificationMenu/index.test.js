import { http, HttpResponse } from 'msw/http';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../__test-helpers/MockStore';
import mockNewsData from '../__test-helpers/fixtures/news';
import { NEWS_API_URL } from '../ducks/news';
import { render, screen, waitFor, within } from '../test-utils';

import SocketProvider, { mockedSocket } from '../__test-helpers/MockSocketContext';

import NotificationMenu from './';

const UNREAD_NEWS_COUNT = mockNewsData.filter((newsItem) => !newsItem.read).length;

describe('NotificationMenu', () => {
  let readNewsRequests;
  let server;
  let store;

  beforeAll(() => {
    server = setupServer();
    server.listen();
  });

  beforeEach(() => {
    readNewsRequests = [];
    store = { view: {} };

    server.use(
      http.get(NEWS_API_URL, () => HttpResponse.json({ data: { results: mockNewsData } })),
      http.post(NEWS_API_URL, ({ request }) => {
        readNewsRequests.push(new URL(request.url).searchParams.get('read'));

        return HttpResponse.json(null, { status: 201 });
      }),
    );
  });

  afterEach(() => server.resetHandlers());

  afterAll(() => server.close());

  const renderNotificationMenu = () => render(<Provider store={mockStore(store)}>
    <SocketProvider>
      <NotificationMenu />
    </SocketProvider>
  </Provider>);

  const findToggle = () => screen.findByRole('button', { name: /^Notifications/ });

  const openPopover = async () => {
    await userEvent.click(await findToggle());

    return screen.findByRole('dialog', { name: 'Notifications' });
  };

  const findNotificationItems = async () => within(await screen.findByRole('dialog')).findAllByRole('listitem');

  test('names the toggle with the count of unread notifications', async () => {
    renderNotificationMenu();

    expect(await screen.findByRole('button', {
      name: `Notifications, ${UNREAD_NEWS_COUNT} unread`,
    })).toHaveAttribute('title', 'Notifications');
  });

  test('shows the count of unread notifications over the bell', async () => {
    renderNotificationMenu();

    expect(await screen.findByTestId('notificationMenu-unreadBadge')).toHaveTextContent(`${UNREAD_NEWS_COUNT}`);
  });

  test('does not show a reminder of the unread notifications outside the toggle', async () => {
    renderNotificationMenu();

    await screen.findByRole('button', { name: `Notifications, ${UNREAD_NEWS_COUNT} unread` });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('names the toggle without a count when every notification is read', async () => {
    server.use(http.get(NEWS_API_URL, () => HttpResponse.json({
      data: { results: mockNewsData.map((newsItem) => ({ ...newsItem, read: true })) },
    })));

    renderNotificationMenu();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument());
    expect(screen.queryByTestId('notificationMenu-unreadBadge')).not.toBeInTheDocument();
  });

  test('shows the toggle collapsed, with the popover closed, by default', async () => {
    renderNotificationMenu();

    const toggle = await findToggle();

    expect(toggle).toHaveAttribute('aria-haspopup', 'dialog');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('opens the popover and focuses it when the user clicks the toggle', async () => {
    renderNotificationMenu();

    const popover = await openPopover();

    expect(popover).toHaveFocus();
    expect(await findToggle()).toHaveAttribute('aria-expanded', 'true');
  });

  test('lists the news, marking the unread items as text', async () => {
    renderNotificationMenu();

    await openPopover();

    const notificationItems = await findNotificationItems();

    expect(notificationItems).toHaveLength(mockNewsData.length);
    expect(within(notificationItems[0]).getByRole('heading', { name: mockNewsData[0].title })).toBeInTheDocument();
    expect(notificationItems[0]).toHaveTextContent(mockNewsData[0].description);
    expect(notificationItems[0]).toHaveTextContent('Unread');
    expect(within(notificationItems[0]).getByTestId('badgeIcon')).toBeInTheDocument();
    expect(notificationItems[1]).not.toHaveTextContent('Unread');
    expect(within(notificationItems[1]).queryByTestId('badgeIcon')).not.toBeInTheDocument();
  });

  test('lists a news item that has no description', async () => {
    server.use(http.get(NEWS_API_URL, () => HttpResponse.json({
      data: { results: [{ ...mockNewsData[0], description: null }] },
    })));

    renderNotificationMenu();

    await openPopover();

    const notificationItems = await findNotificationItems();

    expect(within(notificationItems[0]).getByRole('heading', { name: mockNewsData[0].title })).toBeInTheDocument();
    expect(within(notificationItems[0]).queryByRole('paragraph')).not.toBeInTheDocument();
  });

  test('links each news item to its article in a new tab', async () => {
    renderNotificationMenu();

    await openPopover();

    const readMoreLink = within((await findNotificationItems())[0]).getByRole('link', { name: 'Read more' });

    expect(readMoreLink).toHaveAttribute('href', mockNewsData[0].link);
    expect(readMoreLink).toHaveAttribute('target', '_blank');
  });

  test('describes each read more link by the title of its news item', async () => {
    renderNotificationMenu();

    await openPopover();

    const readMoreLink = within((await findNotificationItems())[0]).getByRole('link', { name: 'Read more' });

    expect(readMoreLink).toHaveAccessibleDescription(mockNewsData[0].title);
  });

  test('says there are no notifications when there are none', async () => {
    server.use(http.get(NEWS_API_URL, () => HttpResponse.json({ data: { results: [] } })));

    renderNotificationMenu();

    await openPopover();

    expect(await screen.findByText('No new notifications at this time.')).toBeInTheDocument();
  });

  test('links to all the news', async () => {
    renderNotificationMenu();

    await openPopover();

    expect(await screen.findByRole('link', { name: 'See all news' })).toHaveAttribute('target', '_blank');
  });

  test('lists an announcement that arrives over the socket first', async () => {
    renderNotificationMenu();

    await openPopover();
    await findNotificationItems();

    mockedSocket.socketClient.emit('new_announcement', {
      data: {
        additional: { created_at: '2021-07-05T00:00:00.000Z' },
        description: 'A new announcement just arrived',
        id: 'new-announcement',
        link: 'https://earthranger.com/news',
        read: false,
        title: 'Fresh news',
      },
    });

    await waitFor(async () => expect((await findNotificationItems())[0])
      .toHaveTextContent('A new announcement just arrived'));
  });

  test('closes the popover, returns focus to the toggle and marks the news read when the user presses escape',
    async () => {
      renderNotificationMenu();

      await openPopover();
      await userEvent.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(await findToggle()).toHaveFocus();

      await waitFor(() => expect(readNewsRequests).toEqual([
        mockNewsData.filter((newsItem) => !newsItem.read).map((newsItem) => newsItem.id).join(','),
      ]));
      expect(await screen.findByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    });

  test('keeps unread an announcement that arrives while the news are being marked read', async () => {
    server.use(http.post(NEWS_API_URL, () => {
      mockedSocket.socketClient.emit('new_announcement', {
        data: { description: 'Arrived mid-request', id: 'new-announcement', read: false, title: 'Fresh news' },
      });

      return HttpResponse.json(null, { status: 201 });
    }));

    renderNotificationMenu();

    await openPopover();
    await userEvent.keyboard('{Escape}');

    expect(await screen.findByRole('button', { name: 'Notifications, 1 unread' })).toBeInTheDocument();
  });

  test('closes the popover when the user clicks outside it', async () => {
    renderNotificationMenu();

    await openPopover();
    await userEvent.click(document.body);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('with a notification from the app', () => {
    let appNotification;

    beforeEach(() => {
      appNotification = {
        confirmText: 'Reload',
        id: 'new-version',
        message: 'A new version is available',
        onConfirm: jest.fn(),
        onDismiss: jest.fn(),
      };
      store = { view: { userNotifications: [appNotification] } };
    });

    test('lists it above the news and counts it as unread', async () => {
      renderNotificationMenu();

      await openPopover();

      await waitFor(async () => expect(await findNotificationItems()).toHaveLength(mockNewsData.length + 1));
      expect((await findNotificationItems())[0]).toHaveTextContent('A new version is available');
      expect(await findToggle()).toHaveAccessibleName(`Notifications, ${UNREAD_NEWS_COUNT + 1} unread`);
    });

    test('confirms it when the user clicks its confirm button', async () => {
      renderNotificationMenu();

      await openPopover();
      await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Reload' }));

      expect(appNotification.onConfirm).toHaveBeenCalledWith(expect.anything(), appNotification);
    });

    test('dismisses it when the user clicks its dismiss button', async () => {
      renderNotificationMenu();

      await openPopover();
      await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Dismiss' }));

      expect(appNotification.onDismiss).toHaveBeenCalledWith(expect.anything(), appNotification);
    });

    test('keeps focus in the popover when the user dismisses it', async () => {
      renderNotificationMenu();

      const popover = await openPopover();

      await userEvent.click(within(popover).getByRole('button', { name: 'Dismiss' }));

      expect(popover).toHaveFocus();
    });
  });

  describe('when the news fail to load', () => {
    beforeEach(() => {
      let hasFailed = false;

      server.use(http.get(NEWS_API_URL, () => {
        if (hasFailed) {
          return HttpResponse.json({ data: { results: mockNewsData } });
        }

        hasFailed = true;

        return HttpResponse.json(null, { status: 500 });
      }));
    });

    test('shows an error message and no link to all the news', async () => {
      renderNotificationMenu();

      await openPopover();

      expect(await screen.findByText('Error fetching recent announcements.')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'See all news' })).not.toBeInTheDocument();
    });

    test('does not say there are no notifications', async () => {
      renderNotificationMenu();

      await openPopover();

      expect(await screen.findByText('Error fetching recent announcements.')).toBeInTheDocument();
      expect(screen.queryByText('No new notifications at this time.')).not.toBeInTheDocument();
    });

    test('loads the news again and keeps focus in the popover when the user clicks retry', async () => {
      renderNotificationMenu();

      const popover = await openPopover();

      await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

      expect(popover).toHaveFocus();
      expect((await findNotificationItems())[0]).toHaveTextContent(mockNewsData[0].description);
    });
  });

});

import React from 'react';
import { Provider } from 'react-redux';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import ReactGA from 'react-ga';

import { NEWS_API_URL } from '../ducks/news';

import { mockStore } from '../__test-helpers/MockStore';
import SocketProvider from '../__test-helpers/MockSocketContext';
import mockNewsData from '../__test-helpers/fixtures/news';

import { render, waitFor, waitForElementToBeRemoved, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NotificationMenu from '../NotificationMenu';

ReactGA.initialize('dummy', { testMode: true });

const server = setupServer(
  rest.get(NEWS_API_URL, (req, res, ctx) => {
    return res(ctx.json( { data: {
      results: mockNewsData,
    } }));
  }),
  rest.post(NEWS_API_URL, (req, res, ctx) => {
    return res(ctx.status(201));
  })
);

let store = mockStore({ view: { } });

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());


test('rendering without crashing', () => {
  render(<Provider store={store} >
    <SocketProvider>
      <NotificationMenu />
    </SocketProvider>
  </Provider>);
});

describe('listing news items', () => {
  let rendered;
  beforeEach(async () => {
    rendered = render(<Provider store={store}>
      <SocketProvider>
        <NotificationMenu />
      </SocketProvider>
    </Provider>);

    const toggle = await screen.findByTestId('notification-toggle');
    userEvent.click(toggle);
  });
  afterEach(() => {
    store = mockStore({ view: { } });
    rendered.unmount();
  });

  test('showing news items from the news API', async () => {
    const items = await waitFor(() => screen.getAllByRole('listitem'));

    expect(items[0]).toHaveTextContent(mockNewsData[0].description);
  });

  test('opening a new tab with a link when clicking "read more"', async () => {
    global.open = jest.fn();

    const items = await waitFor(() => screen.getAllByRole('listitem'));
    const readMoreBtn = items[0].querySelector('button');
    userEvent.click(readMoreBtn);

    expect(global.open).toHaveBeenCalledWith(mockNewsData[0].link, '_blank', 'noopener,noreferrer');
  });

  test('showing a badge with the count of unread items', async () => {
    const unreadBadge = await screen.findByTestId('unread-count');

    expect(unreadBadge.textContent).toEqual(mockNewsData.filter(n => !n.read).length.toString());
  });

  describe('with user notifications', () => {
    let userNotificationListItem;
    const storeWithUserNotification = {
      view: {
        userNotifications: [
          {
            message: 'howdy doody',
            onConfirm: jest.fn(() => console.log('CONFIRM_CLICK')),
            onDismiss: jest.fn(() => console.log('DISMISS_CLICK')),
          }
        ]
      }
    };
    beforeEach(async () => {
      store = mockStore(() => storeWithUserNotification);

      rendered.unmount();

      rendered = render(<Provider store={store}>
        <SocketProvider>
          <NotificationMenu />
        </SocketProvider>
      </Provider>);

      const toggle = await screen.findByTestId('notification-toggle');
      userEvent.click(toggle);

      await waitFor(() => {
        expect(screen.getAllByRole('listitem')).toHaveLength(4);
      });

      userNotificationListItem = screen.getAllByRole('listitem')[0];
    });

    test('user notifications are listed above news items', async () => {
      expect(userNotificationListItem).toHaveTextContent('howdy doody');

      const unreadBadge = await screen.findByTestId('unread-count');
      expect(unreadBadge.textContent).toEqual(`${mockNewsData.filter(n => !n.read).length + 1}`);

    });

    test('clicking confirm', () => {
      const [, confirmBtn] = userNotificationListItem.querySelectorAll('button');

      expect(storeWithUserNotification.view.userNotifications[0].onConfirm).not.toHaveBeenCalled();
      userEvent.click(confirmBtn);
      expect(storeWithUserNotification.view.userNotifications[0].onConfirm).toHaveBeenCalled();
    });

    test('clicking dismiss',  () => {
      const dismissBtn = userNotificationListItem.querySelector('button');

      expect(storeWithUserNotification.view.userNotifications[0].onDismiss).not.toHaveBeenCalled();
      userEvent.click(dismissBtn);
      expect(storeWithUserNotification.view.userNotifications[0].onDismiss).toHaveBeenCalled();

    });
  });


  test('marks unread news items as "read" when the menu is closed after being viewed', async () => {
    const unreadBadge = await screen.findByTestId('unread-count');
    expect(unreadBadge.textContent).toEqual(`${mockNewsData.filter(n => !n.read).length}`);

    /* menu is open from the `beforeEach setup`, click again to close */
    const toggle = await screen.findByTestId('notification-toggle');
    userEvent.click(toggle);

    await waitForElementToBeRemoved(unreadBadge);
  });
});

describe('handling failed news requests', () => {
  beforeEach(async () => {
    server.use(
      rest.get(NEWS_API_URL, (req, res, ctx) => {
        return res.once(ctx.status(500));
      })
    );
    render(<Provider store={store}>
      <SocketProvider>
        <NotificationMenu />
      </SocketProvider>
    </Provider>);

    const toggle = await screen.findByTestId('notification-toggle');
    userEvent.click(toggle);
  });

  test('showing an error message', async () => {
    await screen.findByTestId('error-message');
  });

  test('presenting a retry button which attempts to re-fetch news', async () => {
    const newsFetchRetryBtn = await screen.findByTestId('news-fetch-retry-btn');
    userEvent.click(newsFetchRetryBtn);

    const items = await waitFor(() => screen.getAllByRole('listitem'));
    expect(items[0]).toHaveTextContent(mockNewsData[0].description);
  });
});

describe('reminding users of unread messages', () => {
  const numberOfUnreadItems = mockNewsData.filter(n => !n.read).length;
  let rendered;

  beforeEach(async () => {
    rendered = render(<Provider store={store}>
      <SocketProvider>
        <NotificationMenu />
      </SocketProvider>
    </Provider>);

    const toggle = await screen.findByTestId('notification-toggle');
    userEvent.click(toggle);
  });

  afterEach(() => {
    store = mockStore({ view: { } });
    rendered.unmount();
  });

  test('showing a popup if notifications have aged without being read', async () => {
    const popup = await screen.findByRole('alert');
    expect(popup).toHaveTextContent(`You have ${numberOfUnreadItems} notifications`);
  });

  test('not showing a popup if notifications are relatively recent', () => {
    rendered.unmount();

    const newsItemsWithRecentMessages = mockNewsData.reduce((accumulator, item) => {
      if (item.read) return [...accumulator, item];
      return [
        ...accumulator,
        {
          ...item,
          additional: {
            ...item.additional,
            created_at: new Date().toISOString(),
          }
        }
      ];
    }, []);

    server.use(
      rest.get(NEWS_API_URL, (req, res, ctx) => {
        return res.once(ctx.json( { data: {
          results: newsItemsWithRecentMessages,
        } }));
      })
    );

    rendered = render(<Provider store={store}>
      <SocketProvider>
        <NotificationMenu />
      </SocketProvider>
    </Provider>);

    const popup = screen.queryByRole('alert');
    expect(popup).not.toBeInTheDocument();
  });
});
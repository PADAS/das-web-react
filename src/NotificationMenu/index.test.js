import mocks from '../__test-helpers/mocks'; /* eslint-disable-line no-unused-vars */
import React from 'react';
import { Provider } from 'react-redux';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import ReactGA from 'react-ga';

import { NEWS_API_URL } from '../ducks/news';
import { uuid } from '../utils/string';

import { mockStore } from '../__test-helpers/MockStore';

import { render, waitFor, waitForElementToBeRemoved, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

import NotificationMenu from './';

ReactGA.initialize('dummy', { testMode: true });

const mockNewsItems = [{
  id: uuid(),
  title: 'howdy there',
  description: 'do you want to earn a shiny new golden EarthRanger badge? Inquire within!',
  link: 'https://earthranger.com/hello/wow',
  read: false,
}, {
  id: uuid(),
  title: 'howdy doody',
  description: 'This message has already been read, but you are welcome to read it again pal',
  link: 'https://earthranger.com/about',
  read: true,
}, {
  id: uuid(),
  title: '123 here we go',
  description: 'having a toddler means a life sentence of listening to "baby shark" until your eyes fall out, and that\'s ok',
  link: 'https://earthranger.com/yep/neat',
  read: false,
}];

const server = setupServer(
  rest.get(NEWS_API_URL, (req, res, ctx) => {
    return res(ctx.json( { data: mockNewsItems }));
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
    <NotificationMenu />
  </Provider>);
});

describe('listing news items', () => {
  let rendered;
  beforeEach(async () => {
    rendered = render(<Provider store={store}>
      <NotificationMenu />
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

    expect(items[0]).toHaveTextContent(mockNewsItems[0].description);
  });

  test('opening a new tab with a link when clicking "read more"', async () => {
    global.open = jest.fn();

    const items = await waitFor(() => screen.getAllByRole('listitem'));
    const readMoreBtn = items[0].querySelector('button');
    userEvent.click(readMoreBtn);

    expect(global.open).toHaveBeenCalledWith(mockNewsItems[0].link, '_blank', 'noopener,noreferrer');
  });

  test('showing a badge with the count of unread items', async () => {
    const unreadBadge = await screen.findByTestId('unread-count');
    
    expect(unreadBadge.textContent).toEqual(mockNewsItems.filter(n => !n.read).length.toString());
  });

  test('showing user notifications from state above news items', async () => {
    store = mockStore(() => ({
      view: {
        userNotifications: [
          {
            message: 'howdy doody',
          }
        ]
      }
    }));
    
    rendered.unmount();

    rendered = render(<Provider store={store}>
      <NotificationMenu />
    </Provider>);

    const toggle = await screen.findByTestId('notification-toggle');
    userEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(4);
      expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('howdy doody');
    });

    const unreadBadge = await screen.findByTestId('unread-count');
    expect(unreadBadge.textContent).toEqual('3');

  });

  test('marks unread news items as "read" when the menu is closed after being viewed', async () => {
    const unreadBadge = await screen.findByTestId('unread-count');
    expect(unreadBadge.textContent).toEqual('2');
    
    /* menu is open from the `beforeEach setup`, click again to close */
    const toggle = await screen.findByTestId('notification-toggle');
    userEvent.click(toggle);

    await waitForElementToBeRemoved(unreadBadge);
  });
});

/* test('dismisses new version messages when its "dismiss" or "confirm" button is clicked', () => {

});

test('shows an error message and a "try again" button if the news API request fails', () => {
  server.use(
    rest.get(NEWS_API_URL, (req, res, ctx) => {
      return res(ctx.status(500));
    })
  );
}); */
import mocks from '../__test-helpers/mocks';
import React from 'react';
import ReactDOM from 'react-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { NEWS_API_URL } from '../ducks/news';

import MockStoreProvider, { store } from '../__test-helpers/MockStore';

import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import NotificationMenu from './';

const mockNewsItems = [{
  title: 'howdy there',
  description: 'do you want to earn a shiny new golden EarthRanger badge? Inquire within!',
  link: 'https://earthranger.com/hello/wow',
  read: false,
}, {
  title: 'howdy doody',
  description: 'This message has already been read, but you are welcome to read it again pal',
  link: 'https://earthranger.com/about',
  read: true,
}, {
  title: '123 here we go',
  description: 'having a toddler means a life sentence of listening to "baby shark" until your eyes fall out, and that\'s ok',
  link: 'https://earthranger.com/yep/neat',
  read: false,
}];

const server = setupServer(
  rest.get(NEWS_API_URL, (req, res, ctx) => {
    return res(ctx.json(mockNewsItems));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('renders without crashing', () => {
  const container = document.createElement('div');
  ReactDOM.render(<MockStoreProvider>
    <NotificationMenu />
  </MockStoreProvider>, container);
});

it('lists news items', () => {
  expect(true).toBe(true); // obviously not a real test
});

it('opens a new tab when clicking the "more" button on a news item', () => {

});

it('notifies of a new earthranger version', () => {

});

it('shows a badge with the count of unread items', () => {

});

it('marks news items as unread when the menu is open, then closed', () => {

});

it('dismisses new version messages when its "dismiss" or "confirm" button is clicked', () => {

});

it('shows an error message and a "try again" button if the news API request fails', () => {
  server.use(
    rest.get(NEWS_API_URL, (req, res, ctx) => {
      return res(ctx.status(500));
    })
  );
});
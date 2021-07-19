import mocks from '../__test-helpers/mocks';
import React from 'react';
import ReactDOM from 'react-dom';

import MockStoreProvider, { store } from '../__test-helpers/MockStore';

import { render, screen } from '@testing-library/react';

import NotificationMenu from './';

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
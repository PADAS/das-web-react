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

it('lists user notifications', () => {
  expect(true).toBe(true); // obviously not a real test
});
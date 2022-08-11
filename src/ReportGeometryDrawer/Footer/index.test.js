import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Footer from './';
import { mockStore } from '../../__test-helpers/MockStore';

describe('Footer', () => {
  let store;

  beforeEach(() => {
    store = {};

    render(
      <Provider store={mockStore(store)}>
        <Footer />
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});

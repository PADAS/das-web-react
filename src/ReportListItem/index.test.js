import React from 'react';
import { Provider } from 'react-redux';
import { mockStore } from '../__test-helpers/MockStore';

import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { eventWithoutPatrol, eventWithPatrol } from '../__test-helpers/fixtures/events';
import NavigationWrapper from '../__test-helpers/navigationWrapper';

import ReportListItem from './';

import { render, screen } from '@testing-library/react';

let store = mockStore({ data: { eventTypes, patrolTypes: [] } });

describe('list item icons', () => {
  test('showing a letter "p" patrol indicator for patrol-affiliated reports', async () => {

    render(
      <Provider store={store}>
        <NavigationWrapper>
          <ReportListItem report={eventWithPatrol} />
        </NavigationWrapper>
      </Provider>);

    const icon = await screen.findByRole('img');
    expect(icon.textContent).toEqual('p');
  });

  test('not showing a patrol indicator for non-patrol-affiliated reports', async () => {

    render(
      <Provider store={store}>
        <NavigationWrapper>
          <ReportListItem report={eventWithoutPatrol} />
        </NavigationWrapper>
      </Provider>);

    const icon = await screen.findByRole('img');
    expect(icon.textContent).toEqual('');
  });
});



import { Provider } from 'react-redux';
import { mockStore } from '../__test-helpers/MockStore';

import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { eventWithoutPatrol, eventWithPatrol } from '../__test-helpers/fixtures/events';
import { render, screen } from '../test-utils';

import ReportListItem from './';


let store = mockStore({ data: { eventTypes, patrolTypes: [] } });

describe('list item icons', () => {
  test('showing a letter "p" patrol indicator for patrol-affiliated reports', async () => {

    render(
      <Provider store={store}>
        <ReportListItem report={eventWithPatrol} />
      </Provider>);

    const icon = await screen.findByRole('img');
    expect(icon.textContent).toEqual('p');
  });

  test('not showing a patrol indicator for non-patrol-affiliated reports', async () => {

    render(
      <Provider store={store}>
        <ReportListItem report={eventWithoutPatrol} />
      </Provider>);

    const icon = await screen.findByRole('img');
    expect(icon.textContent).toEqual('');
  });
});



describe('controls', () => {
  test('makes the icon and the title buttons when they open the report', () => {
    render(<Provider store={store}>
      <ReportListItem onTitleClick={jest.fn()} report={eventWithoutPatrol} showJumpButton={false} />
    </Provider>);

    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  test('renders the icon and the title as text when nothing handles them', () => {
    render(<Provider store={store}>
      <ReportListItem report={eventWithoutPatrol} showJumpButton={false} />
    </Provider>);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../../__test-helpers/MockStore';
import { render, screen } from '../../test-utils';

import IncidentOption from './';

import * as styles from './styles.module.scss';

describe('LinkEventModal - IncidentOption', () => {
  let incident;
  let onAdd;

  beforeEach(() => {
    incident = {
      contains: [{ related_event: { id: 'a' } }, { related_event: { id: 'b' } }],
      event_type: 'incident_collection',
      id: 'incident-id',
      is_collection: true,
      priority: 300,
      serial_number: 201,
      state: 'new',
      title: 'Poaching ring',
      updated_at: '2020-01-01T08:00:00Z',
    };
    onAdd = jest.fn();
  });

  const renderIncidentOption = (props) => render(
    <Provider store={mockStore({ data: { eventTypes: [], patrolTypes: [] }, view: {} })}>
      <ul>
        <IncidentOption incident={incident} onAdd={onAdd} {...props} />
      </ul>
    </Provider>
  );

  test('shows the serial number, title, event count and state of the incident', () => {
    renderIncidentOption();

    const option = screen.getByRole('listitem');

    expect(option).toHaveTextContent('201');
    expect(option).toHaveTextContent('Poaching ring');
    expect(option).toHaveTextContent('2 events');
    expect(option).toHaveTextContent('Active');
  });

  test('colors the incident by its priority', () => {
    renderIncidentOption();

    expect(screen.getByRole('listitem')).toHaveClass(styles.red);
  });

  test('colors an incident without a priority as one with none', () => {
    incident.priority = undefined;

    renderIncidentOption();

    expect(screen.getByRole('listitem')).toHaveClass(styles.none);
  });

  test('does not name a state it does not know', () => {
    incident.state = 'unknown';

    renderIncidentOption();

    expect(screen.getByRole('listitem')).not.toHaveTextContent('Active');
  });

  test('adds the event to the incident when the user clicks its add button', async () => {
    renderIncidentOption();

    await userEvent.click(screen.getByRole('button', { name: 'Add to incident 201 Poaching ring' }));

    expect(onAdd).toHaveBeenCalledWith(incident);
  });

  test('shows the link under way', () => {
    renderIncidentOption({ isAdding: true, isDisabled: true });

    const addButton = screen.getByRole('button', { name: 'Add to incident 201 Poaching ring' });

    expect(addButton).toHaveAttribute('aria-busy', 'true');
    expect(addButton).toHaveAttribute('aria-disabled', 'true');
    expect(addButton).not.toHaveTextContent('Add');
  });
});

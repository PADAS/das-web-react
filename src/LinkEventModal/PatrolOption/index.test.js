import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../../__test-helpers/MockStore';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import { render, screen } from '../../test-utils';

import PatrolOption from './';

import * as styles from './styles.module.scss';

describe('LinkEventModal - PatrolOption', () => {
  const firstLeg = {
    id: 'first-leg',
    leader: null,
    patrol_type: 'dog_patrol',
    time_range: { end_time: '2020-01-01T10:00:00Z', start_time: '2020-01-01T08:00:00Z' },
  };
  const secondLeg = {
    id: 'second-leg',
    leader: null,
    patrol_type: 'routine_patrol',
    time_range: { end_time: null, start_time: '2020-01-01T10:00:00Z' },
  };

  let onAdd;
  let patrol;

  beforeEach(() => {
    onAdd = jest.fn();
    patrol = {
      id: 'patrol-id',
      patrol_segments: [firstLeg, secondLeg],
      serial_number: 101,
      state: 'open',
      title: 'Northern fence',
    };
  });

  const renderPatrolOption = (props) => render(
    <Provider store={mockStore({ data: { patrolTypes }, view: {} })}>
      <ul>
        <PatrolOption onAdd={onAdd} patrol={patrol} {...props} />
      </ul>
    </Provider>
  );

  test('shows the serial number, title and state of the patrol', () => {
    renderPatrolOption();

    const option = screen.getByRole('listitem');

    expect(option).toHaveTextContent('101');
    expect(option).toHaveTextContent('Northern fence');
    expect(option).toHaveTextContent('Active');
    expect(option).toHaveClass(styles.active);
  });

  test('names the leg a patrol of several legs is running', () => {
    renderPatrolOption();

    expect(screen.getByRole('listitem')).toHaveTextContent('Leg 2');
  });

  test('does not name the leg of a patrol with only one', () => {
    patrol.patrol_segments = [{ ...firstLeg, time_range: { end_time: null, start_time: firstLeg.time_range.start_time } }];

    renderPatrolOption();

    expect(screen.getByRole('listitem')).not.toHaveTextContent('Leg');
  });

  test('shows a patrol that ended as done', () => {
    patrol.state = 'done';

    renderPatrolOption();

    expect(screen.getByRole('listitem')).toHaveClass(styles.done);
  });

  test('adds the event to the patrol when the user clicks its add button', async () => {
    renderPatrolOption();

    await userEvent.click(screen.getByRole('button', { name: 'Add to patrol 101 Northern fence' }));

    expect(onAdd).toHaveBeenCalledWith(patrol);
  });

  test('shows the link under way', () => {
    renderPatrolOption({ isAdding: true, isDisabled: true });

    const addButton = screen.getByRole('button', { name: 'Add to patrol 101 Northern fence' });

    expect(addButton).toHaveAttribute('aria-busy', 'true');
    expect(addButton).toHaveAttribute('aria-disabled', 'true');
  });
});

import userEvent from '@testing-library/user-event';

import { render, screen } from '../test-utils';

import CheckMark from './';

describe('CheckMark', () => {
  test('shows a pointer when it takes a click handler', async () => {
    const onClick = jest.fn();
    render(<CheckMark fullyChecked onClick={onClick} />);

    await userEvent.click(screen.getByTitle('Visible'));

    expect(screen.getByTitle('Visible')).toHaveClass('clickable');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('does not show a pointer when it only shows a state', () => {
    render(<CheckMark fullyChecked />);

    expect(screen.getByTitle('Visible')).not.toHaveClass('clickable');
  });
});

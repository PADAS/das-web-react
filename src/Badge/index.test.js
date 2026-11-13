import { render, screen } from '../test-utils';

import Badge from './';

describe('Badge', () => {
  test('shows its count', () => {
    render(<Badge count={3} />);

    expect(screen.getByTestId('badgeIcon')).toHaveTextContent('3');
  });

  test('caps its count at 9+', () => {
    render(<Badge count={10} />);

    expect(screen.getByTestId('badgeIcon')).toHaveTextContent('9+');
  });

  test('shows no count when it is zero', () => {
    render(<Badge count={0} />);

    expect(screen.getByTestId('badgeIcon')).toBeEmptyDOMElement();
  });
});

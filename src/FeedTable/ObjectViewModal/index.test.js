import userEvent from '@testing-library/user-event';

import { render, screen } from '../../test-utils';

import ObjectViewModal from '.';

describe('FeedTable - ObjectViewModal', () => {
  const herd = { leader: { name: 'Matriarch' }, members: [{ name: 'Calf' }, { name: 'Bull' }], size: 12 };

  test('lists the object keys and values', () => {
    render(<ObjectViewModal title="Herd" value={herd} />);

    expect(screen.getByText('size')).toBeVisible();
    expect(screen.getByText('12')).toBeVisible();
    expect(screen.getByRole('button', { name: '2 items' })).toBeVisible();
  });

  test('opens nested values in place and goes back through the path', async () => {
    render(<ObjectViewModal title="Herd" value={herd} />);

    await userEvent.click(screen.getByRole('button', { name: '2 items' }));
    await userEvent.click(screen.getAllByRole('button', { name: 'View' })[1]);

    expect(screen.getByText('Bull')).toBeVisible();
    expect(screen.getByRole('navigation', { name: 'Path' })).toHaveTextContent('Herdmembers2');

    expect(screen.getByText('2')).toHaveAttribute('aria-current', 'location');

    await userEvent.click(screen.getByRole('button', { name: 'Herd' }));

    expect(screen.getByText('size')).toBeVisible();
    expect(screen.queryByRole('navigation', { name: 'Path' })).toBeNull();
  });
});

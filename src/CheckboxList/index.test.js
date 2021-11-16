import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CheckboxList from './';

describe('CheckboxList', () => {
  const onItemClick = jest.fn();
  const items = [{
    checked: true,
    id: 'all',
    value: 'All',
  }, {
    checked: false,
    id: '1',
    value: <div>Option 1</div>,
  }, {
    checked: false,
    id: '2',
    value: <div>Option 2</div>,
  }];
  beforeEach(() => {
    render(<CheckboxList items={items} onItemClick={onItemClick} />);
  });

  test('sets the checkboxes as selected depending on the items prop', async () => {
    const checkboxes = await screen.findAllByRole('checkbox');

    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(false);
    expect(checkboxes[2].checked).toBe(false);
  });

  test('triggers the onItemClick callback when the user clicks a checkbox', async () => {
    const checkboxes = await screen.findAllByRole('checkbox');

    expect(onItemClick).toHaveBeenCalledTimes(0);

    userEvent.click(checkboxes[1]);

    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith(items[1], 1);

    userEvent.click(checkboxes[2]);

    expect(onItemClick).toHaveBeenCalledTimes(2);
    expect(onItemClick).toHaveBeenCalledWith(items[2], 2);
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CheckboxList from './';

describe('CheckboxList', () => {
  const onItemChange = jest.fn();
  const options = [{
    id: 'all',
    value: 'All',
  }, {
    id: '1',
    value: <div>Option 1</div>,
  }, {
    id: '2',
    value: <div>Option 2</div>,
  }];
  beforeEach(() => {
    render(<CheckboxList onItemChange={onItemChange} options={options} values={['all']} />);
  });

  test('sets the checkboxes as selected depending on the values', async () => {
    const checkboxes = await screen.findAllByRole('checkbox');

    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(false);
    expect(checkboxes[2].checked).toBe(false);
  });

  test('triggers the onItemChange callback when the user clicks a checkbox', async () => {
    const checkboxes = await screen.findAllByRole('checkbox');

    expect(onItemChange).toHaveBeenCalledTimes(0);

    userEvent.click(checkboxes[1]);

    expect(onItemChange).toHaveBeenCalledTimes(1);
    expect(onItemChange).toHaveBeenCalledWith(options[1], 1);

    userEvent.click(checkboxes[2]);

    expect(onItemChange).toHaveBeenCalledTimes(2);
    expect(onItemChange).toHaveBeenCalledWith(options[2], 2);
  });
});

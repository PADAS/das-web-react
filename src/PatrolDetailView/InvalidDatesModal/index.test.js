import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import InvalidDatesModal from './';

describe('InvalidDatesModal', () => {
  const onHide = jest.fn();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('triggers onHide the modal when  user clicks Ok', async () => {
    render(<InvalidDatesModal onHide={onHide} show />);

    expect(onHide).toHaveBeenCalledTimes(0);

    const okButton = await screen.findByText('OK');
    userEvent.click(okButton);

    expect(onHide).toHaveBeenCalledTimes(1);
  });
});

import React from 'react';

import TextCopyBtn from './';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

Object.defineProperty(global.navigator, 'clipboard', { value: {
  writeText: jest.fn().mockImplementation(() => Promise.resolve()),
}, configurable: true });

const testString = 'i am being copied';

test('rendering without crashing', () => {
  render(<TextCopyBtn text={testString} />);
});

test('copying to the clipbboard', async () => {
  render(<TextCopyBtn text={testString} />);

  const copyBtn = await screen.findByRole('button');

  expect(global.navigator.clipboard.writeText).not.toHaveBeenCalled();
  
  userEvent.click(copyBtn);

  expect(global.navigator.clipboard.writeText).toHaveBeenCalledWith(testString);
});

test('showing a message on successful copy', async () => {
  render(<TextCopyBtn text={testString} />);

  const copyBtn = await screen.findByRole('button');

  userEvent.click(copyBtn);

  const successMsg = await screen.findByRole('alert');

  expect(successMsg).toBeInTheDocument();
  expect(successMsg.textContent).toBe('Copied to clipboard');

});
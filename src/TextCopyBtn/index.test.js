import React from 'react';

import TextCopyBtn from './';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slide, ToastContainer } from 'react-toastify';

Object.defineProperty(global.navigator, 'clipboard', { value: {
  writeText: jest.fn().mockReturnValue(Promise.resolve()),
}, configurable: true });

const testString = 'i am being copied';

const renderTextCopyBtn = (text = testString) => render(
  <>
    <ToastContainer transition={Slide} />
    <TextCopyBtn text={text} />
  </>
);

test('rendering without crashing', () => {
  renderTextCopyBtn();
});

test('copying to the clipbboard', async () => {
  renderTextCopyBtn();

  const copyBtn = await screen.findByRole('button');

  expect(global.navigator.clipboard.writeText).not.toHaveBeenCalled();

  userEvent.click(copyBtn);

  expect(global.navigator.clipboard.writeText).toHaveBeenCalledWith(testString);
});

test('showing a message on successful copy', async () => {
  renderTextCopyBtn();

  const copyBtn = await screen.findByRole('button');
  userEvent.click(copyBtn);

  const successMsg = await screen.findByRole('alert');
  expect(successMsg).toBeInTheDocument();
  expect(successMsg.textContent).toBe('Copied to clipboard');
});

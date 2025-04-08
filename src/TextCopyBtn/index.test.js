import React from 'react';
import { toast } from 'react-toastify';
import userEvent from '@testing-library/user-event';

import { ReactComponent as LinkIcon } from '../common/images/icons/link.svg';

import { render, screen, waitFor } from '../test-utils';

import TextCopyBtn from './';

jest.mock('react-toastify', () => ({
  ...jest.requireActual('react-toastify'),
  toast: { info: jest.fn() },
}));

describe('TextCopyBtn', () => {
  const renderTextCopyBtn = (props) => render(<TextCopyBtn text="text" {...props} />);

  test('configures the button with other props', () => {
    renderTextCopyBtn({ className: 'className' });

    expect(screen.getByLabelText('Copy to clipboard')).toHaveClass('className');
  });

  test('copies the provided text to the clibpboard when the user clicks the button', async () => {
    renderTextCopyBtn();

    window.navigator.clipboard = { writeText: jest.fn() };

    expect(toast.info).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Copy to clipboard'));

    expect(window.navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith('text');

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledTimes(1);
      expect(toast.info).toHaveBeenCalledWith('Copied to clipboard', {
        autoClose: 2000,
        hideProgressBar: true,
      });
    });
  });

  test('copies the text from the getter function to the clibpboard when the user clicks the button', async () => {
    renderTextCopyBtn({ getText: () => 'text gotten', text: null });

    window.navigator.clipboard = { writeText: jest.fn() };

    expect(toast.info).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Copy to clipboard'));

    expect(window.navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith('text gotten');

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledTimes(1);
      expect(toast.info).toHaveBeenCalledWith('Copied to clipboard', {
        autoClose: 2000,
        hideProgressBar: true,
      });
    });
  });

  test('shows a custom success message', async () => {
    renderTextCopyBtn({ successMessage: 'success message' });

    window.navigator.clipboard = { writeText: jest.fn() };
    userEvent.click(screen.getByLabelText('Copy to clipboard'));

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledTimes(1);
      expect(toast.info).toHaveBeenCalledWith('success message', {
        autoClose: 2000,
        hideProgressBar: true,
      });
    });
  });

  test('shows a custom icon in the button', async () => {
    renderTextCopyBtn({ icon: <LinkIcon /> });

    expect(screen.getByLabelText('Copy to clipboard')).toHaveTextContent('link.svg');
  });

  test('shows a default icon in the button', async () => {
    renderTextCopyBtn();

    expect(screen.getByLabelText('Copy to clipboard')).toHaveTextContent('clipboard-icon.svg');
  });

  test('shows text inside the button', async () => {
    renderTextCopyBtn({ label: 'text' });

    expect(screen.getByLabelText('Copy to clipboard')).toHaveTextContent('text');
  });
});

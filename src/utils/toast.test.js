import React from 'react';
import { toast } from 'react-toastify';

import { DEFAULT_TOAST_CONFIG } from '../constants';
import { showToast } from './toast';
import ToastBody from '../ToastBody';

jest.mock('react-toastify', () => ({
  ...jest.requireActual('react-toastify'),
  toast: jest.fn(),
}));

describe('#showToast', () => {
  test('showing a toast renders the ToastBody component with message, details, link, and configuration', () => {
    const toastObject = {
      message: 'yes',
      details: 'neato',
      link: {
        href: 'https://whatever.bizness',
        title: 'howdy wow',
      },
    };

    showToast(toastObject);

    expect(toast).toHaveBeenCalled();
    expect(toast.mock.calls[0]).toEqual(
      [<ToastBody {...toastObject} />, { ...DEFAULT_TOAST_CONFIG }], /* eslint-disable-line */
    );
  });
});
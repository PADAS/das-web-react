import React from 'react';
import * as toastLib from 'react-toastify';

import { DEFAULT_TOAST_CONFIG } from '../constants';
import { showToast } from './toast';
import ToastBody from '../ToastBody';


describe('#showToast', () => {
  let toastSpy;

  beforeEach(() => {
    toastSpy = jest.fn();
    const mockToastFn = function () {
      return toastSpy;
    };

    jest.spyOn(toastLib, 'toast').mockImplementation(mockToastFn);

    toastLib.toast.TYPE = {
      ERROR: 'error',
    };

  });
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

    expect(toastLib.toast).toHaveBeenCalled();
    expect(toastLib.toast.mock.calls[0]).toEqual(
      [<ToastBody {...toastObject} />, { ...DEFAULT_TOAST_CONFIG }], /* eslint-disable-line */
    );

  });
});
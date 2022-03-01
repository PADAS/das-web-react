import React from 'react';
import * as toastLib from 'react-toastify';

import { act, render } from '@testing-library/react';

import { showToast } from './toast';
import ToastBody from '../ToastBody';


describe('#showToast', () => {
  let toastSpy;

  beforeEach(() => {
    toastSpy = jest.fn();
    const mockToastFn = () => toastSpy;
    mockToastFn.TYPE = {
      ERROR: 'error',
    };

    jest.spyOn(toastLib, 'toast').mockImplementation(mockToastFn);
  });
  test('showing a toast renders the ToastBody component with message, details, and link', () => {
    const toastObject = {
      message: 'yes',
      details: 'neato',
      link: {
        href: 'https://whatever.bizness',
        title: 'howdy wow',
      },
    };

    showToast(toastObject);

    expect(toastLib.toast).toHaveBeenCalledWith(<ToastBody {...toastObject} />);
  });
  test('configuring a toast with the toastConfig argument', () => {

  });
});
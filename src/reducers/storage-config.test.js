import { waitFor } from '@testing-library/react';

import { renderHook } from '../test-utils';
import { useOptionalPersistence } from './storage-config';

describe('useOptionalPersistence', () => {
  let getItemSpy, setItemSpy;
  const storageKey = 'testKey';

  beforeEach(() => {
    getItemSpy = jest.spyOn(global.localStorage.__proto__, 'getItem');
    setItemSpy = jest.spyOn(global.localStorage.__proto__, 'setItem');

    getItemSpy.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with { restore: false } as default persistence config, and use setRestorable to change the state', async () => {
    const { result: { current: { restorable, setRestorable } } } = renderHook(() => useOptionalPersistence(storageKey));

    expect(restorable).toEqual(false);

    setRestorable(true);

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith(`er-web-restorable:${storageKey}`, JSON.stringify({ restore: true }));
    });

  });

  it('should initialize with provided persistence config, and use setRestorable to change the state', async () => {
    const { result: { current: { restorable, setRestorable } } } = renderHook(() => useOptionalPersistence(storageKey, { restore: true }));

    expect(restorable).toEqual(true);

    setRestorable(false);

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith(`er-web-restorable:${storageKey}`, JSON.stringify({ restore: false }));
    });

  });
});
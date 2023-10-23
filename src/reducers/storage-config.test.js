import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useOptionalPersistence } from './storage-config';

describe('useOptionalPersistence', () => {
  let getItemSpy, setItemSpy;
  beforeEach(() => {
    getItemSpy = jest.spyOn(global.localStorage.__proto__, 'getItem');
    setItemSpy = jest.spyOn(global.localStorage.__proto__, 'setItem');

    getItemSpy.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with { restore: false }, and use setRestorable to change the state', async () => {
    const key = 'testKey';
    const { result: { current: { restorable, setRestorable } } } = renderHook(() => useOptionalPersistence(key));

    expect(restorable).toEqual(false);

    setRestorable(true);

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith('er-web-restorable:testKey', JSON.stringify({ restore: true }));
    });

  });
});
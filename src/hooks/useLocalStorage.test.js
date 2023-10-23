import { waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react-hooks';
import useLocalStorage from './useLocalStorage';

describe('useLocalStorage', () => {
  let getItemSpy, setItemSpy, localStorageMockValue = null;
  beforeEach(() => {
    getItemSpy = jest.spyOn(global.localStorage.__proto__, 'getItem');
    setItemSpy = jest.spyOn(global.localStorage.__proto__, 'setItem');

    getItemSpy.mockReturnValue(localStorageMockValue);
    setItemSpy.mockImplementation((_key, val) => {
      localStorageMockValue = val;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorageMockValue = null;
  });

  it('returns the default value when the key is not in localStorage', () => {
    const { result: { current: [value] } } = renderHook(() => useLocalStorage('testKey', { value: 'testValue' }));

    expect(value).toEqual({ value: 'testValue' });
  });

  it('returns the value from localStorage when the key is in localStorage', () => {
    getItemSpy.mockReturnValueOnce(JSON.stringify({ something: 'okie-dokie' }));

    const { result: { current: [value] } } = renderHook(() => useLocalStorage('testKey', { value: 'defaultValue' }));

    expect(value).toEqual({ something: 'okie-dokie' });
  });

  it('updates the value in localStorage when the state is updated', async () => {
    const { result: { current: [, setValue] } } = renderHook(() => useLocalStorage('testKey', { value: 'defaultValue' }));

    expect(global.localStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify({ value: 'defaultValue' }));
    expect(localStorageMockValue).toEqual(JSON.stringify({ value: 'defaultValue' }));

    setValue({ value: 'oh-wow-i-am-new' });

    await waitFor(() => {
      expect(global.localStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify({ value: 'oh-wow-i-am-new' }));
      expect(localStorageMockValue).toEqual(JSON.stringify({ value: 'oh-wow-i-am-new' }));
    });

  });
});
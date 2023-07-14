import { getStoredTab, STORAGE_KEY, storeTab } from './';

describe('AddItemButton - AddItemModal - Utils', () => {
  describe('getStoredTab', () =>  {
    test('retrieves the stored tab from localstorage', () => {
      window.localStorage.setItem(STORAGE_KEY, 'reports');

      expect(getStoredTab()).toBe('reports');

      window.localStorage.setItem(STORAGE_KEY, 'patrols');

      expect(getStoredTab()).toBe('patrols');

      window.localStorage.clear(STORAGE_KEY);
    });
  });

  describe('storeTab', () =>  {
    test('stores the sent tab in localstorage', () => {
      storeTab('reports');

      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('reports');

      storeTab('patrols');

      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('patrols');

      window.localStorage.clear(STORAGE_KEY);
    });
  });
});

export const STORAGE_KEY = 'selectedAddReportTab';

export const storeTab = (tab) => window.localStorage.setItem(STORAGE_KEY, tab);

export const getStoredTab = () => window.localStorage.getItem(STORAGE_KEY);

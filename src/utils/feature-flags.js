import { store } from '../';

export const evaluateFeatureFlag = (flag) => {
  
  try {
    const { view: { systemConfig } } = store.getState();

    return systemConfig[flag];

  } catch (e) {

    return false;
  }
};
import { fetchCurrentUserForRequest } from './user/index.js';

export default (app) => {
  app.use('/preferences*', [fetchCurrentUserForRequest]);
};
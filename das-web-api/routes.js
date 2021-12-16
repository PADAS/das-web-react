

import { preferencesController } from './controllers/index.js';

export default (app) => {
  app.get('/preferences', preferencesController.get);
};
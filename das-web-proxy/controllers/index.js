import { preferencesService } from '../services/index.js';

export const preferencesController = {
  async get(req, res, next) {
    const userId = req?.userData?.id;

    if (!userId) {
      res.sendStatus(404);
    }

    const result = await preferencesService.getUserPreferencesById(userId)
      .catch((error) => {
        next(error);
      });

    res.send(result);
  },
};

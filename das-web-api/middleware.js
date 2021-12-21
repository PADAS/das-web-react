import express from 'express';
import { fetchCurrentUserForRequest } from './user/index.js';

export default (app) => {
  app.use(express.json());
  app.use('/preferences*', [fetchCurrentUserForRequest]);
};
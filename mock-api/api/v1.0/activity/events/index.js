const express = require('express');

const { generateEvent } = require('./utils');

const events = express.Router();

events.get('/', (_, res) => {
  res.json({
    data: {
      results: Array.from({ length: 25 }, generateEvent),
      next: null,
      count: 25,
    },
  });
});

module.exports = events;

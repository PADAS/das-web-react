const express = require('express');

const eventtypes = express.Router();

eventtypes.get('/:eventTypeValue/schema', (_, res) => {
  res.json({ data: {} });
});

module.exports = eventtypes;

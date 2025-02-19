const express = require('express');

const { eventtypesFixture, eventtypeSchemaFixtures } = require('./fixtures');

const eventtypes = express.Router();

eventtypes.get('/', (_, res) => {
  res.json(eventtypesFixture);
});

eventtypes.get('/:eventTypeValue/schema', (req, res) => {
  if (eventtypeSchemaFixtures[req.params.eventTypeValue]) {
    res.json(eventtypeSchemaFixtures[req.params.eventTypeValue]);
  } else {
    res.sendStatus(404);
  }
});

module.exports = eventtypes;

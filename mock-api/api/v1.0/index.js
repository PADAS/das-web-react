const express = require('express');

const events = require('./activity/events');

const apiv1 = express.Router();

apiv1.use('/activity/events', events);

module.exports = apiv1;

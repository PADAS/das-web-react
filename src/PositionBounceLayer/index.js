import React, { memo, Fragment, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Source, Layer } from 'react-mapbox-gl';
import { point } from '@turf/helpers';
import { setCurrentEventLocation } from '../ducks/events';
import { addMapImage } from '../utils/map';

import { withMap } from '../EarthRangerMap';

const PositionBounceLayer = (props) => {
  const { map, eventLocation } = props;

};

const mapStateToProps = (state) => ({
  eventLocation: state.view.userLocation,
});

export default connect(mapStateToProps, { setCurrenEventLocation })(withMap(memo(PositionBounceLayer)));

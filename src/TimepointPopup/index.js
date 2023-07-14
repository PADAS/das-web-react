import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import AddItemButton from '../AddItemButton';
import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';

import { MAP_INTERACTION_CATEGORY } from '../utils/analytics';

export default class TimepointPopup extends PureComponent {
  render() {
    const { data: { geometry, properties } } = this.props;

    const locationObject = {
      longitude: geometry.coordinates[0],
      latitude: geometry.coordinates[1],
    };

    const reportedById = properties.id;

    const time = properties.time;

    return (
      <>
        <h4>{properties.title || properties.name}</h4>
        {properties.time && <DateTime date={properties.time} />}
        <GpsFormatToggle lng={locationObject.longitude} lat={locationObject.latitude} />
        <hr />
        <AddItemButton
          analyticsMetadata={{ category: MAP_INTERACTION_CATEGORY, location: 'track timepoint' }}
          reportData={{ location: locationObject, reportedById, time }}
          showLabel={false}
        />
      </>
    );
  }
}

TimepointPopup.propTypes = {
  data: PropTypes.object.isRequired,
};
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import AddEvent from '../../events/forms/AddEvent';
import DateTime from '../../common/components/date/DateTime';
import GpsFormatToggle from '../../user/preferences/GpsFormatToggle';

export default class TimepointPopup extends PureComponent {
  render() {
    const { data: { geometry, properties }, popoverPlacement } = this.props;

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
        <AddEvent
          analyticsMetadata={{
            category: 'Map Interaction',
            location: 'track timepoint',
          }}
          reportData={{ location: locationObject, reportedById, time }}
          showLabel={false}
          popoverPlacement={popoverPlacement}
        />
      </>
    );
  }
}

TimepointPopup.propTypes = {
  data: PropTypes.object.isRequired,
};
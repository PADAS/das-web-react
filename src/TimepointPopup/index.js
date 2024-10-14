import React from 'react';
import PropTypes from 'prop-types';

import { MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import AddItemButton from '../AddItemButton';
import DateTime from '../DateTime';
import { DAS_HOST } from '../constants';
import GpsFormatToggle from '../GpsFormatToggle';
import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';

import styles from './index.module.scss';

const TimepointPopup = ({ data }) => <>
  <div className={styles.gearIconWrapper}>
    <a target="_blank" rel="noopener noreferrer" href={`${DAS_HOST}/admin/observations/observation/${data.properties.observation_id}/change/`}>
      <GearIcon className={styles.gearIcon} />
    </a>
  </div>

  <h4 className={styles.timePointTitle}>
    {data.properties.title || data.properties.name}
  </h4>

  {data.properties.time && <DateTime date={data.properties.time} />}

  <GpsFormatToggle lat={data.geometry.coordinates[1]} lng={data.geometry.coordinates[0]} />

  <hr />

  <AddItemButton
        analyticsMetadata={{ category: MAP_INTERACTION_CATEGORY, location: 'track timepoint' }}
        reportData={{
            location: {
                latitude: data.geometry.coordinates[1],
                longitude: data.geometry.coordinates[0],
            },
            reportedById: data.properties.id,
            time: data.properties.time,
        }}
        showLabel={false}
    />
</>;

TimepointPopup.propTypes = {
  data: PropTypes.shape({
    geometry: PropTypes.shape({
      coordinates: PropTypes.arrayOf(PropTypes.number)
    }),
    properties: PropTypes.shape({
      id: PropTypes.string,
      observation_id: PropTypes.string,
      name: PropTypes.string,
      time: PropTypes.string,
      title: PropTypes.string,
    }),
  }).isRequired,
};

export default TimepointPopup;

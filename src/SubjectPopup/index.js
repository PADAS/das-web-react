import React, { memo, Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';
import format from 'date-fns/format';

import TimeAgo from '../TimeAgo';
import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';
import TrackLength from '../TrackLength';
import SubjectControls from '../SubjectControls';
import AddReport from '../AddReport';

import { subjectIsARadioWithRecentVoiceActivity } from '../utils/subjects';
import { STANDARD_DATE_FORMAT } from '../utils/datetime';


import styles from './styles.module.scss';

const SubjectPopup = (props) => {
  const { data, map, ...rest } = props;
  const  { geometry, properties } = data;
  const { tracks_available } = properties;
  const coordProps = typeof properties.coordinateProperties === 'string' ? JSON.parse(properties.coordinateProperties) : properties.coordinateProperties;

  const [radioWithRecentMicActivity, setIsRadioWithRecentMicActivity] = useState(subjectIsARadioWithRecentVoiceActivity(properties));

  const locationObject = {
    longitude: geometry.coordinates[0],
    latitude: geometry.coordinates[1],
  };

  const reportedById = properties.id;

  const time = new Date(properties.last_position_date);

  useEffect(() => {
    setIsRadioWithRecentMicActivity(subjectIsARadioWithRecentVoiceActivity(properties));
  }, [properties]);

  return (
    <Popup anchor='bottom' offset={[0, -16]} coordinates={geometry.coordinates} id={`subject-popup-${properties.id}`} {...rest}>
      <h4>{properties.name}</h4>
      {coordProps.time && <DateTime date={coordProps.time} />}
      {<GpsFormatToggle lng={geometry.coordinates[0]} lat={geometry.coordinates[1]} />}
      {radioWithRecentMicActivity && <div className={styles.micActivity}>
        <h5>Mic activity:</h5>
        <div>
          <span>{format(properties.last_voice_call_start_at, STANDARD_DATE_FORMAT)}</span>
          <TimeAgo className={styles.timeAgo} date={new Date(properties.last_voice_call_start_at)} />
        </div>
      </div>}
      {tracks_available && (
        <Fragment>
          {/* @TODO FIX ME TO USE THE RIGHT DATA */}
          <TrackLength className={styles.trackLength} trackId={properties.id} />
          <SubjectControls map={map} showJumpButton={false} subject={properties} className={styles.trackControls} />
          <AddReport className={styles.addReport} reportData={{ location: locationObject, reportedById, time }} showLabel={false} />
        </Fragment>
      )}
    </Popup>
  );
};

export default memo(SubjectPopup);

SubjectPopup.propTypes = {
  data: PropTypes.object.isRequired,
};
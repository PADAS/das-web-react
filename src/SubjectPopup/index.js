import React, { memo, Fragment, useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';
import format from 'date-fns/format';
import Button from 'react-bootstrap/Button';
import isObject from 'lodash/isObject';

import TimeAgo from '../TimeAgo';
import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';
import TrackLength from '../TrackLength';
import SubjectControls from '../SubjectControls';
import AddReport from '../AddReport';

import { subjectIsARadioWithRecentVoiceActivity } from '../utils/subjects';
import { STANDARD_DATE_FORMAT } from '../utils/datetime';

import styles from './styles.module.scss';

const STORAGE_KEY = 'showSubjectDetailsByDefault';

const SubjectPopup = (props) => {
  const { data, map, ...rest } = props;
  const  { geometry, properties } = data;
  const device_status_properties =
      typeof properties?.device_status_properties === 'string' ?
        JSON.parse(properties?.device_status_properties ?? '[]')
        : properties?.device_status_properties;

  const hasAdditionalDeviceProps = !!device_status_properties?.length;
  const { tracks_available } = properties;
  const coordProps = typeof properties.coordinateProperties === 'string' ? JSON.parse(properties.coordinateProperties) : properties.coordinateProperties;

  const [showAdditionalProperties, setShowAdditionalProperties] = useState(window.localStorage.getItem(STORAGE_KEY) === 'true' ? true : false);

  const radioWithRecentMicActivity = useMemo(() =>
    subjectIsARadioWithRecentVoiceActivity(properties)
  , [properties]);

  const toggleShowAdditionalProperties = useCallback(() => {
    setShowAdditionalProperties(!showAdditionalProperties);
    window.localStorage.setItem(STORAGE_KEY, !showAdditionalProperties);
  }, [showAdditionalProperties]);

  const locationObject = {
    longitude: geometry.coordinates[0],
    latitude: geometry.coordinates[1],
  };

  const reportedById = properties.id;

  const time = new Date(properties.last_position_date);

  return (
    <Popup anchor='bottom' offset={[0, -16]} coordinates={geometry.coordinates} id={`subject-popup-${properties.id}`} {...rest}>
      <div className={styles.header}>
        <h4>{properties.name}</h4>
        {coordProps.time && <DateTime date={coordProps.time} />}
      </div>

      <GpsFormatToggle lng={geometry.coordinates[0]} lat={geometry.coordinates[1]} className={styles.gpsFormatToggle} />
      {radioWithRecentMicActivity && <div className={styles.micActivity}>
        <h5>Mic activity:</h5>
        <div>
          <span>{format(properties.last_voice_call_start_at, STANDARD_DATE_FORMAT)}</span>
          <TimeAgo className={styles.timeAgo} date={new Date(properties.last_voice_call_start_at)} />
        </div>
      </div>}
      {tracks_available && <TrackLength className={styles.trackLength} trackId={properties.id} />}
      {hasAdditionalDeviceProps && showAdditionalProperties && <ul className={styles.additionalProperties}>
        {device_status_properties.map(({ label, units, value }, index) =>
          <li key={`${label}-${index}`}>
            <strong>{label}</strong>:&nbsp;
            <span>
              {value}<span className={styles.unit}> {units}</span>
            </span>
          </li>
        )}
      </ul>}
      {hasAdditionalDeviceProps && <Button variant='link' size='sm' type='button' onClick={toggleShowAdditionalProperties} className={styles.toggleAdditionalProps}>{showAdditionalProperties ? '< fewer details' : 'more details >'}</Button>}
      {tracks_available && (
        <Fragment>
          <SubjectControls map={map} showJumpButton={false} subject={properties} className={styles.trackControls} />
          <AddReport 
            analyticsMetadata={{
              category: 'Map Interaction',
              location: 'subject popover',
            }}
            className={styles.addReport} reportData={{ location: locationObject, reportedById, time }} showLabel={false} />
        </Fragment>
      )}
    </Popup>
  );
};

export default memo(SubjectPopup);

SubjectPopup.propTypes = {
  data: PropTypes.object.isRequired,
};
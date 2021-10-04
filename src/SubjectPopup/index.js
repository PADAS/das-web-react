import React, { memo, Fragment, useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import format from 'date-fns/format';
import Button from 'react-bootstrap/Button';

import TimeAgo from '../TimeAgo';
import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';
import TrackLength from '../TrackLength';
import SubjectControls from '../SubjectControls';
import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';
import AddReport from '../AddReport';

import { showPopup } from '../ducks/popup';

import { subjectIsARadioWithRecentVoiceActivity } from '../utils/subjects';
import { STANDARD_DATE_FORMAT } from '../utils/datetime';

import styles from './styles.module.scss';

const STORAGE_KEY = 'showSubjectDetailsByDefault';

const SubjectPopup = (props) => {
  const { data, map, showPopup } = props;
  const  { geometry, properties } = data;

  const device_status_properties =
      typeof properties?.device_status_properties === 'string' ?
        JSON.parse(properties?.device_status_properties ?? '[]')
        : properties?.device_status_properties;

  const { tracks_available } = properties;
  const coordProps = typeof properties.coordinateProperties === 'string' ? JSON.parse(properties.coordinateProperties) : properties.coordinateProperties;

  const hasAdditionalDeviceProps = !!device_status_properties?.length;
  const additionalPropsShouldBeToggleable = hasAdditionalDeviceProps && device_status_properties.length > 2;
  const [additionalPropsToggledOn, toggleAdditionalPropsVisibility] = useState(window.localStorage.getItem(STORAGE_KEY) === 'true' ? true : false);

  const showAdditionalProps = hasAdditionalDeviceProps &&
    (additionalPropsShouldBeToggleable ? additionalPropsToggledOn : true);

  const isMessageable = !!properties?.messaging?.length;

  const radioWithRecentMicActivity = useMemo(() =>
    subjectIsARadioWithRecentVoiceActivity(properties)
  , [properties]);

  const toggleShowAdditionalProperties = useCallback(() => {
    toggleAdditionalPropsVisibility(!additionalPropsToggledOn);
    window.localStorage.setItem(STORAGE_KEY, !additionalPropsToggledOn);
  }, [additionalPropsToggledOn]);

  const onClickMessagingIcon = useCallback(() => {
    showPopup('subject-messages', { geometry, properties, coordinates: geometry.coordinates });
  }, [geometry, properties, showPopup]);

  const locationObject = {
    longitude: geometry.coordinates[0],
    latitude: geometry.coordinates[1],
  };

  const reportedById = properties.id;

  return <>
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
    {hasAdditionalDeviceProps && showAdditionalProps && <ul data-testid='additional-props' className={styles.additionalProperties}>
      {device_status_properties.map(({ label, units, value }, index) =>
        <li key={`${label}-${index}`}>
          <strong>{label}</strong>:&nbsp;
          <span>
            {value}<span className={styles.unit}> {units}</span>
          </span>
        </li>
      )}
    </ul>}
    {hasAdditionalDeviceProps && additionalPropsShouldBeToggleable && <Button data-testid='additional-props-toggle-btn' variant='link' size='sm' type='button' onClick={toggleShowAdditionalProperties} className={styles.toggleAdditionalProps}>{additionalPropsToggledOn ? '< fewer details' : 'more details >'}</Button>}
    {tracks_available && (
      <Fragment>
        <SubjectControls map={map} showMessageButton={false} showJumpButton={false} subject={properties} className={styles.trackControls} />
        <div className={styles.controls}>
          <AddReport
            analyticsMetadata={{
              category: 'Map Interaction',
              location: 'subject popover',
            }}
            className={styles.addReport} reportData={{ location: locationObject, reportedById }} showLabel={false} />
          {isMessageable && <Button variant='link' type='button' onClick={onClickMessagingIcon}>
            <ChatIcon className={styles.messagingIcon} />
          </Button>}
        </div>
      </Fragment>
    )}
  </>;
};

export default connect(null, { showPopup })(memo(SubjectPopup));

SubjectPopup.propTypes = {
  data: PropTypes.object.isRequired,
};
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
import AddReport from '../AddReport';

import { subjectIsARadioWithRecentVoiceActivity, subjectIsStatic } from '../utils/subjects';
import { STANDARD_DATE_FORMAT } from '../utils/datetime';
import { MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import styles from './styles.module.scss';

const STORAGE_KEY = 'showSubjectDetailsByDefault';

const SubjectPopup = ({ data, popoverPlacement, timeSliderState }) => {
  const  { geometry, properties } = data;
  const  { active: isTimeSliderActive } = timeSliderState;

  const device_status_properties =
      typeof properties?.device_status_properties === 'string' ?
        JSON.parse(properties?.device_status_properties ?? '[]')
        : properties?.device_status_properties;

  const { tracks_available } = properties;
  const coordProps = typeof properties.coordinateProperties === 'string' ? JSON.parse(properties.coordinateProperties) : properties.coordinateProperties;

  const isStatic = subjectIsStatic(data);

  const hasAdditionalDeviceProps = !!device_status_properties?.length;
  const additionalPropsShouldBeToggleable = hasAdditionalDeviceProps && device_status_properties.length > 2 && !isStatic;
  const [additionalPropsToggledOn, toggleAdditionalPropsVisibility] = useState(window.localStorage.getItem(STORAGE_KEY) === 'true' ? true : false);

  const showAdditionalProps = hasAdditionalDeviceProps &&
    (additionalPropsShouldBeToggleable ? additionalPropsToggledOn : true);

  const radioWithRecentMicActivity = useMemo(() =>
    subjectIsARadioWithRecentVoiceActivity(properties)
  , [properties]);

  const toggleShowAdditionalProperties = useCallback(() => {
    toggleAdditionalPropsVisibility(!additionalPropsToggledOn);
    window.localStorage.setItem(STORAGE_KEY, !additionalPropsToggledOn);
  }, [additionalPropsToggledOn]);

  const locationObject = {
    longitude: geometry.coordinates[0],
    latitude: geometry.coordinates[1],
  };

  const reportedById = properties.id;

  return <>
    <div className={styles.header}>
      <div>
        <div className={styles.defaultStatusProperty}>
          {properties.default_status_value && <>
            {properties.image && <img src={properties.image} alt={`Subject icon for ${properties.name}`} />}
            <span data-testid='header-default-status-property'>{properties.default_status_value}</span>
          </>}
          <h6>{properties.name}</h6>
        </div>
        <AddReport
          analyticsMetadata={{
            category: MAP_INTERACTION_CATEGORY,
            location: 'subject popover',
          }}
          className={styles.addReport}
          variant="secondary"
          reportData={{ location: locationObject, reportedById }}
          showLabel={false}
          popoverPlacement={popoverPlacement}
        />
      </div>
      {coordProps.time && <div className={styles.dateTimeWrapper}>
        <DateTime date={coordProps.time} className={styles.dateTimeDetails} showElapsed={false}/>
        <span className={styles.dateTimeComma}>, </span>
        <TimeAgo className={styles.timeAgo} date={coordProps.time} suffix="ago" />
      </div>}
    </div>

    <GpsFormatToggle lng={geometry.coordinates[0]} lat={geometry.coordinates[1]} className={styles.gpsFormatToggle} />
    {radioWithRecentMicActivity && <div className={styles.micActivity}>
      <h5>Mic activity</h5>
      <div>
        <span>{format(properties.last_voice_call_start_at, STANDARD_DATE_FORMAT)}</span>
        <TimeAgo className={styles.timeAgo} date={new Date(properties.last_voice_call_start_at)} suffix="ago" />
      </div>
    </div>}
    {tracks_available && <TrackLength className={styles.trackLength} trackId={properties.id} />}
    {hasAdditionalDeviceProps && showAdditionalProps && <ul data-testid='additional-props' className={`${styles.additionalProperties} ${isTimeSliderActive} ? ${styles.disabled} : ''`}>
      {device_status_properties.map(({ label, units, value }, index) =>
        <li key={`${label}-${index}`}>
          <strong>{label}</strong>
          {isTimeSliderActive ?  <span>No historical data</span> : <span data-testid='additional-props-value'>
            {value.toString()}<span className={styles.unit}> {units}</span>
          </span>}
        </li>
      )}
    </ul>}
    {hasAdditionalDeviceProps && <>
      {additionalPropsShouldBeToggleable && <Button data-testid='additional-props-toggle-btn' variant='link' size='sm' type='button' onClick={toggleShowAdditionalProperties} className={styles.toggleAdditionalProps}>{additionalPropsToggledOn ? '< fewer details' : 'more details >'}</Button>}
    </>}
    <Fragment>
      <SubjectControls className={styles.controls} showHistoryButton={hasAdditionalDeviceProps} showJumpButton={false} subject={properties} />
    </Fragment>
  </>;
};

const mapStateToProps = ({ view: { timeSliderState } }) => ({ timeSliderState });
export default connect(mapStateToProps, null)(memo(SubjectPopup));

SubjectPopup.propTypes = {
  data: PropTypes.object.isRequired,
};
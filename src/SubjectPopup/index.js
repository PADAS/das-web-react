import React, { memo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import Button from 'react-bootstrap/Button';

import { MAP_INTERACTION_CATEGORY } from '../utils/analytics';
import { STANDARD_DATE_FORMAT } from '../utils/datetime';
import { subjectIsARadioWithRecentVoiceActivity, subjectIsStatic } from '../utils/subjects';

import AddItemButton from '../AddItemButton';
import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';
import SubjectControls from '../SubjectControls';
import TimeAgo from '../TimeAgo';
import TrackLength from '../TrackLength';

import styles from './styles.module.scss';

const STORAGE_KEY = 'showSubjectDetailsByDefault';

const SubjectPopup = ({ data }) => {
  const { t } = useTranslation('subjects', { keyPrefix: 'subjectPopup' });

  const isTimeSliderActive = useSelector((state) => state.view.timeSliderState.active);

  const [additionalPropsToggledOn, toggleAdditionalPropsVisibility] = useState(
    window.localStorage.getItem(STORAGE_KEY) === 'true'
  );

  const { geometry, properties } = data;
  const isStatic = subjectIsStatic(data);

  const coordProps = typeof properties.coordinateProperties === 'string'
    ? JSON.parse(properties.coordinateProperties)
    : properties.coordinateProperties;
  const device_status_properties = typeof properties?.device_status_properties === 'string'
    ? JSON.parse(properties?.device_status_properties ?? '[]')
    : properties?.device_status_properties;
  const radioWithRecentMicActivity = subjectIsARadioWithRecentVoiceActivity(properties);
  const { tracks_available } = properties;

  const hasAdditionalDeviceProps = !!device_status_properties?.length;
  const additionalPropsShouldBeToggleable = hasAdditionalDeviceProps
    && device_status_properties.length > 2
    && !isStatic;
  const showAdditionalProps = hasAdditionalDeviceProps
    && (additionalPropsShouldBeToggleable ? additionalPropsToggledOn : true);

  const toggleShowAdditionalProperties = useCallback(() => {
    toggleAdditionalPropsVisibility(!additionalPropsToggledOn);

    window.localStorage.setItem(STORAGE_KEY, !additionalPropsToggledOn);
  }, [additionalPropsToggledOn]);

  return <>
    <div className={styles.header}>
      <div>
        <div className={styles.defaultStatusProperty}>
          {properties.default_status_value && <>
            {properties.image && <img alt={t('subjectIconAlt', { name: properties.name })} src={properties.image} />}

            <span data-testid="header-default-status-property">{properties.default_status_value}</span>
          </>}

          <h6>{properties.name}</h6>
        </div>

        <AddItemButton
          analyticsMetadata={{ category: MAP_INTERACTION_CATEGORY, location: 'subject popover' }}
          className={styles.addReport}
          reportData={{
            location: {
              longitude: geometry.coordinates[0],
              latitude: geometry.coordinates[1],
            },
            related_subjects: [properties.id],
            reportedById: properties.id,
          }}
          showLabel={false}
          variant="secondary"
        />
      </div>

      {coordProps.time && <div className={styles.dateTimeWrapper}>
        <DateTime className={styles.dateTimeDetails} date={coordProps.time} showElapsed={false}/>

        <span className={styles.dateTimeComma}>, </span>

        <TimeAgo className={styles.timeAgo} date={coordProps.time} suffix={t('dateTimeSuffix')} />
      </div>}
    </div>

    <GpsFormatToggle className={styles.gpsFormatToggle} lat={geometry.coordinates[1]} lng={geometry.coordinates[0]} />

    {radioWithRecentMicActivity && <div className={styles.micActivity}>
      <h5>{t('micActivityHeader')}</h5>

      <div>
        <span>{format(properties.last_voice_call_start_at, STANDARD_DATE_FORMAT)}</span>

        <TimeAgo
          className={styles.timeAgo}
          date={new Date(properties.last_voice_call_start_at)}
          suffix={t('dateTimeSuffix')}
        />
      </div>
    </div>}

    {tracks_available && <TrackLength className={styles.trackLength} trackId={properties.id} />}

    {hasAdditionalDeviceProps && showAdditionalProps && <ul
        className={`${styles.additionalProperties} ${isTimeSliderActive ? styles.disabled : ''}`}
        data-testid="additional-props"
      >
      {device_status_properties.map((deviceStatusProperty, index) => <li
          key={`${deviceStatusProperty.label}-${index}`}
        >
        <strong>{deviceStatusProperty.label}</strong>

        {isTimeSliderActive ? <span>{t('noHistoricalDataSpan')}</span> : <span data-testid="additional-props-value">
          {deviceStatusProperty.value.toString()}

          <span className={styles.unit}> {deviceStatusProperty.units}</span>
        </span>}
      </li>)}
    </ul>}

    {hasAdditionalDeviceProps && <>
      {additionalPropsShouldBeToggleable && <Button
          className={styles.toggleAdditionalProps}
          data-testid="additional-props-toggle-btn"
          onClick={toggleShowAdditionalProperties}
          size="sm"
          type="button"
          variant="link"
        >
        {t(`additionalPropsButton.${additionalPropsToggledOn ? 'fewer' : 'more'}`)}
      </Button>}
    </>}

    <SubjectControls
      className={styles.controls}
      showHistoryButton={hasAdditionalDeviceProps}
      showJumpButton={false}
      subject={properties}
    />
  </>;
};

SubjectPopup.propTypes = {
  data: PropTypes.shape({
    geometry: PropTypes.shape({
      coordinates: PropTypes.arrayOf(PropTypes.number)
    }),
    properties: PropTypes.shape({
      coordinateProperties: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      default_status_value: PropTypes.string,
      device_status_properties: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
      id: PropTypes.string,
      image: PropTypes.string,
      last_voice_call_start_at: PropTypes.string,
      name: PropTypes.string,
      tracks_available: PropTypes.bool,
    })
  }).isRequired,
};

export default memo(SubjectPopup);

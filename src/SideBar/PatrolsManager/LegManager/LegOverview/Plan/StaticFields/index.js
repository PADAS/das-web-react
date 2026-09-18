import React from 'react';
import { isFuture } from 'date-fns';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as MarkerFeedIcon } from '../../../../../../common/images/icons/marker-feed.svg';

import { calcUrlForImage } from '../../../../../../utils/img';
import {
  displayEndTimeForPatrolSegment,
  displayStartTimeForPatrolSegment,
  getTeamAndTrackingForPatrolSegment,
  hasPatrolSegmentNotRun,
  scheduledEndTimeForPatrolSegment,
} from '../../../../../../utils/patrols';
import { EMPTY_VALUE } from '../../../../../../constants';
import { format, STANDARD_DATE_FORMAT } from '../../../../../../utils/datetime';
import { selectPatrolRosterFallbackSubjects } from '../../../../../../selectors/patrols';
import useJumpToLocation from '../../../../../../hooks/useJumpToLocation';
import useStringifyCoordinates from '../../../../../../hooks/useStringifyCoordinates';

import SvgIcon from '../../../../../../SvgIcon';
import TextCopyBtn from '../../../../../../TextCopyBtn';

import * as styles from './styles.module.scss';

const JUMP_TO_LOCATION_ZOOM = 17;

const Location = ({ fieldLabel, value }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'legOverview.plan.staticFields' });

  const jumpToLocation = useJumpToLocation();

  const { coordinatesString } = useStringifyCoordinates(value);

  if (!value) {
    return null;
  }

  return <span className={styles.location}>
    <span className={styles.coordinates}>{coordinatesString}</span>

    <TextCopyBtn
      aria-label={t('copyCoordinatesButtonLabel', { field: fieldLabel })}
      className={styles.locationButton}
      successMessage={t('copyCoordinatesMessage')}
      text={coordinatesString}
      title={t('copyCoordinatesButtonLabel', { field: fieldLabel })}
    />

    <button
      aria-label={t('jumpToLocationButtonLabel', { field: fieldLabel })}
      className={styles.locationButton}
      onClick={() => jumpToLocation([value.longitude, value.latitude], JUMP_TO_LOCATION_ZOOM)}
      title={t('jumpToLocationButtonLabel', { field: fieldLabel })}
      type="button"
    >
      <MarkerFeedIcon aria-hidden="true" />
    </button>
  </span>;
};

const StaticFields = ({ patrol, patrolSegment }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'legOverview.plan.staticFields' });

  const rosterFallbackSubjects = useSelector((state) => selectPatrolRosterFallbackSubjects(state, patrol));
  const teamAndTrackingOptions = useSelector((state) => state.data.patrolTeamAndTrackingOptions);

  const hasNotRun = hasPatrolSegmentNotRun(patrol, patrolSegment);

  // A closed patrol can leave legs with an end earlier than their own start, so
  // a leg that never ran shows the end it was scheduled for instead.
  const endDateTime = hasNotRun
    ? scheduledEndTimeForPatrolSegment(patrolSegment)
    : displayEndTimeForPatrolSegment(patrolSegment);
  const startDateTime = displayStartTimeForPatrolSegment(patrolSegment);

  // A leg carries the times it is due to run at before it runs, so the moment
  // alone does not say it happened: only a time_range value already past does.
  const isStartPlanned = !patrolSegment.time_range?.start_time || isFuture(startDateTime);
  const isEndPlanned = hasNotRun || !patrolSegment.time_range?.end_time || isFuture(endDateTime);

  const teamAndTracking = getTeamAndTrackingForPatrolSegment(
    patrolSegment,
    teamAndTrackingOptions,
    rosterFallbackSubjects
  );

  const renderTimeField = (label, dateTime, isPlanned, location) => <div className={styles.field}>
    <dt className={styles.fieldLabel}>{label}</dt>

    <dd className={styles.fieldValue}>
      {dateTime
        ? <>
          <time dateTime={dateTime.toISOString()}>{format(dateTime, STANDARD_DATE_FORMAT)}</time>

          {!!isPlanned && <span className={styles.scheduledIndicator}>{t('scheduledIndicator')}</span>}
        </>
        : EMPTY_VALUE}

      <Location fieldLabel={label} value={location} />
    </dd>
  </div>;

  const renderTextField = (label, value) => <div className={styles.field}>
    <dt className={styles.fieldLabel}>{label}</dt>

    <dd className={styles.fieldValue}>{value || EMPTY_VALUE}</dd>
  </div>;

  const renderSubject = (subject, isLead = false) => <>
    <span className={styles.subjectIcon}>
      {!!subject.image_url && <SvgIcon imageUrl={calcUrlForImage(subject.image_url)} type="subjects" />}
    </span>

    <span className={styles.subjectText}>
      {subject.name}

      {!!isLead && <span className={styles.subjectLeadIndicator}>{t('teamLeadIndicator')}</span>}
    </span>
  </>;

  const renderSubjectField = (label, subject) => <div className={styles.field}>
    <dt className={styles.fieldLabel}>{label}</dt>

    <dd className={styles.fieldValue}>
      {subject
        ? <span className={styles.subject}>{renderSubject(subject)}</span>
        : EMPTY_VALUE}
    </dd>
  </div>;

  const renderSubjectListField = (label, subjects) => <div className={styles.field}>
    <dt className={styles.fieldLabel}>{label}</dt>

    <dd className={styles.fieldValue}>
      {subjects.length > 0
        ? <ul className={styles.subjectList}>
          {subjects.map((subject) => <li className={styles.subject} key={subject.id}>
            {renderSubject(subject, subject.id === patrolSegment.leader?.id)}
          </li>)}
        </ul>
        : EMPTY_VALUE}
    </dd>
  </div>;

  return <div className={styles.staticFields}>
    <div className={styles.columns}>
      <dl className={styles.column}>
        {renderTimeField(t('startLabel'), startDateTime, isStartPlanned, patrolSegment.start_location)}
      </dl>

      <dl className={styles.column}>
        {renderTimeField(t('endLabel'), endDateTime, isEndPlanned, patrolSegment.end_location)}
      </dl>
    </div>

    <div className={styles.columns}>
      <dl className={styles.column}>
        {renderTextField(t('teamLabel'), teamAndTracking.team?.display)}

        {renderSubjectListField(t('teamMembersLabel'), teamAndTracking.members)}
      </dl>

      <dl className={styles.column}>
        {renderSubjectField(t('teamLeadLabel'), patrolSegment.leader)}

        {renderSubjectListField(t('assetsLabel'), teamAndTracking.assets)}
      </dl>
    </div>
  </div>;
};

export default StaticFields;

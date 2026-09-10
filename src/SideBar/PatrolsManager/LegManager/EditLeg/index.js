import React, { useCallback, useEffect, useId, useState } from 'react';
import isEqual from 'react-fast-compare';
import { isSameMinute } from 'date-fns';
import { pickBy } from 'lodash-es';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';

import buildLegDraft from '../../utils/buildLegDraft';
import buildLegSegment from '../../LegForm/utils/buildLegSegment';
import {
  canEditPatrolSegment,
  earliestStartForEditedPatrolSegment,
  latestEndForEditedPatrolSegment,
} from '../../../../utils/patrols';
import { EDIT_LEG_CATEGORY, TrackerContext, trackEventFactory } from '../../../../utils/analytics';
import { TAB_KEYS } from '../../../../constants';
import { updatePatrol } from '../../../../ducks/patrols';
import useNavigate from '../../../../hooks/useNavigate';
import { usePatrolsPermissions } from '../../../../hooks/usePermissions';
import usePatrolState from '../../../../hooks/usePatrolState';

import DetailViewLoader from '../../DetailViewLoader';
import Footer from './Footer';
import Header from './Header';
import LegForm from '../../LegForm';
import NavigationPromptModal from '../../../../NavigationPromptModal';

import * as styles from './styles.module.scss';

const editLegTracker = trackEventFactory(EDIT_LEG_CATEGORY);

// The form reads and writes whole minutes, so a time it hands back on the same
// minute the leg was stamped on is that stamp, and goes back with its seconds.
const timeKeepingItsSeconds = (time, storedTime) => {
  const isStillTheStoredTime = !!time && !!storedTime && isSameMinute(new Date(time), new Date(storedTime));

  return isStillTheStoredTime ? storedTime : time;
};

const segmentKeepingItsSeconds = (segment, storedSegment) => ({
  ...segment,
  time_range: {
    end_time: timeKeepingItsSeconds(segment.time_range.end_time, storedSegment.time_range?.end_time),
    start_time: timeKeepingItsSeconds(segment.time_range.start_time, storedSegment.time_range?.start_time),
  },
});

// The API merges a leg into the one it holds by id, so an edit sends the fields
// the user changed and leaves the leg's every other field as it stands.
const buildEditLegUpdate = (patrol, patrolSegment, { initialLeg, isFirstLeg, leg }) => {
  const segmentAsEdited = segmentKeepingItsSeconds(buildLegSegment(leg, { isFirstLeg }), patrolSegment);
  const segmentAsOpened = segmentKeepingItsSeconds(buildLegSegment(initialLeg, { isFirstLeg }), patrolSegment);

  return {
    id: patrol.id,
    patrol_segments: [{
      ...pickBy(segmentAsEdited, (value, field) => !isEqual(value, segmentAsOpened[field])),
      id: patrolSegment.id,
    }],
  };
};

const EditLegContent = ({ patrol, patrolSegment }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation('patrols', { keyPrefix: 'editLeg' });

  const { hasPatrolsUpdatePermission } = usePatrolsPermissions();
  const legState = usePatrolState(patrol, patrolSegment);

  const patrolTeamAndTrackingOptions = useSelector((state) => state.data.patrolTeamAndTrackingOptions);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const legFormId = useId();

  const [hasSavedLeg, setHasSavedLeg] = useState(false);
  const [initialLeg, setInitialLeg] = useState(
    () => buildLegDraft(patrolSegment, patrolTypes, patrolTeamAndTrackingOptions)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [leg, setLeg] = useState(initialLeg);

  const canEditLeg = hasPatrolsUpdatePermission && canEditPatrolSegment(patrol, legState);

  const hasUnsavedChanges = !isEqual(leg, initialLeg);

  const patrolSegmentIndex = patrol.patrol_segments.indexOf(patrolSegment);

  const isFirstLeg = patrolSegmentIndex === 0;

  const legOverviewPath = `/${TAB_KEYS.PATROLS}/${patrol.id}/legs/${patrolSegment.id}`;

  const nextPatrolSegment = patrol.patrol_segments[patrolSegmentIndex + 1] ?? null;
  const previousPatrolSegment = patrolSegmentIndex > 0 ? patrol.patrol_segments[patrolSegmentIndex - 1] : null;

  // The legs around this one hold their ground: an edit moves this leg within
  // the room they leave it.
  const earliestStartDateTime = earliestStartForEditedPatrolSegment(patrolSegment, previousPatrolSegment);
  const latestEndDateTime = latestEndForEditedPatrolSegment(patrolSegment, nextPatrolSegment);

  const onChangeLeg = useCallback((legChanges, { isDefaultData = false } = {}) => {
    // A schema form populates its defaults before the user can touch it, so
    // they belong to the leg as it was handed over, not to an edit of it.
    if (isDefaultData) {
      setInitialLeg((prevInitialLeg) => ({ ...prevInitialLeg, ...legChanges }));
    }

    setLeg((prevLeg) => ({ ...prevLeg, ...legChanges }));
  }, []);

  const onSubmit = async () => {
    editLegTracker.track('Click the "Save" button in edit leg');

    setIsSaving(true);

    try {
      await dispatch(updatePatrol(
        buildEditLegUpdate(patrol, patrolSegment, { initialLeg, isFirstLeg, leg })
      ));

      editLegTracker.track('Edited a leg of a patrol from edit leg');

      setHasSavedLeg(true);
    } catch (error) {
      toast.error(t('saveErrorMessage'));

      editLegTracker.track('Error editing a leg of a patrol from edit leg');

      console.warn('Error editing a leg of a patrol: ', error);

      setIsSaving(false);
    }
  };

  const onContinueNavigation = useCallback(() => {
    editLegTracker.track('Discard unsaved changes and navigate away from edit leg');

    return true;
  }, []);

  useEffect(() => {
    // This route is reachable by its url alone.
    if (!canEditLeg) {
      navigate(legOverviewPath, { replace: true });
    }
  }, [canEditLeg, legOverviewPath, navigate]);

  useEffect(() => {
    // Navigating from an effect instead of the save method to make sure the
    // navigation blocker is freed after the leg is saved.
    if (hasSavedLeg) {
      navigate(legOverviewPath, { replace: true });
    }
  }, [hasSavedLeg, legOverviewPath, navigate]);

  if (!canEditLeg) {
    return <DetailViewLoader />;
  }

  return <TrackerContext.Provider value={editLegTracker}>
    <NavigationPromptModal
      onContinue={onContinueNavigation}
      showPositiveContinueButton={false}
      when={hasUnsavedChanges && !isSaving}
    />

    <div className={styles.editLeg}>
      <Header legNumber={patrolSegmentIndex + 1} legState={legState} patrol={patrol} patrolSegment={patrolSegment} />

      <div className={styles.body}>
        <LegForm
          earliestStartDateTime={earliestStartDateTime}
          formId={legFormId}
          isFirstLeg={isFirstLeg}
          latestEndDateTime={latestEndDateTime}
          leg={leg}
          onChangeLeg={onChangeLeg}
          onSubmit={onSubmit}
          patrolId={patrol.id}
        />
      </div>

      <Footer
        disableSaveButton={!hasUnsavedChanges}
        formId={legFormId}
        isSaving={isSaving}
        legId={patrolSegment.id}
        patrolId={patrol.id}
      />
    </div>
  </TrackerContext.Provider>;
};

const EditLeg = ({ patrol }) => {
  const navigate = useNavigate();
  const { legId } = useParams();

  const patrolSegment = patrol.patrol_segments.find((patrolSegment) => patrolSegment.id === legId) ?? null;

  useEffect(() => {
    // This route is reachable by its url alone.
    if (!patrolSegment) {
      navigate(`/${TAB_KEYS.PATROLS}/${patrol.id}`, { replace: true });
    }
  }, [navigate, patrol.id, patrolSegment]);

  // Keyed by leg, so what the user typed into one does not follow them to the
  // next.
  return patrolSegment
    ? <EditLegContent key={patrolSegment.id} patrol={patrol} patrolSegment={patrolSegment} />
    : <DetailViewLoader />;
};

export default EditLeg;

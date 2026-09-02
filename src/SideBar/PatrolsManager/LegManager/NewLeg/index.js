import React, { useCallback, useEffect, useId, useState } from 'react';
import isEqual from 'react-fast-compare';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import buildAddLegUpdate from './utils/buildAddLegUpdate';
import buildNewLegDraft from './utils/buildNewLegDraft';
import {
  canPatrolTakeNewLegs,
  displayTitleForPatrol,
  earliestStartAfterPatrolSegment,
  governingPatrolSegment,
} from '../../../../utils/patrols';
import { NEW_LEG_CATEGORY, TrackerContext, trackEventFactory } from '../../../../utils/analytics';
import { TAB_KEYS } from '../../../../constants';
import { updatePatrol } from '../../../../ducks/patrols';
import { updateUserPreferences } from '../../../../ducks/user-preferences';
import useNavigate from '../../../../hooks/useNavigate';
import { usePatrolsPermissions } from '../../../../hooks/usePermissions';
import usePatrolState from '../../../../hooks/usePatrolState';

import Footer from './Footer';
import Header from './Header';
import LegForm from '../../LegForm';
import NavigationPromptModal from '../../../../NavigationPromptModal';

import * as styles from './styles.module.scss';

const newLegTracker = trackEventFactory(NEW_LEG_CATEGORY);

const NewLeg = ({ patrol }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation('patrols', { keyPrefix: 'newLeg' });

  const { hasPatrolsUpdatePermission } = usePatrolsPermissions();
  const patrolState = usePatrolState(patrol);

  const autoEndPatrols = useSelector((state) => state.view.userPreferences.autoEndPatrols);
  const autoStartPatrols = useSelector((state) => state.view.userPreferences.autoStartPatrols);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const legFormId = useId();

  const previousLeg = patrol.patrol_segments.at(-1) ?? null;

  const [hasAddedLeg, setHasAddedLeg] = useState(false);
  const [initialLeg] = useState(() => buildNewLegDraft({
    isAutoEnd: autoEndPatrols,
    isAutoStart: autoStartPatrols,
    patrolTypes,
    previousLeg,
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [leg, setLeg] = useState(initialLeg);

  const canAddLeg = hasPatrolsUpdatePermission && canPatrolTakeNewLegs(patrol, patrolState);

  const hasUnsavedChanges = !isEqual(leg, initialLeg);

  const earliestStartDateTime = previousLeg ? earliestStartAfterPatrolSegment(previousLeg) : null;

  const patrolTitle = displayTitleForPatrol(patrol, governingPatrolSegment(patrol)?.leader);

  const onChangeLeg = useCallback((legChanges) => {
    // Whether a patrol starts and ends by itself is a preference the next
    // leg the user plans inherits.
    if ('isAutoEnd' in legChanges) {
      dispatch(updateUserPreferences({ autoEndPatrols: legChanges.isAutoEnd }));
    }
    if ('isAutoStart' in legChanges) {
      dispatch(updateUserPreferences({ autoStartPatrols: legChanges.isAutoStart }));
    }

    setLeg((prevLeg) => ({ ...prevLeg, ...legChanges }));
  }, [dispatch]);

  const onSubmit = async () => {
    newLegTracker.track('Click the "Save" button in new leg');

    setIsSaving(true);

    try {
      await dispatch(updatePatrol(buildAddLegUpdate(patrol, leg)));

      newLegTracker.track('Added a leg to a patrol from new leg');

      setHasAddedLeg(true);
    } catch (error) {
      toast.error(t('saveErrorMessage'));

      newLegTracker.track('Error adding a leg to a patrol from new leg');

      console.warn('Error adding a leg to a patrol: ', error);

      setIsSaving(false);
    }
  };

  const onContinueNavigation = useCallback(() => {
    newLegTracker.track('Discard unsaved changes and navigate away from new leg');

    return true;
  }, []);

  useEffect(() => {
    // This route is reachable by its url alone.
    if (!canAddLeg) {
      navigate(`/${TAB_KEYS.PATROLS}/${patrol.id}`, { replace: true });
    }
  }, [canAddLeg, navigate, patrol.id]);

  useEffect(() => {
    // Navigating from an effect instead of the save method to make sure the
    // navigation blocker is freed after the leg is added.
    if (hasAddedLeg) {
      navigate(`/${TAB_KEYS.PATROLS}/${patrol.id}`, { replace: true });
    }
  }, [hasAddedLeg, navigate, patrol.id]);

  return <TrackerContext.Provider value={newLegTracker}>
    <NavigationPromptModal
      onContinue={onContinueNavigation}
      showPositiveContinueButton={false}
      when={hasUnsavedChanges && !isSaving}
    />

    <div className={styles.newLeg}>
      <Header patrolId={patrol.id} patrolTitle={patrolTitle} />

      <div className={styles.body}>
        <LegForm
          earliestStartDateTime={earliestStartDateTime}
          formId={legFormId}
          leg={leg}
          onChangeLeg={onChangeLeg}
          onSubmit={onSubmit}
        />
      </div>

      <Footer formId={legFormId} isSaving={isSaving} patrolId={patrol.id} />
    </div>
  </TrackerContext.Provider>;
};

export default NewLeg;

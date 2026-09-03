import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import isEqual from 'react-fast-compare';
import MoonLoader from 'react-spinners/MoonLoader';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';

import buildLegSegment from '../LegForm/utils/buildLegSegment';
import buildNewPatrolLegDraft from './utils/buildNewPatrolLegDraft';
import { createPatrol } from '../../../ducks/patrols';
import { NEW_PATROL_CATEGORY, TrackerContext, trackEventFactory } from '../../../utils/analytics';
import { PATROL_TYPE_QUERY_PARAMETER, TAB_KEYS } from '../../../constants';
import { updateUserPreferences } from '../../../ducks/user-preferences';
import useNavigate from '../../../hooks/useNavigate';

import Footer from './Footer';
import Header from './Header';
import LegForm from '../LegForm';
import NavigationPromptModal from '../../../NavigationPromptModal';

import * as styles from './styles.module.scss';

const newPatrolTracker = trackEventFactory(NEW_PATROL_CATEGORY);

const LOADER_SIZE = 50;

const NewPatrolContent = ({ initialPatrolType }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('patrols', { keyPrefix: 'newPatrol' });

  const autoEndPatrols = useSelector((state) => state.view.userPreferences.autoEndPatrols);
  const autoStartPatrols = useSelector((state) => state.view.userPreferences.autoStartPatrols);

  const legFormId = useId();

  const [createdPatrolId, setCreatedPatrolId] = useState(null);
  const [editedTitle, setEditedTitle] = useState(null);
  const [initialLeg] = useState(() => buildNewPatrolLegDraft({
    isAutoEnd: autoEndPatrols,
    isAutoStart: autoStartPatrols,
    patrolData: location.state?.patrolData,
    patrolType: initialPatrolType,
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [leg, setLeg] = useState(initialLeg);

  const title = editedTitle ?? leg.patrolType.display;

  const isTitleDirty = editedTitle !== null && editedTitle.trim() !== leg.patrolType.display.trim();

  const hasUnsavedChanges = isTitleDirty || !isEqual(leg, initialLeg);

  const onChangeLeg = useCallback((legChanges) => {
    // Whether a patrol starts and ends by itself is a preference the next new patrol inherits.
    if ('isAutoEnd' in legChanges) {
      dispatch(updateUserPreferences({ autoEndPatrols: legChanges.isAutoEnd }));
    }
    if ('isAutoStart' in legChanges) {
      dispatch(updateUserPreferences({ autoStartPatrols: legChanges.isAutoStart }));
    }

    setLeg((prevLeg) => ({ ...prevLeg, ...legChanges }));
  }, [dispatch]);

  const onSubmit = useCallback(async () => {
    newPatrolTracker.track('Click the "Save Patrol" button in new patrol');

    setIsSaving(true);

    try {
      const { data: { data: createdPatrol } } = await dispatch(createPatrol({
        files: [],
        icon_id: leg.patrolType.icon_id,
        is_collection: false,
        notes: [],
        patrol_segments: [buildLegSegment(leg)],
        priority: leg.patrolType.default_priority ?? 0,
        title: title.trim(),
      }));

      newPatrolTracker.track('Created a patrol from new patrol');

      setCreatedPatrolId(createdPatrol.id);
    } catch (error) {
      toast.error(t('saveErrorMessage'));

      newPatrolTracker.track('Error creating a patrol from new patrol');

      console.warn('Error creating patrol: ', error);

      setIsSaving(false);
    }
  }, [dispatch, leg, t, title]);

  const onContinueNavigation = useCallback(() => {
    newPatrolTracker.track('Discard unsaved changes and navigate away from new patrol');

    return true;
  }, []);

  useEffect(() => {
    // Navigating from an effect instead of the save method to make sure the
    // navigation blocker is freed after the patrol is created.
    if (createdPatrolId) {
      navigate(`/${TAB_KEYS.PATROLS}/${createdPatrolId}`, { replace: true });
    }
  }, [createdPatrolId, navigate]);

  return <TrackerContext.Provider value={newPatrolTracker}>
    <NavigationPromptModal
      onContinue={onContinueNavigation}
      showPositiveContinueButton={false}
      when={hasUnsavedChanges && !isSaving}
    />

    <div className={styles.newPatrol}>
      <Header
        isTitleDirty={isTitleDirty}
        onChangeTitle={setEditedTitle}
        patrolType={leg.patrolType}
        title={title}
      />

      <div className={styles.body}>
        <LegForm formId={legFormId} leg={leg} onChangeLeg={onChangeLeg} onSubmit={onSubmit} />
      </div>

      <Footer formId={legFormId} isSaving={isSaving} />
    </div>
  </TrackerContext.Provider>;
};

const NewPatrol = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const patrolTypeId = searchParams.get(PATROL_TYPE_QUERY_PARAMETER);

  const patrolType = useMemo(
    () => patrolTypes.find(({ id }) => id === patrolTypeId) ?? null,
    [patrolTypeId, patrolTypes]
  );

  useEffect(() => {
    // A patrol cannot be created without knowing its type, and the patrol
    // types are already in the store by the time the feed can offer this
    // route.
    if (patrolTypes.length > 0 && !patrolType) {
      navigate(`/${TAB_KEYS.PATROLS}`, { replace: true });
    }
  }, [navigate, patrolType, patrolTypes.length]);

  return patrolType
    // Reaching this route again, with another type or start data, must begin a
    // brand new patrol instead of reusing the draft already in the form.
    ? <NewPatrolContent initialPatrolType={patrolType} key={location.state?.temporalId} />
    : <div className={styles.loaderWrapper} data-testid="newPatrol-loader">
      <MoonLoader size={LOADER_SIZE} />
    </div>;
};

export default NewPatrol;

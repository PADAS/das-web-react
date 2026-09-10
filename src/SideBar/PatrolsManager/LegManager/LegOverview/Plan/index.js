import React, { useEffect, useMemo } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import buildLegDraft from '../../../utils/buildLegDraft';
import {
  DEFAULT_PATROL_SEGMENT_TYPE,
  fetchDefaultPatrolSegmentTypeSchema,
  fetchPatrolTypeSchema,
} from '../../../../../ducks/patrol-schemas';

import SchemaFormSummary from '../../../../../SchemaFormSummary';
import StaticFields from './StaticFields';

import * as styles from './styles.module.scss';

const SCHEMA_LOADER_SIZE = 40;

const Plan = ({ patrol, patrolSegment }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('patrols', { keyPrefix: 'legOverview.plan' });

  const defaultPatrolSegmentTypeSchemaState = useSelector(
    (state) => state.data.patrolSchemas[DEFAULT_PATROL_SEGMENT_TYPE]
  );
  const patrolTeamAndTrackingOptions = useSelector((state) => state.data.patrolTeamAndTrackingOptions);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);
  const patrolTypeSchemaState = useSelector((state) => state.data.patrolSchemas[patrolSegment.patrol_type]);

  const legDraft = useMemo(
    () => buildLegDraft(patrolSegment, patrolTypes, patrolTeamAndTrackingOptions),
    [patrolSegment, patrolTeamAndTrackingOptions, patrolTypes]
  );

  useEffect(() => {
    if (!defaultPatrolSegmentTypeSchemaState) {
      dispatch(fetchDefaultPatrolSegmentTypeSchema());
    }
  }, [defaultPatrolSegmentTypeSchemaState, dispatch]);

  useEffect(() => {
    if (patrolSegment.patrol_type && !patrolTypeSchemaState) {
      dispatch(fetchPatrolTypeSchema(patrolSegment.patrol_type));
    }
  }, [dispatch, patrolSegment.patrol_type, patrolTypeSchemaState]);

  const renderSchemaLoader = (label, testId) => <div className={styles.section}>
    <div className={styles.schemaLoader} data-testid={testId} role="status">
      <MoonLoader size={SCHEMA_LOADER_SIZE} />

      <span className="sr-only">{label}</span>
    </div>
  </div>;

  const renderSchemaError = (message) => <div className={styles.section}>
    <p className={styles.schemaErrorMessage} role="alert">{message}</p>
  </div>;

  return <div className={styles.plan}>
    <div className={styles.section}>
      <StaticFields patrol={patrol} patrolSegment={patrolSegment} />
    </div>

    {!!defaultPatrolSegmentTypeSchemaState?.schema && <SchemaFormSummary
      className={styles.schemaFormSummary}
      formData={legDraft.universalDetails}
      schema={defaultPatrolSegmentTypeSchemaState.schema}
      sectionClassName={styles.section}
    />}

    {(!defaultPatrolSegmentTypeSchemaState || !!defaultPatrolSegmentTypeSchemaState.isLoading)
      && renderSchemaLoader(t('universalFieldsSchemaLoadingLabel'), 'legOverviewPlan-universalFieldsSchemaLoader')}

    {!!defaultPatrolSegmentTypeSchemaState?.error && renderSchemaError(t('universalFieldsSchemaErrorMessage'))}

    {!!patrolTypeSchemaState?.schema && <SchemaFormSummary
      className={styles.schemaFormSummary}
      formData={legDraft.typeDetails}
      schema={patrolTypeSchemaState.schema}
      sectionClassName={styles.section}
    />}

    {!!patrolSegment.patrol_type && (!patrolTypeSchemaState || !!patrolTypeSchemaState.isLoading)
      && renderSchemaLoader(t('patrolTypeSchemaLoadingLabel'), 'legOverviewPlan-patrolTypeSchemaLoader')}

    {!!patrolTypeSchemaState?.error && renderSchemaError(t('patrolTypeSchemaErrorMessage'))}
  </div>;
};

export default Plan;

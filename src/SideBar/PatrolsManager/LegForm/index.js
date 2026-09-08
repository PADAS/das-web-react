import React, { useCallback, useEffect, useRef, useState } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { omit } from 'lodash-es';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { clearUserContent } from '../../../ducks/user-content';
import {
  DEFAULT_PATROL_SEGMENT_TYPE,
  fetchDefaultPatrolSegmentTypeSchema,
  fetchPatrolTypeSchema,
} from '../../../ducks/patrol-schemas';
import getStaticFieldErrors from './utils/getStaticFieldErrors';

import PatrolTypeField from './PatrolTypeField';
import SchemaForm from '../../../SchemaForm';
import StaticFields from './StaticFields';

import * as styles from './styles.module.scss';

// TODO: Pass the leg's attachments metadata once the API defines where its
// schema driven fields live.
const EMPTY_METADATA = {};

const SCHEMA_LOADER_SIZE = 40;

const ERRORS_CLEARED_BY_LEG_DRAFT_FIELD = {
  endDate: ['endDate', 'endTime'],
  endTime: ['endDate', 'endTime'],
  patrolType: ['patrolType'],
  startDate: ['endDate', 'startDate'],
  startTime: ['endDate', 'startTime'],
};

const LegForm = ({ earliestStartDateTime = null, formId, leg, onChangeLeg, onSubmit }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('patrols', { keyPrefix: 'legForm' });

  const defaultPatrolSegmentTypeSchemaState = useSelector(
    (state) => state.data.patrolSchemas[DEFAULT_PATROL_SEGMENT_TYPE]
  );
  const patrolTypeSchemaState = useSelector((state) => state.data.patrolSchemas[leg.patrolType?.value]);

  const defaultPatrolSegmentTypeFormRef = useRef(null);
  const patrolTypeFieldRef = useRef(null);
  const patrolTypeFieldsFormRef = useRef(null);
  const staticFieldsRef = useRef(null);

  const [staticFieldErrors, setStaticFieldErrors] = useState({});

  // The schema forms and the patrol type select are memoized and expensive to
  // redraw, so their handlers are the one thing here worth holding still.
  const onChangeLegField = useCallback((legChanges) => {
    const clearedErrors = Object.keys(legChanges)
      .flatMap((field) => ERRORS_CLEARED_BY_LEG_DRAFT_FIELD[field] ?? []);

    if (clearedErrors.length > 0) {
      setStaticFieldErrors((prevErrors) => omit(prevErrors, clearedErrors));
    }

    onChangeLeg(legChanges);
  }, [onChangeLeg]);

  const onChangePatrolType = useCallback(
    (patrolType) => onChangeLegField({ patrolType, typeDetails: {} }),
    [onChangeLegField]
  );

  const onChangeTypeDetails = useCallback(
    (typeDetails, options) => onChangeLeg({ typeDetails }, options),
    [onChangeLeg]
  );

  const onChangeUniversalDetails = useCallback(
    (universalDetails, options) => onChangeLeg({ universalDetails }, options),
    [onChangeLeg]
  );

  const onSubmitForm = (event) => {
    event.preventDefault();

    const newStaticFieldErrors = getStaticFieldErrors(leg, earliestStartDateTime);
    setStaticFieldErrors(newStaticFieldErrors);

    const [erroneousField] = Object.keys(newStaticFieldErrors);

    // The patrol type field sits between the two schema forms, so only an
    // erroneous universal patrol field owns the focus ahead of it.
    const hasErroneousStaticField = !!erroneousField && erroneousField !== 'patrolType';

    const areDefaultPatrolSegmentTypeFieldsValid = defaultPatrolSegmentTypeFormRef.current
      ?.validate({ shouldFocusFirstError: !hasErroneousStaticField }) ?? true;
    const arePatrolTypeFieldsValid = patrolTypeFieldsFormRef.current?.validate({
      shouldFocusFirstError: !erroneousField && areDefaultPatrolSegmentTypeFieldsValid,
    }) ?? true;

    if (hasErroneousStaticField) {
      staticFieldsRef.current?.focusField(erroneousField);
    } else if (erroneousField && areDefaultPatrolSegmentTypeFieldsValid) {
      patrolTypeFieldRef.current?.focus();
    } else if (!erroneousField && areDefaultPatrolSegmentTypeFieldsValid && arePatrolTypeFieldsValid) {
      onSubmit();
    }
  };

  useEffect(() => {
    if (!defaultPatrolSegmentTypeSchemaState) {
      dispatch(fetchDefaultPatrolSegmentTypeSchema());
    }
  }, [defaultPatrolSegmentTypeSchemaState, dispatch]);

  useEffect(() => {
    if (leg.patrolType && !patrolTypeSchemaState) {
      // The schema of the currently selected patrol type is not available,
      // fetch it.
      dispatch(fetchPatrolTypeSchema(leg.patrolType.value));
    }
  }, [dispatch, leg.patrolType, patrolTypeSchemaState]);

  // Clear the user content that its schema driven parts uploaded.
  useEffect(() => () => dispatch(clearUserContent()), [dispatch]);

  return <form className={styles.legForm} id={formId} onSubmit={onSubmitForm}>
    <div className={styles.section}>
      <StaticFields
        earliestStartDateTime={earliestStartDateTime}
        errors={staticFieldErrors}
        leg={leg}
        onChangeLeg={onChangeLegField}
        ref={staticFieldsRef}
      />
    </div>

    {!!defaultPatrolSegmentTypeSchemaState?.schema && <SchemaForm
      anchorLocation={leg.startLocation}
      as="div"
      className={styles.schemaForm}
      formData={leg.universalDetails}
      hideMapLocationMarkers={false}
      metadata={EMPTY_METADATA}
      onFormDataChange={onChangeUniversalDetails}
      readOnly={false}
      schema={defaultPatrolSegmentTypeSchemaState.schema}
      shouldPopulateDefaultData
      validateRef={defaultPatrolSegmentTypeFormRef}
    />}

    {(!defaultPatrolSegmentTypeSchemaState || !!defaultPatrolSegmentTypeSchemaState.isLoading)
      && <div className={styles.section}>
        <div className={styles.schemaLoader} data-testid="legForm-universalFieldsSchemaLoader" role="status">
          <MoonLoader size={SCHEMA_LOADER_SIZE} />

          <span className="sr-only">{t('universalFieldsSchemaLoadingLabel')}</span>
        </div>
      </div>}

    {!!defaultPatrolSegmentTypeSchemaState?.error && <div className={styles.section}>
      <p className={styles.schemaErrorMessage} role="alert">{t('universalFieldsSchemaErrorMessage')}</p>
    </div>}

    <div className={styles.section}>
      <PatrolTypeField
        error={staticFieldErrors.patrolType}
        onChange={onChangePatrolType}
        patrolType={leg.patrolType}
        ref={patrolTypeFieldRef}
      />

      {!!patrolTypeSchemaState?.isLoading && <div
          className={styles.schemaLoader}
          data-testid="legForm-patrolTypeSchemaLoader"
          role="status"
        >
        <MoonLoader size={SCHEMA_LOADER_SIZE} />

        <span className="sr-only">{t('patrolTypeSchemaLoadingLabel')}</span>
      </div>}

      {!!patrolTypeSchemaState?.error && <p className={styles.schemaErrorMessage} role="alert">
        {t('patrolTypeSchemaErrorMessage')}
      </p>}
    </div>

    {!!patrolTypeSchemaState?.schema && <SchemaForm
      anchorLocation={leg.startLocation}
      as="div"
      className={styles.schemaForm}
      formData={leg.typeDetails}
      hideMapLocationMarkers={false}
      metadata={EMPTY_METADATA}
      onFormDataChange={onChangeTypeDetails}
      readOnly={false}
      schema={patrolTypeSchemaState.schema}
      shouldPopulateDefaultData
      validateRef={patrolTypeFieldsFormRef}
    />}
  </form>;
};

export default LegForm;

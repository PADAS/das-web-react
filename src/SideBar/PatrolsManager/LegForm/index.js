import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { omit } from 'lodash-es';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { clearUserContent } from '../../../ducks/user-content';
import { DEFAULT_PATROL_SEGMENT_TYPE, fetchPatrolTypeSchema } from '../../../ducks/patrol-schemas';
import getStaticFieldErrors from './utils/getStaticFieldErrors';

import PatrolTypeField from './PatrolTypeField';
import SchemaForm from '../../../SchemaForm';
import StaticFields from './StaticFields';

import * as styles from './styles.module.scss';

// TODO: Pass the attachments metadata of the leg once the API defines where its schema driven
// fields live.
const EMPTY_METADATA = {};

const PATROL_TYPE_SCHEMA_LOADER_SIZE = 40;

const ERRORS_CLEARED_BY_LEG_DRAFT_FIELD = {
  endDate: ['endDate'],
  endTime: ['endDate'],
  startDate: ['endDate', 'startDate'],
  startTime: ['endDate', 'startDate'],
};

const LegForm = ({ formId, leg, onChangeLeg, onSubmit }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('patrols', { keyPrefix: 'legForm' });

  const defaultPatrolSegmentTypeSchemaState = useSelector(
    (state) => state.data.patrolSchemas[DEFAULT_PATROL_SEGMENT_TYPE]
  );
  const patrolTypeSchemaState = useSelector((state) => state.data.patrolSchemas[leg.patrolType?.value]);

  const defaultPatrolSegmentTypeFormRef = useRef(null);
  const patrolTypeFieldsFormRef = useRef(null);
  const staticFieldsRef = useRef(null);

  const [staticFieldErrors, setStaticFieldErrors] = useState({});

  const onChangeStaticFields = useCallback((legChanges) => {
    const clearedErrors = Object.keys(legChanges)
      .flatMap((field) => ERRORS_CLEARED_BY_LEG_DRAFT_FIELD[field] ?? []);

    if (clearedErrors.length > 0) {
      setStaticFieldErrors((prevErrors) => omit(prevErrors, clearedErrors));
    }

    onChangeLeg(legChanges);
  }, [onChangeLeg]);

  const onSubmitForm = (event) => {
    event.preventDefault();

    const newStaticFieldErrors = getStaticFieldErrors(leg);
    setStaticFieldErrors(newStaticFieldErrors);

    // The static fields come first in the form, so they own the focus whenever
    // any of them is erroneous.
    const [firstErroneousStaticField] = Object.keys(newStaticFieldErrors);

    const areDefaultPatrolSegmentTypeFieldsValid = defaultPatrolSegmentTypeFormRef.current
      ?.validate({ shouldFocusFirstError: !firstErroneousStaticField }) ?? true;
    const arePatrolTypeFieldsValid = patrolTypeFieldsFormRef.current?.validate({
      shouldFocusFirstError: !firstErroneousStaticField && areDefaultPatrolSegmentTypeFieldsValid,
    }) ?? true;

    if (firstErroneousStaticField) {
      staticFieldsRef.current?.focusField(firstErroneousStaticField);
    } else if (areDefaultPatrolSegmentTypeFieldsValid && arePatrolTypeFieldsValid) {
      onSubmit();
    }
  };

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
    <section className={styles.section}>
      <StaticFields errors={staticFieldErrors} leg={leg} onChangeLeg={onChangeStaticFields} ref={staticFieldsRef} />
    </section>

    {!!defaultPatrolSegmentTypeSchemaState?.schema && <SchemaForm
      anchorLocation={leg.startLocation}
      as="div"
      className={styles.schemaForm}
      formData={leg.universalDetails}
      hideMapLocationMarkers={false}
      metadata={EMPTY_METADATA}
      onFormDataChange={(universalDetails) => onChangeLeg({ universalDetails })}
      readOnly={false}
      schema={defaultPatrolSegmentTypeSchemaState.schema}
      shouldPopulateDefaultData
      validateRef={defaultPatrolSegmentTypeFormRef}
    />}

    <section className={styles.section}>
      <PatrolTypeField
        onChange={(patrolType) => onChangeLeg({ patrolType, typeDetails: {} })}
        patrolType={leg.patrolType}
      />

      {!!patrolTypeSchemaState?.isLoading && <div className={styles.patrolTypeSchemaLoader}>
        <MoonLoader data-testid="legForm-patrolTypeSchemaLoader" size={PATROL_TYPE_SCHEMA_LOADER_SIZE} />
      </div>}

      {!!patrolTypeSchemaState?.error && <p className={styles.patrolTypeSchemaError} role="alert">
        {t('patrolTypeSchemaErrorMessage')}
      </p>}
    </section>

    {!!patrolTypeSchemaState?.schema && <SchemaForm
      anchorLocation={leg.startLocation}
      as="div"
      className={styles.schemaForm}
      formData={leg.typeDetails}
      hideMapLocationMarkers={false}
      metadata={EMPTY_METADATA}
      onFormDataChange={(typeDetails) => onChangeLeg({ typeDetails })}
      readOnly={false}
      schema={patrolTypeSchemaState.schema}
      shouldPopulateDefaultData
      validateRef={patrolTypeFieldsFormRef}
    />}
  </form>;
};

export default memo(LegForm);

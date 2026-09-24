import React, { memo, useCallback, useContext, useId, useState } from 'react';
import Form from '@rjsf/react-bootstrap';
import { format, isToday, isValid, parseISO } from 'date-fns';
import MoonLoader from 'react-spinners/MoonLoader';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as PencilWritingIcon } from '../../../../common/images/icons/pencil-writing.svg';

import {
  filterOutEnumErrorsForClearedFields,
  filterOutErrorsForHiddenProperties,
  filterOutRequiredValueOnSchemaPropErrors,
  getLinearErrorPropTree,
} from '../../../../utils/event-schemas';
import { getHoursAndMinutesString } from '../../../../utils/datetime';
import { PRIORITY_COLOR_MAP } from '../../../../utils/events';
import { REPORT_PRIORITIES, VALID_EVENT_GEOMETRY_TYPES } from '../../../../constants';
import { selectEventTypeByValue } from '../../../../selectors/event-types';
import { TrackerContext } from '../../../../utils/analytics';

import {
  AddButton,
  ArrayFieldItemTemplate,
  ArrayFieldTemplate,
  BaseInputTemplate,
  ExternalLinkField,
  MoveDownButton,
  MoveUpButton,
  ObjectFieldTemplate,
  RemoveButton,
} from '../../../../SchemaFields';
import AreaPicker from './AreaPicker';
import DatePicker, { EMPTY_DATE_VALUE } from '../../../../DatePicker';
import { GeometryPreview } from './AreaPicker/MenuPopover';
import LocationPicker from '../../../../LocationPicker';
import ReporterSelect from '../../ReporterSelect';
import SchemaForm from '../../../../SchemaForm';
import Select from '../../../../Select';
import TimePicker, { EMPTY_TIME_VALUE, isValidTime } from '../../../../TimePicker';

import * as styles from './styles.module.scss';

const SCHEMA_LOADER_SIZE = 40;

const renderPriorityIcon = (priority) => <span
  className={styles.priorityDot}
  style={{ backgroundColor: PRIORITY_COLOR_MAP[priority.value].base }}
/>;

const DetailsSection = ({
  communityInputValue = null,
  eventSchema = null,
  formValidator,
  // hidePriority / hideReportedBy are intentionally generic visibility props expressed in this
  // component's own vocabulary, rather than gating these fields on isCommunity (the caller's reason).
  // This lets a future caller hide these fields for some other reason without adding yet another
  // context flag here — the component stays agnostic of *why* a field is hidden.
  hidePriority = false,
  hideReportedBy = false,
  isCommunity = false,
  isBehindAddedEvent,
  isCollection,
  isNewEvent,
  onFormDataChange,
  onFormError,
  onFormSubmit,
  onLegacyFormChange,
  onPriorityChange,
  onReportedByChange,
  onReportDateChange,
  onReportGeometryChange,
  onReportLocationChange,
  ref,
  reportForm,
  submitFormButtonRef,
}) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection' });

  const eventType = useSelector((state) => reportForm?.event_type ? selectEventTypeByValue(state, reportForm.event_type) : null);

  const eventTracker = useContext(TrackerContext);

  const dateLabelId = useId();
  const locationPickerId = useId();
  const prioritySelectId = useId();
  const reportedBySelectId = useId();
  const timeLabelId = useId();

  const eventTime = reportForm?.time ? new Date(reportForm.time) : null;

  const [date, setDate] = useState(eventTime ? format(eventTime, 'yyyy-MM-dd') : EMPTY_DATE_VALUE);
  const [time, setTime] = useState(eventTime ? getHoursAndMinutesString(eventTime) : EMPTY_TIME_VALUE);

  const geometryType = eventType?.geometry_type;
  const jsonSchema = eventSchema?.schema ?? eventSchema?.json;
  const isReadOnly = eventType?.version === 1 ? jsonSchema?.readonly : eventType?.readonly;
  const shouldShowReportedBy = !isCollection && !hideReportedBy;

  const onDatePickerChange = (newDate) => {
    setDate(newDate);

    const parsedNewDate = parseISO(`${newDate}T${isValidTime(time) ? time : '00:00'}`);
    if (isValid(parsedNewDate)) {
      onReportDateChange(parsedNewDate);
    } else {
      onReportDateChange(undefined);
    }

    eventTracker.track('Change Report Date');
  };

  const onTimePickerChange = (newTime) => {
    setTime(newTime);

    const parsedNewDate = parseISO(`${date}T${newTime}`);
    if (isValid(parsedNewDate)) {
      onReportDateChange(parsedNewDate);
    } else {
      onReportDateChange(undefined);
    }

    eventTracker.track('Change Report Time');
  };

  const eventUISchema = eventSchema?.uiSchema;
  const transformErrors = useCallback((errors) => {
    const filteredErrors = filterOutErrorsForHiddenProperties(
      filterOutEnumErrorsForClearedFields(
        filterOutRequiredValueOnSchemaPropErrors(errors),
        reportForm.event_details,
        jsonSchema
      ),
      eventUISchema
    );

    return filteredErrors.map((error) => ({ ...error, linearProperty: getLinearErrorPropTree(error.property) }));
  }, [eventUISchema, jsonSchema, reportForm.event_details]);

  return <div ref={ref}>
    <div className={styles.globalDetails}>
      {!isCommunity && <div className={styles.title}>
        <PencilWritingIcon />

        <h2>{t('detailsHeader')}</h2>
      </div>}

      <div className={styles.container}>
        {(shouldShowReportedBy || !hidePriority) && <div className={styles.row}>
          {shouldShowReportedBy && <div className={styles.field}>
            <label className={styles.label} htmlFor={reportedBySelectId}>{t('reportedByLabel')}</label>

            <ReporterSelect
              inputId={reportedBySelectId}
              isDisabled={isReadOnly}
              onChange={onReportedByChange}
              value={reportForm?.reported_by}
            />
          </div>}

          {!hidePriority && <div className={styles.field}>
            <label className={styles.label} htmlFor={prioritySelectId}>{t('priorityLabel')}</label>

            <Select
              getOptionLabel={(priority) => t(`priorities.${priority.key}`)}
              inputId={prioritySelectId}
              isClearable={false}
              isDisabled={isReadOnly}
              onChange={onPriorityChange}
              options={REPORT_PRIORITIES}
              renderOptionIcon={renderPriorityIcon}
              value={REPORT_PRIORITIES.find((priority) => priority.value === reportForm?.priority) ?? null}
            />
          </div>}
        </div>}

        {!isCollection && <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={locationPickerId}>{t('locationLabel')}</label>

            {geometryType === VALID_EVENT_GEOMETRY_TYPES.POLYGON
              ? <AreaPicker
                event={reportForm}
                id={locationPickerId}
                onChange={onReportGeometryChange}
                readOnly={isReadOnly}
                value={reportForm.geometry || null}
              />
              : <LocationPicker
                id={locationPickerId}
                inputProps={{ 'aria-label': t('locationLabel') }}
                onChange={onReportLocationChange}
                readOnly={isReadOnly}
                value={reportForm.location || null}
              />}
          </div>

          <div className={styles.dateTimeFields}>
            <div className={styles.field}>
              <span className={styles.label} id={dateLabelId}>{t('dateLabel')}</span>

              <DatePicker
                aria-labelledby={dateLabelId}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={onDatePickerChange}
                readOnly={isReadOnly}
                value={date}
              />
            </div>

            <div className={`${styles.field} ${styles.timeField}`}>
              <span className={styles.label} id={timeLabelId}>{t('timeLabel')}</span>

              <TimePicker
                aria-labelledby={timeLabelId}
                max={eventTime && isToday(eventTime) ? getHoursAndMinutesString(new Date()) : undefined}
                minutesInterval={15}
                onChange={onTimePickerChange}
                readOnly={isReadOnly}
                value={time}
              />
            </div>
          </div>
        </div>}

        {geometryType === VALID_EVENT_GEOMETRY_TYPES.POLYGON && !!reportForm?.geometry && <div
          className={styles.printableRow}
          >
          <GeometryPreview className={styles.geometryPreview} event={reportForm} />
        </div>}
      </div>
    </div>

    {/* Legacy form renderer */}
    {/* Gate by schema shape, not eventType.version: community event types are forced to version 2
       client-side, yet the backend can still return a v1-format schema (a top-level `schema`),
       so the actual shape is the reliable signal for which renderer to use. */}
    {!!eventSchema?.schema && !!jsonSchema && <Form
      className={`${styles.form} ${reportForm.is_collection ? styles.hidden : ''}`}
      disabled={isReadOnly}
      fields={{ externalLink: ExternalLinkField }}
      formData={reportForm.event_details}
      onChange={onLegacyFormChange}
      onError={onFormError}
      onSubmit={onFormSubmit}
      schema={jsonSchema}
      showErrorList={false}
      templates={{
        ArrayFieldItemTemplate,
        ArrayFieldTemplate,
        BaseInputTemplate,
        ButtonTemplates: { AddButton, MoveDownButton, MoveUpButton, RemoveButton },
        ObjectFieldTemplate,
      }}
      transformErrors={transformErrors}
      uiSchema={eventUISchema}
      validator={formValidator}
    >
      <button ref={submitFormButtonRef} type="submit" />
    </Form>}

    {eventType?.version === 2 && eventSchema?.json && !eventSchema?.error && <SchemaForm
      anchorLocation={reportForm.location}
      className={styles.schemaForm}
      communityInputValue={communityInputValue}
      formData={reportForm.event_details}
      hideMapLocationMarkers={isBehindAddedEvent}
      metadata={reportForm.metadata ?? {}}
      onFormDataChange={onFormDataChange}
      onFormSubmit={onFormSubmit}
      readOnly={isReadOnly}
      renderSubmitButton={() => <button
        className={styles.schemaFormSubmitButton}
        ref={submitFormButtonRef}
        type="submit"
      />}
      schema={eventSchema}
      shouldPopulateDefaultData={isNewEvent}
    />}

    {/* The view fetches a missing schema, so its absence means it is loading. */}
    {!eventSchema && !!eventType && !reportForm.is_collection && <div className={styles.section}>
      <div className={styles.schemaLoader} role="status">
        <MoonLoader size={SCHEMA_LOADER_SIZE} />

        <span className="sr-only">{t('schemaLoadingLabel')}</span>
      </div>
    </div>}

    {!!eventSchema?.error && <div className={styles.section}>
      <p className={styles.schemaErrorMessage} role="alert">
        {t('schemaErrorMessage')}

        {!!eventSchema.error.response?.data?.status?.detail && <span>
          {eventSchema.error.response.data.status.detail}
        </span>}
      </p>
    </div>}
  </div>;
};

export default memo(DetailsSection);

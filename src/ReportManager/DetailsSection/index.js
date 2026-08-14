import React, { memo, useCallback, useContext, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from '@rjsf/react-bootstrap';
import { format, isToday, isValid, parseISO } from 'date-fns';
import MoonLoader from 'react-spinners/MoonLoader';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as PencilWritingIcon } from '../../common/images/icons/pencil-writing.svg';

import { EVENT_FORM_STATES, PREVIEW_FEATURES, VALID_EVENT_GEOMETRY_TYPES } from '../../constants';
import {
  filterOutEnumErrorsForClearedFields,
  filterOutErrorsForHiddenProperties,
  filterOutRequiredValueOnSchemaPropErrors,
  getLinearErrorPropTree,
} from '../../utils/event-schemas';
import { getHoursAndMinutesString } from '../../utils/datetime';
import { selectEventTypeByValue } from '../../selectors/event-types';
import { TrackerContext } from '../../utils/analytics';
import { usePreviewFeature } from '../../hooks';

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
} from '../../SchemaFields';
import AreaPicker from './AreaPicker';
import DatePicker, { EMPTY_DATE_VALUE } from '../../DatePicker';
import { GeometryPreview } from './AreaPicker/MenuPopover';
import LocationPicker from '../../LocationPicker';
import PrioritySelect from '../../PrioritySelect';
import ReportedBySelect from '../../ReportedBySelect';
import SchemaForm from '../../SchemaForm';
import TimePicker, { EMPTY_TIME_VALUE, isValidTime } from '../../TimePicker';

import * as styles from './styles.module.scss';

const LOADER_COLOR = '#006cd9'; // Bright blue
const LOADER_SIZE = 50;

const DetailsSection = ({
  eventDetails = {},
  eventSchema = null,
  formValidator,
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
  onReportStateChange,
  ref,
  reportForm,
  submitFormButtonRef,
}) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection' });

  // Remove this flag and the `.filter` below once community input is enabled
  // for all tenants.
  const communityInputEnabled = usePreviewFeature(PREVIEW_FEATURES.COMMUNITY_INPUT_ADMIN);
  const eventType = useSelector((state) => reportForm?.event_type ? selectEventTypeByValue(state, reportForm.event_type) : null);
  const loadingEventSchemas = useSelector((state) => state.data.eventSchemas.loading);

  const eventTracker = useContext(TrackerContext);

  const eventTime = reportForm?.time ? new Date(reportForm.time) : null;

  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [date, setDate] = useState(eventTime ? format(eventTime, 'yyyy-MM-dd') : EMPTY_DATE_VALUE);
  const [time, setTime] = useState(eventTime ? getHoursAndMinutesString(eventTime) : EMPTY_TIME_VALUE);

  const eventState = reportForm.state === EVENT_FORM_STATES.NEW_LEGACY ? EVENT_FORM_STATES.ACTIVE : reportForm.state;
  const geometryType = eventType?.geometry_type;
  const jsonSchema = eventSchema?.schema ?? eventSchema?.json;
  const isReadOnly = eventType?.version === 1 ? jsonSchema?.readonly : eventType?.readonly;

  const onStateDropdownKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      setShowStateDropdown(false);
      event.stopPropagation();
    }
  }, []);

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
      <div className={styles.sectionHeader}>
        {!isCommunity && <div className={styles.title}>
          <PencilWritingIcon />

          <h2>{t('detailsHeader')}</h2>
        </div>}

        {!isCommunity && <div>
          <Dropdown
            className={`${styles.stateDropdown} ${styles[reportForm.state]}`}
            onKeyDown={onStateDropdownKeyDown}
            onSelect={onReportStateChange}
            onToggle={(nextShow) => setShowStateDropdown(nextShow)}
            show={showStateDropdown}
          >
            <Dropdown.Toggle variant="success">
              {t(`stateDropdown.${eventState}`)}
            </Dropdown.Toggle>

            <Dropdown.Menu
              className={styles.stateDropdownMenu}
              data-testid="reportManager-detailsSection-stateDropdownMenu"
            >
              {Object.values(EVENT_FORM_STATES)
                .filter((eventState) => eventState !== EVENT_FORM_STATES.NEW_LEGACY)
                .filter((eventState) => communityInputEnabled || eventState !== EVENT_FORM_STATES.REVIEW)
                .map((eventState) => <Dropdown.Item
                  className={styles.stateItem}
                  eventKey={eventState}
                  key={eventState}
                >
                  {t(`stateDropdown.${eventState}`)}
                </Dropdown.Item>)}
            </Dropdown.Menu>
          </Dropdown>
        </div>}
      </div>

      <div className={styles.container}>
        <div className={styles.row}>
          {!isCollection && !hideReportedBy && <label className={styles.fieldLabel} data-testid="reportManager-reportedBySelect">
            {t('reportedByLabel')}

            <ReportedBySelect
              isDisabled={isReadOnly}
              onChange={onReportedByChange}
              value={reportForm?.reported_by}
            />
          </label>}

          {!hidePriority && <label className={styles.fieldLabel}>
            {t('priorityLabel')}

            <PrioritySelect
              isDisabled={isReadOnly}
              onChange={onPriorityChange}
              priority={reportForm?.priority}
            />
          </label>}
        </div>

        {!isCollection && <div className={styles.row}>
          <label className={styles.fieldLabel} data-testid="reportManager-reportLocationSelect">
            {t('locationLabel')}

            {geometryType === VALID_EVENT_GEOMETRY_TYPES.POLYGON
              ? <AreaPicker
                data-testid="reportManager-detailsSection-areaPicker"
                event={reportForm}
                id="reportManager-detailsSection-areaPicker"
                onChange={onReportGeometryChange}
                readOnly={isReadOnly}
                value={reportForm.geometry || null}
              />
              : <LocationPicker
                data-testid="reportManager-detailsSection-locationPicker"
                id="reportManager-detailsSection-locationPicker"
                onChange={onReportLocationChange}
                readOnly={isReadOnly}
                value={reportForm.location || null}
              />
            }
          </label>

          <div className={styles.reportDateTimeContainer}>
            <label className={`${styles.fieldLabel} ${styles.datePickerLabel}`}>
              {t('dateLabel')}

              <DatePicker
                data-testid="reportManager-detailsSection-datePicker"
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={onDatePickerChange}
                readOnly={isReadOnly}
                value={date}
              />
            </label>

            <label className={`${styles.fieldLabel} ${styles.timePickerLabel}`}>
              {t('timeLabel')}

              <TimePicker
                data-testid="reportManager-detailsSection-timePicker"
                max={eventTime && isToday(eventTime) ? getHoursAndMinutesString(new Date()) : undefined}
                minutesInterval={15}
                onChange={onTimePickerChange}
                readOnly={isReadOnly}
                value={time}
              />
            </label>
          </div>
        </div>}

        {geometryType === VALID_EVENT_GEOMETRY_TYPES.POLYGON && reportForm?.geometry
          ? <div className={styles.printableRow}>
            <GeometryPreview className={styles.geometryPreview} event={reportForm} />
          </div>
          : null}
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
      formData={eventDetails}
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

    {!eventSchema && !reportForm.is_collection && loadingEventSchemas && <div className={styles.loaderWrapper}>
      <MoonLoader
        color={LOADER_COLOR}
        data-testid="reportManager-detailsSection-loader"
        size={LOADER_SIZE}
      />
    </div>}

    {eventSchema?.error && <div
      aria-live="polite"
      className={styles.errorMessageWrapper}
      role="alert"
    >
      <p className={styles.errorMessage}>
        <strong>{t('errorLoadingSchema')}</strong>

        {eventSchema?.error?.response?.data?.status?.detail && <span>
          {eventSchema.error.response.data.status.detail}
        </span>}
      </p>
    </div>}
  </div>;
};

export default memo(DetailsSection);

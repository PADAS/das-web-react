import React, { memo, useCallback, useContext, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from '@rjsf/bootstrap-4';
import { format, isToday, isValid, parseISO } from 'date-fns';
import MoonLoader from 'react-spinners/MoonLoader';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as PencilWritingIcon } from '../../common/images/icons/pencil-writing.svg';

import { EVENT_FORM_STATES, VALID_EVENT_GEOMETRY_TYPES } from '../../constants';
import {
  filterOutErrorsForHiddenProperties,
  filterOutRequiredValueOnSchemaPropErrors,
  getLinearErrorPropTree,
} from '../../utils/event-schemas';
import { getHoursAndMinutesString } from '../../utils/datetime';
import { selectEventTypeByValue } from '../../selectors/event-types';
import { TrackerContext } from '../../utils/analytics';

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
import SchemaForm from './SchemaForm';
import TimePicker, { EMPTY_TIME_VALUE, isValidTime } from '../../TimePicker';

import * as styles from './styles.module.scss';

const LOADER_COLOR = '#006cd9'; // Bright blue
const LOADER_SIZE = 50;

const DetailsSection = ({
  eventId,
  eventSchema = null,
  formValidator,
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

  const eventType = useSelector((state) => reportForm?.event_type ? selectEventTypeByValue(state, reportForm.event_type) : null);
  const loadingEventSchemas = useSelector((state) => state.data.eventSchemas.loading);

  const reportTracker = useContext(TrackerContext);

  const reportTime = reportForm?.time ? new Date(reportForm.time) : null;

  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [date, setDate] = useState(reportTime ? format(reportTime, 'yyyy-MM-dd') : EMPTY_DATE_VALUE);
  const [time, setTime] = useState(reportTime ? getHoursAndMinutesString(reportTime) : EMPTY_TIME_VALUE);

  const geometryType = eventType?.geometry_type;
  const jsonSchema = eventType?.version === 1 ? eventSchema?.schema : eventSchema?.json;
  const reportState = reportForm.state === EVENT_FORM_STATES.NEW_LEGACY ? EVENT_FORM_STATES.ACTIVE : reportForm.state;

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

    reportTracker.track('Change Report Date');
  };

  const onTimePickerChange = (newTime) => {
    setTime(newTime);

    const parsedNewDate = parseISO(`${date}T${newTime}`);
    if (isValid(parsedNewDate)) {
      onReportDateChange(parsedNewDate);
    } else {
      onReportDateChange(undefined);
    }

    reportTracker.track('Change Report Time');
  };

  const transformErrors = useCallback((errors) => {
    const filteredErrors = filterOutErrorsForHiddenProperties(
      filterOutRequiredValueOnSchemaPropErrors(errors),
      eventSchema.uiSchema
    );

    return filteredErrors.map((error) => ({ ...error, linearProperty: getLinearErrorPropTree(error.property) }));
  }, [eventSchema?.uiSchema]);

  return <div ref={ref}>
    <div className={styles.globalDetails}>
      <div className={styles.sectionHeader}>
        <div className={styles.title}>
          <PencilWritingIcon />

          <h2>{t('detailsHeader')}</h2>
        </div>

        <div>
          <Dropdown
            className={`${styles.stateDropdown} ${styles[reportForm.state]}`}
            onKeyDown={onStateDropdownKeyDown}
            onSelect={onReportStateChange}
            onToggle={(nextShow) => setShowStateDropdown(nextShow)}
            show={showStateDropdown}
          >
            <Dropdown.Toggle variant="success">
              {t(`stateDropdown.${reportState}`)}
            </Dropdown.Toggle>

            <Dropdown.Menu
              className={styles.stateDropdownMenu}
              data-testid="reportManager-detailsSection-stateDropdownMenu"
            >
              {Object.values(EVENT_FORM_STATES)
                .filter((eventState) => eventState !== EVENT_FORM_STATES.NEW_LEGACY)
                .map((eventState) => <Dropdown.Item
                  className={styles.stateItem}
                  eventKey={eventState}
                  key={eventState}
                >
                  {t(`stateDropdown.${eventState}`)}
                </Dropdown.Item>)}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.row}>
          {!isCollection && <label className={styles.fieldLabel} data-testid="reportManager-reportedBySelect">
            {t('reportedByLabel')}

            <ReportedBySelect
              isDisabled={jsonSchema?.readonly}
              onChange={onReportedByChange}
              value={reportForm?.reported_by}
            />
          </label>}

          <label className={styles.fieldLabel}>
            {t('priorityLabel')}

            <PrioritySelect
              isDisabled={jsonSchema?.readonly}
              onChange={onPriorityChange}
              priority={reportForm?.priority}
            />
          </label>
        </div>

        {!isCollection && <div className={styles.row}>
          <label className={styles.fieldLabel} data-testid="reportManager-reportLocationSelect">
            {t('locationLabel')}

            {geometryType === VALID_EVENT_GEOMETRY_TYPES.POLYGON
              ? <AreaPicker
                className={jsonSchema?.readonly ? styles.readOnly : ''}
                data-testid="reportManager-detailsSection-areaPicker"
                event={reportForm}
                id="reportManager-detailsSection-areaPicker"
                onChange={onReportGeometryChange}
                readOnly={jsonSchema?.readonly}
                value={reportForm.geometry || null}
              />
              : <LocationPicker
                className={jsonSchema?.readonly ? styles.readOnly : ''}
                data-testid="reportManager-detailsSection-locationPicker"
                id="reportManager-detailsSection-locationPicker"
                onChange={onReportLocationChange}
                readOnly={jsonSchema?.readonly}
                value={reportForm.location || null}
              />
            }
          </label>

          <div className={styles.reportDateTimeContainer}>
            <label className={`${styles.fieldLabel} ${styles.datePickerLabel}`}>
              {t('dateLabel')}

              <DatePicker
                className={jsonSchema?.readonly ? styles.readOnly : ''}
                data-testid="reportManager-detailsSection-datePicker"
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={onDatePickerChange}
                readOnly={jsonSchema?.readonly}
                value={date}
              />
            </label>

            <label className={`${styles.fieldLabel} ${styles.timePickerLabel}`}>
              {t('timeLabel')}

              <TimePicker
                className={jsonSchema?.readonly ? styles.readOnly : ''}
                data-testid="reportManager-detailsSection-timePicker"
                max={reportTime && isToday(reportTime) ? getHoursAndMinutesString(new Date()) : undefined}
                minutesInterval={15}
                onChange={onTimePickerChange}
                readOnly={jsonSchema?.readonly}
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
    {eventType?.version === 1 && !!jsonSchema && <Form
      className={`${styles.form} ${reportForm.is_collection ? styles.hidden : ''}`}
      disabled={jsonSchema?.readonly}
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
      uiSchema={eventSchema?.uiSchema}
      validator={formValidator}
    >
      <button ref={submitFormButtonRef} type="submit" />
    </Form>}

    {eventType?.version === 2 && eventSchema && <SchemaForm
      autofillDefaultInputs={isNewEvent}
      eventId={eventId}
      eventLocation={reportForm.location}
      hideMapLocationMarkers={isBehindAddedEvent}
      initialFormData={reportForm.event_details}
      onFormDataChange={onFormDataChange}
      onFormSubmit={onFormSubmit}
      renderSubmitButton={() => <button
        className={styles.schemaFormSubmitButton}
        ref={submitFormButtonRef}
        type="submit"
      />}
      schema={eventSchema}
    />}

    {!eventSchema && !reportForm.is_collection && loadingEventSchemas && <div className={styles.loaderWrapper}>
      <MoonLoader
        color={LOADER_COLOR}
        data-testid="reportManager-detailsSection-loader"
        size={LOADER_SIZE}
      />
    </div>}

    {eventSchema instanceof Error && <div
      className={styles.errorMessage}
      role="alert"
      aria-live="polite"
    >
      <p>
        <strong>{t('errorLoadingSchema')}</strong>

        {eventSchema?.response?.data?.status?.detail && <span className={styles.errorDetail}>
          {eventSchema.response.data.status.detail}
        </span>}
      </p>
    </div>}
  </div>;
};

export default memo(DetailsSection);

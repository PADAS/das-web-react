import React, { memo, useCallback, useContext, useEffect, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from '@rjsf/bootstrap-4';
import { format, isToday, isValid, parseISO } from 'date-fns';
import MoonLoader from 'react-spinners/MoonLoader';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as PencilWritingIcon } from '../../common/images/icons/pencil-writing.svg';

import { EVENT_FORM_STATES, FEATURE_FLAG_LABELS, VALID_EVENT_GEOMETRY_TYPES } from '../../constants';
import {
  filterOutErrorsForHiddenProperties,
  filterOutRequiredValueOnSchemaPropErrors,
  getLinearErrorPropTree,
} from '../../utils/event-schemas';
import { getHoursAndMinutesString } from '../../utils/datetime';
import { selectEventTypeByValue } from '../../selectors/event-types';
import { setMapLocationSelectionEvent } from '../../ducks/map-ui';
import { TrackerContext } from '../../utils/analytics';
import { useFeatureFlag } from '../../hooks';

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
import AreaSelectorInput from './AreaSelectorInput';
import DatePicker, { EMPTY_DATE_VALUE } from '../../DatePicker';
import GeometryPreview from './AreaSelectorInput/GeometryPreview';
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
  loadingSchema,
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
  originalReport,
  ref,
  reportForm,
  submitFormButtonRef,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection' });

  const eventType = useSelector((state) => reportForm?.event_type ? selectEventTypeByValue(state, reportForm.event_type) : null);

  // Temporary solution to test new schemas starts here.
  // Feature flag to enable mocks schemas from the selector.
  const efbFormSchemaSupportEnabled = useFeatureFlag(FEATURE_FLAG_LABELS.EFB_FORM_SCHEMA_SUPPORT_ENABLED);
  // Schema from schema selector, it is stored in redux.
  const schemaFromSchemaSelector = useSelector(
    (state) => efbFormSchemaSupportEnabled ? state.view.schemaSelector.schema?.schema : null
  );
  // Override to the schema.
  const eventSchemaOverride = efbFormSchemaSupportEnabled ? schemaFromSchemaSelector : eventSchema;
  // Temporary solution to test new schemas ends here.

  const reportTracker = useContext(TrackerContext);

  const reportTime = reportForm?.time ? new Date(reportForm.time) : null;

  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [date, setDate] = useState(reportTime ? format(reportTime, 'yyyy-MM-dd') : EMPTY_DATE_VALUE);
  const [time, setTime] = useState(reportTime ? getHoursAndMinutesString(reportTime) : EMPTY_TIME_VALUE);

  const geometryType = eventType?.geometry_type;
  const jsonSchema = eventType?.version === 1 ? eventSchemaOverride?.schema : eventSchemaOverride?.json;
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
      eventSchemaOverride.uiSchema
    );

    return filteredErrors.map((error) => ({ ...error, linearProperty: getLinearErrorPropTree(error.property) }));
  }, [eventSchemaOverride?.uiSchema]);

  useEffect(() => {
    dispatch(setMapLocationSelectionEvent(reportForm));

    return () => dispatch(setMapLocationSelectionEvent(null));
  }, [dispatch, reportForm]);

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
              ? <AreaSelectorInput
                event={reportForm}
                onGeometryChange={onReportGeometryChange}
                originalEvent={originalReport}
              />
              : <LocationPicker
                id="reportManager-detailsSection-locationPicker"
                onChange={onReportLocationChange}
                value={reportForm.location || null}
              />
            }
          </label>

          <div className={styles.reportDateTimeContainer}>
            <label className={`${styles.fieldLabel} ${styles.datePickerLabel}`}>
              {t('dateLabel')}

              <DatePicker
                data-testid="reportManager-detailsSection-datePicker"
                disabled={jsonSchema?.readonly}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={onDatePickerChange}
                value={date}
              />
            </label>

            <label className={`${styles.fieldLabel} ${styles.timePickerLabel}`}>
              {t('timeLabel')}

              <TimePicker
                data-testid="reportManager-detailsSection-timePicker"
                disabled={jsonSchema?.readonly}
                max={reportTime && isToday(reportTime) ? getHoursAndMinutesString(new Date()) : undefined}
                minutesInterval={15}
                onChange={onTimePickerChange}
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
    {(eventType?.version === 1 && !efbFormSchemaSupportEnabled) && !!jsonSchema && <Form
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
      uiSchema={eventSchemaOverride?.uiSchema}
      validator={formValidator}
    >
      <button ref={submitFormButtonRef} type="submit" />
    </Form>}

    {(eventType?.version === 2 || efbFormSchemaSupportEnabled) && eventSchemaOverride && <SchemaForm
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
      schema={eventSchemaOverride}
    />}

    {!eventSchemaOverride && !reportForm.is_collection && loadingSchema && <div className={styles.loaderWrapper}>
      <MoonLoader
        color={LOADER_COLOR}
        data-testid="reportManager-detailsSection-loader"
        size={LOADER_SIZE}
      />
    </div>}
  </div>;
};

export default memo(DetailsSection);

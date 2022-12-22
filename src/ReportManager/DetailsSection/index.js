import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { customizeValidator } from '@rjsf/validator-ajv6';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from '@rjsf/bootstrap-4';
import metaSchemaDraft04 from 'ajv/lib/refs/json-schema-draft-04.json';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { ResizeSpinLoader } from 'react-css-loaders';

import { ReactComponent as PencilWritingIcon } from '../../common/images/icons/pencil-writing.svg';

import { calcGeometryTypeForReport } from '../../utils/events';
import {
  filterOutErrorsForHiddenProperties,
  filterOutRequiredValueOnSchemaPropErrors,
  getLinearErrorPropTree,
} from '../../utils/event-schemas';
import { getHoursAndMinutesString } from '../../utils/datetime';
import { setMapLocationSelectionEvent } from '../../ducks/map-ui';
import { EVENT_FORM_STATES, VALID_EVENT_GEOMETRY_TYPES } from '../../constants';

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
import DatePicker from '../../DatePicker';
import LocationSelectorInput from '../../EditableItem/LocationSelectorInput';
import PrioritySelect from '../../PrioritySelect';
import ReportedBySelect from '../../ReportedBySelect';
import TimePicker from '../../TimePicker';

import styles from './styles.module.scss';

const formValidator = customizeValidator({ additionalMetaSchemas: [metaSchemaDraft04] });

const LOADER_COLOR = '#006cd9'; // Bright blue
const LOADER_SIZE = 4;

const DetailsSection = ({
  formSchema,
  formUISchema,
  isCollection,
  loadingSchema,
  onFormChange,
  onFormError,
  onFormSubmit,
  onPriorityChange,
  onReportedByChange,
  onReportDateChange,
  onReportGeometryChange,
  onReportLocationChange,
  onReportStateChange,
  onReportTimeChange,
  originalReport,
  reportForm,
  submitFormButtonRef,
}) => {
  const dispatch = useDispatch();

  const eventTypes = useSelector((state) => state.data.eventTypes);

  const datePickerRef = useRef(null);

  const reportState = reportForm.state === EVENT_FORM_STATES.NEW_LEGACY ? EVENT_FORM_STATES.ACTIVE : reportForm.state;

  const geometryType = useMemo(() => calcGeometryTypeForReport(reportForm, eventTypes), [eventTypes, reportForm]);

  const reportLocation = useMemo(
    () => !!reportForm.location ? [reportForm.location.longitude, reportForm.location.latitude] : null,
    [reportForm.location]
  );

  const handleReportDateChange = useCallback((date) => {
    setTimeout(() => datePickerRef.current.setOpen(false), 0);
    onReportDateChange(date);
  }, [onReportDateChange]);

  const transformErrors = useCallback((errors) => {
    const filteredErrors = filterOutErrorsForHiddenProperties(
      filterOutRequiredValueOnSchemaPropErrors(errors),
      formUISchema
    );

    return filteredErrors.map((error) => ({ ...error, linearProperty: getLinearErrorPropTree(error.property) }));
  }, [formUISchema]);

  useEffect(() => {
    dispatch(setMapLocationSelectionEvent(reportForm));
  }, [dispatch, reportForm]);

  return <>
    <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <PencilWritingIcon />

        <h2>Details</h2>
      </div>

      <div>
        <Dropdown className={`${styles.stateDropdown} ${styles[reportForm.state]}`} onSelect={onReportStateChange}>
          <Dropdown.Toggle variant="success" id="dropdown-basic">
            {reportState}
          </Dropdown.Toggle>

          <Dropdown.Menu className={styles.stateDropdownMenu}>
            {Object.values(EVENT_FORM_STATES)
              .filter((eventState) => eventState !== EVENT_FORM_STATES.NEW_LEGACY)
              .map((eventState) => <Dropdown.Item className={styles.stateItem} eventKey={eventState} key={eventState}>
                {eventState}
              </Dropdown.Item>)}
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>

    <div className={styles.container}>
      <div className={styles.row}>
        {!isCollection && <label data-testid="reportManager-reportedBySelect" className={styles.fieldLabel}>
          Reported By
          <ReportedBySelect onChange={onReportedByChange} value={reportForm?.reported_by} />
        </label>}

        <label data-testid="reportManager-prioritySelector" className={styles.fieldLabel}>
          Priority
          <PrioritySelect onChange={onPriorityChange} priority={reportForm?.priority} />
        </label>
      </div>

      {!isCollection && <div className={styles.row}>
        <label data-testid="reportManager-reportLocationSelect" className={styles.fieldLabel}>
          Report location
          {geometryType === VALID_EVENT_GEOMETRY_TYPES.POLYGON
              ? <AreaSelectorInput
                  event={reportForm}
                  originalEvent={originalReport}
                  onGeometryChange={onReportGeometryChange}
              />
              : <LocationSelectorInput
                  label={null}
                  location={reportLocation}
                  onLocationChange={onReportLocationChange}
              />
          }
        </label>

        <div className={styles.reportDateTimeContainer}>
          <label data-testid="reportManager-datePicker" className={`${styles.fieldLabel} ${styles.datePickerLabel}`}>
            Report Date
            <DatePicker
              className={styles.datePicker}
              onChange={handleReportDateChange}
              ref={datePickerRef}
              selected={new Date(reportForm?.time)}
            />
          </label>

          <label data-testid="reportManager-timePicker" className={`${styles.fieldLabel} ${styles.timePickerLabel}`}>
            Report Time
            <TimePicker
              minutesInterval={15}
              onChange={onReportTimeChange}
              optionsToDisplay={15}
              value={getHoursAndMinutesString(new Date(reportForm?.time))}
            />
          </label>
        </div>
      </div>}
    </div>

    {!!formSchema && <Form
        className={styles.form}
        disabled={formSchema.readonly}
        fields={{ externalLink: ExternalLinkField }}
        formData={reportForm.event_details}
        onChange={onFormChange}
        onError={onFormError}
        onSubmit={onFormSubmit}
        schema={formSchema}
        showErrorList={false}
        templates={{
          ArrayFieldItemTemplate,
          ArrayFieldTemplate,
          BaseInputTemplate,
          ButtonTemplates: { AddButton, MoveDownButton, MoveUpButton, RemoveButton },
          ObjectFieldTemplate,
        }}
        transformErrors={transformErrors}
        uiSchema={formUISchema}
        validator={formValidator}
      >
      <button ref={submitFormButtonRef} type="submit" />
    </Form>}

    {!formSchema && loadingSchema && <ResizeSpinLoader
      color={LOADER_COLOR}
      data-testid="reportManager-detailsSection-loader"
      size={LOADER_SIZE}
    />}
  </>;
};

DetailsSection.defaultProps = {
  formSchema: null,
  formUISchema: null,
};

DetailsSection.propTypes = {
  formSchema: PropTypes.object,
  formUISchema: PropTypes.object,
  isCollection: PropTypes.bool.isRequired,
  loadingSchema: PropTypes.bool.isRequired,
  onFormChange: PropTypes.func.isRequired,
  onFormError: PropTypes.func.isRequired,
  onFormSubmit: PropTypes.func.isRequired,
  onPriorityChange: PropTypes.func.isRequired,
  onReportedByChange: PropTypes.func.isRequired,
  onReportDateChange: PropTypes.func.isRequired,
  onReportGeometryChange: PropTypes.func.isRequired,
  onReportLocationChange: PropTypes.func.isRequired,
  originalReport: PropTypes.object.isRequired,
  onReportTimeChange: PropTypes.func.isRequired,
  reportForm: PropTypes.object.isRequired,
  submitFormButtonRef: PropTypes.object.isRequired,
};

export default memo(DetailsSection);

import React, { forwardRef, memo, useCallback, useEffect, useMemo } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from '@rjsf/bootstrap-4';
import { isToday } from 'date-fns';
import PropTypes from 'prop-types';
import { ResizeSpinLoader } from 'react-css-loaders';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as PencilWritingIcon } from '../../common/images/icons/pencil-writing.svg';

import { calcGeometryTypeForReport } from '../../utils/events';
import { EVENT_FORM_STATES, VALID_EVENT_GEOMETRY_TYPES } from '../../constants';
import {
  filterOutErrorsForHiddenProperties,
  filterOutRequiredValueOnSchemaPropErrors,
  getLinearErrorPropTree,
} from '../../utils/event-schemas';
import { getHoursAndMinutesString } from '../../utils/datetime';
import { setMapLocationSelectionEvent } from '../../ducks/map-ui';

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
import GeometryPreview from './AreaSelectorInput/GeometryPreview';
import LocationSelectorInput from '../../EditableItem/LocationSelectorInput';
import PrioritySelect from '../../PrioritySelect';
import ReportedBySelect from '../../ReportedBySelect';
import TimePicker from '../../TimePicker';

import styles from './styles.module.scss';

const LOADER_COLOR = '#006cd9'; // Bright blue
const LOADER_SIZE = 4;

const DetailsSection = ({
  formSchema,
  formUISchema,
  formValidator,
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
}, ref) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection' });

  const eventTypes = useSelector((state) => state.data.eventTypes);

  const reportLocation = !!reportForm.location ? [reportForm.location.longitude, reportForm.location.latitude] : null;
  const reportState = reportForm.state === EVENT_FORM_STATES.NEW_LEGACY ? EVENT_FORM_STATES.ACTIVE : reportForm.state;
  const reportTime = new Date(reportForm?.time);

  const geometryType = useMemo(() =>
    reportForm
    && eventTypes
    && calcGeometryTypeForReport(reportForm, eventTypes)
  , [eventTypes, reportForm]);

  const transformErrors = useCallback((errors) => {
    const filteredErrors = filterOutErrorsForHiddenProperties(
      filterOutRequiredValueOnSchemaPropErrors(errors),
      formUISchema
    );

    return filteredErrors.map((error) => ({ ...error, linearProperty: getLinearErrorPropTree(error.property) }));
  }, [formUISchema]);

  useEffect(() => {
    dispatch(setMapLocationSelectionEvent(reportForm));

    return () => {
      dispatch(setMapLocationSelectionEvent(null));
    };
  }, [dispatch, reportForm]);

  return <div ref={ref}>
    <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <PencilWritingIcon />

        <h2>{t('detailsHeader')}</h2>
      </div>

      <div>
        <Dropdown className={`${styles.stateDropdown} ${styles[reportForm.state]}`} onSelect={onReportStateChange}>
          <Dropdown.Toggle variant="success">
            {t(`stateDropdown.${reportState}`)}
          </Dropdown.Toggle>

          <Dropdown.Menu className={styles.stateDropdownMenu}>
            {Object.values(EVENT_FORM_STATES)
              .filter((eventState) => eventState !== EVENT_FORM_STATES.NEW_LEGACY)
              .map((eventState) => <Dropdown.Item className={styles.stateItem} eventKey={eventState} key={eventState}>
                {t(`stateDropdown.${eventState}`)}
              </Dropdown.Item>)}
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>

    <div className={styles.container}>
      <div className={styles.row}>
        {!isCollection && <label data-testid="reportManager-reportedBySelect" className={styles.fieldLabel}>
          {t('reportedByLabel')}

          <ReportedBySelect
            isDisabled={formSchema?.readonly}
            onChange={onReportedByChange}
            value={reportForm?.reported_by}
          />
        </label>}

        <label className={styles.fieldLabel} data-testid="reportManager-prioritySelector">
          {t('priorityLabel')}

          <PrioritySelect
            isDisabled={formSchema?.readonly}
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
          <label className={`${styles.fieldLabel} ${styles.datePickerLabel}`} data-testid="reportManager-datePicker">
            {t('dateLabel')}

            <DatePicker
              className={styles.datePicker}
              disabled={formSchema?.readonly}
              maxDate={new Date()}
              onChange={onReportDateChange}
              selected={reportForm?.time ? reportTime : undefined}
            />
          </label>

          <label className={`${styles.fieldLabel} ${styles.timePickerLabel}`} data-testid="reportManager-timePicker">
            {t('timeLabel')}

            <TimePicker
              disabled={formSchema?.readonly}
              maxTime={isToday(reportTime) ? getHoursAndMinutesString(new Date()) : undefined}
              minutesInterval={15}
              onChange={onReportTimeChange}
              value={getHoursAndMinutesString(reportTime)}
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

    {!!formSchema && <Form
      className={`${styles.form} ${reportForm.is_collection ? styles.hidden : ''}`}
      disabled={formSchema?.readonly}
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

    {!formSchema && !reportForm.is_collection && loadingSchema && <ResizeSpinLoader
      color={LOADER_COLOR}
      data-testid="reportManager-detailsSection-loader"
      size={LOADER_SIZE}
    />}
  </div>;
};

const DetailsSectionForwardRef = forwardRef(DetailsSection);

DetailsSectionForwardRef.defaultProps = {
  formSchema: null,
  formUISchema: null,
};

DetailsSectionForwardRef.propTypes = {
  formSchema: PropTypes.object,
  formUISchema: PropTypes.object,
  formValidator: PropTypes.object.isRequired,
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
  onReportTimeChange: PropTypes.func.isRequired,
  originalReport: PropTypes.object.isRequired,
  reportForm: PropTypes.object.isRequired,
  submitFormButtonRef: PropTypes.object.isRequired,
};

export default memo(DetailsSectionForwardRef);

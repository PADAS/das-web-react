import React, { memo, useCallback, useEffect, useMemo } from 'react';
import Form from '@rjsf/bootstrap-4';
import metaSchemaDraft04 from 'ajv/lib/refs/json-schema-draft-04.json';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { customizeValidator } from '@rjsf/validator-ajv6';

import ReportedBySelect from '../../ReportedBySelect';

import { ReactComponent as PencilWritingIcon } from '../../common/images/icons/pencil-writing.svg';

import { calcGeometryTypeForReport } from '../../utils/events';
import {
  filterOutErrorsForHiddenProperties,
  filterOutRequiredValueOnSchemaPropErrors,
  getLinearErrorPropTree,
} from '../../utils/event-schemas';
import { setMapLocationSelectionEvent } from '../../ducks/map-ui';
import { VALID_EVENT_GEOMETRY_TYPES } from '../../constants';

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
import LocationSelectorInput from '../../EditableItem/LocationSelectorInput';
import PrioritySelect from '../../PrioritySelect';

import styles from './styles.module.scss';

const jsonFormValidator = customizeValidator({ additionalMetaSchemas: [metaSchemaDraft04] });

const DetailsSection = ({
  jsonFormSchema,
  jsonFormUISchema,
  onJsonFormChange,
  onJsonFormError,
  onJsonFormSubmit,
  onPriorityChange,
  onReportedByChange,
  onReportGeometryChange,
  onReportLocationChange,
  originalReport,
  reportForm,
  submitJsonFormButtonRef,
}) => {
  const dispatch = useDispatch();

  const eventTypes = useSelector((state) => state.data.eventTypes);

  const geometryType = useMemo(() => calcGeometryTypeForReport(reportForm, eventTypes), [eventTypes, reportForm]);

  const reportLocation = useMemo(
    () => !!reportForm.location ? [reportForm.location.longitude, reportForm.location.latitude] : null,
    [reportForm.location]
  );

  const transformErrors = useCallback((errors) => {
    const filteredErrors = filterOutErrorsForHiddenProperties(
      filterOutRequiredValueOnSchemaPropErrors(errors),
      jsonFormUISchema
    );

    return filteredErrors.map((error) => ({ ...error, linearProperty: getLinearErrorPropTree(error.property) }));
  }, [jsonFormUISchema]);

  useEffect(() => {
    dispatch(setMapLocationSelectionEvent(reportForm));
  }, [dispatch, reportForm]);

  return <>
    <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <PencilWritingIcon />

        <h2>Details</h2>
      </div>
    </div>

    <div className={styles.container}>
      <div className={styles.row}>
        <label data-testid="reportManager-reportedBySelect" className={styles.fieldLabel}>
          Reported By
          <ReportedBySelect onChange={onReportedByChange} value={reportForm?.reported_by} />
        </label>

        <label data-testid="reportManager-prioritySelector" className={styles.fieldLabel}>
          Priority
          <PrioritySelect onChange={onPriorityChange} priority={reportForm?.priority} />
        </label>
      </div>

      <div className={styles.row}>
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
      </div>
    </div>

    {jsonFormSchema && <Form
        className={styles.form}
        disabled={jsonFormSchema.readonly}
        fields={{ externalLink: ExternalLinkField }}
        formData={reportForm.event_details}
        onChange={onJsonFormChange}
        onError={onJsonFormError}
        onSubmit={onJsonFormSubmit}
        schema={jsonFormSchema}
        showErrorList={false}
        templates={{
          ArrayFieldItemTemplate,
          ArrayFieldTemplate,
          BaseInputTemplate,
          ButtonTemplates: { AddButton, MoveDownButton, MoveUpButton, RemoveButton },
          ObjectFieldTemplate,
        }}
        transformErrors={transformErrors}
        uiSchema={jsonFormUISchema}
        validator={jsonFormValidator}
      >
      <button ref={submitJsonFormButtonRef} type="submit" />
    </Form>}
  </>;
};

DetailsSection.propTypes = {
  jsonFormSchema: PropTypes.object.isRequired,
  jsonFormUISchema: PropTypes.object.isRequired,
  onJsonFormChange: PropTypes.func.isRequired,
  onJsonFormError: PropTypes.func.isRequired,
  onJsonFormSubmit: PropTypes.func.isRequired,
  onPriorityChange: PropTypes.func.isRequired,
  onReportedByChange: PropTypes.func.isRequired,
  onReportGeometryChange: PropTypes.func.isRequired,
  onReportLocationChange: PropTypes.func.isRequired,
  originalReport: PropTypes.object.isRequired,
  reportForm: PropTypes.object.isRequired,
  submitJsonFormButtonRef: PropTypes.object.isRequired,
};

export default memo(DetailsSection);

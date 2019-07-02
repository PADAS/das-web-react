import React, { memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { fetchEventTypeSchema } from '../ducks/event-schemas';
import { fetchEvent } from '../ducks/events';
import { removeModal, updateModal } from '../ducks/modals';

import { createNewReportForEventType } from '../utils/events';

import LoadingOverlay from '../LoadingOverlay';
import ReportForm from '../ReportForm';

import styles from './styles.module.scss';

const ReportFormModal = (props) => {
  const { report_id, id:modalId, event_type, eventSchemas, eventStore,
    eventTypes, onSaveError, onSaveSuccess, fetchEventTypeSchema,
    removeModal, updateModal, fetchEvent, relationshipButtonDisabled, map } = props;


  const eventFromStore = eventStore[report_id];
  const schemasFromStore = eventSchemas[event_type];
  const eventTypeFromStore = eventTypes.find(({ value }) => value === event_type);

  const [report, setReport] = useState(null);
  const [schemas, setSchemas] = useState(null);
  const [loaded, setLoadState] = useState(false);

  useEffect(() => {
    if (!schemasFromStore) {
      fetchEventTypeSchema(event_type);
    } else {
      setSchemas(schemasFromStore);
    }
  }, [schemasFromStore]);

  useEffect(() => {
    if (!report_id) { // must be new
      setReport(createNewReportForEventType(eventTypeFromStore));
    } else {
      if (eventFromStore) {
        setReport(eventFromStore); // only draw report data from the central store
      } else {
        fetchEvent(report_id);
      }
    }
  }, [report_id, eventFromStore]);

  useEffect(() => {
    if (report && schemas) {
      setLoadState(true);
    }
  }, [report, schemas]);

  if (!loaded) {
    return <LoadingOverlay className={styles.loadingOverlay} message='Loading...' />;
  }

  return loaded && <ReportForm
    report={report}
    modalId={modalId}
    uiSchema={schemas.uiSchema}
    removeModal={() => removeModal(modalId)}
    updateModal={(...data) => updateModal({ id: modalId, ...data })}
    schema={schemas.schema}
    onSaveError={onSaveError}
    onSaveSuccess={onSaveSuccess}
    relationshipButtonDisabled={relationshipButtonDisabled}
    map={map}
  />;
};

const mapStatetoProps = ({ data: { eventSchemas, eventStore, eventTypes } }) => ({ eventSchemas, eventStore, eventTypes });

export default connect(mapStatetoProps, {
  fetchEventTypeSchema: (...args) => fetchEventTypeSchema(...args), 
  fetchEvent: (...args) => fetchEvent(...args), removeModal, updateModal })(memo(ReportFormModal));

ReportFormModal.propTypes = {
  report_id: PropTypes.string,
  event_type: PropTypes.string.isRequired,
  onSaveSuccess: PropTypes.func,
  onSaveError: PropTypes.func,
};

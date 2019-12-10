import React, { memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { fetchEventTypeSchema } from '../ducks/event-schemas';
import { fetchEvent } from '../ducks/events';
import { removeModal, updateModal } from '../ducks/modals';

import LoadingOverlay from '../LoadingOverlay';
import ReportForm from '../ReportForm';

import styles from './styles.module.scss';

const ReportFormModal = (props) => {
  const { report, id:modalId, eventSchemas, eventStore, onSaveError, onSaveSuccess, fetchEventTypeSchema,
    removeModal, updateModal, fetchEvent, relationshipButtonDisabled, map } = props;

  const { id: report_id, event_type } = report;

  const eventFromStore = eventStore[report_id];
  const schemasFromStore = eventSchemas[event_type];

  const [stateReport, setReport] = useState(null);
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
    if (!report_id) { // must be new, use what's been generated
      setReport(report);
    } else {
      if (eventFromStore) {
        setReport(eventFromStore); // only draw report data from the central store
      } else {
        fetchEvent(report_id);
      }
    }
  }, [report_id, eventFromStore]);

  useEffect(() => {
    if (stateReport && schemas) {
      setLoadState(true);
    }
  }, [stateReport, schemas]);

  if (!loaded) {
    return <LoadingOverlay className={styles.loadingOverlay} message='Loading...' />;
  }

  return loaded && <ReportForm
    report={stateReport}
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

const mapStatetoProps = ({ data: { eventSchemas, eventStore } }) => ({ eventSchemas, eventStore });

export default connect(mapStatetoProps, {
  fetchEventTypeSchema: (...args) => fetchEventTypeSchema(...args), 
  fetchEvent: (...args) => fetchEvent(...args), removeModal, updateModal })(memo(ReportFormModal));

ReportFormModal.propTypes = {
  report: PropTypes.object.isRequired,
  onSaveSuccess: PropTypes.func,
  onSaveError: PropTypes.func,
};

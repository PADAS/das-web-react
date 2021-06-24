import React, { memo, useCallback, useEffect, useState } from 'react';
import { withMap } from '../EarthRangerMap';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { fetchEventTypeSchema } from '../ducks/event-schemas';
import { fetchEvent } from '../ducks/events';
import { removeModal } from '../ducks/modals';

import EditableItem from '../EditableItem';

import LoadingOverlay from '../LoadingOverlay';
import ReportForm from '../ReportForm';

import styles from './styles.module.scss';

const ReportFormModal = (props) => {
  const { report, id:modalId, eventSchemas, eventStore, onSaveError, onSaveSuccess, fetchEventTypeSchema,
    removeModal, fetchEvent, navigateRelationships, relationshipButtonDisabled, map, hidePatrols} = props;

  const { id: report_id, event_type } = report;

  const eventFromStore = eventStore[report_id];
  const schemasFromStore = eventSchemas[event_type];

  const [stateReport, setReport] = useState(report);
  const [schemas, setSchemas] = useState(schemasFromStore);
  const [loaded, setLoadState] = useState(false);

  const onRemoveModal = useCallback(() => {
    removeModal(modalId);
  }, [modalId, removeModal]);

  useEffect(() => {
    if (!schemasFromStore) {
      fetchEventTypeSchema(event_type);
    } else {
      setSchemas(schemasFromStore);
    }
  }, [event_type, fetchEventTypeSchema, schemasFromStore]);

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
  }, [report_id, eventFromStore, report, fetchEvent]);

  useEffect(() => {
    if (!loaded && stateReport && schemas) {
      setLoadState(true);
    }
  }, [stateReport, schemas, loaded]);

  if (!loaded) {
    return <LoadingOverlay className={styles.loadingOverlay} message='Loading...' />;
  }

  const isPatrolReport = !!stateReport.patrol_segments && !!stateReport.patrol_segments.length;

  return loaded && <EditableItem data={stateReport}>
    <EditableItem.Modal>
      <ReportForm
        modalId={modalId}
        uiSchema={schemas.uiSchema}
        removeModal={onRemoveModal}
        schema={schemas.schema}
        onSaveError={onSaveError}
        onSaveSuccess={onSaveSuccess}
        hidePatrols={hidePatrols}
        isPatrolReport={isPatrolReport}
        formProps={{navigateRelationships, relationshipButtonDisabled}}
        map={map}
      />
    </EditableItem.Modal>
  </EditableItem>;
};

const mapStatetoProps = ({ data: { eventSchemas, eventStore } }) => ({ eventSchemas, eventStore });

export default connect(mapStatetoProps, {
  fetchEventTypeSchema: (...args) => fetchEventTypeSchema(...args), 
  fetchEvent: (...args) => fetchEvent(...args), removeModal })(memo(withMap(ReportFormModal)));

ReportFormModal.propTypes = {
  report: PropTypes.object.isRequired,
  onSaveSuccess: PropTypes.func,
  onSaveError: PropTypes.func,
};

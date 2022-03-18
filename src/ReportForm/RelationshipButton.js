import React, { memo, Fragment, useCallback, useContext, useMemo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { DEVELOPMENT_FEATURE_FLAGS } from '../constants';
import { openModalForPatrol } from '../utils/patrols';
import { fetchEvent } from '../ducks/events';
import { fetchPatrol, showPatrolDetailView } from '../ducks/patrols';
import { eventBelongsToPatrol, eventBelongsToCollection, openModalForReport } from '../utils/events';

import { trackEventFactory, EVENT_REPORT_CATEGORY, INCIDENT_REPORT_CATEGORY, REPORT_MODAL_CATEGORY } from '../utils/analytics';

import { FormDataContext } from '../EditableItem/context';

import AddReport from '../AddReport';
import { AttachmentButton } from '../EditableItem/AttachmentControls';

import { ReactComponent as FieldReportIcon } from '../common/images/icons/go_to_incident.svg';
import { ReactComponent as PatrolIcon } from '../common/images/icons/go_to_patrol.svg';

const { PATROL_NEW_UI, UFA_NAVIGATION_UI } = DEVELOPMENT_FEATURE_FLAGS;
const RelationshipButton = (props) => {
  const { fetchEvent, fetchPatrol, showPatrolDetailView, hidePatrols, navigateRelationships = true, onNewReportSaved, map, removeModal } = props;
  const report = useContext(FormDataContext);

  const isPatrolReport = useMemo(() => eventBelongsToPatrol(report), [report]);
  const isCollection = !!report.is_collection;
  const isCollectionChild = useMemo(() => eventBelongsToCollection(report), [report]);

  const typeOfReportToTrack = isCollection ? INCIDENT_REPORT_CATEGORY : EVENT_REPORT_CATEGORY;
  const reportTracker = trackEventFactory(typeOfReportToTrack);

  const goToParentCollection = useCallback(() => {
    const { is_contained_in: [{ related_event: { id: incidentID } }] } = report;

    reportTracker.track('Click \'Go to Incident\' button');

    return fetchEvent(incidentID).then(({ data: { data } }) => {
      removeModal();
      openModalForReport(data, map);
    });
  }, [fetchEvent, map, removeModal, report, reportTracker]);

  const goToParentPatrol = useCallback(() => {
    const [patrolId] = report.patrols;

    reportTracker.track('Click \'Go to Patrol\' button');

    removeModal();
    if (PATROL_NEW_UI && UFA_NAVIGATION_UI) return showPatrolDetailView({ id: patrolId });
    return fetchPatrol(patrolId).then(({ data: { data } }) => {
      openModalForPatrol(data, map);
    });
  }, [fetchPatrol, map, removeModal, report.patrols, reportTracker, showPatrolDetailView]);

  return <Fragment>
    {navigateRelationships && <Fragment>
      {isPatrolReport && <AttachmentButton icon={PatrolIcon} title='Go To Patrol' onClick={goToParentPatrol} />}
      {isCollectionChild && <AttachmentButton icon={FieldReportIcon} title='Go To Collection' onClick={goToParentCollection} />}
    </Fragment>}
    {(isCollection || (!isPatrolReport && !isCollectionChild)) && <AddReport
      analyticsMetadata={{
        category: REPORT_MODAL_CATEGORY,
        location: 'report modal',
      }}
      formProps={{
        hidePatrols: hidePatrols,
        relationshipButtonDisabled: true,
        onSaveSuccess: onNewReportSaved,
      }}
    />}
  </Fragment>;
};


export default memo(connect(null, { fetchEvent: id => fetchEvent(id), fetchPatrol: id => fetchPatrol(id), showPatrolDetailView })(RelationshipButton));

RelationshipButton.propTypes = {
  onNewReportSaved: PropTypes.func,
  isCollectionChild: PropTypes.bool,
  isPatrolReport: PropTypes.bool,
  onGoToCollection: PropTypes.func,
  map: PropTypes.object,
  showPatrolDetailView: PropTypes.func.isRequired,
};
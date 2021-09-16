import React, { memo, Fragment, useCallback, useContext, useMemo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { eventBelongsToPatrol, eventBelongsToCollection, openModalForReport } from '../utils/events';
import { openModalForPatrol } from '../utils/patrols';
import { fetchEvent } from '../ducks/events';
import { fetchPatrol } from '../ducks/patrols';
import { trackEvent } from '../utils/analytics';

import { FormDataContext } from '../EditableItem/context';

import AddReport from '../AddReport';
import { AttachmentButton } from '../EditableItem/AttachmentControls';

import { ReactComponent as FieldReportIcon } from '../common/images/icons/go_to_incident.svg';
import { ReactComponent as PatrolIcon } from '../common/images/icons/go_to_patrol.svg';

const RelationshipButton = (props) => {
  const { fetchEvent, fetchPatrol, hidePatrols, navigateRelationships = true, onNewReportSaved, map, removeModal } = props;

  const report = useContext(FormDataContext);

  const isPatrolReport = useMemo(() => eventBelongsToPatrol(report), [report]);
  const isCollection = !!report.is_collection;
  const isCollectionChild = useMemo(() => eventBelongsToCollection(report), [report]);

  const goToParentCollection = useCallback(() => {
    const { is_contained_in: [{ related_event: { id: incidentID } }] } = report;

    trackEvent(`${report.is_collection?'Incident':'Event'} Report`, 'Click \'Go to Incident\' button');

    return fetchEvent(incidentID).then(({ data: { data } }) => {
      removeModal();
      openModalForReport(data, map);
    });
  }, [fetchEvent, map, removeModal, report]);

  const goToParentPatrol = useCallback(() => {
    const [patrolId] = report.patrols;

    trackEvent(`${report.is_collection?'Incident':'Event'} Report`, 'Click \'Go to Patrol\' button');

    return fetchPatrol(patrolId).then(({ data: { data } }) => {
      removeModal();
      openModalForPatrol(data, map);
    });
  }, [fetchPatrol, map, removeModal, report.is_collection, report.patrols]);

  return <Fragment>
    {navigateRelationships && <Fragment>
      {isPatrolReport && <AttachmentButton icon={PatrolIcon} title='Go To Patrol' onClick={goToParentPatrol} />}
      {isCollectionChild && <AttachmentButton icon={FieldReportIcon} title='Go To Collection' onClick={goToParentCollection} />}
    </Fragment>}
    {(isCollection || (!isPatrolReport && !isCollectionChild)) && <AddReport
      analyticsMetadata={{
        category: 'Report Modal',
        location: 'report modal',
      }}
      map={map}
      formProps={{
        hidePatrols: hidePatrols,
        relationshipButtonDisabled: true,
        onSaveSuccess: onNewReportSaved,
      }}
    />}
  </Fragment>;
};


export default memo(connect(null, { fetchEvent: id => fetchEvent(id), fetchPatrol: id => fetchPatrol(id) })(RelationshipButton));

RelationshipButton.propTypes = {
  onNewReportSaved: PropTypes.func,
  isCollectionChild: PropTypes.bool,
  isPatrolReport: PropTypes.bool,
  onGoToCollection: PropTypes.func,
  map: PropTypes.object,
};
import React, { memo, Fragment } from 'react';
import PropTypes from 'prop-types';

import AddReport from '../AddReport';
import { AttachmentButton } from '../EditableItem/AttachmentControls';

import { ReactComponent as FieldReportIcon } from '../common/images/icons/go_to_incident.svg';

const RelationshipButton = (props) => {
  const { relationshipButtonDisabled, hidePatrols, onNewReportSaved, isCollectionChild, onGoToCollection, map } = props;

  return !relationshipButtonDisabled && <Fragment>
    {!isCollectionChild && <AddReport map={map} hidePatrols={hidePatrols} relationshipButtonDisabled={true} onSaveSuccess={onNewReportSaved} />}
    {isCollectionChild && <AttachmentButton icon={FieldReportIcon} title='Go To Collection' onClick={onGoToCollection} />}

  </Fragment>;
};

export default memo(RelationshipButton);

RelationshipButton.propTypes = {
  relationshipButtonDisabled: PropTypes.bool,
  onNewReportSaved: PropTypes.func,
  isCollectionChild: PropTypes.bool,
  onGoToCollection: PropTypes.func,
  map: PropTypes.object,
};
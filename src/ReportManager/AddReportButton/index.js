import React, { memo, useRef } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as DocumentIcon } from '../../common/images/icons/document.svg';

import { REPORT_MODAL_CATEGORY } from '../../utils/analytics';

import AddReport from '../../AddReport';

import styles from './styles.module.scss';

const AddReportButton = ({ className, onAddReport, onSaveAddedReport }) => {
  const addReportButtonRef = useRef();

  return <div
    className={`${className} ${styles.addReportButton}`}
    data-testid="reportManager-addReportButton"
    >
    <AddReport
      analyticsMetadata={{ category: REPORT_MODAL_CATEGORY, location: 'report modal' }}
      formProps={{ hidePatrols: true, onSaveSuccess: onSaveAddedReport, relationshipButtonDisabled: true }}
      onAddReport={onAddReport}
      popoverPlacement="top"
      ref={addReportButtonRef}
      iconComponent={<DocumentIcon />}
      title="Report"
    />
  </div>;
};

AddReportButton.defaultProps = {
  className: '',
};

AddReportButton.propTypes = {
  className: PropTypes.string,
  onAddReport: PropTypes.func.isRequired,
};

export default memo(AddReportButton);

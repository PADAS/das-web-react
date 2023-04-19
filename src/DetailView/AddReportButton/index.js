import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as DocumentIcon } from '../../common/images/icons/document.svg';

import { analyticsMetadata, addReportFormProps } from '../../proptypes';
import AddReport from '../../AddReport';

import styles from './styles.module.scss';

const AddReportButton = ({ analyticsMetadata, className, clickSideEffect, formProps, onAddReport }, ref) => {
  return  <AddReport
    className={`${className} ${styles.addReportButton}`}
    analyticsMetadata={analyticsMetadata}
    clickSideEffect={clickSideEffect}
    formProps={formProps}
    onAddReport={onAddReport}
    popoverPlacement="top"
    ref={ref}
    iconComponent={<DocumentIcon />}
    title="Report"
  />;
};

AddReportButton.propTypes = {
  analyticsMetadata: analyticsMetadata.isRequired,
  formProps: addReportFormProps,
  onAddReport: PropTypes.func,
  onSaveAddedReport: PropTypes.func,
  className: PropTypes.string,
  clickSideEffect: PropTypes.func,
};

export default forwardRef(AddReportButton);
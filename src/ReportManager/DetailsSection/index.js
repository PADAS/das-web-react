import React, { memo } from 'react';
import PropTypes from 'prop-types';

import ReportedBySelect from '../../ReportedBySelect';

import { ReactComponent as PencilWritingIcon } from '../../common/images/icons/pencil-writing.svg';

import styles from './styles.module.scss';

const DetailsSection = ({ onReportedByChange, reportedBy }) => <>
  <div className={styles.sectionHeader}>
    <div className={styles.title}>
      <PencilWritingIcon />

      <h2>Details</h2>
    </div>
  </div>

  <label data-testid="reportManager-reportedBySelect" className={styles.trackedByLabel}>
    Reported By
    <ReportedBySelect onChange={onReportedByChange} value={reportedBy} />
  </label>
</>;

DetailsSection.defaultProps = { reportedBy: null };

DetailsSection.propTypes = {
  onReportedByChange: PropTypes.func.isRequired,
  reportedBy: PropTypes.object,
};

export default memo(DetailsSection);
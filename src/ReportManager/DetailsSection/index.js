import React, { memo } from 'react';
import PropTypes from 'prop-types';
import ReportedBySelect from '../../ReportedBySelect';
import { ReactComponent as PencilWritingIcon } from '../../common/images/icons/pencil-writing.svg';
import PrioritySelect from '../../PrioritySelect';
import styles from './styles.module.scss';

const DetailsSection = ({ onReportedByChange, reportedBy, onPriorityChange, priority }) => (
  <>
    <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <PencilWritingIcon />
        <h2>Details</h2>
      </div>
    </div>
    <div className={styles.formContainer}>
      <div className={styles.column}>
        <label data-testid="reportManager-reportedBySelect" className={styles.label}>
          Reported By
          <ReportedBySelect onChange={onReportedByChange} value={reportedBy} />
        </label>
      </div>
      <div className={styles.column}>
        <label data-testid="reportManager-prioritySelector" className={styles.label}>
          Priority
          <PrioritySelect onChange={onPriorityChange} priority={priority} />
        </label>
      </div>
    </div>
  </>
);

DetailsSection.defaultProps = {
  reportedBy: null,
  priority: null,
};

DetailsSection.propTypes = {
  onPriorityChange: PropTypes.func.isRequired,
  onReportedByChange: PropTypes.func.isRequired,
  reportedBy: PropTypes.object,
  priority: PropTypes.number,
};

export default memo(DetailsSection);

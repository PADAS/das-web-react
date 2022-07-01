import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import ReportedBySelect from '../../ReportedBySelect';

import { ReactComponent as PencilWritingIcon } from '../../common/images/icons/pencil-writing.svg';

import styles from './styles.module.scss';

const DetailsSection = ({ report, onReportedByChange }) => {
  return <>
    <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <PencilWritingIcon />
        <h2>Details</h2>
      </div>
    </div>
    <label data-testid="reported-by-select" className={styles.trackedByLabel}>
      Reported By
      <ReportedBySelect value={report.reported_by} onChange={onReportedByChange} />
    </label>
  </>;
};

DetailsSection.propTypes = {
  report: PropTypes.object.isRequired,
};

export default memo(DetailsSection);
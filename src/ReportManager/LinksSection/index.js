import React, { memo } from 'react';
import styles from './styles.module.scss';
import { ReactComponent as LinkIcon } from '../../common/images/icons/link.svg';
import ReportListItem from '../../ReportListItem';
import PatrolListItem from '../../PatrolListItem';
import PropTypes from 'prop-types';

const LinksSection = ({ linkedReportsInfo, patrolsInfo, onReportLinkClicked, onPatrolLinkClicked }) => {
  return (
    <div>
      <div className={styles.title}>
        <LinkIcon />
        <h2>Links</h2>
      </div>
      {
        linkedReportsInfo.map((linkedReport) => (
          <ReportListItem showJumpButton={false}
            onTitleClick={onReportLinkClicked}
            className={styles.reportLink}
            report={linkedReport}
            showElapsed={false}
            key={linkedReport.id} />
        ))
      }
      {
        patrolsInfo.map((patrolInfo) => (
          <PatrolListItem showTitleDetails={false}
            onTitleClick={onPatrolLinkClicked}
            showControls={false}
            patrol={patrolInfo}
            showStateTitle={false}
            className={styles.reportLink}
            key={patrolInfo.id} />
        ))
      }
    </div>
  );
};

LinksSection.propTypes = {
  linkedReportsInfo: PropTypes.object,
  patrolsInfo: PropTypes.object,
  onReportLinkClicked: PropTypes.func,
  onPatrolLinkClicked: PropTypes.func
};

export default memo(LinksSection);
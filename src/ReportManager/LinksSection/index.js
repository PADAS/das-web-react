import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as LinkIcon } from '../../common/images/icons/link.svg';

import LinkItem from './LinkItem';

import styles from './styles.module.scss';

const LinksSection = ({ linkedPatrols, linkedReports }) => <div data-testid="reportManager-linksSection">
  <div className={styles.sectionHeader}>
    <div className={styles.title}>
      <LinkIcon />

      <h2>Links</h2>
    </div>
  </div>

  {linkedReports.map((linkedReport) => <LinkItem item={linkedReport} key={linkedReport.id} type="report" />)}

  {linkedPatrols.map((linkedPatrol) => <LinkItem item={linkedPatrol} key={linkedPatrol.id} type="patrol" />)}
</div>;

LinksSection.defaultProps = {
  linkedPatrols: [],
  linkedReports: [],
};

LinksSection.propTypes = {
  linkedPatrols: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
  })),
  linkedReports: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
  })),
};

export default memo(LinksSection);
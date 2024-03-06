import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { ReactComponent as LinkIcon } from '../../common/images/icons/link.svg';

import { LINK_TYPES, TAB_KEYS } from '../../constants';

import LinkItem from './LinkItem';

import styles from './styles.module.scss';

const LinksSection = ({ linkedPatrols, linkedReports }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager' });

  return <div data-testid="reportManager-linksSection">
    <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <LinkIcon />

        <h2>{t('linksSection.linksHeader')}</h2>
      </div>
    </div>

    {linkedReports.map((linkedReport) => <LinkItem
      item={linkedReport}
      key={linkedReport.id}
      type={LINK_TYPES.EVENT}
      to={`/${TAB_KEYS.EVENTS}/${linkedReport.id}`}
    />)}

    {linkedPatrols.map((linkedPatrol) => <LinkItem
      item={linkedPatrol}
      key={linkedPatrol.id}
      type={LINK_TYPES.PATROL}
      to={`/${TAB_KEYS.PATROLS}/${linkedPatrol.id}`}
    />)}
  </div>;
};

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

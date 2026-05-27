import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as LinkIcon } from '../../common/images/icons/link.svg';

import { LINK_TYPES, TAB_KEYS } from '../../constants';

import LinkItem from './LinkItem';

import * as styles from './styles.module.scss';

const LinksSection = ({ linkedPatrols = [], linkedReports = [], fromLabel }) => {
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
      fromLabel={fromLabel}
    />)}
  </div>;
};

export default memo(LinksSection);

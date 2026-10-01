import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { calcTitleAndSubtitle } from '../../../../utils/titles';
import { TAB_KEYS } from '../../../../constants';

import DetailViewHeader from '../../../DetailViewHeader';
import SvgIcon from '../../../../SvgIcon';
import TitleInput from '../../../TitleInput';

import * as styles from './styles.module.scss';

const Header = ({ isTitleDirty, onChangeTitle, patrolType, title }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'newPatrol.header' });
  const { t: tHeader } = useTranslation('patrols', { keyPrefix: 'header' });

  const titles = calcTitleAndSubtitle(title, patrolType.display);

  const crumbs = [
    { label: t('breadcrumbPatrolsLabel'), to: `/${TAB_KEYS.PATROLS}` },
    { label: t('breadcrumbNewPatrolLabel') },
  ];

  const renderTitleBar = () => <>
    {/* The title is an input, so the view needs a heading of its own. */}
    <h2 className="sr-only">{titles.title}</h2>

    <div className={styles.titleBarMain}>
      <div className={`${styles.icon} ${styles.new}`} data-testid="newPatrolHeader-icon">
        <SvgIcon iconId={patrolType.icon_id} title={patrolType.display} type="patrols" />
      </div>

      <div className={styles.titleStack}>
        <TitleInput
          aria-label={t('titleInputLabel')}
          data-testid="newPatrol-title"
          isDirty={isTitleDirty}
          onChange={onChangeTitle}
          value={title}
        />

        {!!titles.subtitle && <p className={styles.subtitle}>{titles.subtitle}</p>}
      </div>
    </div>

    <div className={styles.pills}>
      <span className={styles.statePill}>{t('statePill')}</span>
    </div>
  </>;

  return <DetailViewHeader
    breadcrumbLabel={tHeader('breadcrumbNavLabel')}
    crumbs={crumbs}
    renderTitleBar={renderTitleBar}
  />;
};

export default memo(Header);

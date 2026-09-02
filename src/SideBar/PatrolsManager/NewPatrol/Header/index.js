import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { TAB_KEYS } from '../../../../constants';

import PatrolsManagerHeader from '../../Header';
import SvgIcon from '../../../../SvgIcon';
import TitleInput from '../../TitleInput';

import * as styles from './styles.module.scss';

const Header = ({ isTitleDirty, onChangeTitle, patrolType, title }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'newPatrol.header' });

  const crumbs = [
    { label: t('breadcrumbPatrolsLabel'), to: `/${TAB_KEYS.PATROLS}` },
    { label: t('breadcrumbNewPatrolLabel') },
  ];

  const renderTitleBar = () => <>
    {/* The title is an input, so the view needs a heading of its own to be navigable. */}
    <h2 className="sr-only">{title}</h2>

    <div className={styles.titleBarMain}>
      <div className={styles.icon}>
        <SvgIcon iconId={patrolType.icon_id} type="patrols" />
      </div>

      <TitleInput
        aria-label={t('titleInputLabel')}
        data-testid="newPatrol-title"
        isDirty={isTitleDirty}
        onChange={onChangeTitle}
        value={title}
      />
    </div>

    <span className={styles.statePill}>{t('statePill')}</span>
  </>;

  return <PatrolsManagerHeader crumbs={crumbs} renderTitleBar={renderTitleBar} />;
};

export default memo(Header);

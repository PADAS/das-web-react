import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as BulletListIcon } from '../../../common/images/icons/bullet-list.svg';
import { ReactComponent as CrossIcon } from '../../../common/images/icons/cross.svg';
import { ReactComponent as PlusIcon } from '../../../common/images/icons/plus.svg';

import * as styles from './styles.module.scss';

const Header = ({ onClose, onNewConversation, onToggleRecent }) => {
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.otusTab.header' });

  return <header className={styles.header}>
    <button
      aria-label={t('newConversationButtonLabel')}
      className={styles.newConversationButton}
      onClick={onNewConversation}
      title={t('newConversationButtonLabel')}
      type="button"
    >
      <PlusIcon aria-hidden="true" className={styles.newConversationButtonIcon} />
    </button>

    <div className={styles.titleGroup}>
      <h2 className={styles.title}>{t('title')}</h2>

      <span className={styles.betaBadge}>{t('betaBadgeLabel')}</span>
    </div>

    <div className={styles.actions}>
      <button
        className={styles.recentButton}
        onClick={onToggleRecent}
        title={t('recentButtonLabel')}
        type="button"
      >
        <BulletListIcon aria-hidden="true" className={styles.recentButtonIcon} />

        {t('recentButtonLabel')}
      </button>

      <button
        aria-label={t('closeButtonLabel')}
        className={styles.closeButton}
        onClick={onClose}
        title={t('closeButtonLabel')}
        type="button"
      >
        <CrossIcon aria-hidden="true" className={styles.closeButtonIcon} />
      </button>
    </div>
  </header>;
};

export default memo(Header);

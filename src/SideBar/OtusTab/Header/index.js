import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CrossIcon } from '../../../common/images/icons/cross.svg';
import { ReactComponent as ManageSearchIcon } from '../../../common/images/icons/manage-search.svg';
import { ReactComponent as PlusCircleIcon } from '../../../common/images/icons/plus-circle.svg';

import * as styles from './styles.module.scss';

const Header = ({ isRecentOpen = false, onClose, onNewConversation, onToggleRecent, titleId }) => {
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.otusTab.header' });

  return <header className={styles.header}>
    <button
      aria-label={t('newConversationButtonLabel')}
      className={styles.newConversationButton}
      onClick={onNewConversation}
      title={t('newConversationButtonLabel')}
      type="button"
    >
      <PlusCircleIcon aria-hidden="true" className={styles.newConversationButtonIcon} />
    </button>

    <div className={styles.titleGroup}>
      <h3 className={styles.title} id={titleId}>{t('title')}</h3>

      <span className={styles.betaBadge}>{t('betaBadgeLabel')}</span>
    </div>

    <div className={styles.actions}>
      <button
        aria-pressed={isRecentOpen}
        className={styles.recentButton}
        onClick={onToggleRecent}
        title={t('recentButtonLabel')}
        type="button"
      >
        <ManageSearchIcon aria-hidden="true" className={styles.recentButtonIcon} />

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

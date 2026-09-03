import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CrossIcon } from '../../../common/images/icons/cross.svg';

import Breadcrumb from './Breadcrumb';
import Link from '../../../Link';

import * as styles from './styles.module.scss';

const Header = ({ crumbs, renderActions = () => null, renderTitleBar = () => null }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'header' });

  return <header className={styles.header}>
    <div className={styles.topBar}>
      <Breadcrumb aria-label={t('breadcrumbNavLabel')} crumbs={crumbs} />

      <div className={styles.topActions}>
        {renderActions()}

        <Link
          aria-label={t('closeButtonLabel')}
          className={styles.closeButton}
          title={t('closeButtonLabel')}
          to="/"
        >
          <CrossIcon aria-hidden="true" className={styles.closeButtonIcon} />
        </Link>
      </div>
    </div>

    <div className={styles.titleBar}>{renderTitleBar()}</div>
  </header>;
};

export default memo(Header);

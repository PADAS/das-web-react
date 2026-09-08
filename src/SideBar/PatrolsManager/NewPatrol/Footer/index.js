import React, { memo } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { useTranslation } from 'react-i18next';

import { TAB_KEYS } from '../../../../constants';

import Link from '../../../../Link';

import * as styles from './styles.module.scss';

const SAVE_LOADER_SIZE = 18;

const Footer = ({ formId, isSaving }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'newPatrol.footer' });

  return <footer className={styles.footer}>
    <Link className={styles.cancelButton} to={`/${TAB_KEYS.PATROLS}`}>{t('cancelButton')}</Link>

    <button
      aria-busy={isSaving}
      aria-label={t('saveButton')}
      className={styles.saveButton}
      disabled={isSaving}
      form={formId}
      type="submit"
    >
      <span className={styles.saveButtonLabel}>{t('saveButton')}</span>

      {isSaving && <span className={styles.saveButtonLoader}>
        <MoonLoader aria-hidden color="white" size={SAVE_LOADER_SIZE} />
      </span>}
    </button>
  </footer>;
};

export default memo(Footer);

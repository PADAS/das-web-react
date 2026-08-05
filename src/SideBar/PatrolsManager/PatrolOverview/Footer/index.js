import React from 'react';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import noop from 'lodash/noop';
import { useTranslation } from 'react-i18next';

import { ReactComponent as DocumentIcon } from '../../../../common/images/icons/document.svg';

import AddAttachmentButton from '../../../../AddAttachmentButton';
import AddNoteButton from '../../../../AddNoteButton';

import * as styles from './styles.module.scss';

const Footer = () => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.footer' });

  return <div className={styles.footer}>
    <div className={styles.footerActions}>
      <AddNoteButton className={styles.footerActionButton} onAddNote={noop} />

      <AddAttachmentButton className={styles.footerActionButton} onAddAttachments={noop} />

      <Button className={styles.footerActionButton} onClick={noop} type="button" variant="secondary">
        <DocumentIcon />

        <label>{t('addEventButton')}</label>
      </Button>
    </div>

    <div className={styles.footerStatusActions}>
      <Dropdown>
        <Dropdown.Toggle className={styles.updateStatusButton} variant="secondary">
          {t('updateStatusButton')}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item onClick={noop}>{t('pauseOption')}</Dropdown.Item>

          <Dropdown.Item onClick={noop}>{t('cancelOption')}</Dropdown.Item>

          <Dropdown.Item onClick={noop}>{t('endOption')}</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      <Button className={styles.saveButton} onClick={noop} type="button" variant="primary">
        {t('saveButton')}
      </Button>
    </div>
  </div>;
};

export default Footer;

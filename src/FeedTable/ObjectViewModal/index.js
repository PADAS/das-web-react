import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ChevronRightIcon } from '../../common/images/icons/chevron-right.svg';

import * as styles from './styles.module.scss';

const isOpenable = (value) => value !== null && typeof value === 'object';

const entriesOf = (value) => Array.isArray(value)
  ? value.map((item, index) => ({ key: String(index + 1), value: item }))
  : Object.keys(value).sort().map((key) => ({ key, value: value[key] }));

export const ObjectValueLink = ({ onOpen, value }) => {
  const { t } = useTranslation('components', { keyPrefix: 'feedTable.objectViewModal' });

  return <button className={styles.valueLink} onClick={onOpen} type="button">
    {Array.isArray(value) ? t('itemCountMessage', { count: value.length }) : t('openButtonLabel')}

    <ChevronRightIcon aria-hidden />
  </button>;
};

const ObjectViewModal = ({ title, value }) => {
  const { t } = useTranslation('components', { keyPrefix: 'feedTable.objectViewModal' });

  const [openedPath, setOpenedPath] = useState([]);

  const trail = [{ label: title, value }, ...openedPath];
  const current = trail[trail.length - 1];

  return <>
    <Modal.Header closeButton>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>

    <Modal.Body>
      {trail.length > 1 && <nav aria-label={t('breadcrumbLabel')}>
        <ol className={styles.breadcrumb}>
          {trail.map((step, index) => <li key={index}>
            {index < trail.length - 1
              ? <button
                className={styles.breadcrumbButton}
                onClick={() => setOpenedPath(openedPath.slice(0, index))}
                type="button"
              >
                {step.label}
              </button>
              : <span aria-current="location" className={styles.breadcrumbCurrent}>{step.label}</span>}
          </li>)}
        </ol>
      </nav>}

      <dl className={styles.entries}>
        {entriesOf(current.value).map((entry) => <div className={styles.entry} key={entry.key}>
          <dt>{entry.key}</dt>

          <dd>
            {isOpenable(entry.value)
              ? <ObjectValueLink
                onOpen={() => setOpenedPath([...openedPath, { label: entry.key, value: entry.value }])}
                value={entry.value}
              />
              : String(entry.value ?? '')}
          </dd>
        </div>)}
      </dl>
    </Modal.Body>
  </>;
};

export default ObjectViewModal;

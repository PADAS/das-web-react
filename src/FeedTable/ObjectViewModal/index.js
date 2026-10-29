import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ChevronRightIcon } from '../../common/images/icons/chevron-right.svg';

import * as styles from './styles.module.scss';

const isOpenable = (value) => value !== null && typeof value === 'object';

const entriesOf = (value) => Array.isArray(value)
  ? value.map((item, index) => [String(index + 1), item])
  : Object.keys(value).sort().map((key) => [key, value[key]]);

export const ObjectValueLink = ({ onOpen, value }) => {
  const { t } = useTranslation('components', { keyPrefix: 'feedTable.objectView' });

  return <button className={styles.valueLink} onClick={onOpen} type="button">
    {Array.isArray(value) ? t('itemCount', { count: value.length }) : t('open')}

    <ChevronRightIcon aria-hidden />
  </button>;
};

const ObjectViewModal = ({ title, value }) => {
  const { t } = useTranslation('components', { keyPrefix: 'feedTable.objectView' });

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
              ? <button className={styles.breadcrumbButton} onClick={() => setOpenedPath(openedPath.slice(0, index))} type="button">
                {step.label}
              </button>
              : <span aria-current="location" className={styles.breadcrumbCurrent}>{step.label}</span>}
          </li>)}
        </ol>
      </nav>}

      <dl className={styles.entries}>
        {entriesOf(current.value).map(([key, entryValue]) => <div className={styles.entry} key={key}>
          <dt>{key}</dt>

          <dd>
            {isOpenable(entryValue)
              ? <ObjectValueLink
                onOpen={() => setOpenedPath([...openedPath, { label: key, value: entryValue }])}
                value={entryValue}
              />
              : String(entryValue ?? '')}
          </dd>
        </div>)}
      </dl>
    </Modal.Body>
  </>;
};

export default ObjectViewModal;

import { createContext, useContext } from 'react';
import Button from 'react-bootstrap/Button';
import { useTranslation } from 'react-i18next';

import * as styles from './styles.module.scss';

// A form that Atlas drafted provides the fields still showing what Atlas
// filled, and how the person keeps one.
export const AtlasDraftContext = createContext(null);

export const AtlasDraftedField = ({ children, fieldId }) => {
  const { t } = useTranslation('schema-form', { keyPrefix: 'atlasDraft' });
  const atlasDraft = useContext(AtlasDraftContext);

  if (!atlasDraft?.pendingFieldIds.includes(fieldId)) return children;

  return <div className={styles.draftedField}>
    {children}
    <div className={styles.badge}>
      <span>{t('badge')}</span>
      <Button onClick={() => atlasDraft.onKeepField(fieldId)} size="sm" type="button" variant="link">{t('keep')}</Button>
    </div>
  </div>;
};

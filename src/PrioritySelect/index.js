import React, { memo, useCallback, useState } from 'react';
import { components } from 'react-select';
import { useTranslation } from 'react-i18next';

import {
  REPORT_PRIORITIES,
  REPORT_PRIORITY_HIGH,
  REPORT_PRIORITY_LOW,
  REPORT_PRIORITY_MEDIUM,
} from '../constants';

import Select from '../Select';

import * as styles from './styles.module.scss';

const PRIORITY_STYLES = {
  [REPORT_PRIORITY_HIGH.value]: styles.highPriority,
  [REPORT_PRIORITY_MEDIUM.value]: styles.mediumPriority,
  [REPORT_PRIORITY_LOW.value]: styles.lowPriority,
};

const PriorityItem = ({ data }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'prioritySelect' });

  return <div className={styles.priorityItem}>
    <div className={`${styles.circle} ${PRIORITY_STYLES[data.value] ?? ''}`} />

    <span>{t(`labels.${data.key}`)}</span>
  </div>;
};

const SingleValue = ({ data, ...props }) => <components.SingleValue {...props} className={styles.control}>
  <PriorityItem data={data} />
</components.SingleValue>;

const Option = ({ data, ...props }) => <components.Option {...props} >
  <div data-testid={`priority-select-${data.key}`}>
    <PriorityItem data={data} />
  </div>
</components.Option>;

const PrioritySelect = ({ className = '', isDisabled = false, onChange, placeholder = '', priority = null }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'prioritySelect' });

  const [isMenuOpen, setMenuOpen] = useState(false);

  const priorityValue = REPORT_PRIORITIES.find((reportPriority) => reportPriority.value === priority);

  const onMenuClose = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const onMenuOpen = useCallback(() => {
    setMenuOpen(true);
  }, []);

  const onKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && isMenuOpen) {
      event.stopPropagation();
    }
  }, [isMenuOpen]);

  return <Select
    className={`${styles.select} ${className}`}
    components={{ Option, SingleValue }}
    getOptionLabel={(option) => t(`labels.${option.key}`)}
    getOptionValue={(option) => option.value}
    isDisabled={isDisabled}
    onChange={onChange}
    onKeyDown={onKeyDown}
    onMenuClose={onMenuClose}
    onMenuOpen={onMenuOpen}
    options={REPORT_PRIORITIES}
    placeholder={placeholder || t('placeholder')}
    styles={{
      valueContainer: (provided) => ({
        ...provided,
        maxHeight: '12rem',
        overflowY: 'auto',
      }),
    }}
    value={priorityValue}
  />;
};

export default memo(PrioritySelect);

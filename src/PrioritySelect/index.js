import React, { memo } from 'react';
import { components } from 'react-select';
import { useTranslation } from 'react-i18next';

import {
  REPORT_PRIORITIES,
  REPORT_PRIORITY_HIGH,
  REPORT_PRIORITY_LOW,
  REPORT_PRIORITY_MEDIUM,
} from '../constants';

import LegacySelect from '../LegacySelect';

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

  const priorityValue = REPORT_PRIORITIES.find((reportPriority) => reportPriority.value === priority);

  return <LegacySelect
    className={`${styles.select} ${className}`}
    components={{ Option, SingleValue }}
    getOptionLabel={(option) => t(`labels.${option.key}`)}
    getOptionValue={(option) => option.value}
    isDisabled={isDisabled}
    onChange={onChange}
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

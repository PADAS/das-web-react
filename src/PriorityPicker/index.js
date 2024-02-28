import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { REPORT_PRIORITIES } from '../constants';

import styles from './styles.module.scss';

const PRIORITY_CLASSNAMES = {
  100: 'lowPriority',
  200: 'mediumPriority',
  300: 'highPriority',
};

const PriorityPicker = ({ className, isMulti, onSelect, selected }) => {
  const { t } = useTranslation('components', { keyPrefix: 'priorityPicker' });

  const isSelected = (value) => isMulti ? selected.some((v) => v === value) : selected === value;

  return <ul className={`${styles.list} ${className}`}>
    {REPORT_PRIORITIES.map(({ value, key }) => <li key={value}>
      <button
        className={`${styles[PRIORITY_CLASSNAMES[value] || 'noPriority']} ${isSelected(value) ? styles.selected : ''}`}
        onClick={() => onSelect?.(value)}
        title={t(key)}
        type="button"
        value={value}
      >
        {t(key)}
      </button>
    </li>)}
  </ul>;
};

PriorityPicker.defaultProps = {
  className: '',
  isMulti: false,
  onSelect: null,
  selected: 0,
};

PriorityPicker.propTypes = {
  className: PropTypes.string,
  isMulti: PropTypes.bool,
  onSelect: PropTypes.func,
  selected: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.array
  ]),
};

export default memo(PriorityPicker);

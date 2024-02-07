import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { REPORT_PRIORITIES } from '../constants';

import styles from './styles.module.scss';

const calcClassNameForPriority = (priority) => {
  if (priority === 300) return 'highPriority';
  if (priority === 200) return 'mediumPriority';
  if (priority === 100) return 'lowPriority';
  return 'noPriority';
};


const PriorityPicker = (props) => {
  const { className, onSelect, selected, isMulti } = props;
  const { t } = useTranslation('filters', { keyPrefix: 'filtersPopover' });

  const isSelected = (value) => isMulti ?
    selected.some(v => v === value)
    : selected === value;

  return <ul className={`${styles.list} ${className}`}>
    {
      REPORT_PRIORITIES.map(({ value, key }) => {
        const display = t(`priorityPickerOptions.${key}`);
        return <li key={value}>
          <button title={display}
                  type='button'
                  className={`${styles[calcClassNameForPriority(value)]} ${isSelected(value) ? styles.selected : ''}`}
                  value={value}
                  onClick={() => onSelect(value)} >
            {display}
          </button>
        </li>;
    })}
  </ul>;

};

export default memo(PriorityPicker);

PriorityPicker.defaultProps = {
  className: '',
  onSelect() {
  },
  isMulti: false,
  selected: 0,
};

PriorityPicker.propTypes = {
  className: PropTypes.string,
  onSelect: PropTypes.func,
  isMulti: PropTypes.bool,
  selected: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.array
  ]),
};
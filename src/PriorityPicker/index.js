import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { REPORT_PRIORITIES } from '../constants';

import styles from './styles.module.scss';

const calcClassNameForPriority = (priority) => {
  if (priority === 300) return 'highPriority';
  if (priority === 200) return 'mediumPriority';
  if (priority === 100) return 'lowPriority';
  return 'noPriority';
};


const PriorityPicker = (props) => {
  const { className, onSelect, selected } = props;

  return <ul className={`${styles.list} ${className}`}>
    {REPORT_PRIORITIES.map(({ display, value }) => <li key={value}>
      <button title={display} type='button' className={`${styles[calcClassNameForPriority(value)]} ${selected === value ? styles.selected : ''}`} value={value} onClick={() => onSelect(value)}>
        {display}
      </button>
    </li>
    )}
  </ul>;

};

export default memo(PriorityPicker);

PriorityPicker.defaultProps = {
  className: '',
  onSelect(value) {
    console.log('i chose', value);
  },
  selected: 0,
};

PriorityPicker.propTypes = {
  className: PropTypes.string,
  onSelect: PropTypes.func,
  selected: PropTypes.number,
};
import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { REPORT_PRIORITIES } from '../constants';

import styles from './styles.module.scss';

const calcClassNameForPriority = (priority) => {
  if (priority === 300) return 'highPriority';
  if (priority === 200) return 'mediumPriority';
  if (priority === 100) return 'lowPriority';
  return 'noPriority';
}


const PriorityPicker = memo((props) => {
  const { onSelect, selected, ...rest } = props;

  return <ul className={styles.list}>
    {REPORT_PRIORITIES.map(({ display, value }) => <li key={value}>
      <button type='button' className={`${styles.option} ${styles[calcClassNameForPriority(value)]} ${selected === value ? styles.selected : ''}`} value={value} onClick={() => onSelect(value)}>
        {display}
      </button>
    </li>
    )}
  </ul>

});

export default PriorityPicker;

PriorityPicker.defaultProps = {
  onSelect(value) {
    console.log('i chose', value);
  },
  selected: 0,
};

PriorityPicker.propTypes = {
  onSelect: PropTypes.func,
  selected: PropTypes.number,
};
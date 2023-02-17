import React, { useCallback, memo } from 'react';
import { components } from 'react-select';
import PropTypes from 'prop-types';

import {
  REPORT_PRIORITIES,
  REPORT_PRIORITY_HIGH, REPORT_PRIORITY_LOW, REPORT_PRIORITY_MEDIUM
} from '../constants';

import styles from './styles.module.scss';
import CustomSelect from '../CustomSelect';

const PrioritySelect = ({ priority: priorityProp, onChange, placeholder, className, isDisabled }) => {
  const priority = REPORT_PRIORITIES.find(({ value }) => value === priorityProp);
  const selectStyles = {
    valueContainer: (provided) => ({
      ...provided,
      maxHeight: '12rem',
      overflowY: 'auto',
    }),
  };
  const getOptionLabel = useCallback(({ display }) => display, []);

  const getOptionValue = useCallback(({ value }) => value, []);

  const calcClassNameForPriority = useCallback((priority) => {
    const priorityStyles = {
      [REPORT_PRIORITY_HIGH.value]: styles.highPriority,
      [REPORT_PRIORITY_MEDIUM.value]: styles.mediumPriority,
      [REPORT_PRIORITY_LOW.value]: styles.lowPriority,
    };
    return priorityStyles[priority] ?? '';
  }, []);

  const PriorityItem = ({ data }) => (
    <div className={styles.priorityItem}>
      <div className={ `${styles.circle} ${calcClassNameForPriority(getOptionValue(data))}`}></div>
      <span>{getOptionLabel(data)}</span>
    </div>
  );

  const SingleValue = ({ data, ...props }) => (
    <components.SingleValue {...props} className={styles.control}>
      <PriorityItem data={data} />
    </components.SingleValue>
  );

  const Option = ({ data, ...props }) => (
    <components.Option {...props} >
      <div data-testid={`priority-select-${data.display}`}>
        <PriorityItem data={data} />
      </div>
    </components.Option>
  );

  return <CustomSelect
      value={priority}
      isDisabled={isDisabled}
      className={`${styles.select} ${className}`}
      components={{ Option, SingleValue }}
      onChange={onChange}
      options={REPORT_PRIORITIES}
      styles={selectStyles}
      getOptionValue={getOptionValue}
      getOptionLabel={getOptionLabel}
      placeholder={placeholder}
    />;
};

PrioritySelect.defaultProps = {
  priority: null,
  className: '',
  placeholder: 'Select',
};


PrioritySelect.propTypes = {
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  priority: PropTypes.number,
};

export default memo(PrioritySelect);

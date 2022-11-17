import React from 'react';
import Select, { components } from 'react-select';
import { DEFAULT_SELECT_STYLES, PRIORITY_LEVELS, REPORT_PRIORITIES } from '../constants';
import styles from './styles.module.scss';
import { string, element, func } from 'prop-types';

const PrioritySelect = ({ menuRef, onChange, className }) => {
  const optionalProps = {};
  const selectStyles = {
    ...DEFAULT_SELECT_STYLES,
    valueContainer: (provided) => ({
      ...provided,
      maxHeight: '12rem',
      overflowY: 'auto',
    }),
  };
  const getOptionLabel = ({ display }) => display;

  const getOptionValue = ({ value }) => value;

  const calcClassNameForPriority = (priority) => {
    const priorityStyles = {
      [PRIORITY_LEVELS.high]: styles.highPriority,
      [PRIORITY_LEVELS.medium]: styles.mediumPriority,
      [PRIORITY_LEVELS.low]: styles.lowPriority,
    };
    return priorityStyles[priority] ?? '';
  };

  const PriorityItem = ({ data }) => (
    <div className={styles.priorityItem}>
      <div className={ `${styles.circle} ${calcClassNameForPriority(getOptionValue(data))}`}></div>
      <span>{getOptionLabel(data)}</span>
    </div>
  );

  const SingleValue = ({ data, ...props }) => (
    <components.Control {...props} className={styles.control}>
      <PriorityItem data={data} />
    </components.Control>
  );

  const Option = ({ data, ...props }) => (
    <components.Option {...props}>
      <PriorityItem data={data} />
    </components.Option>
  );

  if (menuRef) {
    optionalProps.menuPortalTarget = menuRef;
    selectStyles.menuPortal = base => ({ ...base, fontSize: '0.9rem', left: '1rem', top: '10rem', zIndex: 9999 });
  }

  return <Select
        className={className}
        components={{ Option, SingleValue }}
        onChange={onChange}
        options={REPORT_PRIORITIES}
        styles={selectStyles}
        getOptionValue={getOptionValue}
        getOptionLabel={getOptionLabel}
        {...optionalProps}
    />;
};

PrioritySelect.defaultProps = {
  menuRef: null,
  className: ''
};


PrioritySelect.propTypes = {
  menuRef: element,
  onChange: func.isRequired,
  className: string
};

export default PrioritySelect;

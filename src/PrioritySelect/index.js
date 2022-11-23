import React, { useMemo, useState } from 'react';
import Select, { components } from 'react-select';
import {
  DEFAULT_SELECT_STYLES,
  REPORT_PRIORITIES,
  REPORT_PRIORITY_HIGH, REPORT_PRIORITY_LOW, REPORT_PRIORITY_MEDIUM,
  REPORT_PRIORITY_NONE
} from '../constants';
import styles from './styles.module.scss';
import { string, element, func, number } from 'prop-types';


const PrioritySelect = ({ priority: priorityProp, menuRef, onChange, placeholder, className }) => {
  const priority = useMemo(() => {
    return REPORT_PRIORITIES.find(({ value }) => value === priorityProp) ?? REPORT_PRIORITY_NONE;
  }, [priorityProp]);
  const [selectedPriority, setSelectedPriority] = useState(priority);
  const optionalProps = {};
  const selectStyles = {
    ...DEFAULT_SELECT_STYLES,
    valueContainer: (provided) => ({
      ...provided,
      maxHeight: '12rem',
      overflowY: 'auto',
    }),
  };
  const handleOnChange = (selectedOption) => {
    setSelectedPriority(selectedOption);
    onChange(selectedOption);
  };
  const getOptionLabel = ({ display }) => display;

  const getOptionValue = ({ value }) => value;

  const calcClassNameForPriority = (priority) => {
    const priorityStyles = {
      [REPORT_PRIORITY_HIGH.value]: styles.highPriority,
      [REPORT_PRIORITY_MEDIUM.value]: styles.mediumPriority,
      [REPORT_PRIORITY_LOW.value]: styles.lowPriority,
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
    <components.Option {...props} >
      <div data-testid={`priority-select-${data.display}`}>
        <PriorityItem data={data} />
      </div>
    </components.Option>
  );

  if (menuRef) {
    optionalProps.menuPortalTarget = menuRef;
    selectStyles.menuPortal = base => ({ ...base, fontSize: '0.9rem', left: '1rem', top: '10rem', zIndex: 9999 });
  }

  return <Select
      value={selectedPriority}
      className={className}
      components={{ Option, SingleValue }}
      onChange={handleOnChange}
      options={REPORT_PRIORITIES}
      styles={selectStyles}
      getOptionValue={getOptionValue}
      getOptionLabel={getOptionLabel}
      placeholder={placeholder}
      {...optionalProps}
    />;
};

PrioritySelect.defaultProps = {
  menuRef: null,
  priority: null,
  className: '',
  placeholder: 'Select',
};


PrioritySelect.propTypes = {
  menuRef: element,
  onChange: func.isRequired,
  placeholder: string,
  className: string,
  priority: number,
};

export default PrioritySelect;

import React, { useCallback, memo } from 'react';
import Select, { components } from 'react-select';
import PropTypes from 'prop-types';

import {
  DEFAULT_SELECT_STYLES,
  REPORT_PRIORITIES,
  REPORT_PRIORITY_HIGH, REPORT_PRIORITY_LOW, REPORT_PRIORITY_MEDIUM
} from '../constants';

import styles from './styles.module.scss';


const PrioritySelect = ({ priority: priorityProp, menuPortalTarget, menuPortalStyling, onChange, placeholder, className }) => {
  const priority = REPORT_PRIORITIES.find(({ value }) => value === priorityProp);
  const selectStyles = {
    ...DEFAULT_SELECT_STYLES,
    valueContainer: (provided) => ({
      ...provided,
      maxHeight: '12rem',
      overflowY: 'auto',
    }),
    menuPortal: menuPortalStyling
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

  return <Select
      value={priority}
      className={className}
      components={{ Option, SingleValue }}
      onChange={onChange}
      options={REPORT_PRIORITIES}
      styles={selectStyles}
      getOptionValue={getOptionValue}
      getOptionLabel={getOptionLabel}
      placeholder={placeholder}
      menuPortalTarget={menuPortalTarget}
    />;
};

PrioritySelect.defaultProps = {
  menuPortalTarget: undefined,
  menuPortalStyling: null,
  priority: null,
  className: '',
  placeholder: 'Select',
};


PrioritySelect.propTypes = {
  menuPortalTarget: PropTypes.element,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  priority: PropTypes.number,
  menuPortalStyling: PropTypes.oneOf([PropTypes.object, PropTypes.func]),
};

export default memo(PrioritySelect);

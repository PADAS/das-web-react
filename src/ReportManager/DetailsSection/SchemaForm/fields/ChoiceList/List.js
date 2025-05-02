import React from 'react';

import SelectListGroup from '../../../../../SelectListGroup';

const List = ({ details, onChange, ...otherProps }) => {
  const onSelectListGroupChange = (newValue) => {
    const isValueEmpty = details.multiple ? newValue.length === 0 : !newValue;

    return onChange(isValueEmpty ? undefined : newValue);
  };

  return <SelectListGroup
    getOptionLabel={(option) => option.title}
    getOptionValue={(option) => option.const}
    isMulti={details.multiple}
    onChange={onSelectListGroupChange}
    options={details.options}
    {...otherProps}
  />;
};

export default List;

import React from 'react';

import SelectListGroup from '../../../../../SelectListGroup';

const List = ({
  details,
  onChange,
  value,
  id,
  hasError,
  disabled,
  ...otherProps
}) => {

  return <SelectListGroup
        onChange={(newValue) => {
          onChange( !newValue || !newValue?.length ? undefined : newValue );
        }}
        id={id}
        disabled={disabled}
        value={value}
        options={details.options}
        isMulti={details.multiple}
        getOptionValue={(option) => option.const}
        getOptionLabel={(option) => option.title}
        hasError={hasError}
        {...otherProps}
    />;
};

export default List;

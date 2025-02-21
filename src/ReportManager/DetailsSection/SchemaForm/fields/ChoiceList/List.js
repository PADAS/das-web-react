import React from 'react';

import SelectListGroup from '../../../../../SelectListGroup';

const List = ({
  details,
  onChange,
  ...otherProps
}) => <SelectListGroup
        onChange={(newValue) => {
            onChange( !newValue || !newValue?.length ? undefined : newValue );
        }}
        options={details.options}
        isMulti={details.multiple}
        getOptionValue={(option) => option.const}
        getOptionLabel={(option) => option.title}
        {...otherProps}
/>;

export default List;

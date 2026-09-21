import React, { useMemo } from 'react';

import getDisplayableChoiceListOptions from '../../../utils/form-schemas/getDisplayableChoiceListOptions';

import SelectListGroup from '../../../SelectListGroup';

const List = ({ details, onChange, ...otherProps }) => {
  const options = useMemo(
    () => getDisplayableChoiceListOptions(details.options),
    [details.options]
  );

  const onSelectListGroupChange = (newValue) => {
    const isValueEmpty = details.multiple ? newValue.length === 0 : !newValue;

    return onChange(isValueEmpty ? undefined : newValue);
  };

  return <SelectListGroup
    getOptionLabel={(option) => option.display}
    getOptionValue={(option) => option.value}
    isMulti={details.multiple}
    onChange={onSelectListGroupChange}
    options={options}
    {...otherProps}
  />;
};

export default List;

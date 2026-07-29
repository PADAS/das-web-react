import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import getDisplayableChoiceListOptions from '../../../utils/form-schemas/getDisplayableChoiceListOptions';

import SelectListGroup from '../../../SelectListGroup';

const List = ({ details, onChange, ...otherProps }) => {
  const { i18n } = useTranslation();

  const options = useMemo(
    () => getDisplayableChoiceListOptions(details.options, i18n.language),
    [details.options, i18n.language]
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

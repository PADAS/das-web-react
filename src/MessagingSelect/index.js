import React, { memo, useEffect, useMemo, useRef } from 'react';
import { components } from 'react-select';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { allSubjects } from '../selectors/subjects';

import LegacySelect from '../LegacySelect';

const getOptionLabel = (t) => (option) => {
  if (option.hidden) {
    return t('restrictedOptionLabel');
  }
  return option.content_type === 'accounts.user' ? `${option.first_name} ${option.last_name}` : option.name;
};

const Option = ({ data, ...props }) => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'messagingSelect' });

  return <div>
    <components.Option {...props}>
      <span>{getOptionLabel(t)(data)}</span>
    </components.Option>
  </div>;
};

const MessagingSelect = ({ onChange }) => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'messagingSelect' });

  const subjects = useSelector(allSubjects);

  const selectRef = useRef(null);

  const allMessagingCapableRadios = useMemo(
    () => subjects?.filter((subject) => !!subject.messaging?.length) || [],
    [subjects]
  );

  useEffect(() => {
    selectRef.current?.focus?.();
  }, []);

  return <LegacySelect
    components={{ Option }}
    getOptionLabel={getOptionLabel(t)}
    getOptionValue={(option) => option.hidden ? t('hiddenValue') : option.id}
    isClearable={true}
    isSearchable={true}
    onChange={onChange}
    options={[{
      label: t('allOptionsLabel'),
      options: allMessagingCapableRadios || [],
    }]}
    placeholder={t('placeholder')}
    ref={selectRef}
    styles={{ container: (styles) => ({ ...styles, flexGrow: 1 }) }}
  />;
};

export default memo(MessagingSelect);

import React, { memo, useEffect, useMemo, useRef } from 'react';
import { components } from 'react-select';
import { List } from 'react-window';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { allSubjects } from '../selectors/subjects';
import { calcRecentRadiosFromSubjects, isRadioWithImage } from '../utils/subjects';
import { calcUrlForImage } from '../utils/img';
import { getGlobalSchemaReportedBy } from '../selectors';

import LegacySelect from '../LegacySelect';
import TimeAgo from '../TimeAgo';

import * as styles from './styles.module.scss';

const LIST_ITEM_HEIGHT = 37;
const MENU_OVERSCAN_COUNT = 30;

const Control = ({ children, hasValue, ...restProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'reportedBySelect.control' });

  return <div className={styles.control}>
    <components.Control hasValue={hasValue} {...restProps}>
      {!hasValue && <img alt={t('radioIconPlaceholder')} src={calcUrlForImage('static/ranger-gray.svg')} />}

      {children}
    </components.Control>
  </div>;
};

const Option = ({ data, selectProps, innerProps: { onMouseMove: _onMouseMove, onMouseOver: _onMouseOver, ...restInnerProps }, ...restProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'reportedBySelect.option' });

  if (data.type === 'label') {
    return <div className={`${styles.option} ${styles.optionLabel}`} >
      <components.Option
        data={data}
        selectProps={selectProps}
        innerProps={restInnerProps}
        {...restProps}
        isDisabled={true}
      >
        <span>{data.text}</span>
      </components.Option>
    </div>;
  } else {
    const radioImage = isRadioWithImage(data) || calcUrlForImage(data.image_url);
    const isRecent = selectProps.recentRadios.some((item) => item.id === data.id)
      && (data.last_voice_call_start_at || data.last_position_date);

    return <div className={`${styles.option} ${data.hidden ? styles.hidden : ''}`} >
      <components.Option data={data} selectProps={selectProps} innerProps={restInnerProps} {...restProps}>
        {radioImage && <img alt={t('radioIcon', { name: data.name })} src={radioImage} />}

        <span>{selectProps.getOptionLabel(data)}</span>

        {isRecent && <TimeAgo
          className={styles.timeAgo}
          date={new Date(data.last_voice_call_start_at || data.last_position_date)}
        />}
      </components.Option>
    </div>;
  }
};

const MultiValueLabel = ({ data, ...restProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'reportedBySelect.multiValueLabel' });

  const radioImage = isRadioWithImage(data) || calcUrlForImage(data.image_url);

  return <div className={styles.multiValue}>
    {radioImage && <img alt={t('radioIcon', { name: data.name })} src={radioImage} />}

    <div className={styles.label}>
      <components.MultiValueLabel data={data} {...restProps} />
    </div>
  </div>;
};

const SingleValue = ({ data, children, ...restProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'reportedBySelect.singleValue' });

  const radioImage = isRadioWithImage(data) || calcUrlForImage(data.image_url);

  return <components.SingleValue className={styles.singleValue} {...restProps}>
    {radioImage && <img alt={t('radioIcon', { name: data.name })} src={radioImage} />}

    {children}
  </components.SingleValue>;
};

const getOptionLabel = (t) => (option) => {
  if (option.hidden) {
    return t('restrictedOptionLabel');
  }
  if (option.content_type !== 'accounts.user') {
    return option.name;
  }
  if (!option.first_name && !option.last_name) {
    return option.username;
  }
  return `${option.first_name} ${option.last_name}`;
};

const getOptionValue = ({ hidden, id }) => {
  if (hidden) return 'hidden';
  return id;
};

const MenuRow = ({ children, index, style }) => <div style={style}>{children[index]}</div>;

const MenuList = ({ options, children, maxHeight, getValue }) => {
  const listRef = useRef();

  const [value] = getValue();
  const selectedIndex = value != null ? options.findIndex((opt) => opt === value) : -1;

  useEffect(() => {
    if (selectedIndex >= 0) {
      const timeout = setTimeout(() => {
        listRef.current.scrollToRow({ index: selectedIndex, align: 'start', behavior: 'instant' });
      }, 0);

      return () => clearTimeout(timeout);
    }
  }, [selectedIndex]);

  return (
    <List
      listRef={listRef}
      overscanCount={MENU_OVERSCAN_COUNT}
      rowComponent={MenuRow}
      rowCount={children.length}
      rowHeight={LIST_ITEM_HEIGHT}
      rowProps={{ children }}
      style={{ height: Math.min((LIST_ITEM_HEIGHT * children.length), maxHeight) }}
    />
  );
};

const ReportedBySelect = ({
  className = '',
  isDisabled = false,
  isMulti = false,
  menuRef = null,
  numberOfRecentRadiosToShow = 5,
  onChange,
  options: optionsFromProps = null,
  placeholder = null,
  value = null,
}) => {
  const { t } = useTranslation('components', { keyPrefix: 'reportedBySelect' });

  const reporters = useSelector(getGlobalSchemaReportedBy);
  const subjects = useSelector(allSubjects);

  const selections = optionsFromProps ? optionsFromProps : reporters;

  const recentRadios = useMemo(
    () => calcRecentRadiosFromSubjects(...subjects).splice(0, numberOfRecentRadiosToShow),
    [numberOfRecentRadiosToShow, subjects]
  );

  const selected = useMemo(() => {
    if (!value) {
      return null;
    }

    if (isMulti) {
      if (value.length) {
        return value.map((item) => item.hidden
          ? item
          : selections.find((selection) => selection.id === item.id));
      }
      return value;
    }
    return value.hidden ? value : selections.find((selection) => selection.id === value.id);
  }, [isMulti, selections, value]);

  const options = useMemo(() => {
    const displayOptions = selections.filter(({ id }) => !recentRadios.some(({ id: radioId }) => radioId === id));

    if (recentRadios.length) {
      return [
        {
          disabled: true,
          type: 'label',
          text: 'Recent radios',
        },
        ...recentRadios,
        {
          disabled: true,
          text: 'All',
          type: 'label',
        },
        ...displayOptions,
      ];
    }
    return displayOptions;
  }, [recentRadios, selections]);

  const selectStyles = {
    option(styles, { isDisabled: _isDisabled }) {
      return styles;
    },
    valueContainer: (provided) => ({
      ...provided,
      maxHeight: '9rem',
      overflowY: 'auto',
    }),
  };
  const optionalProps = {};
  if (menuRef) {
    optionalProps.menuPortalTarget = menuRef;
    selectStyles.menuPortal = base => ({ ...base, fontSize: '0.9rem', zIndex: 9999 });
  }

  return <LegacySelect
    className={className}
    components={{ Control, MenuList, MultiValueLabel, Option, SingleValue }}
    getOptionLabel={getOptionLabel(t)}
    getOptionValue={getOptionValue}
    isClearable={true}
    isDisabled={isDisabled}
    isMulti={isMulti}
    isSearchable={true}
    menuShouldScrollIntoView={false}
    onChange={onChange}
    options={options}
    placeholder={placeholder || t('placeholder')}
    recentRadios={recentRadios}
    styles={selectStyles}
    value={selected}
    {...optionalProps}
  />;
};

export default memo(ReportedBySelect);

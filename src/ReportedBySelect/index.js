import React, { memo, useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { components } from 'react-select';
import { FixedSizeList as List } from 'react-window';

import { calcRecentRadiosFromSubjects, isRadioWithImage } from '../utils/subjects';
import { calcUrlForImage } from '../utils/img';
import { reportedBy } from '../selectors';
import { allSubjects } from '../selectors/subjects';

import TimeAgo from '../TimeAgo';
import Select from '../Select';

import styles from './styles.module.scss';

const placeholderImgSrc = calcUrlForImage('static/ranger-gray.svg');

const MENU_OVERSCAN_COUNT = 30;
const LIST_ITEM_HEIGHT = 37;

const Control = ({ children, ...props }) => {
  const { hasValue } = props;

  return <div className={styles.control}>
    <components.Control {...props}>
      {!hasValue && <img
        src={placeholderImgSrc}
        alt='Radio icon placeholder for reported by selector'
      />}
      {children}
    </components.Control>
  </div>;
};

const Option = (props) => {
  const { data, selectProps, innerProps: { onMouseMove: _onMouseMove, onMouseOver: _onMouseOver, ...restInnerProps } } = props;

  const propsToPassAlong = {
    ...props,
    innerProps: { ...restInnerProps },
  };

  if (data.type === 'label') {
    return <div className={`${styles.option} ${styles.optionLabel}`} >
      <components.Option {...propsToPassAlong} isDisabled={true}>
        <span>{data.text}</span>
      </components.Option>
    </div>;
  } else {
    const { getOptionLabel, recentRadios } = selectProps;

    const radioImage = isRadioWithImage(data) || calcUrlForImage(data.image_url);
    const isRecent = recentRadios.some(item => item.id === data.id)
    && (data.last_voice_call_start_at || data.last_position_date);
    return <div className={`${styles.option} ${data.hidden ? styles.hidden : ''}`} >
      <components.Option {...propsToPassAlong}>
        {radioImage && <img src={radioImage} alt={`Radio icon for ${data.name} option`} />}
        <span>{getOptionLabel(data)}</span>
        {isRecent &&
        <TimeAgo className={styles.timeAgo} date={new Date(data.last_voice_call_start_at || data.last_position_date)} />
      }
      </components.Option>
    </div>;
  }
};

const MultiValueLabel = (props) => {
  const { data } = props;

  const radioImage = isRadioWithImage(data) || calcUrlForImage(data.image_url);
  return <div className={styles.multiValue}>
    {radioImage && <img src={radioImage} alt={`Radio icon for ${data.name} value`} />}
    <div className={styles.label}>
      <components.MultiValueLabel {...props} />
    </div>
  </div>;
};

const SingleValue = ({ data, children, ...props }) => {
  const radioImage = isRadioWithImage(data) || calcUrlForImage(data.image_url);

  return <components.SingleValue className={styles.singleValue} {...props}>
    {radioImage && <img src={radioImage} alt={`Radio icon for ${data.name} value`} />}
    {children}
  </components.SingleValue>;
};

const getOptionLabel = ({ content_type, first_name, hidden, last_name, name, username }) => {
  if (hidden) return 'RESTRICTED';

  if (content_type !== 'accounts.user') return name;

  if (!first_name && !last_name) return username;

  return `${first_name} ${last_name}`;
};

const getOptionValue = ({ hidden, id }) => {
  if (hidden) return 'hidden';
  return id;
};

const MenuRow = memo(({ child, style }) => <div style={style}>{child}</div>); /* eslint-disable-line react/display-name */

const MenuList = ({ options, children, maxHeight, getValue }) => {
  const [value] = getValue();
  const itemSize = LIST_ITEM_HEIGHT;
  const initialScrollOffset = options.indexOf(value) * itemSize;
  const itemCount = children.length;
  const height = Math.min((itemSize * itemCount), maxHeight);
  const overscanCount = MENU_OVERSCAN_COUNT;

  const renderRow = useCallback(({ index, style }) => {
    return <MenuRow style={style} child={children[index]} />;
  }, [children]);

  return (
    <List
        height={height}
        itemCount={itemCount}
        itemSize={itemSize}
        initialScrollOffset={initialScrollOffset}
        overscanCount={overscanCount}
      >
      {renderRow}
    </List>
  );
};

const ReportedBySelect = (props) => {
  const { menuRef = null, reporters, subjects, onChange, numberOfRecentRadiosToShow, value, isMulti, className, placeholder, options: optionsFromProps, isDisabled } = props;

  const selections = optionsFromProps ? optionsFromProps : reporters;

  const recentRadios = useMemo(() =>
    calcRecentRadiosFromSubjects(...subjects)
      .splice(0, numberOfRecentRadiosToShow)
  , [numberOfRecentRadiosToShow, subjects]);

  const displayOptions = useMemo(() =>
    selections
      .filter(({ id }) =>
        !recentRadios
          .some(({ id: radioId }) =>
            radioId === id
          )
      ), [recentRadios, selections]);

  const optionalProps = {};
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

  if (menuRef) {
    optionalProps.menuPortalTarget = menuRef;
    selectStyles.menuPortal = base => ({ ...base, /* position: 'absolute',  */fontSize: '0.9rem', left: '1rem', top: '10rem', zIndex: 9999 });
  }

  const selected = useMemo(() => {
    if (!Boolean(value)) return null;

    if (isMulti) {
      return value.length ?
        value.map(item =>
          item.hidden
            ? item
            : selections.find(selection => selection.id === item.id)
        ) : value;
    }

    return value.hidden
      ? value
      : selections.find(selection => selection.id === value.id);

  }, [isMulti, selections, value]);


  const options = useMemo(() =>
    !!recentRadios.length ?
      [
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
      ]
      : displayOptions
  , [displayOptions, recentRadios]);

  return <Select
    className={className}
    data-testid='reported-by-select'
    components={{ Control, MenuList, MultiValueLabel, Option, SingleValue }}
    value={selected}
    isClearable={true}
    isDisabled={isDisabled}
    isSearchable={true}
    isMulti={isMulti}
    onChange={onChange}
    options={options}
    recentRadios={recentRadios}
    placeholder={placeholder}
    styles={selectStyles}
    getOptionValue={getOptionValue}
    getOptionLabel={getOptionLabel}
    menuShouldScrollIntoView={false}
    {...optionalProps}
  />;
};

const mapStateToProps = (state) => ({
  reporters: reportedBy(state),
  subjects: allSubjects(state),
});

export default connect(mapStateToProps, null)(memo(ReportedBySelect));

ReportedBySelect.defaultProps = {
  value: null,
  isDisabled: false,
  isMulti: false,
  numberOfRecentRadiosToShow: 5,
  placeholder: 'Reported By...',
};


ReportedBySelect.propTypes = {
  isDisabled: PropTypes.bool,
  isMulti: PropTypes.bool,
  value: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
  ]),
  onChange: PropTypes.func.isRequired,
  numberOfRecentRadiosToShow: PropTypes.number,
};

import React, { memo, useMemo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Select, { components } from 'react-select';
import TimeAgo from '../TimeAgo';

import { calcRecentRadiosFromSubjects, isRadioWithImage } from '../utils/subjects';
import { calcUrlForImage } from '../utils/img';
import { DEFAULT_SELECT_STYLES } from '../constants';
import { reportedBy } from '../selectors';
import { allSubjects } from '../selectors/subjects';

import styles from './styles.module.scss';

const ReportedBySelect = (props) => {
  const { menuRef = null, reporters, subjects, onChange, numberOfRecentRadiosToShow, value, isMulti, className, placeholder, options: optionsFromProps } = props;

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
    ...DEFAULT_SELECT_STYLES,
    valueContainer: (provided) => ({
      ...provided,
      maxHeight: '12rem',
      overflowY: 'auto',
    }),
  };

  if (menuRef) {
    optionalProps.menuPortalTarget = menuRef;
    selectStyles.menuPortal = base => ({ ...base, /* position: 'absolute',  */fontSize: '0.9rem', left: '1rem', top: '10rem', zIndex: 9999 });
  };

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

  const options = [
    {
      label: 'Recent radios',
      options: recentRadios,
    },
    {
      label: 'All',
      options: displayOptions || [],
    },
  ];

  const getOptionLabel = ({ hidden, name, content_type, first_name, last_name }) => {
    if (hidden) return 'RESTRICTED';
    return content_type === 'accounts.user'
      ? `${first_name} ${last_name}`
      : name;
  };

  const getOptionValue = ({ hidden, id }) => {
    if (hidden) return 'hidden';
    return id;
  };

  const Control = ({ children, ...props }) => {
    const { hasValue } = props;

    return <div className={styles.control}>
      <components.Control {...props}>
        {!hasValue && <img
          src={calcUrlForImage('static/ranger-gray.svg')}
          alt='Radio icon placeholder for reported by selector'
        />}
        {children}
      </components.Control>
    </div>;
  };

  const Option = (props) => {
    const { data } = props;

    const radioImage = isRadioWithImage(data) || calcUrlForImage(data.image_url);
    const isRecent = recentRadios.some(item => item.id === data.id)
      && (data.last_voice_call_start_at || data.last_position_date);
    return <div className={`${styles.option} ${data.hidden ? styles.hidden : ''}`} >
      <components.Option {...props}>
        {radioImage && <img src={radioImage} alt={`Radio icon for ${data.name} option`} />}
        <span>{getOptionLabel(data)}</span>
        {isRecent &&
          <TimeAgo className={styles.timeAgo} date={new Date(data.last_voice_call_start_at || data.last_position_date)} />
        }
      </components.Option>
    </div>;
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

  const SingleValue = (props) => {
    const { data } = props;

    const radioImage = isRadioWithImage(data) || calcUrlForImage(data.image_url);
    return <div className={styles.singleValue}>
      {radioImage && <img src={radioImage} alt={`Radio icon for ${data.name} value`} />}
      <components.SingleValue {...props} />
    </div>;
  };

  return <Select
    className={className}
    components={{ Control, MultiValueLabel, Option, SingleValue }}
    value={selected}
    isClearable={true}
    isSearchable={true}
    isMulti={isMulti}
    onChange={onChange}
    options={options}
    placeholder={placeholder}
    styles={selectStyles}
    getOptionValue={getOptionValue}
    getOptionLabel={getOptionLabel}
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
  isMulti: false,
  numberOfRecentRadiosToShow: 5,
  placeholder: 'Reported By...',
};


ReportedBySelect.propTypes = {
  isMulti: PropTypes.bool,
  value: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
  ]),
  onChange: PropTypes.func.isRequired,
  numberOfRecentRadiosToShow: PropTypes.number,
};

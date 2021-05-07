import React, { memo, useMemo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Select, { components } from 'react-select';
import TimeAgo from '../TimeAgo';

import { calcRecentRadiosFromSubjects } from '../utils/subjects';
import { DEFAULT_SELECT_STYLES } from '../constants';
import { reportedBy } from '../selectors';
import { allSubjects } from '../selectors/subjects';

import styles from './styles.module.scss';

const RECENT_MESSAGING_SUBJECTS_LIMIT = 5;

const getSubjectForRecentMessage = (message, subjects) => null;

const ReportedBySelect = (props) => {
  const { menuRef = null, reporters, subjects, recentMessages = [], onChange, numberOfRecentRadiosToShow, value, isMulti, className, placeholder, options: optionsFromProps } = props;

  const selections = optionsFromProps ? optionsFromProps : reporters;

  const allMessagingCapableRadios = useMemo(() =>
    subjects.filter(({ messaging }) => !!messaging?.length)
  , [subjects]);

  const recentMessageRadios = useMemo(() =>
    recentMessages.map(message => getSubjectForRecentMessage(message, subjects)).slice(0, RECENT_MESSAGING_SUBJECTS_LIMIT)
  , [allMessagingCapableRadios]);

  const displayOptions = useMemo(() =>
    selections
      .filter(({ id }) =>
        !recentMessageRadios
          .some(({ id:radioId }) =>
            radioId === id
          )
      ), [recentMessageRadios, selections]);

  const optionalProps = {};
  const selectStyles = {
    ...DEFAULT_SELECT_STYLES,
  };

  // if (menuRef) {
  //   optionalProps.menuPortalTarget = menuRef;
  //   selectStyles.menuPortal = base => ({ ...base, /* position: 'absolute',  */fontSize: '0.9rem', left: '1rem', top: '10rem', zIndex: 9999 });
  // };

  const selected = useMemo(() => {
    if (isMulti) {
      !!value && !!value.length &&
        value.map(item =>
          item.hidden
            ? item
            : selections.find(selections => selections.id === item.id)
        );
    }

    return !!value
      ? value.hidden
        ? value
        : selections.find(selections => selections.id === value.id)
      : null;

  }, [isMulti, selections, value]);

  const options = [
    {
      label: 'Recent radios',
      options: recentMessageRadios,
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

  const Option = (props) => {
    const { data } = props;

    const isRecent = recentMessageRadios.some(item => item.id === data.id)
      && (data.last_voice_call_start_at || data.last_position_date);

    return (
      <div className={`${styles.option} ${data.hidden ? styles.hidden : ''}`} >
        <components.Option {...props}>
          <span>{getOptionLabel(data)}</span>
          {isRecent &&
            <TimeAgo className={styles.timeAgo} date={new Date(data.last_voice_call_start_at || data.last_position_date)} />
          }
        </components.Option>
      </div>
    );
  };

  return <Select
    className={className}
    components={{ Option }}
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

import React, { memo, useEffect, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Select, { components } from 'react-select';
import TimeAgo from '../TimeAgo';

import { DEFAULT_SELECT_STYLES } from '../constants';
import { allSubjects } from '../selectors/subjects';

import styles from './styles.module.scss';

// const RECENT_MESSAGING_SUBJECTS_LIMIT = 5;


const MessagingSelect = (props) => {
  const { subjects = [], onChange, value = null, isMulti = false, className } = props;

  const selectRef = useRef(null);


  const allMessagingCapableRadios = useMemo(() =>
    subjects.filter(({ messaging }) => !!messaging?.length)
  , [subjects]);



  const optionalProps = {};
  const selectStyles = {
    ...DEFAULT_SELECT_STYLES,
    container(styles) {
      return {
        ...styles,
        flexGrow: 1,
      };
    }
  };

  const options = [
    /*     {
      label: 'Recent radios',
      options: recentMessageRadios,
    }, */
    {
      label: 'All',
      options: allMessagingCapableRadios || [],
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

    /*     const isRecent = recentMessageRadios.some(item => item.id === data.id)
      && (data.last_voice_call_start_at || data.last_position_date); */

    return (
      <div className={`${styles.option} ${data.hidden ? styles.hidden : ''}`} >
        <components.Option {...props}>
          <span>{getOptionLabel(data)}</span>
          {/* {isRecent &&
            <TimeAgo className={styles.timeAgo} date={new Date(data.last_voice_call_start_at || data.last_position_date)} />
          } */}
        </components.Option>
      </div>
    );
  };

  useEffect(() => {
    if (selectRef?.current?.focus) {
      selectRef.current.focus();
    }
  }, []);

  return <Select
    className={className}
    components={{ Option }}
    value={value}
    isClearable={true}
    isSearchable={true}
    isMulti={isMulti}
    onChange={onChange}
    options={options}
    placeholder='Send message to...'
    styles={selectStyles}
    ref={selectRef}
    getOptionValue={getOptionValue}
    getOptionLabel={getOptionLabel}
    {...optionalProps}
  />;
};

const mapStateToProps = (state) => ({
  subjects: allSubjects(state),
});

export default connect(mapStateToProps, null)(memo(MessagingSelect));

MessagingSelect.defaultProps = {
  value: null,
};


MessagingSelect.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
  ]),
  onChange: PropTypes.func.isRequired,
};

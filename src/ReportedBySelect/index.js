import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Select, { components } from 'react-select';
import TimeAgo from 'react-timeago';

import { subjectIsARadio, calcRecentRadiosFromSubjects } from '../utils/subjects';
import { DEFAULT_SELECT_STYLES } from '../constants';
import { reportedBy } from '../selectors';
import { allSubjects } from '../selectors/subjects';

import styles from './styles.module.scss';

const ReportedBySelect = (props) => {
  const { reporters, subjects, onChange, numberOfRecentRadiosToShow, value, isMulti, className } = props;

  const recentRadios = calcRecentRadiosFromSubjects(...subjects).splice(0, numberOfRecentRadiosToShow);
  const allRadios = reporters.filter(subjectIsARadio);

  const selected = isMulti
      ? !!value && !!value.length &&
        value.map(item => allRadios.find(radio => radio.id === item.id))
        .filter(item => !!item)
      : !!value && !!value.id && allRadios.find(radio => radio.id === value.id);

  const options = [
    {
      label: 'Recent radios',
      options: recentRadios,
    },
    {
      label: 'All radios',
      options: allRadios,
    },
  ];

  const getOptionLabel = ({ name }) => name;
  const getOptionValue = ({ id }) => id;

  const Option = (props) => {
    const { data } = props;

    const isRecent = recentRadios.some(item => item.id === data.id)
      && (data.last_voice_call_start_at || data.last_position_date);

    return (
      <div className={styles.option} >
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
    placeholder='Reported By...'
    styles={DEFAULT_SELECT_STYLES}
    getOptionValue={getOptionValue}
    getOptionLabel={getOptionLabel} />;
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

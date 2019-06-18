import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Select, { components } from 'react-select';
import TimeAgo from 'react-timeago';

import { subjectIsARadio, calcRecentRadiosFromSubjects } from '../utils/subjects';

import { reportedBy, allSubjects } from '../selectors';

import styles from './styles.module.scss';

const ReportedBySelect = memo((props) => {
  const { reporters, subjects, onChange, numberOfRecentRadiosToShow, value } = props;

  const recentRadios = calcRecentRadiosFromSubjects(...subjects).splice(0, numberOfRecentRadiosToShow);
  const allRadios = reporters.filter(subjectIsARadio);

  const selected = allRadios.find(({ id }) => id === value);

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
    const { value, data } = props;

    const isRecent = recentRadios.some(item => item.id === value)
      && (data.last_voice_call_start_at || data.last_position_date);

    return (
      <div className={styles.option}>
        <components.Option {...props}>
          <span>{data.name}</span>
          {isRecent &&
            <TimeAgo className={styles.timeAgo} date={new Date(data.last_voice_call_start_at || data.last_position_date)} />
          }
        </components.Option>
      </div>
    );
  };

  return <Select
    components={{ Option }}
    value={selected}
    isClearable={true}
    isSearchable={true}
    onChange={onChange}
    options={options}
    placeholder='Reported By...'
    getOptionLabel={getOptionLabel}
    getOptionValue={getOptionValue} />;
});

const mapStateToProps = (state) => ({
  reporters: reportedBy(state),
  subjects: allSubjects(state),
});

export default connect(mapStateToProps, null)(ReportedBySelect);

ReportedBySelect.defaultProps = {
  value: null,
  numberOfRecentRadiosToShow: 5,
};


ReportedBySelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  numberOfRecentRadiosToShow: PropTypes.number,
};
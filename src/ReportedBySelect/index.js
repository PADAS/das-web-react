import React, { memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Select, { components } from 'react-select';
import TimeAgo from 'react-timeago'

import { subjectIsARadio } from '../utils/subjects';

import { calcRecentRadioList, reportedBy } from '../selectors';

const ReportedBySelect = memo((props) => {
  const { recentRadios: originalRecentRadios, subjects, onChange, numberOfRecentRadiosToShow, value } = props;

  const recentRadios = originalRecentRadios.splice(0, numberOfRecentRadiosToShow);
  const allRadios = subjects.filter(subjectIsARadio);

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

    const isRecent = recentRadios.some(item => item.id === value);
    return (
      <div>
        <components.Option {...props} />
        {isRecent &&
          <TimeAgo date={new Date(data.last_position_status.last_voice_call_start_at || data.last_position_date)} />
        }
      </div>
    )
  };

  return <Select
    components={{ Option }}
    value={selected}
    isClearable={true}
    isSearchable={true}
    onChange={onChange}
    options={options}
    getOptionLabel={getOptionLabel}
    getOptionValue={getOptionValue} />;
});

const mapStateToProps = (state) => ({
  recentRadios: calcRecentRadioList(state),
  subjects: reportedBy(state),
});

export default connect(mapStateToProps, null)(ReportedBySelect);

ReportedBySelect.defaultProps = {
  value: null,
  numberOfRecentRadiosToShow: 5,
}


ReportedBySelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  numberOfRecentRadiosToShow: PropTypes.number,
};
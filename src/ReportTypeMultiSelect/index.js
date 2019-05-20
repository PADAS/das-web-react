import React, { memo, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import intersection from 'lodash/intersection';

import { mapReportTypesToCategories, calcIconColorByPriority } from '../utils/event-types';
import CheckableList from '../CheckableList';
import EventIcon from '../EventIcon';

import styles from './styles.module.scss';

const ReportTypeMultiSelect = memo((props) => {
  const { eventTypes, onCategoryToggle, selectedReportTypeIDs, onTypeToggle } = props;

  const itemsGroupedByCategory = mapReportTypesToCategories(eventTypes);

  const categoryFullyChecked = (category) => {
    const categoryTypeIDs = category.types.map(t => t.id);
    return intersection(categoryTypeIDs, selectedReportTypeIDs).length === categoryTypeIDs.length;
  };

  const categoryPartiallyChecked = (category) => {
    const categoryTypeIDs = category.types.map(t => t.id);
    return !categoryFullyChecked(category) && !!intersection(categoryTypeIDs, selectedReportTypeIDs).length;
  };

  const reportTypeChecked = (type) => selectedReportTypeIDs.includes(type.id);

  const ListItem = memo((props) => {
    const { display, types } = props;
    return <Fragment key={display}>
      <h5>{display}</h5>
      <CheckableList
        items={types}
        onCheckClick={onTypeToggle}
        itemComponent={memo((type) =>
          <span className={styles.eventType}>
            <EventIcon color={calcIconColorByPriority(type.default_priority)} iconId={type.value} />
            {type.display}
          </span>)
        }
        itemFullyChecked={reportTypeChecked}
      />
    </Fragment>
  });

  return <CheckableList
    className={styles.reportTypeList}
    onCheckClick={onCategoryToggle}
    items={itemsGroupedByCategory}
    itemComponent={ListItem}
    itemFullyChecked={categoryFullyChecked}
    itemPartiallyChecked={categoryPartiallyChecked}
  />
});

const mapStateToProps = ({ data: { eventTypes } }) => ({ eventTypes });

export default connect(mapStateToProps, null)(ReportTypeMultiSelect);




ReportTypeMultiSelect.propTypes = {
  onCategoryToggle: PropTypes.func.isRequired,
  onTypeToggle: PropTypes.func.isRequired,
  selectedReportTypeIDs: PropTypes.array.isRequired,
};
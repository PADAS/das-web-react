import React, { memo, Fragment } from 'react';
import { connect } from 'react-redux';
import { mapReportTypesToCategories, calcIconColorByPriority } from '../utils/event-types';
import CheckableList from '../CheckableList';
import EventIcon from '../EventIcon';

import styles from './styles.module.scss';

const ReportTypeMultiSelect = memo((props) => {
  const { eventTypes, selectedTypes, onCategoryToggle, onTypeToggle, onFilterChange } = props;

  const itemsGroupedByCategory = mapReportTypesToCategories(eventTypes);

  return <CheckableList
    className={styles.reportTypeList}
    items={itemsGroupedByCategory}
    itemComponent={ListItem}
    itemFullyChecked={() => true}
  />
});

const mapStateToProps = ({ data: { eventTypes } }) => ({ eventTypes });

export default connect(mapStateToProps, null)(ReportTypeMultiSelect);

const ListItem = memo((props) => {
  const { display, types, ...rest } = props;
  return <Fragment key={display}>
    <h5>{display}</h5>
    <CheckableList 
       items={types}
       itemComponent={memo((type) =>
        <span className={styles.eventType}>
          <EventIcon color={calcIconColorByPriority(type.default_priority)} iconId={type.value} />
          {type.display}
        </span>)
       }
       itemFullyChecked={() => true}
    />
  </Fragment>
});
import React, { memo, Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import intersection from 'lodash/intersection';

import { mapReportTypesToCategories } from '../utils/event-types';
import CheckableList from '../CheckableList';
import SearchBar from '../SearchBar';
import EventTypeListItem from '../EventTypeListItem';

import styles from './styles.module.scss';

const filterProps = ['display', 'value', 'category.display'];

const filterEventTypes = (eventTypes, filterText) =>
  eventTypes.filter(item =>
    filterProps.some((prop) => {
      if (prop.includes('.')) {
        const nestedFilterProp = prop.split('.').reduce((accumulator, prop) => {
          if (typeof accumulator === 'object') {
            return accumulator[prop];
          }
          return accumulator;
        }, item);
        return nestedFilterProp && nestedFilterProp.toString().toLowerCase().includes(filterText.toString().toLowerCase());
      }
      return item[prop] && item[prop].toString().toLowerCase().includes(filterText.toString().toLowerCase());
    })
  );


const ReportTypeMultiSelect = (props) => {
  const { eventTypes, onCategoryToggle, selectedReportTypeIDs, onTypeToggle, onFilteredItemsSelect } = props;

  const [filterText, setFilterText] = useState('');
  const onFilterChange = ({ target: { value } }) => setFilterText(value);
  const onFilterClear = () => setFilterText('');

  const filteredEventTypes = filterText.length ? filterEventTypes(eventTypes, filterText) : eventTypes;

  const itemsGroupedByCategory = mapReportTypesToCategories(filteredEventTypes);

  const categoryFullyChecked = (category) => {
    const categoryTypeIDs = category.types.map(t => t.id);
    return intersection(categoryTypeIDs, selectedReportTypeIDs).length === categoryTypeIDs.length;
  };

  const categoryPartiallyChecked = (category) => {
    const categoryTypeIDs = category.types.map(t => t.id);
    return !categoryFullyChecked(category) && !!intersection(categoryTypeIDs, selectedReportTypeIDs).length;
  };

  const selectFilteredItems = () => {
    onFilteredItemsSelect(filteredEventTypes);
  };

  const reportTypeChecked = (type) => selectedReportTypeIDs.includes(type.id);

  const ListItem = memo((props) => { // eslint-disable-line react/display-name
    const { display, types } = props;
    return <Fragment key={display}>
      <h5>{display}</h5>
      <CheckableList
        items={types}
        onCheckClick={onTypeToggle}
        itemComponent={EventTypeListItem}
        itemFullyChecked={reportTypeChecked}
      />
    </Fragment>;
  });

  return <div className={styles.wrapper}>
    <div className={styles.searchBar}>
      <SearchBar className={styles.search} placeholder='Search types' text={filterText}
        onChange={onFilterChange} onClear={onFilterClear} />
      {!!filterText.length
        && <Button onClick={selectFilteredItems} type="button" variant='info' size='sm' disabled={!filteredEventTypes.length}>
          {filteredEventTypes.length ?
            `Set to these ${filteredEventTypes.length}`
            : 'No matches'
          }
        </Button>
      }
    </div>
    <CheckableList
      className={styles.reportTypeList}
      onCheckClick={onCategoryToggle}
      items={itemsGroupedByCategory}
      itemComponent={ListItem}
      itemFullyChecked={categoryFullyChecked}
      itemPartiallyChecked={categoryPartiallyChecked}
    />
  </div>;
};

const mapStateToProps = ({ data: { eventTypes } }) => ({ eventTypes });

export default connect(mapStateToProps, null)(memo(ReportTypeMultiSelect));




ReportTypeMultiSelect.propTypes = {
  onCategoryToggle: PropTypes.func.isRequired,
  onTypeToggle: PropTypes.func.isRequired,
  selectedReportTypeIDs: PropTypes.array.isRequired,
};
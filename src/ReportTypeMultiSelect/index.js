import React, { memo, Fragment } from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import intersection from 'lodash/intersection';

import { mapReportTypesToCategories } from '../utils/event-types';
import CheckableList from '../CheckableList';
import SearchBar from '../SearchBar';
import EventTypeListItem from '../EventTypeListItem';

import styles from './styles.module.scss';

import { trackEvent } from '../utils/analytics';

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
        return nestedFilterProp?.toString().toLowerCase().includes(filterText.toString().toLowerCase());
      }
      return item?.[prop].toString().toLowerCase().includes(filterText.toString().toLowerCase());
    })
  );


const ReportTypeMultiSelect = (props) => {
  const { eventTypes, filter, onFilterChange, onCategoryToggle, selectedReportTypeIDs, onTypeToggle, onFilteredItemsSelect } = props;

  const noEventTypeSetInFilter = !selectedReportTypeIDs.length;

  const onSearchValueChange = ({ target: { value } }) => { 
    onFilterChange(value);
  };

  const onFilterClear = () => { 
    onFilterChange('');
    trackEvent('Event Filter', 'Clear Report Type Text Filter');
  };

  const filteredEventTypes = filter.length ? filterEventTypes(eventTypes, filter) : eventTypes;

  const itemsGroupedByCategory = mapReportTypesToCategories(filteredEventTypes);

  const categoryFullyChecked = (category) => {
    if (noEventTypeSetInFilter) return true;

    const categoryTypeIDs = category.types.map(t => t.id);
    return intersection(categoryTypeIDs, selectedReportTypeIDs).length === categoryTypeIDs.length;
  };

  const categoryPartiallyChecked = (category) => {
    const categoryTypeIDs = category.types.map(t => t.id);
    return !categoryFullyChecked(category) && !!intersection(categoryTypeIDs, selectedReportTypeIDs).length;
  };

  const selectFilteredItems = () => {
    onFilteredItemsSelect(filteredEventTypes);
    trackEvent('Event Filter', 'Set Selected Report Types From Searchbar');
  };

  const reportTypeChecked = (type) => noEventTypeSetInFilter ? true : selectedReportTypeIDs.includes(type.id);

  const ListItem = (props) => { // eslint-disable-line react/display-name
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
  };

  const MemoizedListItem = memo(ListItem);

  return <div className={styles.wrapper}>
    <div className={styles.searchBar}>
      <SearchBar className={styles.search} placeholder='Search types' value={filter}
        onChange={onSearchValueChange} onClear={onFilterClear} />
      {!!filter.length
        && <Button onClick={selectFilteredItems} type="button" variant='info' size='sm' disabled={!filteredEventTypes.length}>
          {filteredEventTypes.length ?
            `Set to ${filteredEventTypes.length > 1 ? `these ${filteredEventTypes.length}`  : 'this one'}`
            : 'No matches'
          }
        </Button>
      }
    </div>
    <CheckableList
      className={styles.reportTypeList}
      onCheckClick={onCategoryToggle}
      items={itemsGroupedByCategory}
      itemComponent={MemoizedListItem}
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
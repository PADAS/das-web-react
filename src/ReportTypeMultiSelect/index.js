import React, { memo, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { EVENT_FILTER_CATEGORY, trackEventFactory } from '../utils/analytics';
import { mapEventTypesToCategories } from '../utils/event-types';

import CheckableList from '../CheckableList';
import EventTypeListItem from '../EventTypeListItem';
import SearchBar from '../SearchBar';

import * as styles from './styles.module.scss';

const eventFilterTracker = trackEventFactory(EVENT_FILTER_CATEGORY);

const EVENT_TYPE_TEXT_FILTER_FIELDS = ['display', 'value', 'category.display'];

const filterEventTypes = (eventTypes, filterText) => {
  const filterTextInLowerCase = filterText.toString().toLowerCase();

  return eventTypes.filter((eventType) =>
    EVENT_TYPE_TEXT_FILTER_FIELDS.some((field) => {
      let fieldValue = eventType?.[field];
      if (field.includes('.')) {
        // If the field has a "." we traverse the event type object to the
        // nested field.
        fieldValue = field
          .split('.')
          .reduce((accumulator, field) => accumulator?.[field], eventType);
      }

      return fieldValue?.toString().toLowerCase().includes(filterTextInLowerCase);
    })
  );
};

const ListItem = ({ display, onTypeToggle, selectedReportTypeIDs, types }) => <>
  <h5>{display}</h5>

  <CheckableList
    itemComponent={EventTypeListItem}
    itemFullyChecked={(eventType) => !selectedReportTypeIDs.length|| selectedReportTypeIDs.includes(eventType.id)}
    items={types}
    onCheckClick={onTypeToggle}
  />
</>;

const ReportTypeMultiSelect = ({
  filter,
  onCategoryToggle,
  onFilterChange,
  onFilteredItemsSelect,
  onTypeToggle,
  selectedReportTypeIDs,
}) => {
  const { t } = useTranslation('filters', { keyPrefix: 'reportTypeMultiSelect' });

  const eventCategories = useSelector((state) => state.data.eventCategories);
  const eventTypes = useSelector((state) => state.data.eventTypes);

  const filteredEventTypes = useMemo(
    () => filter.length > 0 ? filterEventTypes(eventTypes, filter) : eventTypes,
    [eventTypes, filter]
  );

  const eventTypesMappedByCategory = mapEventTypesToCategories(filteredEventTypes, eventCategories);

  let setToMatchesButtonText = t('noResultsLabel');
  if (filteredEventTypes.length > 0) {
    setToMatchesButtonText = filteredEventTypes.length > 1
      ? t('someResultsLabel', { resultCount: filteredEventTypes.length })
      : t('singleResultLabel');
  }

  const onSearchBarClear = () => {
    onFilterChange('');

    eventFilterTracker.track('Clear Report Type Text Filter');
  };

  const onSetToMatchesButtonClick = () => {
    onFilteredItemsSelect(filteredEventTypes);

    eventFilterTracker.track('Set Selected Report Types From Searchbar');
  };

  const areAllCategoryEventTypesSelected = (category) => {
    if (!selectedReportTypeIDs.length) {
      return true;
    }

    const categoryEventTypeIds = category.types.map((eventType) => eventType.id);

    return categoryEventTypeIds.every((eventTypeId) => selectedReportTypeIDs.includes(eventTypeId));
  };

  const areCategoryEventTypesPartiallySelected = (category) => {
    const categoryEventTypeIds = category.types.map((eventType) => eventType.id);

    return categoryEventTypeIds.some((eventTypeId) => selectedReportTypeIDs.includes(eventTypeId))
      && !areAllCategoryEventTypesSelected(category);
  };

  return <div className={styles.wrapper}>
    <div className={styles.searchBar}>
      <SearchBar
        onChange={(event) => onFilterChange(event.target.value)}
        onClear={onSearchBarClear}
        placeholder={t('placeholder')}
        value={filter}
      />

      {filter.length > 0 && <Button
        onClick={onSetToMatchesButtonClick}
        size="sm"
        type="button"
        variant="info"
      >
        {setToMatchesButtonText}
      </Button>}
    </div>

    <CheckableList
      className={styles.reportTypeList}
      itemComponent={ListItem}
      itemFullyChecked={areAllCategoryEventTypesSelected}
      itemPartiallyChecked={areCategoryEventTypesPartiallySelected}
      itemProps={{ onTypeToggle, selectedReportTypeIDs }}
      items={eventTypesMappedByCategory}
      onCheckClick={onCategoryToggle}
    />
  </div>;
};

export default memo(ReportTypeMultiSelect);

import React, { useContext, useMemo } from 'react';
import uniq from 'lodash/uniq';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { mapEventTypesToCategories } from '../../../../../../utils/event-types';
import { TrackerContext } from '../../../../../../utils/analytics';

import SearchBar from '../../../../../../SearchBar';
import SelectableItem from '../../../../../../SelectListGroup/SelectableItem';
import SvgIcon from '../../../../../../SvgIcon';

import * as styles from './styles.module.scss';

const includesText = (text, lowerCaseFilterText) => !!text?.toString().toLowerCase().includes(lowerCaseFilterText);

// A category that matches keeps every type in it, the way a search for
// "wildlife" is after all the wildlife types.
const filterCategories = (categories, filterText) => {
  const lowerCaseFilterText = filterText.trim().toLowerCase();

  if (!lowerCaseFilterText) {
    return categories;
  }

  return categories
    .map((category) => includesText(category.display, lowerCaseFilterText) ? category : {
      ...category,
      types: category.types.filter((eventType) => includesText(eventType.display, lowerCaseFilterText)
        || includesText(eventType.value, lowerCaseFilterText)),
    })
    .filter((category) => category.types.length > 0);
};

const EventTypesFilter = ({ filterText, id, onChange, onChangeFilterText, value }) => {
  const { t } = useTranslation('filters', { keyPrefix: 'eventFilters.filtersPopover.eventTypesFilter' });

  const eventCategories = useSelector((state) => state.data.eventCategories);
  const eventTypes = useSelector((state) => state.data.eventTypes);

  const tracker = useContext(TrackerContext);

  const categories = useMemo(
    () => filterCategories(mapEventTypesToCategories(eventTypes, eventCategories), filterText),
    [eventCategories, eventTypes, filterText]
  );

  const matchingEventTypeIds = categories.flatMap((category) => category.types.map((eventType) => eventType.id));

  const onClearFilterText = () => {
    onChangeFilterText('');

    tracker.track('Clear the event types search');
  };

  const onSetMatches = () => {
    onChange(matchingEventTypeIds);

    tracker.track('Set the event types filter to the search matches');
  };

  const onToggleEventTypes = (eventTypeIds, isChecked) => onChange(isChecked
    ? uniq([...value, ...eventTypeIds])
    : value.filter((eventTypeId) => !eventTypeIds.includes(eventTypeId)));

  return <fieldset className={styles.eventTypesFilter} id={id}>
    <legend className={styles.label}>{t('label')}</legend>

    <div className={styles.search}>
      <SearchBar
        aria-label={t('searchBarLabel')}
        className={styles.searchBar}
        onChange={(event) => onChangeFilterText(event.target.value)}
        onClear={onClearFilterText}
        placeholder={t('searchBarPlaceholder')}
        value={filterText}
      />

      {!!filterText && <button
        aria-label={t('setMatchesButtonLabel', { count: matchingEventTypeIds.length })}
        className={styles.setMatchesButton}
        disabled={matchingEventTypeIds.length === 0}
        onClick={onSetMatches}
        type="button"
      >
        {t('setMatchesButton')}
      </button>}
    </div>

    {categories.length > 0
      ? <ul className={styles.categoryList}>
        {categories.map((category) => {
          const categoryEventTypeIds = category.types.map((eventType) => eventType.id);
          const checkedEventTypeCount = categoryEventTypeIds
            .filter((eventTypeId) => value.includes(eventTypeId)).length;

          return <li key={category.value}>
            <SelectableItem
              className={styles.category}
              id={`${id}-category-${category.value}`}
              isChecked={checkedEventTypeCount === categoryEventTypeIds.length}
              label={category.display}
              onClick={(_, isChecked) => {
                onToggleEventTypes(categoryEventTypeIds, isChecked);

                tracker.track(`${isChecked ? 'Check' : 'Uncheck'} an event type category filter`);
              }}
              ref={(input) => {
                if (input) {
                  input.indeterminate = checkedEventTypeCount > 0
                    && checkedEventTypeCount < categoryEventTypeIds.length;
                }
              }}
              value={category.value}
            />

            <ul className={styles.eventTypeList}>
              {category.types.map((eventType) => <li key={eventType.id}>
                <SelectableItem
                  icon={<SvgIcon color="black" iconId={eventType.icon_id || eventType.value} type="events" />}
                  id={`${id}-${eventType.id}`}
                  isChecked={value.includes(eventType.id)}
                  label={eventType.display}
                  onClick={(_, isChecked) => {
                    onToggleEventTypes([eventType.id], isChecked);

                    tracker.track(`${isChecked ? 'Check' : 'Uncheck'} an event type filter`);
                  }}
                  value={eventType.id}
                />
              </li>)}
            </ul>
          </li>;
        })}
      </ul>
      : <p className={styles.noMatchesMessage}>{t('noMatchesMessage')}</p>}
  </fieldset>;
};

export default EventTypesFilter;

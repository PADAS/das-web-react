import React, { forwardRef, memo } from 'react';
import PropTypes from 'prop-types';

import EventTypeListItem from '../../../EventTypeListItem';

import styles from './styles.module.scss';

const CategoryList = ({ category, onClickType, showTitle }) => <div>
  {showTitle && <h4 className={styles.categoryTitle} id={`${category.value}-quick-select`}>{category.display}</h4>}

  <ul key={category.value} className={styles.typesList}>
    {category.types.map((type) => <li className={styles.typeListItem} key={type.id}>
      <button data-testid={`categoryList-button-${type.id}`} onClick={() => onClickType(type)} type="button">
        <EventTypeListItem {...type} />
      </button>
    </li>)}
  </ul>
</div>;

const TypesList = ({ filterText, onClickType, typesByCategory }, ref) => {
  const filterTextLowerCase = filterText.toLowerCase();

  const filteredCategories = typesByCategory.reduce((accumulator, category) => {
    if (!category.types.length) {
      return accumulator;
    }

    if (category.display.toLowerCase().includes(filterTextLowerCase)) {
      return [...accumulator, category];
    }

    const filteredTypes = category.types.filter((type) => type.display.toLowerCase().includes(filterTextLowerCase));
    if (!filteredTypes.length) {
      return accumulator;
    }
    return [...accumulator, { ...category, types: filteredTypes }];
  }, []);

  return <div className={styles.typesContainer} ref={ref}>
    {filteredCategories.map((category) => <CategoryList
      category={category}
      key={`${category.id}${category.value}`}
      onClickType={onClickType}
      showTitle={typesByCategory.length > 1}
    />)}
  </div>;
};

const TypesListForwardRef = forwardRef(TypesList);

TypesListForwardRef.propTypes = {
  filterText: PropTypes.string.isRequired,
  onClickType: PropTypes.func.isRequired,
  typesByCategory: PropTypes.arrayOf(PropTypes.shape({
    display: PropTypes.string,
    id: PropTypes.string,
    types: PropTypes.array,
    value: PropTypes.string,
  })).isRequired,
};

export default TypesListForwardRef;

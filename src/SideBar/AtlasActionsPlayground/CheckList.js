import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as styles from './styles.module.scss';

const SEARCHABLE_FROM = 8;

// A labelled set of checkboxes, with a search box once it gets long.
const CheckList = ({ label, onChange, options, value }) => {
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.atlasActionsPlayground' });
  const id = useId();

  const [search, setSearch] = useState('');

  const shownOptions = options.filter((option) => option.label.toLowerCase().includes(search.trim().toLowerCase()));

  const onToggle = (optionId) => onChange(value.includes(optionId)
    ? value.filter((checkedId) => checkedId !== optionId)
    : [...value, optionId]);

  return <fieldset className={styles.checkList}>
    <legend className={styles.label}>{label} {!!value.length && <span className={styles.count}>({value.length})</span>}</legend>

    {options.length >= SEARCHABLE_FROM && <input
      aria-label={t('searchLabel', { label })}
      className={styles.search}
      onChange={(event) => setSearch(event.target.value)}
      placeholder={t('searchPlaceholder')}
      type="search"
      value={search}
    />}

    {!options.length && <p className={styles.empty}>{t('noOptions')}</p>}

    <ul className={styles.options}>
      {shownOptions.map((option) => <li key={option.id}>
        <label className={styles.option} htmlFor={`${id}-${option.id}`}>
          <input
            checked={value.includes(option.id)}
            id={`${id}-${option.id}`}
            onChange={() => onToggle(option.id)}
            type="checkbox"
          />
          <span className={styles.optionLabel}>{option.label}</span>
        </label>
      </li>)}
    </ul>
  </fieldset>;
};

export default CheckList;

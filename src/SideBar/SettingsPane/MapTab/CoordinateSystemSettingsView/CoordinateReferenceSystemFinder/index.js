import React, { useEffect, useId, useMemo, useState } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { getProj4CompatibleCRS } from '../../../../../utils/location';
import {
  MAX_STORED_COORDINATE_REFERENCE_SYSTEMS,
  setStoredCoordinateReferenceSystems,
} from '../../../../../ducks/coordinate-reference-systems';

import SearchBar from '../../../../../SearchBar';

import * as styles from './styles.module.scss';

const LOADER_SIZE = 30;
const MAX_FILTERED_CRS_AREA_LENGTH = 60;
const MAX_FILTERED_CRS_RESULTS = 10;

const AreaTD = ({ area, epsgCode, name }) => {
  const { t } = useTranslation('components', {
    keyPrefix: 'sideBar.settingsPane.mapTab.coordinateSystemSettingsView.coordinateReferenceSystemFinder',
  });

  const contentId = useId();

  const [isExpanded, setIsExpanded] = useState(false);

  const isLongText = area.length > MAX_FILTERED_CRS_AREA_LENGTH;

  return <td className={styles.areaCell}>
    <span id={contentId}>
      {(isLongText && !isExpanded) ? `${area.slice(0, MAX_FILTERED_CRS_AREA_LENGTH)}...` : area}
    </span>

    {isLongText && <button
      aria-controls={contentId}
      aria-expanded={isExpanded}
      aria-label={t(`readMoreLessButtonLabel.${isExpanded ? 'less' : 'more'}`, { epsgCode, name })}
      className={styles.readMoreLessButton}
      onClick={() => setIsExpanded(!isExpanded)}
      title={t(`readMoreLessButtonLabel.${isExpanded ? 'less' : 'more'}`, { epsgCode, name })}
      type="button"
    >
      {t(`readMoreLessButton.${isExpanded ? 'less' : 'more'}`)}
    </button>}
  </td>;
};

const CoordinateReferenceSystemFinder = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', {
    keyPrefix: 'sideBar.settingsPane.mapTab.coordinateSystemSettingsView.coordinateReferenceSystemFinder',
  });

  const storedCRS = useSelector((state) => state.view.coordinateReferenceSystems.storedSystems);

  const [searchText, setSearchText] = useState('');
  const [supportedCRS, setSupportedCRS] = useState(null);

  const filteredCRS = useMemo(() => {
    if (supportedCRS) {
      const lowerCaseSearchText = searchText.toLowerCase();
      const storedCrsCodes = new Set(storedCRS.map((crs) => crs.code));

      const filteredCRS = [];
      for (const crs of supportedCRS) {
        // Ignore CRS that are already in the stored list.
        if (!storedCrsCodes.has(crs.code)) {
          const doesCrsMatchSearchText =
            crs.area?.toLowerCase().includes(lowerCaseSearchText)
              || crs.code.toString().includes(lowerCaseSearchText)
              || crs.name.toLowerCase().includes(lowerCaseSearchText);
          if (doesCrsMatchSearchText) {
            filteredCRS.push(crs);

            if (filteredCRS.length === MAX_FILTERED_CRS_RESULTS) {
              break;
            }
          }
        }
      }
      return filteredCRS;
    }

    return [];
  }, [searchText, storedCRS, supportedCRS]);

  useEffect(() => {
    // Variable to track if the component is still mounted in order to avoid
    // setting the state if it is not.
    let isMounted = true;

    const fetchCRS = async () => {
      const proj4CompatibleCRS = await getProj4CompatibleCRS();
      if (isMounted) {
        setSupportedCRS(proj4CompatibleCRS);
      }
    };

    fetchCRS();

    return () => {
      isMounted = false;
    };
  }, []);

  return <div>
    <label className={styles.instructions} htmlFor="crs-finder-search">
      {t('instructions')}
    </label>

    <SearchBar
      aria-describedby="crs-finder-showing-maximum-filtered-results-message crs-finder-empty-state-message"
      className={styles.searchBar}
      id="crs-finder-search"
      onChange={(event) => setSearchText(event.target.value)}
      onClear={() => setSearchText('')}
      value={searchText}
    />

    <table className={styles.resultsTable}>
      <caption className="sr-only">
        {t('resultsTableCaption')}
      </caption>

      <colgroup>
        <col className={styles.codeColumn} />
        <col className={styles.nameColumn} />
        <col className={styles.areaColumn} />
        <col className={styles.actionColumn} />
      </colgroup>

      <thead>
        <tr>
          <th scope="col">{t('resultsTableCodeHeaderCell')}</th>
          <th scope="col">{t('resultsTableNameHeaderCell')}</th>
          <th className={styles.areaCell} scope="col">{t('resultsTableAreaHeaderCell')}</th>
          <th scope="col" />
        </tr>
      </thead>

      <tbody>
        {/* If the supported CRS are not yet loaded, show a spinner. */}
        {supportedCRS === null && <tr>
          <td colSpan="100%">
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
              <MoonLoader data-testid="moonLoader" size={LOADER_SIZE} />
            </div>
          </td>
        </tr>}

        {/* If the supported CRS are loaded and the current search text has
        results, show them. */}
        {supportedCRS !== null && filteredCRS.length > 0 && filteredCRS.map((filteredCRS) => (
          <tr key={filteredCRS.code}>
            <td>{filteredCRS.code}</td>
            <td>{filteredCRS.name}</td>
            <AreaTD area={filteredCRS.area} epsgCode={filteredCRS.code} name={filteredCRS.name} />
            <td>
              <button
                aria-describedby="crs-finder-added-maximum-systems-message"
                aria-label={t('addCrsButtonLabel', { epsgCode: filteredCRS.code, name: filteredCRS.name })}
                className={styles.addButton}
                disabled={storedCRS.length === MAX_STORED_COORDINATE_REFERENCE_SYSTEMS}
                onClick={() => dispatch(setStoredCoordinateReferenceSystems([...storedCRS, filteredCRS]))}
                title={t('addCrsButtonLabel', { epsgCode: filteredCRS.code, name: filteredCRS.name })}
                type="button"
              >
                {t('addCrsButton')}
              </button>
            </td>
          </tr>
        ))}

        {/* If the supported CRS are loaded and the current search text has no
        results, show an empty state. */}
        {supportedCRS !== null && filteredCRS.length === 0 && <tr>
          <td colSpan="100%">
            <div className={styles.emptyState} id="crs-finder-empty-state-message">
              {t('emptyStateMessageTitle')}

              <span className={styles.message}>{t('emptyStateMessage')}</span>
            </div>
          </td>
        </tr>}
      </tbody>
    </table>

    {filteredCRS.length === MAX_FILTERED_CRS_RESULTS && <p
        className={styles.crsFinderMessage}
        id="crs-finder-showing-maximum-filtered-results-message"
        role="status"
      >
      {t('showingMaximumFilteredResultsMessage')}
    </p>}

    {storedCRS.length === MAX_STORED_COORDINATE_REFERENCE_SYSTEMS && <p
        className="sr-only"
        id="crs-finder-added-maximum-systems-message"
        role="status"
      >
      {t('addedMaximumSystemsMessage')}
    </p>}
  </div>;
};

export default CoordinateReferenceSystemFinder;

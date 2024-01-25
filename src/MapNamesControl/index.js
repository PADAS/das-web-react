import React, { useCallback, useEffect, useState } from 'react';
import set from 'lodash/set';
import some from 'lodash/some';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import { toggleMapNamesState } from '../ducks/map-ui';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const MapNamesControl = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('settings', { keyPrefix: 'mapNamesControl' });

  const showMapNames = useSelector((state) => state.view.showMapNames);

  const [allChecked, setAllChecked] = useState(true);
  const [isIndeterminate, setIsIndeterminate] = useState(false);
  const [layersValues, setLayersValues] = useState({ ...showMapNames });

  useEffect(() => {
    const hasFalsyValues = some(Object.values(showMapNames), { enabled: false });
    const hasTrulyValues = some(Object.values(showMapNames), { enabled: true });

    setAllChecked(!hasFalsyValues);
    setIsIndeterminate(hasFalsyValues && hasTrulyValues);
  }, [showMapNames]);

  const switchAllOptions = useCallback(() => {
    const newNamesState = { ...layersValues };
    const newValue = !allChecked;
    for (let key in newNamesState) {
      newNamesState[key].enabled = newValue;
    }

    dispatch(toggleMapNamesState(newNamesState));
    setLayersValues({ ...newNamesState });
    setAllChecked(newValue);

    mapInteractionTracker.track(`${newValue ? 'Check' : 'Uncheck' } 'Show Names' checkbox`);
  }, [allChecked, dispatch, layersValues]);

  const handleChange = useCallback((layerID, value) => {
    const newNamesState = set({ ...layersValues }, `${layerID}.enabled`, value);

    dispatch(toggleMapNamesState(newNamesState));
    setLayersValues({ ...newNamesState });

    mapInteractionTracker
      .track(`${value ? 'Check' : 'Uncheck'} 'Show ${t(`layerLabels.${layersValues[layerID].key}`)} Names' checkbox`);
  }, [dispatch, layersValues, t]);

  return <>
    <label>
      <input
        checked={allChecked}
        id="showAllNames"
        onChange={switchAllOptions}
        ref={(input) => {
          if (input) {
            input.indeterminate = isIndeterminate;
          }
        }}
        type="checkbox"
      />

      <span className={styles.checkboxlabel}>{t('allCheckboxLabel')}</span>
    </label>

    <ul className={styles.subListItems}>
      {Object.keys(layersValues).map((layerKey) => <li key={layerKey}>
        <label>
          <input
            type="checkbox"
            id={layerKey}
            checked={layersValues[layerKey].enabled}
            onChange={(e) => handleChange(layerKey, e.target.checked)}
          />

          <span className={styles.checkboxlabel}>{t(`layerLabels.${layersValues[layerKey].key}`)}</span>
        </label>
      </li>)}
    </ul>
  </>;
};

export default MapNamesControl;

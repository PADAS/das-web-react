import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import startCase from 'lodash/startCase';
import some from 'lodash/some';
import set from 'lodash/set';
import { toggleMapNamesState } from '../ducks/map-ui';
import { trackEventFactory, MAP_INTERACTION_CATEGORY } from '../utils/analytics';
import styles from './styles.module.scss';


const MapNamesControl = ({ showMapNames, toggleMapNamesState }) => {
  const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);
  const [layersValues, setLayersValues] = useState({ ...showMapNames });
  const [allChecked, setAllChecked] = useState(true);
  const [isIndeterminate, setIndeterminate] = useState(true);

  useEffect(() => {
    const hasFalsyValues = some(Object.values(showMapNames), { enabled: false });
    // const hasTrulyValues = some(Object.values(showMapNames), { enabled: true });;
    setAllChecked(!hasFalsyValues);
    // console.log('%c hasFalsyValues', 'font-size:20px;color:red;', hasFalsyValues);
    // setIndeterminate(hasTrulyValues);
  }, [showMapNames, toggleMapNamesState]);

  const switchAllOptions = useCallback(() => {
    const newNamesState = { ...layersValues };
    const newValue = !allChecked;
    for (let key in newNamesState) {
      newNamesState[key].enabled = newValue;
    }

    toggleMapNamesState(newNamesState);
    setLayersValues({ ...newNamesState });
    setAllChecked(newValue);
    mapInteractionTracker.track(`${newValue ? 'Check' : 'Uncheck' } 'Show Names' checkbox`);
  }, [allChecked, layersValues, mapInteractionTracker, toggleMapNamesState]);

  const handleChange = useCallback((layerID, value) => {
    const newNamesState = set({ ...layersValues }, `${layerID}.enabled`, value);
    toggleMapNamesState(newNamesState);
    setLayersValues({ ...newNamesState });
    mapInteractionTracker.track(`${value ? 'Check' : 'Uncheck'} 'Show ${startCase(layersValues[layerID].label)} Names' checkbox`);
  }, [layersValues, mapInteractionTracker, toggleMapNamesState]);

  return <>
    <label>
      <input type='checkbox' id='showAllNames' checked={allChecked} indeterminate={Object.values(showMapNames).includes(true)}  onChange={switchAllOptions}/>
      <span className={styles.checkboxlabel}>Show Names</span>
    </label>
    <ul className={styles.subListItems}>
      {Object.keys(layersValues).map(layerKey => {
        return (
          <li key={layerKey}>
            <label>
              <input type='checkbox' id={layerKey} checked={layersValues[layerKey].enabled} onChange={(e) => handleChange(layerKey, e.target.checked)}/>
              <span className={styles.checkboxlabel}>{layersValues[layerKey].label}</span>
            </label>
          </li>
      );})}
    </ul>
  </>;
};

const mapStateToProps = ( { view: { showMapNames } } ) => {
  return { showMapNames };
};

export default connect(mapStateToProps, { toggleMapNamesState })(MapNamesControl);
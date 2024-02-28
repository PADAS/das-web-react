import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import { toggleShowInactiveRadioState } from '../ducks/map-ui';

import styles from './styles.module.scss';

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const InactiveRadioControl = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('settings', { keyPrefix: 'inactiveRadioControl' });

  const showInactiveRadios = useSelector((state) => state.view.showInactiveRadios);

  const onCheckboxChange = () => {
    dispatch(toggleShowInactiveRadioState(!showInactiveRadios));

    mapInteractionTracker.track(`${showInactiveRadios? 'Uncheck' : 'Check'} 'Show Inactive Radios' checkbox`);
  };

  return <label>
    <input checked={showInactiveRadios} name="inactiveRadios" onChange={onCheckboxChange} type="checkbox"/>

    <span className={styles.cbxlabel}>{t('label')}</span>
  </label>;
};

export default InactiveRadioControl;

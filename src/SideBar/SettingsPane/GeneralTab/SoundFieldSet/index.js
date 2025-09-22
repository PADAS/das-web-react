import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { SETTINGS_CATEGORY, trackEventFactory } from '../../../../utils/analytics';
import {
  setPlaySoundForNewEvents,
  setPlaySoundForNewInReachMessages,
  setPlaySoundForRadioStateChangeToRed,
} from '../../../../ducks/user-preferences';

import * as styles from '../../styles.module.scss';

const settingsTracker = trackEventFactory(SETTINGS_CATEGORY);

const SoundFieldSet = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.settingsPane.generalTab.soundFieldSet' });

  const playSoundForNewEvents = useSelector((state) => state.view.userPreferences.playSoundForNewEvents);
  const playSoundForNewInReachMessages = useSelector(
    (state) => state.view.userPreferences.playSoundForNewInReachMessages
  );
  const playSoundForRadioStateChangeToRed = useSelector(
    (state) => state.view.userPreferences.playSoundForRadioStateChangeToRed
  );

  const onNewInReachMessagesCheckboxChange = (event) => {
    dispatch(setPlaySoundForNewInReachMessages(event.target.checked));

    settingsTracker.track(`${event.target.checked ? 'Check' : 'Uncheck'} 'Sound: new inReach messages' checkbox`);
  };

  const onNewEventsCheckboxChange = (event) => {
    dispatch(setPlaySoundForNewEvents(event.target.checked));

    settingsTracker.track(`${event.target.checked ? 'Check' : 'Uncheck'} 'Sound: new events' checkbox`);
  };

  const onRadioStateChangeToRedCheckboxChange = (event) => {
    dispatch(setPlaySoundForRadioStateChangeToRed(event.target.checked));

    settingsTracker.track(`${event.target.checked ? 'Check' : 'Uncheck'} 'Sound: radio state change to red' checkbox`);
  };

  return <fieldset aria-describedby="sound-settings-description" className={styles.section}>
    <legend className={styles.title}>{t('legend')}</legend>

    <div className={styles.sectionWrapper}>
      <p className={styles.sectionDescription} id="sound-settings-description">
        {t('description')}
      </p>

      <div className={styles.checkboxWrapper}>
        <input
          checked={playSoundForNewInReachMessages}
          className={styles.checkbox}
          id="general-sound-new-in-reach-messages-checkbox"
          onChange={onNewInReachMessagesCheckboxChange}
          type="checkbox"
        />

        <label className={styles.label} htmlFor="general-sound-new-in-reach-messages-checkbox">
          {t('newInReachMessagesCheckboxLabel')}
        </label>
      </div>

      <hr className={styles.separator} />

      <div className={styles.checkboxWrapper}>
        <input
          checked={playSoundForNewEvents}
          className={styles.checkbox}
          id="general-sound-new-events-checkbox"
          onChange={onNewEventsCheckboxChange}
          type="checkbox"
        />

        <label className={styles.label} htmlFor="general-sound-new-events-checkbox">
          {t('newEventsCheckboxLabel')}
        </label>
      </div>

      <hr className={styles.separator} />

      <div className={styles.checkboxWrapper}>
        <input
          checked={playSoundForRadioStateChangeToRed}
          className={styles.checkbox}
          id="general-sound-radio-state-change-to-red-checkbox"
          onChange={onRadioStateChangeToRedCheckboxChange}
          type="checkbox"
        />

        <label className={styles.label} htmlFor="general-sound-radio-state-change-to-red-checkbox">
          {t('radioStateChangeToRedCheckboxLabel')}
        </label>
      </div>
    </div>
  </fieldset>;
};

export default SoundFieldSet;

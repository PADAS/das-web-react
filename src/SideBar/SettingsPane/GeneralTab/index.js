import React from 'react';

import AppRefreshFieldSet from './AppRefreshFieldSet';
import ExperimentalFeaturesFieldSet from './ExperimentalFeaturesFieldSet';
import LanguageSelect from './LanguageSelect';
import SoundFieldSet from './SoundFieldSet';

const GeneralTab = () => <>
  <AppRefreshFieldSet />

  <LanguageSelect />

  <SoundFieldSet />

  <ExperimentalFeaturesFieldSet />
</>;

export default GeneralTab;
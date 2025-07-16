import React from 'react';

import DisplayFieldSet from './DisplayFieldSet';
import GeneralFieldSet from './GeneralFieldSet';
import MapMarkersFieldSet from './MapMarkersFieldSet';

const MainMapSettingsView = ({ onOpenCoordianteSettingsView }) => <>
  <GeneralFieldSet />

  <DisplayFieldSet onOpenCoordianteSettingsView={() => onOpenCoordianteSettingsView()} />

  <MapMarkersFieldSet />
</>;

export default MainMapSettingsView;
import React from 'react';

import DisplayFieldSet from './DisplayFieldSet';
import GeneralFieldSet from './GeneralFieldSet';
import MapMarkersFieldSet from './MapMarkersFieldSet';

const MainMapSettingsView = ({ onOpenCoordinateSettingsView }) => <>
  <GeneralFieldSet />

  <DisplayFieldSet onOpenCoordinateSettingsView={() => onOpenCoordinateSettingsView()} />

  <MapMarkersFieldSet />
</>;

export default MainMapSettingsView;
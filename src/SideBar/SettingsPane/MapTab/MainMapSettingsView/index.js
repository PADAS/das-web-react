import React from 'react';

import DisplayFieldSet from './DisplayFieldSet';
import GeneralFieldSet from './GeneralFieldSet';
import MapMarkersFieldSet from './MapMarkersFieldSet';

const MainMapSettingsView = ({ onOpenCoordinateSystemSettingsView }) => <>
  <GeneralFieldSet onOpenCoordinateSystemSettingsView={() => onOpenCoordinateSystemSettingsView()} />

  <DisplayFieldSet />

  <MapMarkersFieldSet />
</>;

export default MainMapSettingsView;
import React, { useState } from 'react';

import CoordinateSettingsView from './CoordinateSettingsView';
import MainMapSettingsView from './MainMapSettingsView';

const VIEWS = { COORDINATE_SETTINGS: 'coordinates' };

const MapTab = () => {
  const [currentView, setCurrentView] = useState(null);

  switch (currentView) {
  case VIEWS.COORDINATE_SETTINGS:
    return <CoordinateSettingsView onOpenMainMapSettingsView={() => setCurrentView(null)} />;

  default:
    return <MainMapSettingsView onOpenCoordinateSettingsView={() => setCurrentView(VIEWS.COORDINATE_SETTINGS)} />;
  };
};

export default MapTab;

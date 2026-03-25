import React, { useState } from 'react';

import CoordinateSystemSettingsView from './CoordinateSystemSettingsView';
import MainMapSettingsView from './MainMapSettingsView';

const VIEWS = { COORDINATE_SYSTEM_SETTINGS: 'coordinate_systems' };

const MapTab = () => {
  const [currentView, setCurrentView] = useState(null);

  switch (currentView) {
  case VIEWS.COORDINATE_SYSTEM_SETTINGS:
    return <CoordinateSystemSettingsView onOpenMainMapSettingsView={() => setCurrentView(null)} />;

  default:
    return <MainMapSettingsView
      onOpenCoordinateSystemSettingsView={() => setCurrentView(VIEWS.COORDINATE_SYSTEM_SETTINGS)}
    />;
  };
};

export default MapTab;

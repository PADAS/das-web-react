import React, { memo, useCallback } from 'react';

import Footer from './Footer';
import ReportOverview from './ReportOverview';

const ReportGeometryDrawer = () => {
  // TODO: Add drawing mechanism here

  const onSaveGeometry = useCallback(() => {

  }, []);

  return <>
    <ReportOverview />
    <Footer disableSaveButton={true} onSave={onSaveGeometry} />
  </>;
};

export default memo(ReportGeometryDrawer);

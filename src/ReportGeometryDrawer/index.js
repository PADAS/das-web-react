import React, { memo, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { setMapInteractionIsPickingArea } from '../ducks/map-ui';

import Footer from './Footer';
import ReportOverview from './ReportOverview';

const ReportGeometryDrawer = () => {
  const dispatch = useDispatch();
  // TODO: Add drawing mechanism here

  const onSaveGeometry = useCallback(() => {

  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        dispatch(setMapInteractionIsPickingArea(false));
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  return <>
    <ReportOverview />
    <Footer disableSaveButton={true} onSave={onSaveGeometry} />
  </>;
};

export default memo(ReportGeometryDrawer);

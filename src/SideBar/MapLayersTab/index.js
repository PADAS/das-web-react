import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { MapContext } from '../../App';

import AnalyzerLayerList from '../../AnalyzerLayerList';
import ClearAllControl from '../../ClearAllControl';
import ErrorBoundary from '../../ErrorBoundary';
import FeatureLayerList from '../../FeatureLayerList';
import MapLayerFilter from '../../MapLayerFilter';
import ReportMapControl from '../../ReportMapControl';
import SubjectGroupList from '../../SubjectGroupList';

import * as styles from './styles.module.scss';

const MapLayersTab = () => {
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.mapLayersTab' });

  const map = useContext(MapContext);

  return <ErrorBoundary>
    <MapLayerFilter />

    <div className={styles.mapLayers}>
      <ReportMapControl />

      <SubjectGroupList />
      <FeatureLayerList map={map} />
      <AnalyzerLayerList map={map} />
      <div className={styles.noItems}>{t('noItemsToDisplayInLayers')}</div>
    </div>

    <div className={styles.mapLayerFooter}>
      <ClearAllControl map={map} />
    </div>
  </ErrorBoundary>;
};

export default MapLayersTab;

import { memo, useCallback, useEffect } from 'react';
import isPlainObject from 'lodash/isPlainObject';
import MoonLoader from 'react-spinners/MoonLoader';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { fetchFeature } from '../ducks/features';
import { hidePopup } from '../ducks/popup';
import { MAP_INTERACTION_CATEGORY } from '../utils/analytics';
import { selectStoredFeature } from '../selectors/features';

import AddItemButton from '../AddItemButton';
import FeatureGeometryIcon from '../FeatureGeometryIcon';
import GpsFormatToggle from '../GpsFormatToggle';

import * as styles from './styles.module.scss';

const ATTRIBUTES_LOADER_SIZE = 24;
const EMPTY_ATTRIBUTES = {};
const NO_VALUE_PLACEHOLDER = '—';

const isPrimitive = (value) => value === null || typeof value !== 'object';

const isStructured = (value) => !isPrimitive(value) && !(Array.isArray(value) && value.every(isPrimitive));

const formatAttributeValue = (value, t) => {
  if (typeof value === 'boolean') return t(value ? 'trueValueLabel' : 'falseValueLabel');

  if (value === null || value === '') return NO_VALUE_PLACEHOLDER;

  if (isStructured(value)) return JSON.stringify(value, null, 2);

  return Array.isArray(value) ? value.map((item) => formatAttributeValue(item, t)).join(', ') : String(value);
};

const FeatureSymbolPopup = ({ data, id }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('map-popups', { keyPrefix: 'featureSymbolPopup' });

  const storedFeature = useSelector((state) => selectStoredFeature(state, data.properties.id));

  const attributeEntries = Object.entries(
    isPlainObject(storedFeature?.properties?.attributes) ? storedFeature.properties.attributes : EMPTY_ATTRIBUTES
  );
  const featureId = data.properties.id;

  const onComplete = useCallback(() => dispatch(hidePopup(id)), [dispatch, id]);

  // Tiles flatten attributes into the other properties, so ask the API.
  useEffect(() => {
    if (featureId) {
      dispatch(fetchFeature(featureId));
    }
  }, [dispatch, featureId]);

  return <>
    <h4 className={styles.title}>
      <FeatureGeometryIcon className={styles.titleIcon} geometryType={data.geometryType} />

      <span className={styles.titleText}>{data.properties.title || data.properties.name}</span>
    </h4>

    <GpsFormatToggle
      lngLat={{ latitude: data.coordinates[1], longitude: data.coordinates[0] }}
      name="featureLayer-featureSymbolPopup-gpsFormatToggle"
    />

    {!!attributeEntries.length && <div
      aria-label={t('attributesRegionLabel')}
      className={styles.attributes}
      role="region"
      tabIndex={0}
    >
      <dl className={styles.attributesList}>
        {attributeEntries.map(([attributeKey, attributeValue]) => <div
          className={`${styles.attribute} ${isStructured(attributeValue) ? styles.structured : ''}`}
          key={attributeKey}
        >
          <dt>{attributeKey}</dt>

          <dd>{formatAttributeValue(attributeValue, t)}</dd>
        </div>)}
      </dl>
    </div>}

    {!!storedFeature?.isLoading && <div className={styles.attributesLoader} role="status">
      <MoonLoader aria-hidden color="var(--er-ui-cta-primary)" size={ATTRIBUTES_LOADER_SIZE} />

      <span className="sr-only">{t('attributesLoadingLabel')}</span>
    </div>}

    {!!storedFeature?.hasError && <p className={styles.attributesError} role="status">
      {t('attributesErrorMessage')}
    </p>}

    <hr />

    <AddItemButton
      analyticsMetadata={{ category: MAP_INTERACTION_CATEGORY, location: 'feature popup' }}
      formProps={{ onSaveSuccess: onComplete, onSaveError: onComplete }}
      reportData={{ location: { latitude: data.coordinates[1], longitude: data.coordinates[0] } }}
      showLabel={false}
      variant="secondary"
    />
  </>;
};

export default memo(FeatureSymbolPopup);

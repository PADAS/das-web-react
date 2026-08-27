import React, { useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';

import useLocalStorage from '../hooks/useLocalStorage';

import * as styles from './styles.module.scss';

const STORAGE_KEY = 'showSubjectDetailsByDefault';
const NO_VALUE_PLACEHOLDER = '—';
const TOGGLEABLE_PROPERTY_COUNT = 2;

const AdditionalDeviceProperties = ({
  className = '',
  deviceStatusProperties = [],
  isStaticSubject = false,
  isTimeSliderActive = false,
}) => {
  const { t } = useTranslation('subjects', { keyPrefix: 'subjectPopup' });

  const additionalPropsListId = useId();

  const [additionalPropsToggledOn, setAdditionalPropsToggledOn] = useLocalStorage(STORAGE_KEY, false);

  // A subject's properties reach the popup as a JSON string that can decode to null.
  const properties = Array.isArray(deviceStatusProperties) ? deviceStatusProperties : [];

  const hasAdditionalDeviceProps = !!properties.length;
  const additionalPropsShouldBeToggleable = hasAdditionalDeviceProps
    && properties.length > TOGGLEABLE_PROPERTY_COUNT
    && !isStaticSubject;
  const showAdditionalProps = hasAdditionalDeviceProps
    && (additionalPropsShouldBeToggleable ? additionalPropsToggledOn : true);

  const toggleShowAdditionalProperties = useCallback(
    () => setAdditionalPropsToggledOn((toggledOn) => !toggledOn),
    [setAdditionalPropsToggledOn]
  );

  const renderPropertyValue = ({ units, value }) => {
    if (isTimeSliderActive) return <span>{t('noHistoricalDataSpan')}</span>;

    if (value === null || value === undefined) {
      return <span data-testid="additional-props-value">{NO_VALUE_PLACEHOLDER}</span>;
    }

    return <span data-testid="additional-props-value">
      {value.toString()}

      <span> {units}</span>
    </span>;
  };

  if (!hasAdditionalDeviceProps) return null;

  return <div className={className}>
    {additionalPropsShouldBeToggleable && <button
      aria-controls={additionalPropsListId}
      aria-expanded={additionalPropsToggledOn}
      className={styles.toggleAdditionalProps}
      data-testid="additional-props-toggle-btn"
      onClick={toggleShowAdditionalProperties}
      type="button"
      >
      {t(`additionalPropsButton.${additionalPropsToggledOn ? 'fewer' : 'more'}`)}
    </button>}

    <ul
      className={`${styles.additionalProperties} ${isTimeSliderActive ? styles.disabled : ''}`}
      data-testid="additional-props"
      hidden={!showAdditionalProps}
      id={additionalPropsListId}
      >
      {properties.map((deviceStatusProperty, index) => <li
        key={`${deviceStatusProperty.label}-${index}`}
      >
        <strong>{deviceStatusProperty.label}</strong>

        {renderPropertyValue(deviceStatusProperty)}
      </li>)}
    </ul>
  </div>;
};

export default AdditionalDeviceProperties;

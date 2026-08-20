import React, { useCallback, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as styles from './styles.module.scss';

const STORAGE_KEY = 'showSubjectDetailsByDefault';

const AdditionalDeviceProperties = ({
  className = '',
  deviceStatusProperties = [],
  isStaticSubject = false,
  isTimeSliderActive = false,
}) => {
  const { t } = useTranslation('subjects', { keyPrefix: 'subjectPopup' });

  const additionalPropsListId = useId();

  const [additionalPropsToggledOn, toggleAdditionalPropsVisibility] = useState(
    window.localStorage.getItem(STORAGE_KEY) === 'true'
  );

  const hasAdditionalDeviceProps = !!deviceStatusProperties.length;
  const additionalPropsShouldBeToggleable = hasAdditionalDeviceProps
    && deviceStatusProperties.length > 2
    && !isStaticSubject;
  const showAdditionalProps = hasAdditionalDeviceProps
    && (additionalPropsShouldBeToggleable ? additionalPropsToggledOn : true);

  const toggleShowAdditionalProperties = useCallback(() => {
    toggleAdditionalPropsVisibility(!additionalPropsToggledOn);

    window.localStorage.setItem(STORAGE_KEY, !additionalPropsToggledOn);
  }, [additionalPropsToggledOn]);

  if (!hasAdditionalDeviceProps) return null;

  return <div className={className}>
    {showAdditionalProps && <ul
      className={`${styles.additionalProperties} ${isTimeSliderActive ? styles.disabled : ''}`}
      data-testid="additional-props"
      id={additionalPropsListId}
      >
      {deviceStatusProperties.map((deviceStatusProperty, index) => <li
        key={`${deviceStatusProperty.label}-${index}`}
      >
        <strong>{deviceStatusProperty.label}</strong>

        {isTimeSliderActive ? <span>{t('noHistoricalDataSpan')}</span> : <span data-testid="additional-props-value">
          {deviceStatusProperty.value?.toString()}

          <span> {deviceStatusProperty.units}</span>
        </span>}
      </li>)}
    </ul>}

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
  </div>;
};

export default AdditionalDeviceProperties;

import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from 'react-bootstrap/Button';

import * as styles from './styles.module.scss';

const STORAGE_KEY = 'showSubjectDetailsByDefault';

const AdditionalDeviceProperties = ({
  className = '',
  deviceStatusProperties = [],
  staticSubject = false,
  timeSliderActive = false,
}) => {
  const { t } = useTranslation('subjects', { keyPrefix: 'subjectPopup' });

  const [additionalPropsToggledOn, toggleAdditionalPropsVisibility] = useState(
    window.localStorage.getItem(STORAGE_KEY) === 'true'
  );

  const hasAdditionalDeviceProps = !!deviceStatusProperties.length;
  const additionalPropsShouldBeToggleable = hasAdditionalDeviceProps
    && deviceStatusProperties.length > 2
    && !staticSubject;
  const showAdditionalProps = hasAdditionalDeviceProps
    && (additionalPropsShouldBeToggleable ? additionalPropsToggledOn : true);

  const toggleShowAdditionalProperties = useCallback(() => {
    toggleAdditionalPropsVisibility(!additionalPropsToggledOn);

    window.localStorage.setItem(STORAGE_KEY, !additionalPropsToggledOn);
  }, [additionalPropsToggledOn]);

  if (!hasAdditionalDeviceProps) return null;

  return <div className={className}>
    {showAdditionalProps && <ul
      className={`${styles.additionalProperties} ${timeSliderActive ? styles.disabled : ''}`}
      data-testid="additional-props"
      >
      {deviceStatusProperties.map((deviceStatusProperty, index) => <li
        key={`${deviceStatusProperty.label}-${index}`}
      >
        <strong>{deviceStatusProperty.label}</strong>

        {timeSliderActive ? <span>{t('noHistoricalDataSpan')}</span> : <span data-testid="additional-props-value">
          {deviceStatusProperty.value.toString()}

          <span> {deviceStatusProperty.units}</span>
        </span>}
      </li>)}
    </ul>}

    {additionalPropsShouldBeToggleable && <Button
      className={styles.toggleAdditionalProps}
      data-testid="additional-props-toggle-btn"
      onClick={toggleShowAdditionalProperties}
      size="sm"
      type="button"
      variant="link"
      >
      {t(`additionalPropsButton.${additionalPropsToggledOn ? 'fewer' : 'more'}`)}
    </Button>}
  </div>;
};

export default AdditionalDeviceProperties;

import React, { useContext, useId, useImperativeHandle, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { TrackerContext } from '../../../../utils/analytics';

import Select from '../../../../Select';
import SvgIcon from '../../../../SvgIcon';

import * as styles from './styles.module.scss';

const getOptionLabel = ({ display }) => display;
const getOptionValue = ({ id }) => id;

const renderOptionIcon = ({ icon_id }) => <SvgIcon iconId={icon_id} type="patrols" />;

const PatrolTypeField = ({ error, onChange, patrolType, ref }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'legForm.patrolTypeField' });

  const tracker = useContext(TrackerContext);

  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const fieldRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => fieldRef.current?.querySelector('input')?.focus(),
  }));

  const errorId = useId();
  const selectId = useId();

  const options = patrolTypes.filter(({ is_active }) => is_active);

  const onSelectChange = (newPatrolType) => {
    onChange(newPatrolType);

    tracker.track('Pick a patrol type from the leg form');
  };

  return <div className={styles.patrolTypeField} ref={fieldRef}>
    <label className={styles.label} htmlFor={selectId}>{t('label')}</label>

    <Select
      aria-errormessage={error ? errorId : undefined}
      aria-invalid={error ? 'true' : 'false'}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      inputId={selectId}
      isClearable={false}
      onChange={onSelectChange}
      options={options}
      placeholder={t('placeholder')}
      renderOptionIcon={renderOptionIcon}
      value={patrolType}
    />

    {!!error && <p className={styles.errorMessage} id={errorId} role="alert">{error}</p>}
  </div>;
};

export default PatrolTypeField;

import React, { memo, useContext, useId, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { TrackerContext } from '../../../../utils/analytics';

import Select from '../../../../Select';
import SvgIcon from '../../../../SvgIcon';

import * as styles from './styles.module.scss';

const getOptionLabel = ({ display }) => display;
const getOptionValue = ({ id }) => id;

const renderOptionIcon = ({ icon_id }) => <SvgIcon iconId={icon_id} type="patrols" />;

const PatrolTypeField = ({ onChange, patrolType }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'legForm.patrolTypeField' });

  const tracker = useContext(TrackerContext);

  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const selectId = useId();

  const options = useMemo(() => patrolTypes.filter(({ is_active }) => is_active), [patrolTypes]);

  const onSelectChange = (newPatrolType) => {
    onChange(newPatrolType);

    tracker.track('Pick a patrol type from the leg form');
  };

  return <div className={styles.patrolTypeField}>
    <label className={styles.label} htmlFor={selectId}>{t('label')}</label>

    <Select
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
  </div>;
};

export default memo(PatrolTypeField);

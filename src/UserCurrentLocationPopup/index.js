import React, { memo, useCallback } from 'react';
import isEqual from 'react-fast-compare';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { MAP_INTERACTION_CATEGORY } from '../utils/analytics';
import { hidePopup } from '../ducks/popup';

import AddItemButton from '../AddItemButton';
import GpsFormatToggle from '../GpsFormatToggle';
import TimeAgo from '../TimeAgo';

const UserCurrentLocationPopup = ({ data, id }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('user', { keyPrefix: 'userCurrentLocationPopup' });

  const lastRead = new Date(data.location.timestamp);

  const onComplete = useCallback(() => dispatch(hidePopup(id)), [dispatch, id]);

  return <>
    <h4>{t('header')}</h4>

    <GpsFormatToggle lat={data.location.coords.latitude} lng={data.location.coords.longitude} />

    <p>{t('accuracy', { accuracy: data.location.coords.accuracy })}</p>

    <p>{t('lastChecked')} <TimeAgo date={lastRead} /></p>

    <hr />

    <AddItemButton
      analyticsMetadata={{ category: MAP_INTERACTION_CATEGORY, location: 'current user location' }}
      formProps={{ onSaveError: onComplete, onSaveSuccess: onComplete }}
      reportData={{
        location: {
          latitude: data.location.coords.latitude,
          longitude: data.location.coords.longitude,
        }
      }}
      showLabel={false}
    />
  </>;
};

UserCurrentLocationPopup.propTypes = {
  data: PropTypes.shape({
    location: PropTypes.object,
  }).isRequired,
  id: PropTypes.string.isRequired,
};

export default memo(
  UserCurrentLocationPopup,
  (oldProps, newProps) => isEqual(oldProps.data.location, newProps.data.location)
);

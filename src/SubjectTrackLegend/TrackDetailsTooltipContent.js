import React, { memo, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import { fetchTrackPointCount } from '../utils/tracks';
import { format, STANDARD_DATE_FORMAT } from '../utils/datetime';

import * as styles from './styles.module.scss';

const TrackDetailsTooltipContent = memo(function TrackDetailsTooltipContent({ subjectIds, from, until }) {
  const { t } = useTranslation('tracks', { keyPrefix: 'subjectTrackLegend.tooltip' });
  const [state, setState] = useState({ status: 'loading', count: null, error: null });
  const mountedRef = useRef(true);
  const subjectIdsKey = subjectIds?.length ? subjectIds.slice().sort().join(',') : '';

  useEffect(() => {
    mountedRef.current = true;
    if (!subjectIdsKey || !from) {
      setState({ status: 'idle', count: 0, error: null });
      return () => { mountedRef.current = false; };
    }
    const controller = new AbortController();
    fetchTrackPointCount(subjectIds, from, until || new Date(), controller.signal)
      .then((count) => {
        if (mountedRef.current) setState({ status: 'success', count, error: null });
      })
      .catch((err) => {
        const isAborted = err?.name === 'AbortError' || err?.name === 'CanceledError' || axios.isCancel(err);
        if (mountedRef.current && !isAborted) {
          setState({ status: 'error', count: null, error: err });
        }
      });
    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- subjectIdsKey encodes subjectIds
  }, [subjectIdsKey, from, until]);

  const fromFormatted = from ? format(new Date(from), STANDARD_DATE_FORMAT) : '';
  const untilFormatted = until ? format(new Date(until), STANDARD_DATE_FORMAT) : t('untilNow');

  return (
    <div className={styles.popoverContent}>
      <div>{t('dateRange', { from: fromFormatted, until: untilFormatted })}</div>
      <div>
        {state.status === 'loading' && t('pointCountLoading')}
        {state.status === 'success' && t('pointCount', { count: state.count })}
        {state.status === 'error' && t('pointCountError')}
      </div>
    </div>
  );
});

export default TrackDetailsTooltipContent;

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { allSubjects } from '../../../selectors/subjects';
import { calcRecentRadiosFromSubjects, isRadioWithImage } from '../../../utils/subjects';
import { calcUrlForImage } from '../../../utils/img';
import { getGlobalSchemaReportedBy } from '../../../selectors';

import Select from '../../../Select';
import SvgIcon from '../../../SvgIcon';

const RECENT_RADIO_COUNT = 5;

const getReporterValue = (reporter) => reporter.id;

const renderReporterIcon = (reporter) => {
  const imageUrl = calcUrlForImage(isRadioWithImage(reporter) || reporter.image_url);

  return !!imageUrl && <SvgIcon imageUrl={imageUrl} type="subjects" />;
};

// Subjects update constantly, so only this select follows them, not its form.
const ReporterSelect = ({ ...otherProps }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'eventsManager.reporterSelect' });

  const reporters = useSelector(getGlobalSchemaReportedBy);
  const subjects = useSelector(allSubjects);

  const getReporterLabel = (reporter) => {
    if (reporter.hidden) {
      return t('restrictedReporterLabel');
    }

    if (reporter.content_type !== 'accounts.user') {
      return reporter.name;
    }

    return reporter.first_name || reporter.last_name
      ? `${reporter.first_name} ${reporter.last_name}`.trim()
      : reporter.username;
  };

  const reporterOptions = useMemo(() => {
    const visibleReporters = reporters.filter((reporter) => !reporter.hidden);
    const recentRadios = calcRecentRadiosFromSubjects(...subjects).slice(0, RECENT_RADIO_COUNT);

    if (recentRadios.length === 0) {
      return visibleReporters;
    }

    return [
      { label: t('recentRadiosGroupLabel'), options: recentRadios },
      {
        label: t('allReportersGroupLabel'),
        options: visibleReporters.filter((reporter) => !recentRadios.some((radio) => radio.id === reporter.id)),
      },
    ];
  }, [reporters, subjects, t]);

  return <Select
    getOptionLabel={getReporterLabel}
    getOptionValue={getReporterValue}
    options={reporterOptions}
    renderOptionIcon={renderReporterIcon}
    {...otherProps}
  />;
};

export default ReporterSelect;

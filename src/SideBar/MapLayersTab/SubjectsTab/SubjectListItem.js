import React, { memo } from 'react';
import isEmpty from 'lodash/isEmpty';

import { getSubjectDefaultDeviceProperty, isRadioWithImage, subjectIsStatic } from '../../../utils/subjects';

import DateTime from '../../../DateTime';
import SubjectControls from '../../../SubjectControls';

import * as mapLayersStyles from '../styles.module.scss';
import * as styles from './styles.module.scss';

const SubjectListItem = ({ ...subject }) => {
  const defaultDeviceProperty = getSubjectDefaultDeviceProperty(subject);
  const isStatic = subjectIsStatic(subject);
  const subjectRadioImage = isRadioWithImage(subject);

  return <>
    <p className={mapLayersStyles.itemTitle} data-testid='subject-item-name'>
      {subjectRadioImage && <img alt={subject.name} src={subjectRadioImage} />}

      <span> {subject.name} </span>

      {!isEmpty(defaultDeviceProperty) && <span className={mapLayersStyles.defaultProperty}>
        {`${defaultDeviceProperty.label}: ${defaultDeviceProperty.value} ${defaultDeviceProperty.units || ''}`}
      </span>}
    </p>

    {subject.last_position?.properties?.coordinateProperties?.time && <DateTime
      className={styles.subjectDateTime}
      date={subject.last_position.properties.coordinateProperties.time}
    />}

    <SubjectControls
      className={mapLayersStyles.controls}
      showHeatmapButton={!isStatic}
      showLabels={false}
      showTitles={false}
      showTrackButton={!isStatic}
      subject={subject}
    />
  </>;
};

export default memo(SubjectListItem);

import React, { memo, useMemo, Fragment } from 'react';
import SubjectControls from '../SubjectControls';

import { subjectIsARadio } from '../utils/subjects';

import listStyles from '../SideBar/styles.module.scss';

const SubjectListItem = (props) => { // eslint-disable-line react/display-name

  const isRadioWithImage = useMemo(() => subjectIsARadio(props) && !!props.last_position && !!props.last_position.properties && props.last_position.properties.image, [props]);

  const { map, ...rest } = props;
  return <Fragment>
    <span className={listStyles.itemTitle}>{isRadioWithImage && <img src={isRadioWithImage} alt={props.name} />} {props.name}</span>
    <SubjectControls className={listStyles.controls} map={map} showTitles={false} subject={rest} />
  </Fragment>;
};

export default memo(SubjectListItem);

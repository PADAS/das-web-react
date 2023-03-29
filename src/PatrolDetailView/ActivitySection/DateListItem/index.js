import React, { useMemo } from 'react';
import FeedListItem from '../../../FeedListItem';
import { ReactComponent as ClockIcon } from '../../../common/images/icons/check.svg';
import DateTime from '../../../DateTime';
import styles  from './styles.module.scss';

const DateListItem = ({ date, title }) => {

  const renderIcon = useMemo(() => {
    return <div className={styles.icon}>
      <ClockIcon />
    </div>;
  }, []);

  const renderDate = useMemo(() => <DateTime
      date={date}
      showElapsed={false} className={styles.date}
  />, [date]);

  const renderTitle = useMemo(() => <p className={styles.title}>{title}</p>, [title]);

  return <FeedListItem className={styles.feedItem} themeColor="transparent"
        IconComponent={renderIcon}
        DateComponent={renderDate}
        TitleComponent={renderTitle}
    />;
};

export default DateListItem;

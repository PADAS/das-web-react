import { memo, useCallback, useContext, useEffect, useId, useState } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as BellIcon } from '../common/images/icons/bell-icon.svg';

import { fetchNews, readNews } from '../ducks/news';
import { MAIN_TOOLBAR_CATEGORY, trackEventFactory } from '../utils/analytics';
import { POPOVER_POPPER_CONFIG } from '../constants';
import { SocketContext } from '../withSocketConnection';

import Badge from '../Badge';
import NotificationsPopover from './NotificationsPopover';

import * as styles from './styles.module.scss';

const EMPTY_USER_NOTIFICATIONS = [];

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);

const formatNewsItemsAsNotifications = (newsItems = []) => newsItems.map((newsItem) => ({
  date: newsItem.additional?.created_at,
  id: newsItem.id,
  link: newsItem.link,
  message: newsItem.description,
  read: newsItem.read,
  title: newsItem.title,
}));

const NotificationMenu = () => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'notificationMenu' });

  const userNotifications = useSelector((state) => state.view.userNotifications ?? EMPTY_USER_NOTIFICATIONS);

  const socket = useContext(SocketContext);

  const popoverId = useId();

  const [hasNewsFetchError, setHasNewsFetchError] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [news, setNews] = useState(null);
  const [toggleButton, setToggleButton] = useState(null);

  const notifications = [...userNotifications, ...(news ?? [])];
  const unreadNotifications = notifications.filter((notification) => !notification.read);

  const fetchNewsForMenu = useCallback(async () => {
    setHasNewsFetchError(false);

    try {
      const response = await fetchNews();

      setNews(formatNewsItemsAsNotifications(response.data.data.results));
    } catch (error) {
      console.warn('error fetching news', error);

      setHasNewsFetchError(true);
    }
  }, []);

  // Closing marks the news read, as the user has now seen it.
  const hidePopover = useCallback(async () => {
    setIsPopoverOpen(false);

    mainToolbarTracker.track('Close Notification Menu');

    const unreadNews = (news ?? []).filter((newsItem) => !newsItem.read);
    if (unreadNews.length) {
      try {
        await readNews(unreadNews);

        setNews((currentNews) => currentNews.map((newsItem) => ({ ...newsItem, read: true })));
      } catch (error) {
        console.warn('error marking news as `read`', error);
      }
    }
  }, [news]);

  const onToggleClick = () => {
    if (isPopoverOpen) {
      hidePopover();
    } else {
      setIsPopoverOpen(true);

      mainToolbarTracker.track('Open Notification Menu');
    }
  };

  useEffect(() => {
    // Updating state from this effect is intended.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNewsForMenu();
  }, [fetchNewsForMenu]);

  useEffect(() => {
    if (socket) {
      const consumeMessage = ({ data: message }) => setNews((currentNews) => [
        ...formatNewsItemsAsNotifications([message]),
        ...(currentNews ?? []),
      ]);

      const [, fnRef] = socket.on('new_announcement', consumeMessage);

      return () => socket.off('new_announcement', fnRef);
    }
  }, [socket]);

  return <div className={styles.notificationMenu}>
    <button
      aria-controls={isPopoverOpen ? popoverId : undefined}
      aria-expanded={isPopoverOpen}
      aria-haspopup="dialog"
      aria-label={unreadNotifications.length
        ? t('unreadToggleLabel', { count: unreadNotifications.length })
        : t('toggleLabel')}
      className={styles.toggle}
      onClick={onToggleClick}
      ref={setToggleButton}
      title={t('toggleLabel')}
      type="button"
    >
      <BellIcon aria-hidden="true" />

      {!!unreadNotifications.length && <Badge
        aria-hidden="true"
        className={styles.unreadBadge}
        count={unreadNotifications.length}
        data-testid="notificationMenu-unreadBadge"
      />}
    </button>

    <Overlay
      placement="bottom-end"
      popperConfig={POPOVER_POPPER_CONFIG}
      show={isPopoverOpen}
      target={toggleButton}
    >
      <NotificationsPopover
        hasNews={!!news?.length}
        hasNewsFetchError={hasNewsFetchError}
        id={popoverId}
        notifications={notifications}
        onClose={hidePopover}
        onRetryNewsFetch={fetchNewsForMenu}
        trigger={toggleButton}
      />
    </Overlay>
  </div>;
};

export default memo(NotificationMenu);

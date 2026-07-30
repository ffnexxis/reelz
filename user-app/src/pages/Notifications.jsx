import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../api/client';
import { useNotifications } from '../contexts/NotificationsContext';
import UserAvatar from '../components/UserAvatar';
import { getDisplayName } from '../utils/displayName';
import { timeAgo } from '../utils/timeAgo';

const VERBS = {
  FOLLOW: 'started following you',
  LIKE: 'liked your post',
  COMMENT: 'commented on your post',
};

// A LIKE notification with no postId is a like on watchlist activity
// (likes.js only sets postId for post likes), so word it accordingly.
function verbFor(n) {
  if (n.type === 'LIKE' && !n.postId) return 'liked your watchlist activity';
  return VERBS[n.type] || 'interacted with you';
}

const TYPE_ICONS = {
  FOLLOW: (
    <span className="w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
      <svg className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
      </svg>
    </span>
  ),
  LIKE: (
    <span className="w-6 h-6 rounded-full bg-pink-500/15 border border-pink-500/30 flex items-center justify-center flex-shrink-0">
      <svg className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
      </svg>
    </span>
  ),
  COMMENT: (
    <span className="w-6 h-6 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0">
      <svg className="w-3.5 h-3.5 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
      </svg>
    </span>
  ),
};

function linkFor(n) {
  if (n.type !== 'FOLLOW' && n.postId) return `/posts/${n.postId}`;
  return `/users/${n.actor?.id}`;
}

export default function Notifications() {
  const { markAllRead } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    notificationsApi.getAll()
      .then((res) => {
        setNotifications(res.data.notifications || []);
        // Clear the badge only after we've captured which rows were unread,
        // so the "new" styling still shows for this visit.
        markAllRead();
      })
      .catch(() => setError('Failed to load notifications'))
      .finally(() => setLoading(false));
  }, [markAllRead]);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const dismissUnread = () => {
    setNotifications((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
    markAllRead();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {unreadCount > 0
              ? `${unreadCount} new ${unreadCount === 1 ? 'notification' : 'notifications'}`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={dismissUnread}
            className="text-sm text-reelz-600 dark:text-reelz-400 hover:text-reelz-500 dark:hover:text-reelz-300 transition-colors flex-shrink-0"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-reelz-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{error}</p>
          <button onClick={load} className="btn-secondary mt-4">Try again</button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Nothing here yet</p>
          <p className="text-sm mt-1">
            <Link
              to="/people"
              className="text-reelz-600 dark:text-reelz-400 hover:text-reelz-500 dark:hover:text-reelz-300"
            >
              Follow people
            </Link>{' '}
            and get the conversation going
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <Link
                to={linkFor(n)}
                className={`card-glass p-4 flex items-center gap-3 transition-colors hover:border-reelz-500/50 ${
                  !n.read
                    ? 'border-reelz-500/40 bg-reelz-600/5 dark:bg-reelz-500/10'
                    : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <UserAvatar user={n.actor} size="md" />
                  <span className="absolute -bottom-1 -right-1">
                    {TYPE_ICONS[n.type] || null}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {getDisplayName(n.actor)}
                    </span>{' '}
                    {verbFor(n)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <span
                    className="w-2 h-2 rounded-full bg-reelz-500 flex-shrink-0"
                    title="New"
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

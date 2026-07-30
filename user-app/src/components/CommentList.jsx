import { Link } from 'react-router-dom';
import UserAvatar from './UserAvatar';
import { getDisplayName } from '../utils/displayName';
import { timeAgo } from '../utils/timeAgo';

// Simple list of comments (each comment includes its `user`).
export default function CommentList({ comments = [] }) {
  if (!comments.length) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
        No comments yet. Be the first!
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li key={comment.id} className="flex gap-3">
          <Link to={`/users/${comment.user?.id}`} className="flex-shrink-0">
            <UserAvatar user={comment.user} size="sm" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <Link
                to={`/users/${comment.user?.id}`}
                className="text-sm font-semibold text-gray-900 dark:text-white hover:text-reelz-600 dark:hover:text-reelz-400 transition-colors"
              >
                {getDisplayName(comment.user)}
              </Link>
              <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
              {comment.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

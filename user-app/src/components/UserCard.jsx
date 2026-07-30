import { useState } from 'react';
import { Link } from 'react-router-dom';
import UserAvatar from './UserAvatar';
import FollowButton from './FollowButton';
import { getDisplayName } from '../utils/displayName';

// Row card for People / follower lists: avatar, name, email, follower count,
// follow toggle. `showFollowerCount` hides the count when the API omits it.
export default function UserCard({ user, showFollowerCount = true }) {
  const [isFollowing, setIsFollowing] = useState(!!user.isFollowedByMe);
  const [followerCount, setFollowerCount] = useState(user.followerCount ?? null);

  const handleFollowChange = (next) => {
    setIsFollowing(next);
    setFollowerCount((c) => (c === null ? c : c + (next ? 1 : -1)));
  };

  return (
    <div className="card-glass p-4 flex items-center gap-4">
      <Link to={`/users/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0 group">
        <UserAvatar user={user} size="md" />
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-reelz-600 dark:group-hover:text-reelz-400 transition-colors">
            {getDisplayName(user)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          {showFollowerCount && followerCount !== null && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {followerCount} follower{followerCount === 1 ? '' : 's'}
            </p>
          )}
        </div>
      </Link>
      <FollowButton userId={user.id} isFollowing={isFollowing} onChange={handleFollowChange} />
    </div>
  );
}

import { useState } from 'react';
import { usersApi } from '../api/client';

// Follow/unfollow toggle. Parent owns the `isFollowing` state and gets the new
// value via onChange(next) after the API call succeeds.
export default function FollowButton({ userId, isFollowing, onChange, className = '' }) {
  const [busy, setBusy] = useState(false);

  const toggle = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      if (isFollowing) {
        await usersApi.unfollow(userId);
      } else {
        await usersApi.follow(userId);
      }
      onChange?.(!isFollowing);
    } catch {
      // idempotent endpoints; swallow errors so the toggle never wedges
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`${isFollowing ? 'btn-secondary' : 'btn-primary'} text-sm ${busy ? 'opacity-60 cursor-wait' : ''} ${className}`}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
